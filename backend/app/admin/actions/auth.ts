"use server";

/**
 * Admin auth Server Actions: login, logout, get current admin.
 * Imported by the (future) admin dashboard in the frontend.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/server";
import { signAdminToken, clearAdminCookie, ADMIN_COOKIE_NAME } from "@/lib/auth/rbac";
import { safeAction, type ActionResult } from "@/lib/handler";
import { adminLoginSchema } from "@/lib/validations";

export async function adminLoginAction(
  formData: FormData,
): Promise<ActionResult<{ email: string; role: string }>> {
  return safeAction(async () => {
    const parsed = adminLoginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) throw new Error("Invalid credentials");
    const { email, password } = parsed.data;

    const { data: admin, error } = await supabaseAdmin()
      .from("admins")
      .select("id, email, password_hash, role, is_active")
      .eq("email", email)
      .maybeSingle();
    if (error || !admin || !admin.is_active) throw new Error("Invalid credentials");

    const ok_ = await bcrypt.compare(password, admin.password_hash);
    if (!ok_) throw new Error("Invalid credentials");

    const token = await signAdminToken({ id: admin.id, email: admin.email, role: admin.role });
    const store = await cookies();
    store.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    await supabaseAdmin()
      .from("admins")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", admin.id);

    return { email: admin.email, role: admin.role };
  });
}

export async function adminLogoutAction(): Promise<void> {
  const c = clearAdminCookie();
  const store = await cookies();
  store.set(c.name, c.value, {
    httpOnly: c.httpOnly,
    secure: c.secure,
    sameSite: c.sameSite,
    path: c.path,
    maxAge: c.maxAge,
  });
  redirect("/admin/login");
}
