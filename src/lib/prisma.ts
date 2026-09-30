import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  });
  return new PrismaClient({ adapter });
}

// Reuse one client across hot reloads in development. After `prisma generate` the reloaded
// module exports a new PrismaClient class, so a cached client built from the old schema fails
// the instanceof check and is replaced instead of rejecting new fields.
const cached = globalForPrisma.prisma;
export const prisma = cached instanceof PrismaClient ? cached : createPrismaClient();

if (cached && cached !== prisma) void cached.$disconnect();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
