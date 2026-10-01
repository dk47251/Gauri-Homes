import Database from "better-sqlite3";

const db = new Database("./prisma/dev.db", { readonly: true });

const tables = [
  "User",
  "Session",
  "House",
  "Member",
  "Payment",
  "Expense",
  "RwaMember",
  "Renter",
  "Document",
  "Setting",
];

console.log("===== SQLite DATA CHECK =====");

for (const table of tables) {
  const row = db
    .prepare(`SELECT COUNT(*) AS count FROM "${table}"`)
    .get();

  console.log(`${table}: ${row.count}`);
}

console.log("=============================");

db.close();
