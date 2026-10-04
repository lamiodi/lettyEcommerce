"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Crown, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LinedButton } from "@/components/shared/lined-button";
import { useCustomerAuthStore } from "@/lib/store/customer-auth";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get("redirect") ?? "/";

  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const setCustomer = useCustomerAuthStore((s) => s.setCustomer);
  const currentCustomer = useCustomerAuthStore((s) => s.customer);
  const logout = useCustomerAuthStore((s) => s.logout);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please provide both email and password.");
      return;
    }

    if (mode === "register" && password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      // Same-origin via the Next rewrite so the backend's customer_token cookie
      // is set on THIS domain (readable by server components) instead of the
      // backend host, where cross-site cookie blocking would drop it.
      const endpoint = mode === "signin"
        ? "/api/customer/auth/login"
        : "/api/customer/auth/register";

      const payload = mode === "signin"
        ? { email, password }
        : { email, password, firstName, lastName, marketingConsent };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(json.error ?? (mode === "signin" ? "Sign in failed" : "Registration failed"));
        return;
      }

      // Backend wraps successes as { data: { customer } }; errors are flat { error }.
      const userData = json.data?.customer ?? json.customer;
      if (!userData) {
        toast.error(json.data?.error ?? json.error ?? "Authentication failed. Please check your credentials.");
        return;
      }
      setCustomer(userData);
      toast.success(
        mode === "signin"
          ? `Welcome back, ${userData.firstName || "darling"}!`
          : "Your LETTY account has been created!",
      );

      router.replace(redirect);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Authentication service is currently unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (currentCustomer) {
    return <CustomerAccountView customer={currentCustomer} onSignOut={() => {
      // Clear the httpOnly session cookie server-side, then the local mirror.
      fetch("/api/customer/auth/logout", { method: "POST" }).catch(() => {});
      logout();
      toast.info("You have signed out.");
    }} />;
  }

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email address first, then request a reset link.");
      return;
    }
    setResetLoading(true);
    try {
      const res = await fetch("/api/customer/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.status === 429) {
        toast.error("Too many requests — please wait a minute and try again.");
        return;
      }
      // The endpoint answers the same whether or not the email has an
      // account, so the message stays neutral.
      toast.success(`If an account exists for ${email.trim()}, a reset link is on its way.`);
    } catch {
      toast.error("Something went wrong. Please try again in a moment.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg">
      <h1 className="text-center text-3xl sm:text-[34px] font-bold tracking-tight text-ink">
        {mode === "signin" ? "Login" : "Create Account"}
      </h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {mode === "register" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                required
                autoComplete="given-name"
                className="h-13 w-full rounded-[10px] border border-stone/25 bg-white px-4 text-sm text-ink placeholder:text-stone/50 focus:border-ink focus:ring-1 focus:ring-ink"
              />
            </div>
            <div>
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                required
                autoComplete="family-name"
                className="h-13 w-full rounded-[10px] border border-stone/25 bg-white px-4 text-sm text-ink placeholder:text-stone/50 focus:border-ink focus:ring-1 focus:ring-ink"
              />
            </div>
          </div>
        )}

        <div>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            autoComplete="email"
            className="h-13 w-full rounded-[10px] border border-stone/25 bg-white px-4 text-sm text-ink placeholder:text-stone/50 focus:border-ink focus:ring-1 focus:ring-ink"
          />
        </div>

        <div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
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
          {mode === "register" && (
            <p className="mt-1.5 text-xs text-stone">Must be at least 8 characters</p>
          )}
        </div>

        {mode === "signin" ? (
          <div className="pt-1">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetLoading}
              className="text-sm font-medium text-ink underline underline-offset-4 hover:text-stone cursor-pointer disabled:opacity-50"
            >
              Forgot Your Password?
            </button>
          </div>
        ) : (
          <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-ink"
            />
            <span className="text-xs text-stone leading-tight">
              Receive invitation-only private collection releases and masterclass invitations.
            </span>
          </label>
        )}

        {/* Pill action + mode switch — Huda template row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 items-center justify-center rounded-full bg-ink px-12 text-xs font-medium uppercase tracking-[0.2em] text-ivory transition-all duration-200 hover:bg-stone active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {loading ? "PLEASE WAIT..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>

          {mode === "signin" ? (
            <button
              type="button"
              onClick={() => setMode("register")}
              className="text-base font-medium text-ink underline underline-offset-4 hover:text-stone cursor-pointer"
            >
              Create Account
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="text-base font-medium text-ink underline underline-offset-4 hover:text-stone cursor-pointer"
            >
              Sign In Instead
            </button>
          )}
        </div>
      </form>

      {/* Having trouble signing in? */}
      <div className="mt-14 text-center">
        <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-ink">
          Having trouble signing in?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink">
          {mode === "signin" ? (
            <>
              Forgotten your password?{" "}
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="font-semibold text-ink underline underline-offset-4 hover:text-stone cursor-pointer disabled:opacity-50"
              >
                Request a reset link
              </button>{" "}
              — it only takes a minute.
            </>
          ) : (
            <>
              Already registered with us?{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="font-semibold text-ink underline underline-offset-4 hover:text-stone cursor-pointer"
              >
                Sign in here
              </button>{" "}
              — you only ever need one account.
            </>
          )}
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink">
          Didn&apos;t get the email? Check your spam folder or request a new link. If it still
          doesn&apos;t arrive, contact us at{" "}
          <a
            href="mailto:Hello@houseofletty.com"
            className="font-semibold text-ink underline underline-offset-4 hover:text-stone"
          >
            Hello@houseofletty.com
          </a>
        </p>
      </div>
    </div>
  );
}

