/**
 * Supabase clients (server, admin/service-role, browser).
 * Next.js 15 makes `cookies()` async — we MUST await it.
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/**
 * Server client — respects the user's session cookies. Use inside
 * Server Components, Server Actions, and authenticated Route Handlers.
 * RLS policies apply.
 */
export async function supabaseServer(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(
    env().NEXT_PUBLIC_SUPABASE_URL,
    env().NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — no-op, refresh handled by middleware.
          }
        },
      },
    },
  );
}

/**
 * Admin client — service role key, bypasses RLS. Use ONLY in server-side
 * code paths that have already performed authentication / authorization
 * (route handlers after JWT verification, server actions after RBAC).
 */
let _admin: SupabaseClient | null = null;
export function supabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  _admin = createClient(env().NEXT_PUBLIC_SUPABASE_URL, env().SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}

/**
 * Browser client — for client components, uses the publishable anon key.
 */
let _browser: SupabaseClient | null = null;
export function supabaseBrowser(): SupabaseClient {
  if (_browser) return _browser;
  _browser = createClient(env().NEXT_PUBLIC_SUPABASE_URL, env().NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return _browser;
}
