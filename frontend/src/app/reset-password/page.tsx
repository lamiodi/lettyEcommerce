"use client";

/**
 * /reset-password — destination for the emailed password-reset link.
 *
 * ?token=<raw token from the email> is exchanged at
 * POST /api/customer/auth/reset-password for a new password. Tokens are
 * single-use and expire after 30 minutes; failures say exactly that.
 */
import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

function ResetForm() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("The two passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/customer/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Could not reset your password. Please try again.");
        return;
      }
      toast.success("Your password has been updated — please sign in.");
      router.replace("/login");
    } catch {
      toast.error("Something went wrong. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-lg text-center">
        <h1 className="text-3xl sm:text-[34px] font-bold tracking-tight text-ink">
          Reset link missing
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-stone">
          This page needs the secure link from your password-reset email. Request a new link from
          the sign-in page and it will arrive within a minute.
        </p>
        <div className="mt-8">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-full bg-ink px-12 text-xs font-medium uppercase tracking-[0.2em] text-ivory transition-all duration-200 hover:bg-stone"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <h1 className="text-center text-3xl sm:text-[34px] font-bold tracking-tight text-ink">
        Choose a New Password
      </h1>
      <p className="mt-3 text-center text-sm text-stone">
        Your reset link is valid for 30 minutes and works only once.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              required
              autoComplete="new-password"
              className="h-13 w-full rounded-[10px] border border-stone/25 bg-white px-4 pr-10 text-sm text-ink placeholder:text-stone/50 focus:border-ink focus:ring-1 focus:ring-ink"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone hover:text-ink cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-stone">Must be at least 8 characters</p>
        </div>

        <div>
          <Input
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            required
            autoComplete="new-password"
            className="h-13 w-full rounded-[10px] border border-stone/25 bg-white px-4 text-sm text-ink placeholder:text-stone/50 focus:border-ink focus:ring-1 focus:ring-ink"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-ink px-12 text-xs font-medium uppercase tracking-[0.2em] text-ivory transition-all duration-200 hover:bg-stone active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {loading ? "PLEASE WAIT..." : "Update Password"}
          </button>
        </div>
      </form>

      <div className="mt-10 text-center">
        <p className="text-sm text-stone">
          Didn&apos;t request this? You can safely leave this page — your password won&apos;t
          change.{" "}
          <Link href="/login" className="font-semibold text-ink underline underline-offset-4 hover:text-stone">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] py-12 sm:py-16 px-4 sm:px-6">
      <Suspense fallback={<div className="text-center py-20 text-stone">Loading...</div>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
