/**
 * Apply ONE migration file by name using pg, with DATABASE_URL password
 * URL-encoding fixed on the fly (the live password contains raw `@`).
 *
 * Usage: npx tsx scripts/apply-migration.ts 022_commit_released_inventory.sql
 */
import "dotenv/config";
import { Client } from "pg";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function safeConnString(raw: string): string {
  // Password may contain raw `@` / other reserved chars. The userinfo/host
  // separator is the LAST `@` (host/port/db/params never contain one).
  const schemeMatch = raw.match(/^postgres(?:ql)?:\/\//);
  if (!schemeMatch) return raw;
  const scheme = schemeMatch[0];
  const rest = raw.slice(scheme.length);
  const at = rest.lastIndexOf("@");
  if (at === -1) return raw;
  const userinfo = rest.slice(0, at);
  const hostPart = rest.slice(at + 1);
  const colon = userinfo.indexOf(":");
  if (colon === -1) return raw;
  const user = userinfo.slice(0, colon);
  const password = userinfo.slice(colon + 1);
  return `${scheme}${encodeURIComponent(user)}:${encodeURIComponent(password)}@${hostPart}`;
}

const file = process.argv[2];
if (!file) {
  console.error("Usage: npx tsx scripts/apply-migration.ts <migration-file.sql>");
  process.exit(1);
}

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const sqlPath = join(process.cwd(), "supabase", "migrations", file);
const sql = readFileSync(sqlPath, "utf8");

async function main() {
  const client = new Client({
    connectionString: safeConnString(raw),
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log(`Connected. Applying ${file} ...`);
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("OK");
  } catch (err: any) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(`FAILED:`, err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
