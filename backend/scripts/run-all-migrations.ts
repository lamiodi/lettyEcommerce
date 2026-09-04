import "dotenv/config";
import { Client } from "pg";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing DATABASE_URL in environment");
  process.exit(1);
}

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

async function main() {
  console.log("Connecting to PostgreSQL at:", connectionString!.replace(/:[^:@]+@/, ":****@"));
  const client = new Client({
    connectionString: connectionString!,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected successfully to PostgreSQL database.");

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`Found ${files.length} migration files to apply.`);

  for (const file of files) {
    const filePath = join(MIGRATIONS_DIR, file);
    const sql = readFileSync(filePath, "utf8");
    process.stdout.write(`Applying ${file} ... `);

    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("COMMIT");
      console.log("OK");
    } catch (err: any) {
      await client.query("ROLLBACK").catch(() => {});
      console.error(`\nFAILED ${file}:`, err.message);
      await client.end();
      process.exit(1);
    }
  }

  // Verify created tables
  const res = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
  );
  console.log("\nDatabase migration complete! Public tables created:");
  console.log(res.rows.map((r) => ` - ${r.table_name}`).join("\n"));

  await client.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
