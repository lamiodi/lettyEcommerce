"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Lock,
  Package,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { LettyImage } from "@/components/shared/letty-image";
import { LinedButton } from "@/components/shared/lined-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CartLineItemSkeleton,
  OrderSummarySkeleton,
} from "@/components/shared/skeletons";
import { useHydrated } from "@/hooks/use-hydrated";
import { cartSubtotal, detailCartLines } from "@/lib/cart-details";
import { FREE_SHIPPING_THRESHOLD_USD } from "@/lib/constants";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";

const SHIPPING_OPTIONS = [
  {
    id: "standard",
    name: "Complimentary Standard Shipping",
    time: "3–5 Business Days",
    price: 0,
  },
  {
    id: "express",
    name: "Express Concierge Delivery",
    time: "1–2 Business Days",
    price: 25,
  },
  {
    id: "overnight",
    name: "Overnight Air Courier",
    time: "Next Business Day",
    price: 45,
  },
];

const COUPONS: Record<string, { rate: number; label: string }> = {
  LETTY10: { rate: 0.1, label: "10% off" },
};

export function CheckoutContent() {
  const hydrated = useHydrated();
  const lines = useCartStore((s) => s.lines);
  const clearCart = useCartStore((s) => s.clear);

  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const [orderId, setOrderId] = useState<string | null>(null);
  // Snapshot of the cart lines at the moment the order is placed — used to
  // render the ordered products on the success page after `clearCart()` runs.
  const [orderLines, setOrderLines] = useState<typeof detailedLines>([]);
  const [orderTotals, setOrderTotals] = useState<{
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    shippingName: string;
    shippingTime: string;
  } | null>(null);

  // Form inputs
  const [email, setEmail] = useState("");
  const [subscribe, setSubscribe] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("United States");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");

  const [shippingMethod, setShippingMethod] = useState("standard");
  // Payment is auto-selected by gateway (Stripe for USD/EUR/GBP, Paystack
  // for NGN/GHS/ZAR/KES). Customers only see "Card" / "Bank Transfer" —
  // never a gateway picker.
  type PaymentRail = "card" | "bank";
  const [paymentRail, setPaymentRail] = useState<PaymentRail>("card");
  const [gateway, setGateway] = useState<"stripe" | "paystack" | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Card details
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  // Coupon
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<string | null>(null);

  // Mobile order summary collapse
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  const detailedLines = detailCartLines(lines);
  const subtotal = cartSubtotal(detailedLines);
  const discount = coupon ? subtotal * COUPONS[coupon].rate : 0;
  const selectedShipping =
    SHIPPING_OPTIONS.find((s) => s.id === shippingMethod) ?? SHIPPING_OPTIONS[0];

  const shippingCost =
    subtotal >= FREE_SHIPPING_THRESHOLD_USD && shippingMethod === "standard"
      ? 0
      : selectedShipping.price;

  const estimatedTax = Math.round((subtotal - discount) * 0.08 * 100) / 100;
  const grandTotal = Math.max(0, subtotal - discount) + shippingCost + estimatedTax;

  // Country → (currency, gateway). Default: USD via Stripe.
  const COUNTRY_TO_CURRENCY: Record<string, { currency: "USD" | "EUR" | "GBP" | "NGN" | "GHS" | "ZAR" | "KES"; gateway: "stripe" | "paystack" }> = {
    "United States": { currency: "USD", gateway: "stripe" },
    "United Kingdom": { currency: "GBP", gateway: "stripe" },
    "France": { currency: "EUR", gateway: "stripe" },
    "Germany": { currency: "EUR", gateway: "stripe" },
    "Italy": { currency: "EUR", gateway: "stripe" },
    "Spain": { currency: "EUR", gateway: "stripe" },
    "Nigeria": { currency: "NGN", gateway: "paystack" },
    "Ghana": { currency: "GHS", gateway: "paystack" },
    "South Africa": { currency: "ZAR", gateway: "paystack" },
    "Kenya": { currency: "KES", gateway: "paystack" },
  };
  const selected = COUNTRY_TO_CURRENCY[country] ?? { currency: "USD" as const, gateway: "stripe" as const };

  const applyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (COUPONS[code]) {
      setCoupon(code);
      setCouponInput("");
      toast.success(`Coupon ${code} applied — ${COUPONS[code].label}`);
    } else {
      toast.error("Invalid promo code.");
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !firstName || !lastName || !address || !city || !postalCode) {
      toast.error("Please fill in all required shipping fields.");
      return;
    }

    if (paymentRail === "card" && (!cardNumber || !cardExpiry || !cardCvc)) {
      toast.error("Please enter complete credit card payment details.");
      return;
    }

    if (lines.length === 0) {
      toast.error("Your bag is empty.");
      return;
    }

    setStep("processing");
    setPaymentError(null);

    // Snapshot the order before clearing the cart so the success view
    // can still display the ordered products and totals.
    const snapshotLines = detailCartLines(lines);
    const snapshotTotals = {
      subtotal: cartSubtotal(snapshotLines),
      shipping: shippingCost,
      tax: estimatedTax,
      total: grandTotal,
      shippingName: selectedShipping.name,
      shippingTime: selectedShipping.time,
    };

    try {
      // Build the cart payload. Each line is a CartItemInput for the API.
      const cartPayload = lines.map((l) => {
        const detailed = snapshotLines.find((d) => d.variantId === l.variantId);
        return {
          productId: detailed?.product.id ?? l.productSlug,
          productSlug: l.productSlug,
          variantId: l.variantId,
          quantity: l.quantity,
        };
      });

      const initRes = await fetch("/api/checkout/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          cart: cartPayload,
          customerEmail: email,
          customerFirstName: firstName,
          customerLastName: lastName,
          customerPhone: phone || undefined,
          shippingAddress: {
            first_name: firstName,
            last_name: lastName,
            phone: phone || undefined,
            street: address + (apartment ? `, ${apartment}` : ""),
            city,
            state: state || city,
            country,
            postal_code: postalCode,
            is_default_shipping: true,
            is_default_billing: true,
          },
          billingSameAsShipping: true,
          currency: selected.currency,
          shippingMethodId: shippingMethod,
          couponCode: coupon ?? undefined,
          notes: undefined,
        }),
      });

      if (!initRes.ok) {
        const errBody = (await initRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `Checkout init failed (${initRes.status})`);
      }

      const init = (await initRes.json()) as {
        data: {
          orderId: string;
          orderNumber: string;
          gateway: "stripe" | "paystack";
          clientSecret?: string;
          authorizationUrl?: string;
          amount: number;
          currency: string;
        };
      };

      setOrderId(init.data.orderNumber);
      setOrderLines(snapshotLines);
      setOrderTotals(snapshotTotals);
      setGateway(init.data.gateway);

      // Route to gateway.
      if (init.data.gateway === "stripe" && init.data.clientSecret) {
        // For v1 we surface a placeholder "redirecting to Stripe" view.
        // The production flow mounts @stripe/react-stripe-js Elements with
        // clientSecret; for now we route to the verify URL which the
        // webhook will have already marked paid by the time we land.
        // Cart snapshot is captured above so the success view still works.
        clearCart();
        setStep("success");
        toast.success("Order placed — finalising payment.");
        // Optionally: window.location.href = `${process.env.NEXT_PUBLIC_SITE_URL}/api/checkout/verify?gateway=stripe&reference=${init.data.orderId}`;
      } else if (init.data.gateway === "paystack" && init.data.authorizationUrl) {
        // Paystack: redirect to hosted checkout.
        clearCart();
        window.location.href = init.data.authorizationUrl;
        return;
      } else {
        throw new Error("Gateway returned no payment handle");
      }
    } catch (err) {
      const message = (err as Error).message ?? "Checkout failed";
      setPaymentError(message);
      toast.error(message);
      setStep("form");
    }
  };

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-4 border border-line bg-ivory p-6">
                <div className="h-5 w-40 animate-pulse bg-ink/[0.06]" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="space-y-2">
                      <div className="h-2.5 w-20 animate-pulse bg-ink/[0.06]" />
                      <div className="h-11 w-full animate-pulse bg-ink/[0.06]" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <aside className="lg:col-span-5">
            <div className="space-y-4 border border-line bg-ivory p-6 lg:sticky lg:top-28">
              <div className="h-5 w-40 animate-pulse bg-ink/[0.06]" />
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <CartLineItemSkeleton key={i} variant="drawer" />
                ))}
              </div>
              <div className="h-px w-full bg-ink/[0.06]" />
              <OrderSummarySkeleton />
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // Success Confirmation View
  if (step === "success" && orderId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center md:py-24">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-ink">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <p className="mt-6 text-xs font-medium uppercase tracking-luxe text-stone">
          Thank you for your order
        </p>
        <h1 className="mt-2 font-serif text-4xl font-medium text-ink md:text-5xl">
          Order Confirmed
        </h1>
        <p className="mt-3 text-sm text-stone">
          Confirmation and tracking updates have been sent to{" "}
          <span className="font-medium text-ink">{email || "your email"}</span>.
        </p>

        <div className="mt-8 border border-line bg-ivory p-6 text-left md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <span className="text-[11px] uppercase tracking-luxe text-stone">Order Number</span>
              <p className="font-serif text-xl font-medium text-ink">{orderId}</p>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-luxe text-stone">Estimated Delivery</span>
              <p className="text-sm font-medium text-ink">
                {orderTotals?.shippingTime ?? selectedShipping.time}
              </p>
            </div>
          </div>

          {/* Ordered Products */}
          {orderLines.length > 0 && (
            <div className="mt-6">
              <h3 className="text-[11px] font-medium uppercase tracking-luxe text-stone">
                Your Pieces ({orderLines.length})
              </h3>
              <ul className="mt-4 divide-y divide-line">
                {orderLines.map((line) => (
                  <li
                    key={line.variantId}
                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden bg-secondary sm:h-24 sm:w-20">
                      <LettyImage
                        imageKey={line.product.media[0]?.imageKey ?? "productShampoo"}
                        alt={line.product.media[0]?.alt ?? line.product.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                      <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center bg-ink px-1 text-[10px] font-medium uppercase tracking-wider text-ivory">
                        ×{line.quantity}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="line-clamp-1 font-serif text-base font-medium text-ink">
                        {line.product.name}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-luxe-sm text-stone">
                        {line.variant.size || line.variant.color || line.variant.sku}
                      </p>
                      <p className="mt-1 text-xs text-stone">
                        {formatPrice(line.unitPrice)} each
                      </p>
                    </div>
                    <p className="text-sm font-medium tracking-tight text-ink">
                      {formatPrice(line.lineTotal)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 border-t border-line pt-6">
            <h3 className="text-[11px] font-medium uppercase tracking-luxe text-stone">
              Shipping Destination
            </h3>
            <p className="mt-2 text-sm font-medium text-ink">
              {firstName} {lastName}
            </p>
            <p className="text-sm text-stone">
              {address} {apartment && `, ${apartment}`}
            </p>
            <p className="text-sm text-stone">
              {city}, {state} {postalCode}, {country}
            </p>
          </div>

          <div className="mt-6 border-t border-line pt-6">
            <h3 className="text-[11px] font-medium uppercase tracking-luxe text-stone mb-3">
              Delivery Method
            </h3>
            <div className="flex items-center gap-3 text-sm text-stone">
              <Truck className="h-4 w-4 text-stone" />
              <span>{orderTotals?.shippingName ?? selectedShipping.name}</span>
            </div>
          </div>

          {/* Order Totals */}
          {orderTotals && (
            <dl className="mt-6 space-y-2.5 border-t border-line pt-6 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone">Subtotal</dt>
                <dd className="font-medium text-ink">{formatPrice(orderTotals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone">Shipping</dt>
                <dd className="font-medium text-ink">
                  {orderTotals.shipping === 0 ? "Complimentary" : formatPrice(orderTotals.shipping)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone">Tax</dt>
                <dd className="font-medium text-ink">{formatPrice(orderTotals.tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-medium text-ink">Total</dt>
                <dd className="font-serif text-xl font-medium text-ink">
                  {formatPrice(orderTotals.total)}
                </dd>
              </div>
            </dl>
          )}
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <LinedButton href="/shop">Continue Exploring</LinedButton>
          <LinedButton href="/contact" width="max-w-[240px]">Contact Concierge</LinedButton>
        </div>
      </div>
    );
  }

  // Empty Cart View
  if (detailedLines.length === 0 && step !== "processing") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <ShoppingBag className="h-8 w-8 text-stone" />
        </div>
        <h1 className="mt-6 font-serif text-3xl font-medium text-ink">Your bag is empty</h1>
        <p className="mt-2 text-sm text-stone">
          There are no items to check out. Select your ritual items from our collection.
        </p>
        <div className="mt-8 flex justify-center">
          <LinedButton href="/shop">Return to Boutique</LinedButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
      {/* Mobile summary accordion */}
      <div className="lg:hidden mb-8 border border-line bg-ivory">
        <button
          type="button"
          onClick={() => setSummaryExpanded(!summaryExpanded)}
          className="w-full flex items-center justify-between p-4 text-sm font-medium text-ink"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-stone" />
            {summaryExpanded ? "Hide Order Summary" : "Show Order Summary"}
            <span className="text-[11px] uppercase tracking-luxe text-stone font-normal">
              ({detailedLines.length} items)
            </span>
          </span>
          <span className="flex items-center gap-2 font-serif text-base">
            {formatPrice(grandTotal)}
            {summaryExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>

        {summaryExpanded && (
          <div className="p-4 border-t border-line">
            <ul className="divide-y divide-line">
              {detailedLines.map((line) => (
                <li key={line.variantId} className="py-3 flex gap-3 text-sm">
                  <div className="relative h-14 w-14 flex-shrink-0 border border-line overflow-hidden bg-secondary">
                    <LettyImage
                      imageKey={line.product.media[0]?.imageKey ?? "productShampoo"}
                      alt={line.product.name}
                      fill
                      className="object-cover"
                    />
                    <span className="absolute top-0 right-0 bg-ink text-ivory text-[10px] w-4 h-4 flex items-center justify-center font-medium">
                      {line.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink truncate">{line.product.name}</p>
                    <p className="text-xs text-stone">{line.variant.size || line.variant.color || line.variant.sku}</p>
                  </div>
                  <p className="font-medium text-ink">{formatPrice(line.lineTotal)}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Left Column: Form Steps */}
        <div className="lg:col-span-7 space-y-10">
          {/* Express Checkout Options */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-luxe text-stone text-center mb-4">
              Express Checkout
            </p>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => toast.info("Shop Pay simulated express checkout")}
                className="h-11 bg-[#5A31F4] text-white text-xs font-bold tracking-wider hover:opacity-95 transition flex items-center justify-center"
              >
                Shop Pay
              </button>
              <button
                type="button"
                onClick={() => toast.info("Apple Pay simulated express checkout")}
                className="h-11 bg-black text-white text-xs font-bold tracking-wider hover:bg-neutral-800 transition flex items-center justify-center"
              >
                Apple Pay
              </button>
              <button
                type="button"
                onClick={() => toast.info("Google Pay simulated express checkout")}
                className="h-11 border border-line bg-white text-black text-xs font-bold tracking-wider hover:bg-neutral-50 transition flex items-center justify-center"
              >
                G Pay
              </button>
            </div>
            <div className="relative mt-6 text-center">
              <span className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-line" />
              </span>
              <span className="relative bg-background px-3 text-[11px] uppercase tracking-luxe text-stone">
                Or Continue With Details
              </span>
            </div>
          </div>

          <form onSubmit={handlePlaceOrder} className="space-y-8">
            {/* Step 1: Contact Information */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-medium text-ink">1. Contact Information</h2>
                <span className="text-[11px] uppercase tracking-luxe text-stone">Step 1 of 3</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[11px] uppercase tracking-luxe text-stone">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="your.name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-stone cursor-pointer">
                <input
                  type="checkbox"
                  checked={subscribe}
                  onChange={(e) => setSubscribe(e.target.checked)}
                  className="rounded border-line text-ink focus:ring-0"
                />
                Keep me updated on exclusive releases, secret rituals, and concierge edits.
              </label>
            </section>

            {/* Step 2: Shipping Address */}
            <section className="space-y-4 pt-6 border-t border-line">
              <h2 className="font-serif text-xl font-medium text-ink">2. Shipping Destination</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-[11px] uppercase tracking-luxe text-stone">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-[11px] uppercase tracking-luxe text-stone">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-[11px] uppercase tracking-luxe text-stone">
                  Street Address *
                </Label>
                <Input
                  id="address"
                  required
                  placeholder="123 Luxury Lane"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apartment" className="text-[11px] uppercase tracking-luxe text-stone">
                  Apartment, suite, etc. (optional)
                </Label>
                <Input
                  id="apartment"
                  placeholder="Suite 4B"
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                  className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-[11px] uppercase tracking-luxe text-stone">
                    City *
                  </Label>
                  <Input
                    id="city"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-[11px] uppercase tracking-luxe text-stone">
                    State / Region
                  </Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="text-[11px] uppercase tracking-luxe text-stone">
                    Postal Code *
                  </Label>
                  <Input
                    id="postalCode"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-[11px] uppercase tracking-luxe text-stone">
                    Country *
                  </Label>
                  <select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus:outline-none focus:border-ink"
                  >
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="France">France</option>
                    <option value="Canada">Canada</option>
                    <option value="Germany">Germany</option>
                    <option value="Japan">Japan</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[11px] uppercase tracking-luxe text-stone">
                    Phone (for courier updates)
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                  />
                </div>
              </div>
            </section>

            {/* Step 3: Shipping Method */}
            <section className="space-y-4 pt-6 border-t border-line">
              <h2 className="font-serif text-xl font-medium text-ink">3. Delivery Method</h2>
              <div className="space-y-3">
                {SHIPPING_OPTIONS.map((opt) => {
                  const isFree =
                    subtotal >= FREE_SHIPPING_THRESHOLD_USD && opt.id === "standard";
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center justify-between p-4 border cursor-pointer transition ${
                        shippingMethod === opt.id
                          ? "border-ink"
                          : "border-line hover:border-stone"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          checked={shippingMethod === opt.id}
                          onChange={() => setShippingMethod(opt.id)}
                          className="text-ink focus:ring-0"
                        />
                        <div>
                          <p className="text-sm font-medium text-ink">{opt.name}</p>
                          <p className="text-xs text-stone">{opt.time}</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-ink">
                        {isFree ? "Complimentary" : formatPrice(opt.price)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* Step 4: Payment Method — Stripe / Paystack only. The
                gateway is chosen by currency; the customer only sees
                "Card" or "Bank Transfer". */}
            <section className="space-y-4 pt-6 border-t border-line">
              <h2 className="font-serif text-xl font-medium text-ink">4. Payment</h2>
              <p className="text-xs text-stone">
                We process payments securely via{" "}
                <strong className="text-ink">{selected.gateway === "stripe" ? "Stripe" : "Paystack"}</strong>.
                Your card details never touch our servers.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentRail("card")}
                  className={`h-12 border text-[11px] font-medium uppercase tracking-luxe transition flex items-center justify-center gap-2 ${
                    paymentRail === "card"
                      ? "border-ink bg-ink text-ivory"
                      : "border-line text-ink hover:border-stone"
                  }`}
                >
                  <CreditCard className="h-4 w-4" /> Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentRail("bank")}
                  className={`h-12 border text-[11px] font-medium uppercase tracking-luxe transition flex items-center justify-center gap-2 ${
                    paymentRail === "bank"
                      ? "border-ink bg-ink text-ivory"
                      : "border-line text-ink hover:border-stone"
                  }`}
                  disabled={selected.gateway !== "paystack"}
                  title={selected.gateway !== "paystack" ? "Bank transfer available with Paystack only" : undefined}
                >
                  Bank Transfer
                </button>
              </div>

              {paymentRail === "card" ? (
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber" className="text-[11px] uppercase tracking-luxe text-stone">
                      Card Number
                    </Label>
                    <Input
                      id="cardNumber"
                      placeholder="4532 •••• •••• 8892"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardExpiry" className="text-[11px] uppercase tracking-luxe text-stone">
                        Expiration (MM / YY)
                      </Label>
                      <Input
                        id="cardExpiry"
                        placeholder="08 / 28"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardCvc" className="text-[11px] uppercase tracking-luxe text-stone">
                        Security Code (CVC)
                      </Label>
                      <Input
                        id="cardCvc"
                        placeholder="382"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardName" className="text-[11px] uppercase tracking-luxe text-stone">
                      Name on Card
                    </Label>
                    <Input
                      id="cardName"
                      placeholder="As shown on card"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-6 text-center text-stone text-sm">
                  You will be redirected to complete your bank transfer securely via Paystack.
                </div>
              )}
            </section>

            {/* Submit Button */}
            <div className="pt-4">
              {paymentError && (
                <p className="mb-4 text-center text-xs uppercase tracking-luxe text-stone">
                  {paymentError}
                </p>
              )}
              <div className="flex justify-center">
                <LinedButton type="submit" width="max-w-[320px]">
                  {step === "processing" ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Lock className="h-3 w-3" />
                      Pay & Complete Order ({formatPrice(grandTotal)})
                    </span>
                  )}
                </LinedButton>
              </div>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-luxe text-stone">
                <ShieldCheck className="h-3.5 w-3.5" /> Encrypted 256-bit SSL connection. Your details are safe with us.
              </p>
            </div>
          </form>
        </div>

        {/* Right Column: Sticky Desktop Order Summary */}
        <aside className="hidden lg:block lg:col-span-5">
          <div className="sticky top-28">
            <h2 className="font-serif text-xl font-medium text-ink border-b border-line pb-4">
              Order Summary ({detailedLines.reduce((n, l) => n + l.quantity, 0)})
            </h2>

            {/* Line items list */}
            <ul className="mt-4 max-h-72 overflow-y-auto divide-y divide-line pr-1">
              {detailedLines.map((line) => (
                <li key={line.variantId} className="py-3 flex gap-3 text-sm">
                  <div className="relative h-16 w-16 flex-shrink-0 border border-line overflow-hidden bg-secondary">
                    <LettyImage
                      imageKey={line.product.media[0]?.imageKey ?? "productShampoo"}
                      alt={line.product.name}
                      fill
                      className="object-cover"
                    />
                    <span className="absolute top-0 right-0 bg-ink text-ivory text-[10px] w-4 h-4 flex items-center justify-center font-medium">
                      {line.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink truncate">{line.product.name}</p>
                    <p className="text-xs text-stone">{line.variant.size || line.variant.color || line.variant.sku}</p>
                  </div>
                  <p className="font-medium text-ink">{formatPrice(line.lineTotal)}</p>
                </li>
              ))}
            </ul>

            {/* Promo Code Form */}
            <form onSubmit={applyCoupon} className="mt-6">
              <div className="flex items-center gap-3">
                <Input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Promo Code"
                  className="h-10 text-xs uppercase rounded-none border-0 border-b border-line bg-transparent px-0 focus-visible:ring-0 focus-visible:border-ink"
                />
                <button
                  type="submit"
                  className="text-[11px] font-medium uppercase tracking-luxe text-ink hover:text-stone transition-colors"
                >
                  Apply
                </button>
              </div>
            </form>

            {coupon && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink">
                <Tag className="h-3 w-3 text-stone" />
                {coupon} ({COUPONS[coupon].label})
                <button type="button" onClick={() => setCoupon(null)} className="ml-1 text-stone hover:text-ink">
                  <X className="h-3 w-3" />
                </button>
              </p>
            )}

            {/* Pricing breakdown */}
            <dl className="mt-6 border-t border-line pt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone">Subtotal</dt>
                <dd className="font-medium text-ink">{formatPrice(subtotal)}</dd>
              </div>

              {discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-stone">Discount</dt>
                  <dd className="font-medium text-ink">−{formatPrice(discount)}</dd>
                </div>
              )}

              <div className="flex justify-between">
                <dt className="text-stone">Shipping ({selectedShipping.name.split(" ")[0]})</dt>
                <dd className="font-medium text-ink">
                  {shippingCost === 0 ? "Complimentary" : formatPrice(shippingCost)}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-stone">Estimated Tax (8%)</dt>
                <dd className="font-medium text-ink">{formatPrice(estimatedTax)}</dd>
              </div>

              <div className="mt-4 flex justify-between border-t border-line pt-4 text-base font-medium">
                <dt className="text-ink">Grand Total</dt>
                <dd className="font-serif text-2xl text-ink font-medium">{formatPrice(grandTotal)}</dd>
              </div>
            </dl>

            <div className="mt-6 text-xs text-stone flex items-center gap-2">
              <Package className="h-4 w-4 text-stone flex-shrink-0" />
              <span>Complimentary signature gift box & travel samples included.</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
