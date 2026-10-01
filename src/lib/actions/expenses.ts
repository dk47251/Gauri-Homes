"use server";

import { prisma } from "@/lib/prisma";
import { keptDocumentIds, readUploads } from "@/lib/documents";
import { expenseSchema, parsePayload } from "@/lib/validation";
import { assertId, runAction } from "./run";

export async function saveExpense(formData: FormData) {
  return runAction(async () => {
    const { id, ...data } = parsePayload(expenseSchema, formData);
    const uploads = await readUploads(formData, "documents", "BILL");
    const keep = keptDocumentIds(formData);

    await prisma.$transaction(async (tx) => {
      const expense = id
        ? await tx.expense.update({ where: { id }, data })
        : await tx.expense.create({ data });
      await tx.document.deleteMany({ where: { expenseId: expense.id, id: { notIn: keep } } });
      for (const doc of uploads) await tx.document.create({ data: { ...doc, expenseId: expense.id } });
    });
  }, "Expense saved.");
}

export async function deleteExpense(id: number) {
  return runAction(() => prisma.expense.delete({ where: { id: assertId(id) } }), "Expense deleted.");
}
