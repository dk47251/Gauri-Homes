"use server";

import { prisma } from "@/lib/prisma";
import { ACCESS, ROLES, USER_STATUS } from "@/lib/auth/constants";
import { requireSystemAdmin } from "@/lib/auth/session";
import { assertId, runAction } from "./run";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Loads the target user and applies the rules every admin action shares. */
async function loadTarget(tx: Tx, adminId: number, id: number) {
  const userId = assertId(id);
  if (userId === adminId) throw new Error("You cannot change your own account here.");
  const target = await tx.user.findUnique({ where: { id: userId }, select: { id: true, role: true, isSystemAdmin: true } });
  if (!target) throw new Error("User not found.");
  if (target.isSystemAdmin) throw new Error("The administrator account is managed from the .env file.");
  return target;
}

/** Refuses to remove the last remaining approved administrator. */
async function ensureAnotherAdmin(tx: Tx, target: { id: number; role: string }) {
  if (target.role !== ROLES.ADMIN) return;
  const others = await tx.user.count({
    where: { role: ROLES.ADMIN, status: USER_STATUS.APPROVED, id: { not: target.id } },
  });
  if (others === 0) throw new Error("At least one administrator is required.");
}

/** Approves a pending (or previously rejected) registration so the user can log in. */
export async function approveUser(id: number) {
  return runAction(async () => {
    const admin = await requireSystemAdmin();
    await prisma.$transaction(async (tx) => {
      const target = await loadTarget(tx, admin.id, id);
      await tx.user.update({ where: { id: target.id }, data: { status: USER_STATUS.APPROVED, approvedAt: new Date() } });
    });
  }, "User approved.");
}

/** Rejects a registration or disables an approved user, logging them out everywhere. */
export async function rejectUser(id: number) {
  return runAction(async () => {
    const admin = await requireSystemAdmin();
    await prisma.$transaction(async (tx) => {
      const target = await loadTarget(tx, admin.id, id);
      await ensureAnotherAdmin(tx, target);
      await tx.user.update({ where: { id: target.id }, data: { status: USER_STATUS.REJECTED, approvedAt: null } });
      await tx.session.deleteMany({ where: { userId: target.id } });
    });
  }, "User rejected.");
}

/** Sets Read & Write or Read Only access. System administrator only. */
export async function setUserAccess(id: number, access: string) {
  return runAction(async () => {
    const admin = await requireSystemAdmin();
    if (access !== ACCESS.READ_WRITE && access !== ACCESS.READ_ONLY) throw new Error("Invalid access level.");
    await prisma.$transaction(async (tx) => {
      const target = await loadTarget(tx, admin.id, id);
      await tx.user.update({ where: { id: target.id }, data: { access } });
    });
  }, access === ACCESS.READ_WRITE ? "Read & Write access granted." : "Access set to Read Only.");
}

/** Makes a user an administrator, or turns an administrator back into a normal user. */
export async function setUserRole(id: number, role: string) {
  return runAction(async () => {
    const admin = await requireSystemAdmin();
    if (role !== ROLES.ADMIN && role !== ROLES.USER) throw new Error("Invalid role.");
    await prisma.$transaction(async (tx) => {
      const target = await loadTarget(tx, admin.id, id);
      if (role === ROLES.USER) await ensureAnotherAdmin(tx, target);
      await tx.user.update({ where: { id: target.id }, data: { role } });
    });
  }, role === ROLES.ADMIN ? "User is now an administrator." : "Administrator access removed.");
}

/** Deletes a user and all their sessions (they are logged out everywhere). */
export async function deleteUser(id: number) {
  return runAction(async () => {
    const admin = await requireSystemAdmin();
    await prisma.$transaction(async (tx) => {
      const target = await loadTarget(tx, admin.id, id);
      await ensureAnotherAdmin(tx, target);
      await tx.user.delete({ where: { id: target.id } });
    });
  }, "User deleted.");
}
