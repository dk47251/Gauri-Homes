"use server";

import { prisma } from "@/lib/prisma";
import { parsePayload, settingsSchema } from "@/lib/validation";
import { requireSystemAdmin } from "@/lib/auth/session";
import { runAction } from "./run";

export async function saveSettings(formData: FormData) {
  return runAction(async () => {
    await requireSystemAdmin();
    const data = parsePayload(settingsSchema, formData);
    await prisma.setting.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  }, "Settings saved.");
}
