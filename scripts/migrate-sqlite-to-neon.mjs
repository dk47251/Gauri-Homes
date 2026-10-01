import "dotenv/config";
import Database from "better-sqlite3";
import pg from "pg";

const { Pool } = pg;

const sqlite = new Database("./prisma/dev.db", { readonly: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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

function getRows(table) {
  return sqlite.prepare(`SELECT * FROM "${table}"`).all();
}

function toPgValue(value) {
  if (value === undefined) return null;
  if (Buffer.isBuffer(value)) return value;
  return value;
}

function quoteIdentifier(name) {
  return `"${name.replaceAll('"', '""')}"`;
}

async function insertRows(client, table, rows) {
  if (rows.length === 0) return;

  const columns = Object.keys(rows[0]);

  const columnSql = columns.map(quoteIdentifier).join(", ");

  const values = [];
  const placeholders = [];

  let parameterIndex = 1;

  for (const row of rows) {
    const rowPlaceholders = [];

    for (const column of columns) {
      rowPlaceholders.push(`$${parameterIndex++}`);
      values.push(toPgValue(row[column]));
    }

    placeholders.push(`(${rowPlaceholders.join(", ")})`);
  }

  const sql = `
    INSERT INTO ${quoteIdentifier(table)}
      (${columnSql})
    VALUES
      ${placeholders.join(",\n")}
  `;

  await client.query(sql, values);
}

async function syncSequence(client, table, column = "id") {
  const result = await client.query(
    `SELECT MAX(${quoteIdentifier(column)}) AS max_id
     FROM ${quoteIdentifier(table)}`
  );

  const maxId = result.rows[0]?.max_id;

  if (maxId === null || maxId === undefined) {
    return;
  }

  await client.query(
    `SELECT setval(
      pg_get_serial_sequence($1, $2),
      $3,
      true
    )`,
    [table, column, maxId]
  );
}

async function main() {
  const client = await pool.connect();

  try {
    console.log("===== SQLITE → NEON MIGRATION =====");

    for (const table of tables) {
      const count = sqlite
        .prepare(`SELECT COUNT(*) AS count FROM "${table}"`)
        .get();

      console.log(`${table}: ${count.count} rows in SQLite`);
    }

    console.log("\nConnecting to Neon PostgreSQL...");
    await client.query("SELECT 1");
    console.log("Neon connection: OK");

    await client.query("BEGIN");

    console.log("\nInserting data...");

    /*
     * Parent tables first, then dependent tables.
     */
    const migrationOrder = [
      "User",
      "House",
      "Member",
      "Expense",
      "RwaMember",
      "Renter",
      "Session",
      "Payment",
      "Document",
      "Setting",
    ];

    for (const table of migrationOrder) {
      const rows = getRows(table);

      if (rows.length === 0) {
        console.log(`${table}: 0 rows - skipped`);
        continue;
      }

      await insertRows(client, table, rows);
      console.log(`${table}: ${rows.length} rows inserted`);
    }

    console.log("\nSynchronizing PostgreSQL sequences...");

    for (const table of [
      "User",
      "House",
      "Member",
      "Payment",
      "Expense",
      "RwaMember",
      "Renter",
      "Setting",
    ]) {
      await syncSequence(client, table);
    }

    await client.query("COMMIT");

    console.log("\n===== MIGRATION COMPLETE =====");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {}

    console.error("\n===== MIGRATION FAILED =====");
    console.error(error);
    console.error("\nTransaction rolled back.");
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
    sqlite.close();
  }
}

main();
