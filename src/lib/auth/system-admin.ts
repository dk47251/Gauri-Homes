import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ACCESS, ROLES, USER_STATUS } from "./constants";
import { hashPassword, verifyPassword } from "./password";

/**
 * Keeps the administrator account in sync with ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME from .env.
 * Runs on server start (instrumentation.ts) and before every login, so editing .env is enough to
 * change the administrator's email or password. The old email stops working once it changes.
 */
export async function syncSystemAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Administrator";
  if (!email || !password) return;

  // Skip the (slow, scrypt-based) comparison when .env hasn't changed since the last sync.
  const fingerprint = createHash("sha256").update(`${email}\0${name}\0${password}`).digest("hex");
  if (lastSynced === fingerprint) return;
  await doSync(email, name, password);
  lastSynced = fingerprint;
}

let lastSynced: string | null = null;

async function doSync(email: string, name: string, password: string) {
  const current = await prisma.user.findFirst({ where: { isSystemAdmin: true } });
  // If the configured email already belongs to a regular account, that account becomes the admin.
  const byEmail = current?.email === email ? current : await prisma.user.findUnique({ where: { email } });
  const target = byEmail ?? current;

  const fixed = { email, name, role: ROLES.ADMIN, access: ACCESS.READ_WRITE, status: USER_STATUS.APPROVED, isSystemAdmin: true };

  if (!target) {
    await prisma.user.create({ data: { ...fixed, approvedAt: new Date(), passwordHash: await hashPassword(password) } });
    return;
  }

  const passwordChanged = !(await verifyPassword(password, target.passwordHash));
  const changed =
    passwordChanged ||
    target.email !== email ||
    target.name !== name ||
    target.role !== ROLES.ADMIN ||
    target.access !== ACCESS.READ_WRITE ||
    target.status !== USER_STATUS.APPROVED ||
    !target.isSystemAdmin;

  await prisma.$transaction(async (tx) => {
    // Only one system admin: retire the previous one if the email moved to another account.
    if (current && current.id !== target.id) {
      await tx.user.update({ where: { id: current.id }, data: { isSystemAdmin: false, status: USER_STATUS.REJECTED } });
      await tx.session.deleteMany({ where: { userId: current.id } });
    }
    if (!changed) return;
    await tx.user.update({
      where: { id: target.id },
      data: {
        ...fixed,
        approvedAt: target.approvedAt ?? new Date(),
        ...(passwordChanged && { passwordHash: await hashPassword(password) }),
      },
    });
    // A new password logs the administrator out everywhere.
    if (passwordChanged) await tx.session.deleteMany({ where: { userId: target.id } });
  });
}
