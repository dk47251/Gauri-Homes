import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  });
  const client = new PrismaClient({ adapter });
  // WAL lets reads continue during writes and, with synchronous=NORMAL, makes each commit ~25x
  // faster than SQLite's default rollback journal (still crash-safe; see sqlite.org/wal.html).
  void client
    .$queryRawUnsafe("PRAGMA journal_mode = WAL")
    .then(() => client.$queryRawUnsafe("PRAGMA synchronous = NORMAL"))
    .catch((e) => console.error("[db] could not set SQLite pragmas:", e));
  return client;
}

// Reuse one client across hot reloads in development. After `prisma generate` the reloaded
// module exports a new PrismaClient class, so a cached client built from the old schema fails
// the instanceof check and is replaced instead of rejecting new fields.
const cached = globalForPrisma.prisma;
export const prisma = cached instanceof PrismaClient ? cached : createPrismaClient();

if (cached && cached !== prisma) void cached.$disconnect();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
