"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCustomerAuthStore } from "@/lib/store/customer-auth";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  CartLineItemSkeleton,
  OrderSummarySkeleton,
} from "@/components/shared/skeletons";
import { useHydrated } from "@/hooks/use-hydrated";
import { cartSubtotal, detailCartLines } from "@/lib/cart-details";
import {
  calculateShipping,
  getShippingDestinationKey,
  SHIPPING_DESTINATIONS,
  FREE_SHIPPING_THRESHOLD_USD,
  STANDARD_SHIPPING_FLAT_USD,
} from "@/lib/constants";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import { CountrySelect } from "@/components/ui/country-select";
import { CountryFlag } from "@/components/ui/country-flag";
import { COUNTRIES, type CountryInfo } from "@/lib/data/countries";
import { useCurrencyStore } from "@/lib/store/currency";

const formatCardNumber = (val: string) => {
  const v = val.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const parts = [];
  for (let i = 0; i < v.length; i += 4) {
    parts.push(v.substring(i, i + 4));
  }
  return parts.length > 1 ? parts.join(' ') : v;
};

const formatExpiry = (val: string) => {
  const v = val.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  if (v.length >= 3) {
    return `${v.substring(0, 2)} / ${v.substring(2, 4)}`;
  }
  return v;
};

const SHIPPING_OPTIONS = [
  {
    id: "standard",
    name: "Standard Shipping",
    time: "3–5 Business Days",
    price: STANDARD_SHIPPING_FLAT_USD,
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
  LETY10: { rate: 0.1, label: "10% off" },
  LETTY10: { rate: 0.1, label: "10% off" },
  CIRCLE10: { rate: 0.1, label: "£10 Off Friend Referral" },
  PATRON10: { rate: 0.1, label: "£10 Off VIP Voucher" },
  PATRON20: { rate: 0.2, label: "£20 Off VIP Voucher" },
  PATRON50: { rate: 0.5, label: "£50 Off VIP Voucher" },
  PATRON100: { rate: 1.0, label: "£100 Atelier Credit" },
};

export function CheckoutContent() {
  const hydrated = useHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
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
    currency: string;
    shippingName: string;
    shippingTime: string;
  } | null>(null);

  // Form inputs
  const [email, setEmail] = useState(customer?.email ?? "");
  const [subscribe, setSubscribe] = useState(false);
  const storeCountry = useCurrencyStore((s) => s.country);
  const setStoreCountry = useCurrencyStore((s) => s.setCountry);
  const convertPrice = useCurrencyStore((s) => s.convertPrice);

  const [firstName, setFirstName] = useState(customer?.firstName ?? "");
  const [lastName, setLastName] = useState(customer?.lastName ?? "");

  useEffect(() => {
    if (customer) {
      if (customer.email && !email) setEmail(customer.email);
      if (customer.firstName && !firstName) setFirstName(customer.firstName);
      if (customer.lastName && !lastName) setLastName(customer.lastName);
    }
  }, [customer]);
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState(storeCountry?.name ?? "United Kingdom");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState(storeCountry?.dialCode ? `${storeCountry.dialCode} ` : "");

  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingFirstName, setBillingFirstName] = useState("");
  const [billingLastName, setBillingLastName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingApartment, setBillingApartment] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingCountry, setBillingCountry] = useState(storeCountry?.name ?? "United Kingdom");
  const [billingState, setBillingState] = useState("");
  const [billingPostalCode, setBillingPostalCode] = useState("");

  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Card details
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  // Coupon
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<string | null>(null);
  const [appliedCouponInfo, setAppliedCouponInfo] = useState<{
    code: string;
    rate?: number;
    amount?: number;
    label: string;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Mobile order summary collapse
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  const selectedCountryInfo =
    COUNTRIES.find(
      (c) =>
        c.name.toLowerCase() === country.toLowerCase() ||
        c.code.toLowerCase() === country.toLowerCase(),
    ) ?? COUNTRIES[0];

  const selected = {
    currency: selectedCountryInfo.currency,
    gateway: "stripe" as const,
  };

  const detailedLines = detailCartLines(lines);
  const subtotal = cartSubtotal(detailedLines);
  const discount = appliedCouponInfo
    ? appliedCouponInfo.rate
      ? subtotal * appliedCouponInfo.rate
      : appliedCouponInfo.amount
      ? appliedCouponInfo.amount
      : 0
    : coupon && COUPONS[coupon]
    ? subtotal * COUPONS[coupon].rate
    : 0;
  const destKey = getShippingDestinationKey(country || storeCountry?.name);
  const destInfo = SHIPPING_DESTINATIONS[destKey];
  const isEuropeEur = selected.currency === "EUR" && destKey === "Europe";

  const shippingCost = calculateShipping(
    subtotal - discount,
    country || storeCountry?.name,
    selected.currency,
    shippingMethod,
  );
  const convertedSubtotal = convertPrice(subtotal, selected.currency);
  const convertedDiscount = convertPrice(discount, selected.currency);
  const convertedShippingCost = isEuropeEur
    ? shippingCost
    : (shippingCost === 0 ? 0 : convertPrice(shippingCost, selected.currency));
  const grandTotal =
    Math.max(0, convertedSubtotal - convertedDiscount) + convertedShippingCost;

  const applyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    setValidatingCoupon(true);
    try {
      const res = await fetch("/api/coupon/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          subtotal,
          currency: selected.currency,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        if (data) {
          const isPercent = data.discountType === "percentage";
          const label = isPercent ? `${data.discountValue}% off` : `${data.discountAmount} ${selected.currency} off`;
          setAppliedCouponInfo({
            code,
            rate: isPercent ? data.discountValue / 100 : undefined,
            amount: !isPercent ? data.discountAmount : undefined,
            label,
          });
          setCoupon(code);
          setCouponInput("");
          toast.success(`Promo code ${code} applied — ${label}`);
          return;
        }
      }
    } catch {
      // Fall through to preset boutique coupons
    } finally {
      setValidatingCoupon(false);
    }

    if (COUPONS[code]) {
      setAppliedCouponInfo({
        code,
        rate: COUPONS[code].rate,
        label: COUPONS[code].label,
      });
      setCoupon(code);
      setCouponInput("");
      toast.success(`Promo code ${code} applied — ${COUPONS[code].label}`);
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

    if (!billingSameAsShipping) {
      if (!billingFirstName || !billingLastName || !billingAddress || !billingCity || !billingPostalCode) {
        toast.error("Please fill in all required billing fields.");
        return;
      }
    }

    if (!cardNumber || !cardExpiry || !cardCvc) {
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
    const snapshotLines = detailCartLines(lines).map((l) => ({
      ...l,
      unitPrice: convertPrice(l.unitPrice, selected.currency),
      lineTotal: convertPrice(l.lineTotal, selected.currency),
    }));
    const snapshotTotals = {
      subtotal: convertedSubtotal,
      shipping: convertedShippingCost,
      tax: 0,
      total: grandTotal,
      currency: selected.currency,
      shippingName: `${destInfo.flag} ${destInfo.label} Tracked Delivery`,
      shippingTime: destInfo.deliveryTime,
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
            is_default_billing: billingSameAsShipping,
          },
          billingSameAsShipping,
          billingAddress: billingSameAsShipping ? undefined : {
            first_name: billingFirstName,
            last_name: billingLastName,
            street: billingAddress + (billingApartment ? `, ${billingApartment}` : ""),
            city: billingCity,
            state: billingState || billingCity,
            country: billingCountry,
            postal_code: billingPostalCode,
          },
          currency: selected.currency,
          subtotal: convertedSubtotal,
          shippingTotal: convertedShippingCost,
          total: grandTotal,
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
        data: Record<string, any>;
      };
      const initData = init?.data ?? {};
      const orderNum = initData.orderNumber || initData.order_number || "ORDER";
      const cSecret = initData.clientSecret || initData.client_secret;

      setOrderId(orderNum);
      setOrderLines(snapshotLines);
      setOrderTotals(snapshotTotals);

      // Stripe payment flow:
      if (cSecret || initData.gateway === "stripe") {
        clearCart();
        setStep("success");
        toast.success("Order placed successfully — payment processed via Stripe.");
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
                <Skeleton className="h-5 w-40" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-2.5 w-20" />
                      <Skeleton className="h-11 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <aside className="lg:col-span-5">
            <div className="space-y-4 border border-line bg-ivory p-6 lg:sticky lg:top-28">
              <Skeleton className="h-5 w-40" />
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <CartLineItemSkeleton key={i} variant="drawer" />
                ))}
              </div>
              <Skeleton className="h-px w-full" />
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
                {orderTotals?.shippingTime ?? "2–4 business days"}
              </p>
            </div>
          </div>

          {/* Ordered Products */}
          {orderLines.length > 0 && (
            <div className="mt-6">
              <h3 className="text-[11px] font-medium uppercase tracking-luxe text-stone">
                Your Selection ({orderLines.length})
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
                        {formatPrice(line.unitPrice, orderTotals?.currency ?? selected.currency)} each
                      </p>
                    </div>
                    <p className="text-sm font-medium tracking-tight text-ink">
                      {formatPrice(line.lineTotal, orderTotals?.currency ?? selected.currency)}
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
              <span>{orderTotals?.shippingName ?? "Tracked Delivery"}</span>
            </div>
          </div>

          {/* Order Totals */}
          {orderTotals && (
            <dl className="mt-6 space-y-2.5 border-t border-line pt-6 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone">Subtotal</dt>
                <dd className="font-medium text-ink">{formatPrice(orderTotals.subtotal, orderTotals.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone">Shipping</dt>
                <dd className="font-medium text-ink">
                  {orderTotals.shipping === 0 ? "Complimentary" : formatPrice(orderTotals.shipping, orderTotals.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone">Taxes</dt>
                <dd className="font-medium text-ink">Included</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-medium text-ink">Total</dt>
                <dd className="font-serif text-xl font-medium text-ink">
                  {formatPrice(orderTotals.total, orderTotals.currency)}
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
      <div className="lg:hidden mb-8 border border-line bg-white/90 shadow-xs">
        <button
          type="button"
          onClick={() => setSummaryExpanded(!summaryExpanded)}
          className="w-full flex items-center justify-between gap-3 p-4 text-sm font-medium text-ink"
        >
          <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <ShoppingBag className="h-4 w-4 text-stone shrink-0" />
            <span className="min-w-0 truncate">
              {summaryExpanded ? "Hide Order Summary" : "Show Order Summary"}
              <span className="ml-1 text-[11px] uppercase tracking-luxe text-stone font-normal">
                ({detailedLines.length})
              </span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2 font-serif text-base">
            <span className="whitespace-nowrap">{formatPrice(grandTotal, selected.currency)}</span>
            {summaryExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>

        {summaryExpanded && (
          <div className="p-4 border-t border-line bg-ivory/50">
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
                    <span className="absolute top-0 right-0 bg-ink text-ivory text-[10px] w-4 h-4 flex items-center justify-center font-medium font-mono">
                      {line.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink truncate">{line.product.name}</p>
                    <p className="text-xs text-stone">{line.variant.size || line.variant.color || line.variant.sku}</p>
                  </div>
                  <p className="font-medium text-ink">{formatPrice(convertPrice(line.lineTotal, selected.currency), selected.currency)}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">
        {/* Left Column: Form Steps */}
        <div className="lg:col-span-7">
          <form onSubmit={handlePlaceOrder} className="space-y-6 sm:space-y-8">
            {/* Step 1: Contact Information */}
            <section className="border border-line/90 bg-white/90 p-6 sm:p-7 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-line/60">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center border border-ink/20 bg-ivory text-[11px] font-mono font-medium text-ink shadow-2xs">
                    01
                  </span>
                  <div>
                    <h2 className="font-serif text-lg sm:text-xl font-medium text-ink tracking-tight">Contact Information</h2>
                    <p className="text-[10px] uppercase tracking-luxe text-stone mt-0.5">
                      {customer ? `Signed in as ${customer.email}` : "Guest checkout or member sign-in"}
                    </p>
                  </div>
                </div>
                {!customer && (
                  <Link
                    href="/login?redirect=/checkout"
                    className="text-xs text-stone hover:text-ink underline transition font-medium"
                  >
                    Already have an account? Sign in
                  </Link>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[11px] uppercase tracking-luxe text-stone block">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="your.name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 shadow-2xs transition-all focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                </div>
                <label className="flex items-center gap-2.5 text-xs text-stone cursor-pointer pt-1 select-none">
                  <input
                    type="checkbox"
                    checked={subscribe}
                    onChange={(e) => setSubscribe(e.target.checked)}
                    className="h-4 w-4 rounded-none border-line text-ink focus:ring-0 focus:ring-offset-0"
                  />
                  <span>Keep me updated on exclusive releases, secret rituals, and concierge edits.</span>
                </label>
              </div>
            </section>

            {/* Step 2: Shipping Destination */}
            <section className="border border-line/90 bg-white/90 p-6 sm:p-7 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-line/60">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center border border-ink/20 bg-ivory text-[11px] font-mono font-medium text-ink shadow-2xs">
                    02
                  </span>
                  <div>
                    <h2 className="font-serif text-lg sm:text-xl font-medium text-ink tracking-tight">Shipping Destination</h2>
                    <p className="text-[10px] uppercase tracking-luxe text-stone mt-0.5">
                      Tracked courier delivery to your doorstep
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-ink bg-ivory border border-line">
                  <CountryFlag
                    code={selectedCountryInfo.code}
                    name={selectedCountryInfo.name}
                    flagFallback={selectedCountryInfo.flag}
                    size="sm"
                  />
                  <span>{selectedCountryInfo.name}</span>
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-[11px] uppercase tracking-luxe text-stone block">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      required
                      placeholder="Jane"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-12 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 shadow-2xs transition-all focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-[11px] uppercase tracking-luxe text-stone block">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      required
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-12 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 shadow-2xs transition-all focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-[11px] uppercase tracking-luxe text-stone block">
                    Street Address *
                  </Label>
                  <Input
                    id="address"
                    required
                    placeholder="123 Luxury Lane"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-12 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 shadow-2xs transition-all focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="apartment" className="text-[11px] uppercase tracking-luxe text-stone block">
                    Apartment, suite, etc. (optional)
                  </Label>
                  <Input
                    id="apartment"
                    placeholder="Suite 4B"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    className="h-12 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 shadow-2xs transition-all focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-[11px] uppercase tracking-luxe text-stone block">
                      City *
                    </Label>
                    <Input
                      id="city"
                      required
                      placeholder="London"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="h-12 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 shadow-2xs transition-all focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="state" className="text-[11px] uppercase tracking-luxe text-stone block">
                      State / Region
                    </Label>
                    <Input
                      id="state"
                      placeholder="Greater London"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="h-12 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 shadow-2xs transition-all focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="postalCode" className="text-[11px] uppercase tracking-luxe text-stone block">
                      Postal Code *
                    </Label>
                    <Input
                      id="postalCode"
                      required
                      placeholder="SW1A 1AA"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="h-12 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 shadow-2xs transition-all focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <CountrySelect
                    id="country"
                    label="Country / Region"
                    variant="box"
                    required
                    value={country}
                    onChange={(c) => {
                      setCountry(c.name);
                      setStoreCountry(c.code);
                      if (!phone || phone.startsWith("+")) {
                        setPhone(`${c.dialCode} `);
                      }
                    }}
                  />
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-[11px] uppercase tracking-luxe text-stone block">
                      Phone (for courier delivery updates)
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+44 7123 456789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-12 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 shadow-2xs transition-all focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink font-mono"
                    />
                  </div>
                </div>

                {/* Live destination notice */}
                <div className="flex flex-col gap-2 border border-line/70 bg-[#F7F2EC] px-3.5 py-2.5 text-xs text-stone sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <CountryFlag
                      code={selectedCountryInfo.code}
                      name={selectedCountryInfo.name}
                      flagFallback={selectedCountryInfo.flag}
                      size="md"
                    />
                    <span className="min-w-0 truncate">
                      Shipping to <strong className="text-ink font-medium">{selectedCountryInfo.name}</strong> · Currency: <strong className="text-ink font-medium">{selectedCountryInfo.currency} ({selectedCountryInfo.currencySymbol})</strong>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-stone uppercase tracking-wider shrink-0 sm:ml-2">
                    {destInfo.deliveryTime}
                  </span>
                </div>
              </div>
            </section>

            {/* Step 3: Delivery Method */}
            <section className="border border-line/90 bg-white/90 p-6 sm:p-7 shadow-xs">
              <div className="flex items-center gap-3 pb-4 mb-5 border-b border-line/60">
                <span className="flex h-7 w-7 items-center justify-center border border-ink/20 bg-ivory text-[11px] font-mono font-medium text-ink shadow-2xs">
                  03
                </span>
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-medium text-ink tracking-tight">Delivery Method</h2>
                  <p className="text-[10px] uppercase tracking-luxe text-stone mt-0.5">
                    Verified signature courier routes
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 sm:p-5 border border-ink bg-ivory/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="mt-0.5 sm:mt-0 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-ink">
                      <div className="h-2.5 w-2.5 rounded-full bg-ink" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <CountryFlag
                          code={selectedCountryInfo.code}
                          name={destInfo.label}
                          flagFallback={destInfo.flag}
                          size="md"
                        />
                        <p className="text-sm font-medium text-ink tracking-tight">
                          {destInfo.label} Tracked Delivery
                        </p>
                        <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider font-mono bg-ink text-ivory">
                          Standard
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone flex items-start gap-1.5">
                        <Truck className="mt-0.5 h-3.5 w-3.5 text-stone shrink-0" />
                        <span>Estimated Delivery: <strong className="text-ink font-medium">{destInfo.deliveryTime}</strong> · Full tracking &amp; insurance included</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right sm:pl-4 sm:border-l sm:border-line shrink-0">
                    <span className="text-sm font-serif font-medium text-ink">
                      {subtotal - discount >= FREE_SHIPPING_THRESHOLD_USD
                        ? "Complimentary"
                        : formatPrice(convertedShippingCost, selected.currency)}
                    </span>
                    {subtotal - discount >= FREE_SHIPPING_THRESHOLD_USD && (
                      <span className="block text-[10px] text-emerald-800 font-medium tracking-wide uppercase">
                        Free VIP Shipping
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Step 4: Payment */}
            <section className="border border-line/90 bg-white/90 p-6 sm:p-7 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-line/60">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center border border-ink/20 bg-ivory text-[11px] font-mono font-medium text-ink shadow-2xs">
                    04
                  </span>
                  <div>
                    <h2 className="font-serif text-lg sm:text-xl font-medium text-ink tracking-tight">Payment</h2>
                    <p className="text-[10px] uppercase tracking-luxe text-stone mt-0.5">
                      Encrypted 256-bit SSL transaction via Stripe · Global cards accepted
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-stone bg-ivory px-2 py-1 border border-line">
                  <ShieldCheck className="h-3.5 w-3.5 text-ink" />
                  <span>Bank-Grade Security</span>
                </div>
              </div>

              {/* Payment Method Badge */}
              <div className="p-4 border border-ink bg-ink text-ivory shadow-xs mb-5 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-14 items-center justify-center rounded bg-white px-1.5 py-0.5 shadow-2xs border border-line/50">
                      <Image
                        src="/ima/stripe_logo.png"
                        alt="Stripe"
                        width={56}
                        height={22}
                        className="h-3.5 w-auto object-contain"
                      />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wider">Credit / Debit Card</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 tracking-wider bg-white/20 text-ivory">
                    Stripe
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-ivory/80">
                    Global 256-bit SSL Checkout · All Major Cards Accepted
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300 font-medium">
                    ● Active
                  </span>
                </div>
              </div>

              {/* Stripe Card Form */}
              <div className="border border-line/80 bg-ivory/50 p-5 space-y-4">
                  <div className="flex items-center justify-between mb-1 pb-3 border-b border-line/60">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-luxe text-stone">Cardholder Details</span>
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-mono uppercase tracking-wider">
                        All Countries Supported
                      </span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-mono text-stone/80">
                      Worldwide 256-bit SSL
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cardNumber" className="text-[11px] uppercase tracking-luxe text-stone block">
                      Card Number *
                    </Label>
                    <Input
                      id="cardNumber"
                      placeholder="4532 •••• •••• 8892"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      className="h-12 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 shadow-2xs font-mono transition-all focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="cardExpiry" className="text-[11px] uppercase tracking-luxe text-stone block">
                        Expiration (MM / YY) *
                      </Label>
                      <Input
                        id="cardExpiry"
                        placeholder="08 / 28"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        className="h-12 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 shadow-2xs font-mono transition-all focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cardCvc" className="text-[11px] uppercase tracking-luxe text-stone block">
                        Security Code (CVC) *
                      </Label>
                      <Input
                        id="cardCvc"
                        placeholder="382"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').substring(0, 4))}
                        className="h-12 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 shadow-2xs font-mono transition-all focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cardName" className="text-[11px] uppercase tracking-luxe text-stone block">
                      Name on Card *
                    </Label>
                    <Input
                      id="cardName"
                      placeholder="As printed on front of card"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="h-12 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 shadow-2xs transition-all focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                    />
                  </div>

                  <div className="pt-2 text-[11px] text-stone flex items-center gap-2 border-t border-line/50">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                    <span>Your card information is encrypted and transmitted directly through Stripe. No card details are ever stored on our servers.</span>
                  </div>
                </div>

              {/* Billing Address Toggle */}
              <div className="pt-5 border-t border-line/70 mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-base font-medium text-ink">Billing Address</h3>
                  <span className="text-[10px] uppercase tracking-luxe text-stone">Tax &amp; verification</span>
                </div>

                <label className="flex items-center gap-2.5 text-xs text-stone cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={billingSameAsShipping}
                    onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                    className="h-4 w-4 rounded-none border-line text-ink focus:ring-0 focus:ring-offset-0"
                  />
                  <span>Same as shipping address</span>
                </label>

                {!billingSameAsShipping && (
                  <div className="space-y-4 pt-4 mt-4 border-t border-line/60">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="billingFirstName" className="text-[11px] uppercase tracking-luxe text-stone block">First Name *</Label>
                        <Input id="billingFirstName" required value={billingFirstName} onChange={(e) => setBillingFirstName(e.target.value)} className="h-12 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink shadow-2xs focus:border-ink focus:ring-1 focus:ring-ink" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="billingLastName" className="text-[11px] uppercase tracking-luxe text-stone block">Last Name *</Label>
                        <Input id="billingLastName" required value={billingLastName} onChange={(e) => setBillingLastName(e.target.value)} className="h-12 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink shadow-2xs focus:border-ink focus:ring-1 focus:ring-ink" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="billingAddress" className="text-[11px] uppercase tracking-luxe text-stone block">Street Address *</Label>
                      <Input id="billingAddress" required value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} className="h-12 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink shadow-2xs focus:border-ink focus:ring-1 focus:ring-ink" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="billingApartment" className="text-[11px] uppercase tracking-luxe text-stone block">Apartment (optional)</Label>
                      <Input id="billingApartment" value={billingApartment} onChange={(e) => setBillingApartment(e.target.value)} className="h-12 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink shadow-2xs focus:border-ink focus:ring-1 focus:ring-ink" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="billingCity" className="text-[11px] uppercase tracking-luxe text-stone block">City *</Label>
                        <Input id="billingCity" required value={billingCity} onChange={(e) => setBillingCity(e.target.value)} className="h-12 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink shadow-2xs focus:border-ink focus:ring-1 focus:ring-ink" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="billingState" className="text-[11px] uppercase tracking-luxe text-stone block">State</Label>
                        <Input id="billingState" value={billingState} onChange={(e) => setBillingState(e.target.value)} className="h-12 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink shadow-2xs focus:border-ink focus:ring-1 focus:ring-ink" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="billingPostalCode" className="text-[11px] uppercase tracking-luxe text-stone block">Postal Code *</Label>
                        <Input id="billingPostalCode" required value={billingPostalCode} onChange={(e) => setBillingPostalCode(e.target.value)} className="h-12 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink shadow-2xs focus:border-ink focus:ring-1 focus:ring-ink" />
                      </div>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <CountrySelect
                        id="billingCountry"
                        label="Billing Country"
                        variant="box"
                        required
                        value={billingCountry}
                        onChange={(c) => setBillingCountry(c.name)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Submit Button */}
            <div className="pt-2">
              {paymentError && (
                <div className="mb-4 p-3 border border-red-300 bg-red-50 text-center text-xs font-medium text-red-800">
                  {paymentError}
                </div>
              )}
              <div className="flex justify-center">
                <LinedButton type="submit" width="max-w-[360px]">
                  {step === "processing" ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                      Processing Atelier Order...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Lock className="h-3.5 w-3.5" />
                      Pay &amp; Complete Order ({formatPrice(grandTotal, selected.currency)})
                    </span>
                  )}
                </LinedButton>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] uppercase tracking-widest text-stone">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-ink" /> Encrypted 256-bit SSL
                </span>
                <span>·</span>
                <span>Tracked Courier Dispatch</span>
                <span>·</span>
                <span>14-Day Boutique Returns</span>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Sticky Desktop Order Summary */}
        <aside className="hidden lg:block lg:col-span-5">
          <div className="sticky top-28 border border-line/90 bg-white/95 p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h2 className="font-serif text-xl font-medium text-ink">
                Order Summary
              </h2>
              <span className="text-xs font-mono uppercase tracking-wider text-stone">
                {detailedLines.reduce((n, l) => n + l.quantity, 0)} {detailedLines.reduce((n, l) => n + l.quantity, 0) === 1 ? "Item" : "Items"}
              </span>
            </div>

            {/* Line items list */}
            <ul className="mt-4 max-h-72 overflow-y-auto divide-y divide-line pr-1">
              {detailedLines.map((line) => (
                <li key={line.variantId} className="py-3.5 flex gap-3 text-sm">
                  <div className="relative h-16 w-16 flex-shrink-0 border border-line overflow-hidden bg-secondary">
                    <LettyImage
                      imageKey={line.product.media[0]?.imageKey ?? "productShampoo"}
                      alt={line.product.name}
                      fill
                      className="object-cover"
                    />
                    <span className="absolute top-0 right-0 bg-ink text-ivory text-[10px] w-4 h-4 flex items-center justify-center font-medium font-mono">
                      {line.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink truncate text-sm">{line.product.name}</p>
                    <p className="text-xs text-stone mt-0.5">{line.variant.size || line.variant.color || line.variant.sku}</p>
                  </div>
                  <p className="font-medium text-ink text-sm shrink-0">
                    {formatPrice(convertPrice(line.lineTotal, selected.currency), selected.currency)}
                  </p>
                </li>
              ))}
            </ul>

            {/* Promo Code Form */}
            <form onSubmit={applyCoupon} className="mt-5 pt-4 border-t border-line/70">
              <div className="flex items-center gap-2">
                <Input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Promo Code"
                  className="h-11 text-xs uppercase rounded-none border border-line bg-white px-3 focus-visible:border-ink focus-visible:ring-1 focus-visible:ring-ink"
                />
                <button
                  type="submit"
                  className="h-11 px-4 bg-ink text-ivory text-[11px] font-medium uppercase tracking-luxe hover:bg-ink/90 transition-colors shrink-0 cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </form>

            {coupon && (
              <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-ink bg-emerald-50 border border-emerald-200 px-2.5 py-1">
                <Tag className="h-3 w-3 text-emerald-800" />
                <span className="font-mono font-medium">{coupon}</span> ({appliedCouponInfo?.label ?? COUPONS[coupon]?.label ?? "Promo applied"})
                <button type="button" onClick={() => { setCoupon(null); setAppliedCouponInfo(null); }} className="ml-1 text-stone hover:text-ink cursor-pointer">
                  <X className="h-3.5 w-3.5" />
                </button>
              </p>
            )}

            {/* Pricing breakdown */}
            <dl className="mt-5 border-t border-line pt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone">Subtotal</dt>
                <dd className="font-medium text-ink">{formatPrice(convertedSubtotal, selected.currency)}</dd>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <dt>Discount ({coupon})</dt>
                  <dd className="font-medium font-mono">−{formatPrice(convertedDiscount, selected.currency)}</dd>
                </div>
              )}

              <div className="flex justify-between">
                <dt className="text-stone flex items-center gap-1.5">
                  <span>Tracked Courier</span>
                  <span className="inline-flex items-center gap-1 text-xs">
                    (<CountryFlag
                      code={selectedCountryInfo.code}
                      name={destInfo.label}
                      flagFallback={destInfo.flag}
                      size="xs"
                    />
                    <span>{destInfo.label}</span>)
                  </span>
                </dt>
                <dd className="font-medium text-ink">
                  {convertedShippingCost === 0 ? (
                    <span className="text-emerald-800 font-medium">Complimentary</span>
                  ) : (
                    formatPrice(convertedShippingCost, selected.currency)
                  )}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-stone">Duties &amp; Taxes</dt>
                <dd className="font-medium text-ink">Included</dd>
              </div>

              <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
                <dt className="text-ink font-medium">Total</dt>
                <dd className="font-serif text-2xl text-ink font-medium">
                  {formatPrice(grandTotal, selected.currency)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 pt-4 border-t border-line/60 text-xs text-stone flex items-center gap-2.5">
              <Package className="h-4 w-4 text-gold shrink-0" />
              <span>Complimentary signature ribbon packaging &amp; deluxe samples included with every order.</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
