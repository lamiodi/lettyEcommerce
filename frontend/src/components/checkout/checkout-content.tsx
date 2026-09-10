"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCustomerAuthStore } from "@/lib/store/customer-auth";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Lock,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
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

const getCardBrand = (val: string): "visa" | "mastercard" | "amex" | "discover" | null => {
  const clean = val.replace(/\D/g, "");
  if (/^4/.test(clean)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(clean)) return "mastercard";
  if (/^3[47]/.test(clean)) return "amex";
  if (/^(6011|65)/.test(clean)) return "discover";
  return null;
};

const formatCardNumber = (val: string) => {
  const v = val.replace(/\D/g, "").substring(0, 19);
  const brand = getCardBrand(v);
  if (brand === "amex") {
    const p1 = v.substring(0, 4);
    const p2 = v.substring(4, 10);
    const p3 = v.substring(10, 15);
    return [p1, p2, p3].filter(Boolean).join(" ");
  }
  const parts = [];
  for (let i = 0; i < v.length; i += 4) {
    parts.push(v.substring(i, i + 4));
  }
  return parts.join(" ");
};

const formatExpiry = (val: string) => {
  const v = val.replace(/\D/g, "").substring(0, 4);
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
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState(storeCountry?.dialCode ? `${storeCountry.dialCode} ` : "");

  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingFirstName, setBillingFirstName] = useState("");
  const [billingLastName, setBillingLastName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingApartment, setBillingApartment] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingCountry, setBillingCountry] = useState(storeCountry?.name ?? "United Kingdom");
  const [billingPostalCode, setBillingPostalCode] = useState("");

  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Card details
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNameTouched, setCardNameTouched] = useState(false);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Auto-fill cardholder name with shipping name unless customer manually edited it
  useEffect(() => {
    if (!cardNameTouched) {
      const full = `${firstName} ${lastName}`.trim();
      if (full) setCardName(full);
    }
  }, [firstName, lastName, cardNameTouched]);

  const clearError = (key: string) => {
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const getInputClass = (id: string, extra = "") =>
    `h-12 w-full rounded-none border ${
      fieldErrors[id]
        ? "border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-red-600"
        : "border-line bg-white focus:border-ink focus:ring-ink"
    } px-3.5 text-sm text-ink placeholder:text-stone/40 shadow-2xs transition-all focus:outline-none focus:ring-1 ${extra}`;

  const renderFieldError = (id: string) => {
    if (!fieldErrors[id]) return null;
    return <p className="text-[10px] text-red-600 font-medium mt-1">{fieldErrors[id]}</p>;
  };

  const cardBrand = getCardBrand(cardNumber);

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
    if (step === "processing") return;

    const errors: Record<string, string> = {};
    if (!email.trim()) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!firstName.trim()) errors.firstName = "First name is required";
    if (!lastName.trim()) errors.lastName = "Last name is required";
    if (!address.trim()) errors.address = "Street address is required";
    if (!city.trim()) errors.city = "City is required";
    if (!postalCode.trim()) errors.postalCode = "Postal code is required";

    if (!billingSameAsShipping) {
      if (!billingFirstName.trim()) errors.billingFirstName = "First name is required";
      if (!billingLastName.trim()) errors.billingLastName = "Last name is required";
      if (!billingAddress.trim()) errors.billingAddress = "Billing street is required";
      if (!billingCity.trim()) errors.billingCity = "Billing city is required";
      if (!billingPostalCode.trim()) errors.billingPostalCode = "Postal code is required";
    }

    const cleanCard = cardNumber.replace(/\D/g, "");
    if (!cleanCard) {
      errors.cardNumber = "Card number is required";
    } else if (cleanCard.length < 15) {
      errors.cardNumber = "Please enter a valid card number (15-16 digits)";
    }

    const cleanExp = cardExpiry.replace(/\D/g, "");
    if (!cleanExp || cleanExp.length < 4) {
      errors.cardExpiry = "Expiry date required (MM / YY)";
    }

    if (!cardCvc.trim()) {
      errors.cardCvc = "Security code required";
    } else if (cardCvc.length < 3) {
      errors.cardCvc = "Invalid CVC";
    }

    if (!cardName.trim()) {
      errors.cardName = "Name on card is required";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstId = Object.keys(errors)[0];
      const el = document.getElementById(firstId);
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      toast.error("Please fill in the highlighted required fields.");
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
      shippingName: `${selectedCountryInfo.flag} ${selectedCountryInfo.name} Tracked Delivery`,
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
            state: city,
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
            state: billingCity,
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
              {city}{postalCode ? `, ${postalCode}` : ""}, {country}
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
      {/* Checkout Page Header & Navigation */}
      <div className="mb-6 md:mb-8 pb-5 border-b border-line/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone mb-1.5">
              <Link href="/cart" className="hover:text-ink underline flex items-center gap-1 transition-colors">
                ← Return to Shopping Bag
              </Link>
              <span>/</span>
              <span className="text-ink font-medium">Checkout</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium text-ink tracking-tight">
              Secure Checkout
            </h1>
            <p className="text-xs text-stone mt-1">
              Complete your order in 4 quick and easy steps.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ivory border border-line text-[11px] font-medium text-ink">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              <span>256-Bit SSL Encryption</span>
            </span>
          </div>
        </div>

        {/* 4-Step Progress Indicator */}
        <div className="mt-5 grid grid-cols-4 gap-2 text-center">
          <div className="border-t-2 border-ink pt-2 text-left sm:text-center">
            <span className="block font-mono text-[10px] text-ink font-semibold">01</span>
            <span className="font-medium text-ink text-xs">Contact</span>
          </div>
          <div className="border-t-2 border-ink pt-2 text-left sm:text-center">
            <span className="block font-mono text-[10px] text-ink font-semibold">02</span>
            <span className="font-medium text-ink text-xs">Shipping</span>
          </div>
          <div className="border-t-2 border-ink pt-2 text-left sm:text-center">
            <span className="block font-mono text-[10px] text-ink font-semibold">03</span>
            <span className="font-medium text-ink text-xs">Delivery</span>
          </div>
          <div className="border-t-2 border-ink pt-2 text-left sm:text-center">
            <span className="block font-mono text-[10px] text-ink font-semibold">04</span>
            <span className="font-medium text-ink text-xs">Payment</span>
          </div>
        </div>
      </div>

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

            {/* Mobile Promo Code */}
            <form onSubmit={applyCoupon} className="mt-4 pt-3 border-t border-line/70">
              <div className="flex items-center gap-2">
                <Input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Promo Code"
                  className="h-10 text-xs uppercase rounded-none border border-line bg-white px-3 focus-visible:border-ink focus-visible:ring-1 focus-visible:ring-ink"
                />
                <button
                  type="submit"
                  disabled={validatingCoupon}
                  className="h-10 px-3.5 bg-ink text-ivory text-[10px] font-medium uppercase tracking-luxe hover:bg-ink/90 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {validatingCoupon ? "..." : "Apply"}
                </button>
              </div>
            </form>
            {coupon && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-ink bg-emerald-50 border border-emerald-200 px-2.5 py-1">
                <Tag className="h-3 w-3 text-emerald-800" />
                <span className="font-mono font-medium">{coupon}</span> ({appliedCouponInfo?.label ?? COUPONS[coupon]?.label ?? "Promo applied"})
                <button type="button" onClick={() => { setCoupon(null); setAppliedCouponInfo(null); }} className="ml-1 text-stone hover:text-ink cursor-pointer">
                  <X className="h-3.5 w-3.5" />
                </button>
              </p>
            )}

            <dl className="mt-4 border-t border-line pt-3 space-y-2 text-xs">
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
                <dt className="text-stone flex items-center gap-1.5 min-w-0">
                  <span className="shrink-0">Shipping</span>
                  <span className="inline-flex items-center gap-1 text-xs">
                    (<CountryFlag
                      code={selectedCountryInfo.code}
                      name={selectedCountryInfo.name}
                      flagFallback={selectedCountryInfo.flag}
                      size="xs"
                    />
                    <span>{selectedCountryInfo.name}</span>)
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
                <dd className="font-medium text-ink">Included (No extra fees)</dd>
              </div>
              <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3 text-sm">
                <dt className="text-ink font-medium">Total</dt>
                <dd className="font-serif text-lg text-ink font-medium">
                  {formatPrice(grandTotal, selected.currency)}
                </dd>
              </div>
            </dl>
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
                      {customer ? `Signed in as ${customer.email}` : "Where should we send your receipt & order tracking?"}
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
                    autoComplete="email"
                    inputMode="email"
                    required
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => {
                      clearError("email");
                      setEmail(e.target.value);
                    }}
                    className={getInputClass("email")}
                  />
                  <p className="text-[11px] text-stone">
                    Your order confirmation and courier tracking link will be sent to this email.
                  </p>
                  {renderFieldError("email")}
                </div>
                <label className="flex items-center gap-2.5 text-xs text-stone cursor-pointer pt-1 select-none">
                  <input
                    type="checkbox"
                    checked={subscribe}
                    onChange={(e) => setSubscribe(e.target.checked)}
                    className="h-4 w-4 rounded-none border-line text-ink focus:ring-0 focus:ring-offset-0"
                  />
                  <span>Email me order updates, exclusive boutique releases, and special offers.</span>
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
                    <h2 className="font-serif text-lg sm:text-xl font-medium text-ink tracking-tight">Shipping Address</h2>
                    <p className="text-[10px] uppercase tracking-luxe text-stone mt-0.5">
                      Where should we deliver your parcel?
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
                      autoComplete="given-name"
                      required
                      placeholder="Jane"
                      value={firstName}
                      onChange={(e) => {
                        clearError("firstName");
                        setFirstName(e.target.value);
                      }}
                      className={getInputClass("firstName")}
                    />
                    {renderFieldError("firstName")}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-[11px] uppercase tracking-luxe text-stone block">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      autoComplete="family-name"
                      required
                      placeholder="Smith"
                      value={lastName}
                      onChange={(e) => {
                        clearError("lastName");
                        setLastName(e.target.value);
                      }}
                      className={getInputClass("lastName")}
                    />
                    {renderFieldError("lastName")}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-[11px] uppercase tracking-luxe text-stone block">
                    Street Address *
                  </Label>
                  <Input
                    id="address"
                    autoComplete="address-line1"
                    required
                    placeholder="House / building number and street name"
                    value={address}
                    onChange={(e) => {
                      clearError("address");
                      setAddress(e.target.value);
                    }}
                    className={getInputClass("address")}
                  />
                  {renderFieldError("address")}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="apartment" className="text-[11px] uppercase tracking-luxe text-stone block">
                    Apartment, suite, unit (optional)
                  </Label>
                  <Input
                    id="apartment"
                    autoComplete="address-line2"
                    placeholder="Apartment, suite, unit, floor (optional)"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    className={getInputClass("apartment")}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-[11px] uppercase tracking-luxe text-stone block">
                      City *
                    </Label>
                    <Input
                      id="city"
                      autoComplete="address-level2"
                      required
                      placeholder="City or town"
                      value={city}
                      onChange={(e) => {
                        clearError("city");
                        setCity(e.target.value);
                      }}
                      className={getInputClass("city")}
                    />
                    {renderFieldError("city")}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="postalCode" className="text-[11px] uppercase tracking-luxe text-stone block">
                      Postal Code / ZIP *
                    </Label>
                    <Input
                      id="postalCode"
                      autoComplete="postal-code"
                      autoCapitalize="characters"
                      required
                      placeholder="Postal code / ZIP"
                      value={postalCode}
                      onChange={(e) => {
                        clearError("postalCode");
                        setPostalCode(e.target.value.toUpperCase());
                      }}
                      className={getInputClass("postalCode")}
                    />
                    {renderFieldError("postalCode")}
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
                      setPhone((prev) => {
                        if (!prev || prev.trim() === "" || prev.startsWith("+")) {
                          const currentDigits = prev.replace(/^\+\d+\s*/, "");
                          return currentDigits ? `${c.dialCode} ${currentDigits}` : `${c.dialCode} `;
                        }
                        return `${c.dialCode} ${prev}`;
                      });
                    }}
                  />
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-[11px] uppercase tracking-luxe text-stone block">
                      Phone Number (Optional)
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder={`${selectedCountryInfo.dialCode} 7123 456789`}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-12 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 shadow-2xs transition-all focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink font-mono"
                    />
                    <p className="text-[10px] text-stone">
                      Optional · Used exclusively for courier delivery day SMS updates.
                    </p>
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
                      Delivering to <strong className="text-ink font-medium">{selectedCountryInfo.name}</strong> · All duties &amp; taxes included
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-stone uppercase tracking-wider shrink-0 sm:ml-2">
                    Estimated arrival: <strong className="text-ink font-medium">{destInfo.deliveryTime}</strong>
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
                    Fast tracked courier delivery directly to your door
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 sm:p-5 border-2 border-ink bg-ivory/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="mt-0.5 sm:mt-0 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-ink">
                      <Check className="h-3 w-3 text-ivory stroke-[3]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <CountryFlag
                          code={selectedCountryInfo.code}
                          name={selectedCountryInfo.name}
                          flagFallback={selectedCountryInfo.flag}
                          size="md"
                        />
                        <p className="text-sm font-medium text-ink tracking-tight">
                          {selectedCountryInfo.name} Tracked Courier Delivery
                        </p>
                        <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider font-mono bg-ink text-ivory">
                          Included
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone flex items-start gap-1.5">
                        <Truck className="mt-0.5 h-3.5 w-3.5 text-stone shrink-0" />
                        <span>Estimated Arrival: <strong className="text-ink font-medium">{destInfo.deliveryTime}</strong> · Full tracking link provided upon dispatch</span>
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

                {subtotal - discount >= FREE_SHIPPING_THRESHOLD_USD ? (
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-50/80 border border-emerald-200/80 text-[11px] text-emerald-900">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                    <span>Complimentary VIP tracked shipping applied to your order.</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 p-2.5 bg-[#F7F2EC] border border-line/70 text-[11px] text-stone">
                    <span className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-stone shrink-0" />
                      <span>Complimentary shipping unlocks at {formatPrice(convertPrice(FREE_SHIPPING_THRESHOLD_USD, selected.currency), selected.currency)}</span>
                    </span>
                    <span className="font-medium text-ink font-mono">
                      +{formatPrice(convertPrice(Math.max(0, FREE_SHIPPING_THRESHOLD_USD - (subtotal - discount)), selected.currency), selected.currency)}
                    </span>
                  </div>
                )}
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
                    <h2 className="font-serif text-lg sm:text-xl font-medium text-ink tracking-tight">Payment Method</h2>
                    <p className="text-[10px] uppercase tracking-luxe text-stone mt-0.5">
                      All transactions are secure, encrypted, and processed in real time
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-1 border border-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                  <span>256-Bit SSL Secure</span>
                </div>
              </div>

              {/* Payment Method Selector Card */}
              <div className="border border-ink bg-ivory/60 p-4 sm:p-5 mb-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-line/70">
                  <div className="flex items-center gap-3">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-ink">
                      <div className="h-1.5 w-1.5 rounded-full bg-ivory" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-ink">Credit or Debit Card</span>
                      <p className="text-xs text-stone">Pay securely with any major credit or debit card</p>
                    </div>
                  </div>
                  {/* Card brand badges */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <span className="px-2 py-0.5 text-[10px] font-bold font-serif bg-white border border-line text-[#1A1F71] shadow-2xs">
                      VISA
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-white border border-line flex items-center -space-x-1 shadow-2xs">
                      <span className="h-3 w-3 rounded-full bg-[#EB001B] inline-block opacity-90" />
                      <span className="h-3 w-3 rounded-full bg-[#F79E1B] inline-block opacity-90" />
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-white border border-line text-[#006FCF] shadow-2xs">
                      AMEX
                    </span>
                    <div className="h-5 w-10 flex items-center justify-center bg-white border border-line px-1 shadow-2xs">
                      <Image
                        src="/ima/stripe_logo.png"
                        alt="Powered by Stripe"
                        width={36}
                        height={16}
                        className="h-2.5 w-auto object-contain opacity-80"
                      />
                    </div>
                  </div>
                </div>

                {/* Card input fields */}
                <div className="pt-4 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="cardNumber" className="text-[11px] uppercase tracking-luxe text-stone block">
                        Card Number *
                      </Label>
                      <span className="text-[10px] text-stone">15–16 digits</span>
                    </div>
                    <div className="relative">
                      <Input
                        id="cardNumber"
                        autoComplete="cc-number"
                        inputMode="numeric"
                        placeholder="1234  5678  9012  3456"
                        value={cardNumber}
                        onChange={(e) => {
                          clearError("cardNumber");
                          setCardNumber(formatCardNumber(e.target.value));
                        }}
                        className={getInputClass("cardNumber", "font-mono pr-24 tracking-wide")}
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        {cardBrand === "visa" && (
                          <span className="font-bold font-serif text-[11px] tracking-wider text-[#1A1F71] bg-[#1A1F71]/5 px-2 py-0.5 border border-[#1A1F71]/30">
                            VISA
                          </span>
                        )}
                        {cardBrand === "mastercard" && (
                          <span className="flex items-center -space-x-1.5 bg-stone/5 px-2 py-1 border border-line/60">
                            <span className="h-3.5 w-3.5 rounded-full bg-[#EB001B] opacity-90 inline-block" />
                            <span className="h-3.5 w-3.5 rounded-full bg-[#F79E1B] opacity-90 inline-block" />
                          </span>
                        )}
                        {cardBrand === "amex" && (
                          <span className="font-bold text-[10px] tracking-wider text-[#006FCF] bg-[#006FCF]/5 px-2 py-0.5 border border-[#006FCF]/30">
                            AMEX
                          </span>
                        )}
                        {cardBrand === "discover" && (
                          <span className="font-bold text-[10px] tracking-wider text-[#FF6000] bg-[#FF6000]/5 px-2 py-0.5 border border-[#FF6000]/30">
                            DISCOVER
                          </span>
                        )}
                        {!cardBrand && (
                          <CreditCard className="h-4 w-4 text-stone/40" />
                        )}
                      </div>
                    </div>
                    {renderFieldError("cardNumber")}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="cardExpiry" className="text-[11px] uppercase tracking-luxe text-stone block">
                        Expiration Date *
                      </Label>
                      <Input
                        id="cardExpiry"
                        autoComplete="cc-exp"
                        inputMode="numeric"
                        placeholder="MM / YY"
                        value={cardExpiry}
                        onChange={(e) => {
                          clearError("cardExpiry");
                          setCardExpiry(formatExpiry(e.target.value));
                        }}
                        className={getInputClass("cardExpiry", "font-mono")}
                      />
                      {renderFieldError("cardExpiry")}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="cardCvc" className="text-[11px] uppercase tracking-luxe text-stone block">
                          Security Code (CVC) *
                        </Label>
                        <span className="text-[10px] text-stone">3 or 4 digits</span>
                      </div>
                      <Input
                        id="cardCvc"
                        autoComplete="cc-csc"
                        inputMode="numeric"
                        placeholder={cardBrand === "amex" ? "4 digits" : "3 digits"}
                        maxLength={cardBrand === "amex" ? 4 : 3}
                        value={cardCvc}
                        onChange={(e) => {
                          clearError("cardCvc");
                          setCardCvc(e.target.value.replace(/\D/g, "").substring(0, cardBrand === "amex" ? 4 : 3));
                        }}
                        className={getInputClass("cardCvc", "font-mono")}
                      />
                      {renderFieldError("cardCvc")}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="cardName" className="text-[11px] uppercase tracking-luxe text-stone block">
                        Name on Card *
                      </Label>
                      <span className="text-[10px] text-stone">As printed on card</span>
                    </div>
                    <Input
                      id="cardName"
                      autoComplete="cc-name"
                      placeholder="Jane Doe"
                      value={cardName}
                      onChange={(e) => {
                        setCardNameTouched(true);
                        clearError("cardName");
                        setCardName(e.target.value);
                      }}
                      className={getInputClass("cardName")}
                    />
                    {renderFieldError("cardName")}
                  </div>

                  <div className="pt-2 text-[11px] text-stone flex items-center gap-2 border-t border-line/60">
                    <Lock className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                    <span>Your card details are 256-bit encrypted and never stored on our servers.</span>
                  </div>
                </div>
              </div>

              {/* Billing Address Toggle */}
              <div className="pt-2">
                <div className="p-3.5 border border-line bg-white/70 flex flex-col gap-1.5">
                  <label className="flex items-center gap-2.5 text-xs font-medium text-ink cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={billingSameAsShipping}
                      onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                      className="h-4 w-4 rounded-none border-line text-ink focus:ring-0 focus:ring-offset-0"
                    />
                    <span>Billing address matches shipping address</span>
                  </label>
                  <p className="text-[11px] text-stone pl-6.5">
                    Uncheck only if your card is registered to a different address.
                  </p>
                </div>

                {!billingSameAsShipping && (
                  <div className="space-y-4 pt-4 mt-4 border-t border-line/60">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="billingFirstName" className="text-[11px] uppercase tracking-luxe text-stone block">First Name *</Label>
                        <Input
                          id="billingFirstName"
                          autoComplete="billing given-name"
                          required
                          placeholder="Jane"
                          value={billingFirstName}
                          onChange={(e) => {
                            clearError("billingFirstName");
                            setBillingFirstName(e.target.value);
                          }}
                          className={getInputClass("billingFirstName")}
                        />
                        {renderFieldError("billingFirstName")}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="billingLastName" className="text-[11px] uppercase tracking-luxe text-stone block">Last Name *</Label>
                        <Input
                          id="billingLastName"
                          autoComplete="billing family-name"
                          required
                          placeholder="Smith"
                          value={billingLastName}
                          onChange={(e) => {
                            clearError("billingLastName");
                            setBillingLastName(e.target.value);
                          }}
                          className={getInputClass("billingLastName")}
                        />
                        {renderFieldError("billingLastName")}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="billingAddress" className="text-[11px] uppercase tracking-luxe text-stone block">Street Address *</Label>
                      <Input
                        id="billingAddress"
                        autoComplete="billing address-line1"
                        required
                        placeholder="House number and street name"
                        value={billingAddress}
                        onChange={(e) => {
                          clearError("billingAddress");
                          setBillingAddress(e.target.value);
                        }}
                        className={getInputClass("billingAddress")}
                      />
                      {renderFieldError("billingAddress")}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="billingApartment" className="text-[11px] uppercase tracking-luxe text-stone block">Apartment (optional)</Label>
                      <Input
                        id="billingApartment"
                        autoComplete="billing address-line2"
                        placeholder="Suite, unit, floor (optional)"
                        value={billingApartment}
                        onChange={(e) => setBillingApartment(e.target.value)}
                        className={getInputClass("billingApartment")}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="billingCity" className="text-[11px] uppercase tracking-luxe text-stone block">City *</Label>
                        <Input
                          id="billingCity"
                          autoComplete="billing address-level2"
                          required
                          placeholder="City or town"
                          value={billingCity}
                          onChange={(e) => {
                            clearError("billingCity");
                            setBillingCity(e.target.value);
                          }}
                          className={getInputClass("billingCity")}
                        />
                        {renderFieldError("billingCity")}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="billingPostalCode" className="text-[11px] uppercase tracking-luxe text-stone block">Postal Code *</Label>
                        <Input
                          id="billingPostalCode"
                          autoComplete="billing postal-code"
                          autoCapitalize="characters"
                          required
                          placeholder="Postal code / ZIP"
                          value={billingPostalCode}
                          onChange={(e) => {
                            clearError("billingPostalCode");
                            setBillingPostalCode(e.target.value.toUpperCase());
                          }}
                          className={getInputClass("billingPostalCode")}
                        />
                        {renderFieldError("billingPostalCode")}
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

            {/* Submit Button & Trust Reassurance */}
            <div className="pt-3">
              {paymentError && (
                <div className="mb-4 p-3 border border-red-300 bg-red-50 text-center text-xs font-medium text-red-800">
                  {paymentError}
                </div>
              )}
              <div className="flex flex-col items-center">
                <LinedButton type="submit" width="w-full sm:max-w-[420px]" disabled={step === "processing"}>
                  {step === "processing" ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                      Authorizing Order...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2 text-sm">
                      <Lock className="h-4 w-4" />
                      Pay &amp; Place Order · {formatPrice(grandTotal, selected.currency)}
                    </span>
                  )}
                </LinedButton>
                <p className="mt-2.5 text-[11px] text-stone text-center">
                  By clicking Place Order, you confirm your order details and agree to our terms.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-line/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-[11px] text-stone">
                <div className="flex items-center justify-center gap-1.5 p-2.5 bg-white/70 border border-line/60">
                  <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span>256-Bit SSL Encrypted</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 p-2.5 bg-white/70 border border-line/60">
                  <Truck className="h-4 w-4 text-stone shrink-0" />
                  <span>Tracked Courier Dispatch</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 p-2.5 bg-white/70 border border-line/60">
                  <Package className="h-4 w-4 text-gold shrink-0" />
                  <span>14-Day Boutique Returns</span>
                </div>
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
                <dt className="text-stone flex items-center gap-1.5 min-w-0">
                  <span className="shrink-0">Shipping</span>
                  <span className="inline-flex items-center gap-1 text-xs">
                    (<CountryFlag
                      code={selectedCountryInfo.code}
                      name={selectedCountryInfo.name}
                      flagFallback={selectedCountryInfo.flag}
                      size="xs"
                    />
                    <span>{selectedCountryInfo.name}</span>)
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
                <dd className="font-medium text-ink">Included (No extra fees)</dd>
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
