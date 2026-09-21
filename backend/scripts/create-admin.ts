/**
 * Bootstrap the first admin account (owner role).
 *
 * The admin console requires an authenticated owner for every mutation, so a
 * fresh deployment has no way to create one through the UI. This script is
 * that entry point.
 *
 * Usage:
 *   npm run db:create-admin -- <email> <password> [full name]
 *   tsx scripts/create-admin.ts <email> <password> [full name]
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (same env
 * as db:migrate). If the email already exists the script exits without
 * changing anything.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  const [email, password, ...nameParts] = process.argv.slice(2);

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }
  if (!email || !password) {
    console.error("Usage: npm run db:create-admin -- <email> <password> [full name]");
    process.exit(1);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(`"${email}" is not a valid email address.`);
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing } = await supabase
    .from("admins")
    .select("id, email, role")
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    console.log(`Admin already exists: ${existing.email} (role: ${existing.role}) — nothing changed.`);
    process.exit(0);
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { data, error } = await supabase
    .from("admins")
    .insert({
      email,
      password_hash,
      full_name: nameParts.length ? nameParts.join(" ") : null,
      role: "owner",
      is_active: true,
    })
    .select("id, email, role")
    .single();

  if (error || !data) {
    console.error("Failed to create admin:", error?.message ?? "unknown error");
    process.exit(1);
  }

  console.log(`Owner admin created: ${data.email} (id: ${data.id})`);
  console.log("You can now sign in at /admin/login.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
