import "server-only";
import JSZip from "jszip";
import { prisma } from "@/lib/prisma";

/**
 * Backup format (database.json inside a ZIP) keeps the same top-level shape as the original
 * offline (Dexie) app so old backups can be restored here. Documents are written as separate
 * files in the ZIP and referenced by `file`; old backups embed them as base64 data URLs in `data`.
 */

type BackupDoc = { id?: string; name: string; mime?: string; type?: string; uploadedAt?: string; file?: string; data?: string };
type Row = Record<string, unknown>;

const BACKUP_VERSION = "4.0";

const safeName = (s: string) => s.replace(/[\\/:*?"<>|]+/g, "_");

export async function createBackupZip() {
  const [houses, members, payments, expenses, rwa, renters, settings, documents] = await Promise.all([
    prisma.house.findMany(),
    prisma.member.findMany(),
    prisma.payment.findMany(),
    prisma.expense.findMany(),
    prisma.rwaMember.findMany(),
    prisma.renter.findMany(),
    prisma.setting.findMany(),
    prisma.document.findMany(),
  ]);

  const zip = new JSZip();
  const docsFor = (key: "memberId" | "expenseId" | "rwaMemberId" | "renterId", id: number, kind?: string) =>
    documents
      .filter((d) => d[key] === id && (!kind || d.kind === kind))
      .map((d): BackupDoc => {
        const file = `documents/${d.id}/${safeName(d.name)}`;
        zip.file(file, d.data);
        return { id: d.id, name: d.name, mime: d.mime, type: d.mime, uploadedAt: d.uploadedAt.toISOString(), file };
      });

  const data = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    houses,
    members: members.map((m) => ({ ...m, documents: docsFor("memberId", m.id) })),
    payments,
    expenses: expenses.map((x) => ({ ...x, documents: docsFor("expenseId", x.id) })),
    rwa: rwa.map((r) => ({
      ...r,
      photo: docsFor("rwaMemberId", r.id, "PHOTO")[0],
      idProof: docsFor("rwaMemberId", r.id, "ID_PROOF")[0],
    })),
    renters: renters.map((r) => ({
      ...r,
      familyMembers: JSON.parse(r.familyMembers || "[]"),
      photo: docsFor("renterId", r.id, "PHOTO")[0],
      validId: docsFor("renterId", r.id, "ID_PROOF")[0],
    })),
    settings,
  };

  zip.file("database.json", JSON.stringify(data, null, 2));
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

// ---------------------------------------------------------------------------------------------

const str = (v: unknown, fallback = "") => (v === undefined || v === null ? fallback : String(v));
const num = (v: unknown, fallback = 0) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : fallback);
const bool = (v: unknown, fallback = false) => (typeof v === "boolean" ? v : v === undefined ? fallback : v === "true");
const arr = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : []);

async function readDoc(zip: JSZip, d: BackupDoc | undefined, kind: string) {
  if (!d?.name) return null;
  let bytes: Uint8Array | null = null;
  let mime = d.mime || d.type || "application/octet-stream";
  if (d.file && zip.file(d.file)) {
    bytes = await zip.file(d.file)!.async("uint8array");
  } else if (d.data) {
    const m = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(d.data);
    const payload = m ? m[3] : d.data;
    if (m?.[1]) mime = m[1];
    bytes = new Uint8Array(Buffer.from(payload, m && !m[2] ? "utf8" : "base64"));
  }
  if (!bytes) return null;
  return { name: d.name, mime, size: bytes.byteLength, kind, data: bytes as Uint8Array<ArrayBuffer> };
}

