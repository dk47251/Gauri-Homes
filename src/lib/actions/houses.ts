"use server";

import { prisma } from "@/lib/prisma";
import { keptDocumentIds, readUploads } from "@/lib/documents";
import { houseSchema, memberSchema, parsePayload } from "@/lib/validation";
import { assertId, runAction } from "./run";

export async function saveHouse(formData: FormData) {
  return runAction(async () => {
    const { id, ...data } = parsePayload(houseSchema, formData);
    if (id) await prisma.house.update({ where: { id }, data });
    else await prisma.house.create({ data });
  }, "Property saved.");
}

/** Deleting a house cascades to its member account, documents and payments. */
export async function deleteHouse(id: number) {
  return runAction(() => prisma.house.delete({ where: { id: assertId(id) } }), "Property deleted.");
}

export async function saveMemberAccount(formData: FormData) {
  return runAction(async () => {
    const { houseId, ...data } = parsePayload(memberSchema, formData);
    const uploads = await readUploads(formData, "documents", "ID_PROOF");
    const keep = keptDocumentIds(formData);

    await prisma.$transaction(async (tx) => {
      const member = await tx.member.upsert({
        where: { houseId },
        update: data,
        create: { houseId, ...data },
      });
      await tx.document.deleteMany({ where: { memberId: member.id, id: { notIn: keep } } });
      for (const doc of uploads) await tx.document.create({ data: { ...doc, memberId: member.id } });
    });
  }, "Member account saved.");
}
