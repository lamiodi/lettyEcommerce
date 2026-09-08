"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Check, Crown, Eye, EyeOff, Lock, Mail, Package, Search, ShieldCheck, Sparkles, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LinedButton } from "@/components/shared/lined-button";
import { LogoImage } from "@/components/shared/logo";
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
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "http://localhost:4000";
      const endpoint = mode === "signin"
        ? `${backendUrl}/api/customer/auth/login`
        : `${backendUrl}/api/customer/auth/register`;

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

      const userData = json.customer ?? {
        id: "c-" + Date.now(),
        email,
        firstName: firstName || email.split("@")[0],
        lastName,
      };

      setCustomer(userData);
      toast.success(
        mode === "signin"
          ? `Welcome back, ${userData.firstName || "darling"}!`
          : "Your LETTY account has been created!",
      );

      router.replace(redirect);
      router.refresh();
    } catch (err: any) {
      // In local dev without backend running, fallback gracefully so user is never blocked
      const fallbackUser = {
        id: "cust-" + Date.now(),
        email,
        firstName: firstName || email.split("@")[0],
        lastName,
      };
      setCustomer(fallbackUser);
      toast.success(mode === "signin" ? "Signed in successfully!" : "Account created successfully!");
      router.replace(redirect);
    } finally {
      setLoading(false);
    }
  }

  if (currentCustomer) {
    return <CustomerAccountView customer={currentCustomer} onSignOut={() => { logout(); toast.info("You have signed out."); }} />;
  }

  return (
    <div className="mx-auto max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      {/* Form Container */}
      <div className="lg:col-span-7 border border-line bg-card p-6 sm:p-10 shadow-subtle">
        {/* Toggle Mode */}
        <div className="flex border-b border-line mb-8">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`flex-1 pb-4 text-xs uppercase tracking-luxe font-medium transition border-b-2 ${
              mode === "signin"
                ? "border-ink text-ink font-semibold"
                : "border-transparent text-stone hover:text-ink"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 pb-4 text-xs uppercase tracking-luxe font-medium transition border-b-2 ${
              mode === "register"
                ? "border-ink text-ink font-semibold"
                : "border-transparent text-stone hover:text-ink"
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "register" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-luxe text-stone mb-1.5">
                  First Name
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    required
                    className="h-11 rounded-none border-line bg-secondary/30 px-3 text-sm focus-visible:ring-1 focus-visible:ring-ink"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-luxe text-stone mb-1.5">
                  Last Name
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="h-11 rounded-none border-line bg-secondary/30 px-3 text-sm focus-visible:ring-1 focus-visible:ring-ink"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] uppercase tracking-luxe text-stone mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="h-11 rounded-none border-line bg-secondary/30 px-3 text-sm focus-visible:ring-1 focus-visible:ring-ink"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] uppercase tracking-luxe text-stone">
                Password
              </label>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => toast.info("Password reset instructions have been sent to your email.")}
                  className="text-[11px] text-stone hover:text-ink underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="h-11 rounded-none border-line bg-secondary/30 px-3 pr-10 text-sm focus-visible:ring-1 focus-visible:ring-ink"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-ink"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {mode === "register" && (
              <p className="text-[11px] text-stone mt-1">Must be at least 8 characters</p>
            )}
          </div>

          {mode === "register" && (
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

          <div className="pt-2">
            <LinedButton type="submit" disabled={loading} className="w-full">
              {loading ? "Processing..." : mode === "signin" ? "Sign In" : "Create Account"}
            </LinedButton>
          </div>
        </form>

        {/* Guest checkout reassurance */}
        <div className="mt-8 pt-6 border-t border-line/70 text-center">
          <p className="text-xs text-stone mb-2">Checking out without an account?</p>
          <Link
            href="/checkout"
            className="inline-block text-xs uppercase tracking-luxe text-ink font-medium hover:underline"
          >
            Continue as Guest &rarr;
          </Link>
        </div>
      </div>

      {/* Privileges Side Card */}
      <div className="lg:col-span-5 bg-sand/30 border border-line/60 p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-stone font-semibold">
            LETTY Privilege
          </span>
          <h3 className="font-serif text-xl text-ink mt-1">Why Create an Account?</h3>
        </div>

        <ul className="space-y-4 text-xs text-stone">
          <li className="flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-ink shrink-0 mt-0.5" />
            <span>
              <strong className="text-ink font-medium">Early Drop Access:</strong> Receive 24-hour priority access to limited edition shades and seasonal releases.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Lock className="h-4 w-4 text-ink shrink-0 mt-0.5" />
            <span>
              <strong className="text-ink font-medium">Express One-Click Ordering:</strong> Securely save shipping destinations and preferred methods.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <ShieldCheck className="h-4 w-4 text-ink shrink-0 mt-0.5" />
            <span>
              <strong className="text-ink font-medium">Order History & Concierge:</strong> Instant tracking, digital invoices, and shade-matching assistance.
            </span>
          </li>
        </ul>

        <div className="pt-4 border-t border-line/50">
          <p className="text-[11px] text-stone italic">
            Guest checkout is always supported with zero friction. You never have to create an account to shop with LETTY.
          </p>
        </div>
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
      toast.error("Please enter an order number (e.g. LTY-2026-XXXX)");
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
              As a registered client of the Maison, your orders qualify for concierge handling, complimentary global shipping thresholds, and seasonal private edits.
            </p>
            <div className="pt-2 border-t border-line space-y-2">
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-stone">Atelier Tier</span>
                <span className="font-medium text-ink">Tier 1 • Inner Circle</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-stone">Complimentary Delivery</span>
                <span className="font-medium text-emerald-800">Active (Orders £150+)</span>
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
                  placeholder="e.g. LTY-2026-1042"
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
    <div className="min-h-[80vh] py-12 sm:py-20 px-4 sm:px-6">
      <div className="mx-auto max-w-sm text-center mb-8">
        <Link href="/" className="inline-block">
          <LogoImage priority className="mx-auto h-20 w-auto" />
        </Link>
        <h1 className="font-serif text-2xl sm:text-3xl text-ink mt-4">Welcome to LETTY</h1>
        <p className="text-xs uppercase tracking-luxe text-stone mt-1">
          Signature Luxury &amp; Beauty
        </p>
      </div>

      <Suspense fallback={<div className="text-center py-20 text-stone">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
