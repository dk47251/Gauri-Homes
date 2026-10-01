import "server-only";
import { prisma } from "@/lib/prisma";
import { docMetaSelect } from "@/lib/documents";
import { requireSystemAdminPage, requireUser } from "@/lib/auth/session";

// Every query goes through requireUser(): it enforces login (Data Access Layer) and, because
// it reads cookies, also keeps pages out of the build-time prerender so data is always fresh.

export async function getHouses() {
  await requireUser();
  return prisma.house.findMany({ orderBy: { id: "asc" } });
}

export async function getHousesWithAccounts() {
  await requireUser();
  return prisma.house.findMany({
    orderBy: { id: "asc" },
    include: {
      member: { include: { documents: { select: docMetaSelect } } },
      payments: { orderBy: { date: "desc" } },
    },
  });
}

export async function getPayments() {
  await requireUser();
  return prisma.payment.findMany({ orderBy: [{ date: "desc" }, { id: "desc" }] });
}

export async function getExpenses() {
  await requireUser();
  return prisma.expense.findMany({
    orderBy: [{ date: "desc" }, { id: "desc" }],
    include: { documents: { select: docMetaSelect } },
  });
}

export async function getRwaMembers() {
  await requireUser();
  return prisma.rwaMember.findMany({
    orderBy: { id: "asc" },
    include: { documents: { select: docMetaSelect } },
  });
}

export async function getRenters() {
  await requireUser();
  const rows = await prisma.renter.findMany({
    orderBy: { id: "asc" },
    include: { documents: { select: docMetaSelect } },
  });
  return rows.map(({ familyMembers, ...r }) => ({ ...r, familyMembers: parseNames(familyMembers) }));
}

/** Application settings (administrator only). */
export async function getSettings() {
  await requireSystemAdminPage();
  return prisma.setting.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

/** Registered users (administrator only). Selects safe fields — the password hash never leaves the server. */
export async function getUsers({ adminsOnly = false } = {}) {
  await requireSystemAdminPage();
  return prisma.user.findMany({
    where: adminsOnly ? { role: "ADMIN" } : undefined,
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      access: true,
      status: true,
      isSystemAdmin: true,
      approvedAt: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
}

function parseNames(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export type HouseRow = Awaited<ReturnType<typeof getHouses>>[number];
export type HouseWithAccount = Awaited<ReturnType<typeof getHousesWithAccounts>>[number];
export type PaymentRow = Awaited<ReturnType<typeof getPayments>>[number];
export type ExpenseRow = Awaited<ReturnType<typeof getExpenses>>[number];
export type RwaRow = Awaited<ReturnType<typeof getRwaMembers>>[number];
export type RenterRow = Awaited<ReturnType<typeof getRenters>>[number];
export type UserRow = Awaited<ReturnType<typeof getUsers>>[number];
export type SettingRow = Awaited<ReturnType<typeof getSettings>>;
