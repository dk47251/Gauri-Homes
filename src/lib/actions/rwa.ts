"use server";

import { prisma } from "@/lib/prisma";
import { keptDocumentIds, readUploads } from "@/lib/documents";
import { parsePayload, rwaSchema } from "@/lib/validation";
import { assertId, runAction } from "./run";

/** Photo and ID proof are single files: a new upload replaces the previous one. */
export async function saveRwaMember(formData: FormData) {
  return runAction(async () => {
    const { id, ...data } = parsePayload(rwaSchema, formData);
    const photo = (await readUploads(formData, "photo", "PHOTO")).slice(0, 1);
    const idProof = (await readUploads(formData, "idProof", "ID_PROOF")).slice(0, 1);
    const keep = keptDocumentIds(formData);

    await prisma.$transaction(async (tx) => {
      const row = id ? await tx.rwaMember.update({ where: { id }, data }) : await tx.rwaMember.create({ data });
      await tx.document.deleteMany({
        where: {
          rwaMemberId: row.id,
          OR: [
            { id: { notIn: keep } },
            ...(photo.length ? [{ kind: "PHOTO" }] : []),
            ...(idProof.length ? [{ kind: "ID_PROOF" }] : []),
          ],
        },
      });
      for (const doc of [...photo, ...idProof]) await tx.document.create({ data: { ...doc, rwaMemberId: row.id } });
    });
  }, "RWA member saved.");
}

export async function deleteRwaMember(id: number) {
  return runAction(() => prisma.rwaMember.delete({ where: { id: assertId(id) } }), "RWA member deleted.");
}
