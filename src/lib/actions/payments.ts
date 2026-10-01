"use server";

import { prisma } from "@/lib/prisma";
import { parsePayload, paymentSchema } from "@/lib/validation";
import { assertId, runAction } from "./run";

export async function savePayment(formData: FormData) {
  return runAction(async () => {
    const { id, ...data } = parsePayload(paymentSchema, formData);
    if (id) await prisma.payment.update({ where: { id }, data });
    else await prisma.payment.create({ data });
  }, "Payment saved.");
}

export async function deletePayment(id: number) {
  return runAction(() => prisma.payment.delete({ where: { id: assertId(id) } }), "Payment deleted.");
}