/** Replaces all data with the contents of a backup ZIP. Record IDs are preserved so relations stay intact. */
export async function restoreBackupZip(buffer: ArrayBuffer) {
  const zip = await JSZip.loadAsync(buffer);
  const dbFile = zip.file("database.json");
  if (!dbFile) throw new Error("database.json not found in ZIP.");
  const j = JSON.parse(await dbFile.async("string")) as Row;

  const houses = arr(j.houses).filter((h) => num(h.id) > 0);
  const houseIds = new Set(houses.map((h) => num(h.id)));

  // Read all documents before opening the write transaction.
  const memberDocs = new Map<number, NonNullable<Awaited<ReturnType<typeof readDoc>>>[]>();
  for (const m of arr(j.members)) {
    const docs = [];
    for (const d of arr(m.documents) as BackupDoc[]) {
      const doc = await readDoc(zip, d, "ID_PROOF");
      if (doc) docs.push(doc);
    }
    memberDocs.set(num(m.id), docs);
  }
  const expenseDocs = new Map<number, NonNullable<Awaited<ReturnType<typeof readDoc>>>[]>();
  for (const x of arr(j.expenses)) {
    const docs = [];
    for (const d of arr(x.documents) as BackupDoc[]) {
      const doc = await readDoc(zip, d, "BILL");
      if (doc) docs.push(doc);
    }
    expenseDocs.set(num(x.id), docs);
  }
  const rwaDocs = new Map<number, NonNullable<Awaited<ReturnType<typeof readDoc>>>[]>();
  for (const r of arr(j.rwa)) {
    const docs = [await readDoc(zip, r.photo as BackupDoc, "PHOTO"), await readDoc(zip, r.idProof as BackupDoc, "ID_PROOF")];
    rwaDocs.set(num(r.id), docs.filter((d) => d !== null));
  }
  const renterDocs = new Map<number, NonNullable<Awaited<ReturnType<typeof readDoc>>>[]>();
  for (const r of arr(j.renters)) {
    const docs = [await readDoc(zip, r.photo as BackupDoc, "PHOTO"), await readDoc(zip, r.validId as BackupDoc, "ID_PROOF")];
    renterDocs.set(num(r.id), docs.filter((d) => d !== null));
  }

  const counts = { houses: 0, members: 0, payments: 0, expenses: 0, rwa: 0, renters: 0, documents: 0 };

  await prisma.$transaction(
    async (tx) => {
      await tx.document.deleteMany();
      await tx.payment.deleteMany();
      await tx.member.deleteMany();
      await tx.house.deleteMany();
      await tx.expense.deleteMany();
      await tx.rwaMember.deleteMany();
      await tx.renter.deleteMany();
      await tx.setting.deleteMany();

      for (const h of houses) {
        await tx.house.create({
          data: {
            id: num(h.id),
            number: str(h.number),
            owner: str(h.owner),
            mobile: str(h.mobile),
            whatsapp: str(h.whatsapp),
            email: str(h.email),
            propertyStatus: str(h.propertyStatus),
            maintenanceApplicable: bool(h.maintenanceApplicable, true),
            monthlyMaintenance: num(h.monthlyMaintenance),
            dueDate: str(h.dueDate),
            startDate: str(h.startDate),
            status: str(h.status, "Active"),
            notes: str(h.notes),
          },
        });
        counts.houses++;
      }

      const seenMemberHouses = new Set<number>();
      for (const m of arr(j.members)) {
        const houseId = num(m.houseId);
        if (!houseIds.has(houseId) || seenMemberHouses.has(houseId)) continue;
        seenMemberHouses.add(houseId);
        const docs = memberDocs.get(num(m.id)) ?? [];
        await tx.member.create({
          data: {
            houseId,
            name: str(m.name),
            mobile: str(m.mobile),
            whatsapp: str(m.whatsapp),
            email: str(m.email),
            startDate: str(m.startDate),
            notes: str(m.notes),
            documents: { create: docs },
          },
        });
        counts.members++;
        counts.documents += docs.length;
      }

      for (const p of arr(j.payments)) {
        const houseId = num(p.houseId);
        if (!houseIds.has(houseId)) continue;
        await tx.payment.create({
          data: {
            houseId,
            date: str(p.date),
            month: str(p.month),
            amount: num(p.amount),
            mode: str(p.mode, "Cash"),
            txn: str(p.txn),
            remarks: str(p.remarks),
            kind: str(p.kind, "Regular") === "Advance" ? "Advance" : "Regular",
            advanceMonths: Math.max(1, num(p.advanceMonths, 1)),
          },
        });
        counts.payments++;
      }

      for (const x of arr(j.expenses)) {
        const docs = expenseDocs.get(num(x.id)) ?? [];
        await tx.expense.create({
          data: {
            date: str(x.date),
            category: str(x.category, "Other"),
            description: str(x.description),
            amount: num(x.amount),
            mode: str(x.mode, "Cash"),
            vendor: str(x.vendor),
            remarks: str(x.remarks),
            recurring: bool(x.recurring),
            recurringStart: str(x.recurringStart),
            recurringEnd: str(x.recurringEnd),
            documents: { create: docs },
          },
        });
        counts.expenses++;
        counts.documents += docs.length;
      }

      for (const r of arr(j.rwa)) {
        const docs = rwaDocs.get(num(r.id)) ?? [];
        await tx.rwaMember.create({
          data: {
            name: str(r.name),
            houseFlat: str(r.houseFlat),
            designation: str(r.designation),
            phone: str(r.phone),
            dob: str(r.dob),
            idProofType: str(r.idProofType, "Aadhaar"),
            idProofNumber: str(r.idProofNumber),
            status: str(r.status, "Active"),
            notes: str(r.notes),
            documents: { create: docs },
          },
        });
        counts.rwa++;
        counts.documents += docs.length;
      }

      for (const r of arr(j.renters)) {
        const docs = renterDocs.get(num(r.id)) ?? [];
        await tx.renter.create({
          data: {
            houseFlat: str(r.houseFlat),
            name: str(r.name),
            age: num(r.age),
            nationality: str(r.nationality, "Indian"),
            phone: str(r.phone),
            familyCount: Math.max(1, num(r.familyCount, 1)),
            familyMembers: JSON.stringify(Array.isArray(r.familyMembers) ? r.familyMembers.map(String) : []),
            moveInDate: str(r.moveInDate),
            validIdType: str(r.validIdType, "Aadhaar"),
            validIdNumber: str(r.validIdNumber),
            notes: str(r.notes),
            documents: { create: docs },
          },
        });
        counts.renters++;
        counts.documents += docs.length;
      }

      const s = arr(j.settings)[0];
      await tx.setting.create({
        data: s
          ? {
              id: 1,
              autoBackup: bool(s.autoBackup),
              backupTime: str(s.backupTime, "23:00"),
              backupEmail: str(s.backupEmail),
              emailApiUrl: str(s.emailApiUrl),
              emailBackup: bool(s.emailBackup),
              localBackup: bool(s.localBackup, true),
              retentionDays: Math.max(1, num(s.retentionDays, 30)),
            }
          : { id: 1 },
      });
    },
    { timeout: 120_000 },
  );

  return counts;
}