function CustomerAccountView({
  customer,
  onSignOut,
}: {
  customer: { email: string; firstName?: string; lastName?: string; id?: string };
  onSignOut: () => void;
}) {
  const [orderNumber, setOrderNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [orderResult, setOrderResult] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      toast.error("Please enter an order number (e.g. L0328159)");
      return;
    }
    setSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch("/api/customer/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: customer.email,
          order_number: orderNumber.trim(),
        }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.data) {
        setOrderResult(json.data);
        toast.success("Order record located.");
      } else {
        setOrderResult(null);
        toast.error(json?.error || "Order not found. Please verify your order number.");
      }
    } catch {
      setOrderResult(null);
      toast.error("Lookup service is temporarily unavailable.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Welcome Banner */}
      <div className="border border-line bg-card p-6 sm:p-8 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sand/60 text-ink text-xl font-serif">
            {(customer.firstName?.[0] || customer.email[0]).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl text-ink">
                Welcome, {customer.firstName || "Cherished Client"}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8C6D32]">
                <Crown className="h-3 w-3" /> VIP Client
              </span>
            </div>
            <p className="text-sm text-stone mt-1">{customer.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/shop">
            <LinedButton>Explore Collections</LinedButton>
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="border border-line px-4 py-2.5 text-xs uppercase tracking-luxe text-stone hover:text-ink hover:bg-secondary transition cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Account Details & Privileges */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-line bg-card p-6 shadow-subtle space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
              ATELIER PRIVILEGES
            </p>
            <h3 className="font-serif text-lg font-medium text-ink">Your VIP Sanctuary</h3>
            <p className="text-xs text-stone leading-relaxed">
              As a registered client of the Maison, your orders receive concierge handling and access to seasonal private edits.
            </p>
            <div className="pt-2 border-t border-line space-y-2">
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-stone">Atelier Tier</span>
                <span className="font-medium text-ink">Tier 1 • Inner Circle</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-stone">Concierge Line</span>
                <a href="https://wa.me/447311564331" target="_blank" rel="noopener noreferrer" className="font-medium text-ink underline">
                  +44 7311 564331
                </a>
              </div>
            </div>
            <div className="pt-2">
              <Link href="/vip" className="block text-center w-full border border-line py-2.5 text-xs uppercase tracking-luxe text-ink hover:bg-secondary transition">
                View VIP Rewards &amp; Rituals
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Order Lookup & Tracking */}
        <div className="lg:col-span-7">
          <div className="border border-line bg-card p-6 sm:p-8 shadow-subtle space-y-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
                ORDER CONCIERGE
              </p>
              <h3 className="font-serif text-xl font-medium text-ink mt-1">
                Track &amp; View Order
              </h3>
              <p className="text-xs text-stone mt-1">
                Enter your order confirmation number to view fulfillment progress, package tracking, and dispatched items.
              </p>
            </div>

            <form onSubmit={handleLookup} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="e.g. L0328159"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full border border-line bg-ivory/60 px-3.5 py-2.5 text-xs text-ink placeholder:text-stone/60 focus:border-ink focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="shrink-0 bg-ink px-4 py-2.5 text-xs font-semibold uppercase tracking-luxe text-ivory hover:bg-gold hover:text-ink transition disabled:opacity-50 cursor-pointer"
              >
                {searching ? "Searching..." : "Track Order"}
              </button>
            </form>

            {/* Results Section */}
            {orderResult ? (
              <div className="border border-line bg-secondary/30 p-5 space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-stone">Order Reference</span>
                    <p className="font-mono font-bold text-sm text-ink">{orderResult.order_number}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-stone">Payment</span>
                    <p className="font-semibold text-emerald-800 uppercase">{orderResult.payment_status}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-stone">Fulfillment</span>
                    <p className="font-medium text-ink capitalize mt-0.5">{orderResult.fulfillment_status || "Processing"}</p>
                  </div>
                  <div>
                    <span className="text-stone">Date Placed</span>
                    <p className="font-medium text-ink mt-0.5">{new Date(orderResult.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-stone">Total</span>
                    <p className="font-medium text-ink mt-0.5">{orderResult.currency} {orderResult.total}</p>
                  </div>
                </div>

                {orderResult.order_items && orderResult.order_items.length > 0 && (
                  <div className="border-t border-line pt-3">
                    <span className="text-[10px] uppercase tracking-wider text-stone block mb-2">Items in Order</span>
                    <ul className="space-y-1.5">
                      {orderResult.order_items.map((item: any) => (
                        <li key={item.id} className="flex justify-between items-center text-xs">
                          <span className="text-ink">
                            {item.product_snapshot?.name || "Letty Beauty Ritual"} × {item.quantity}
                          </span>
                          <span className="text-stone">{orderResult.currency} {item.line_total}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : hasSearched && !searching ? (
              <div className="border border-dashed border-line p-6 text-center text-xs text-stone">
                No active order found with reference &ldquo;{orderNumber}&rdquo; for this account.
              </div>
            ) : (
              <div className="border border-dashed border-line p-6 text-center text-xs text-stone">
                Enter your order number above to view real-time shipping status and order breakdown.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] py-12 sm:py-16 px-4 sm:px-6">
      <Suspense fallback={<div className="text-center py-20 text-stone">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
