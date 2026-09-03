"use client";

/**
 * /admin/login — email + password sign-in for staff.
 * POSTs to /api/admin/login; on success, redirects to the next URL
 * (?next=/admin/orders) or /admin.
 *
 * Branded look: full-bleed ivory background, centered form, hairline
 * border on the input, lined button, the wordmark above.
 */
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { LinedButton } from "@/components/shared/lined-button";
import { LogoImage } from "@/components/shared/logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; data?: { admin: { role: string } } };
      if (!res.ok) {
        toast.error(json.error ?? "Invalid email or password.");
        return;
      }
      toast.success("Welcome back.");
      router.replace(next);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message ?? "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-ivory text-ink">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center mb-12">
          <LogoImage priority className="mx-auto h-24 w-auto" />
          <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-stone">Admin Console</p>
        </Link>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-[11px] uppercase tracking-[0.18em] text-stone mb-2"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-[11px] uppercase tracking-[0.18em] text-stone mb-2"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
            />
          </div>

          <div className="pt-2">
            <LinedButton type="submit" disabled={loading} width="w-full">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                  Signing in
                </span>
              ) : (
                "Sign in"
              )}
            </LinedButton>
          </div>
        </form>

        <p className="mt-10 text-center text-[11px] uppercase tracking-[0.18em] text-stone">
          Lost your password? Contact the <a href="mailto:lettybeautyco@gmail.com" className="text-ink underline underline-offset-2">concierge</a>.
        </p>
      </div>
    </div>
  );
}
