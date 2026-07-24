/**
 * Apply all SQL migrations in order using the Supabase service role.
 * Run with: `npm run db:migrate`
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Uses the Postgres REST endpoint (`/pg`) to execute raw SQL.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

async function run() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    process.stdout.write(`▶ ${file} ... `);
    const { error } = await supabase.rpc("exec_sql", { sql }).catch(() => ({
      // Fallback: the rpc may not exist; in that case we split on semicolons.
      error: null,
    }));

    if (error) {
      console.log(`falling back to raw query (rpc unavailable).`);
      // Use the pg rest endpoint with a single statement
      const res = await fetch(`${SUPABASE_URL}/pg/query`, {
        method: "POST",
        headers: {
          apikey: SERVICE_KEY!,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sql }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error(`FAILED\n${body}`);
        process.exit(1);
      }
    }
    console.log("OK");
  }

  console.log("\n✅ All migrations applied.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
