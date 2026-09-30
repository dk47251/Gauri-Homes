"use server";

import { prisma } from "@/lib/prisma";
import { keptDocumentIds, readUploads } from "@/lib/documents";
import { parsePayload, renterSchema } from "@/lib/validation";
import { assertId, runAction } from "./run";

/** Photo and valid ID are single files: a new upload replaces the previous one. */
export async function saveRenter(formData: FormData) {
  return runAction(async () => {
    const { id, familyMembers, ...rest } = parsePayload(renterSchema, formData);
    const data = {
      ...rest,
      familyMembers: JSON.stringify(Array.from({ length: rest.familyCount }, (_, i) => familyMembers[i] ?? "")),
    };
    const photo = (await readUploads(formData, "photo", "PHOTO")).slice(0, 1);
    const validId = (await readUploads(formData, "validId", "ID_PROOF")).slice(0, 1);
    const keep = keptDocumentIds(formData);

    await prisma.$transaction(async (tx) => {
      const row = id ? await tx.renter.update({ where: { id }, data }) : await tx.renter.create({ data });
      await tx.document.deleteMany({
        where: {
          renterId: row.id,
          OR: [
            { id: { notIn: keep } },
            ...(photo.length ? [{ kind: "PHOTO" }] : []),
            ...(validId.length ? [{ kind: "ID_PROOF" }] : []),
          ],
        },
      });
      for (const doc of [...photo, ...validId]) await tx.document.create({ data: { ...doc, renterId: row.id } });
    });
  }, "Renter saved.");
}

export async function deleteRenter(id: number) {
  return runAction(() => prisma.renter.delete({ where: { id: assertId(id) } }), "Renter deleted.");
}
