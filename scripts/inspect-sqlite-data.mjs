import Database from "better-sqlite3";

const db = new Database("./prisma/dev.db", { readonly: true });

const tables = [
  "User",
  "Session",
  "House",
  "Payment",
  "RwaMember",
  "Document",
  "Setting",
];

for (const table of tables) {
  console.log(`\n===== ${table} =====`);

  const rows = db.prepare(`SELECT * FROM "${table}"`).all();

  for (const row of rows) {
    const safeRow = { ...row };

    // Don't print sensitive password/token values.
    if (table === "User" && safeRow.passwordHash) {
      safeRow.passwordHash = "[HIDDEN]";
    }

    if (table === "Session" && safeRow.id) {
      safeRow.id = "[HIDDEN]";
    }

    // Don't dump document binary data to terminal.
    if (table === "Document" && safeRow.data) {
      safeRow.data = `[BINARY DATA: ${safeRow.data.length} bytes]`;
    }

    console.log(safeRow);
  }
}

db.close();
