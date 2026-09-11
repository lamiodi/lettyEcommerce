"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { loadStripe, type Stripe, type StripeElements, type StripeCardElement } from "@stripe/stripe-js";
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
import { Logo } from "@/components/shared/logo";
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
import type { CartLineDetailed } from "@/types";

const stripePromise =
  typeof window !== "undefined" && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    : null;

const SHIPPING_OPTIONS = [
  {
    id: "standard",
    name: "Tracked Courier Delivery",
    time: "2–4 Business Days",
    price: STANDARD_SHIPPING_FLAT_USD,
  },
  {
    id: "express",
    name: "Express Concierge Delivery",
    time: "1–2 Business Days",
    price: 25,
  },
];

const COUPONS: Record<string, { rate?: number; amount?: number; label: string }> = {
  LETY10: { rate: 0.1, label: "10% Welcome Gift" },
  LETTY10: { rate: 0.1, label: "10% Welcome Gift" },
  CIRCLE10: { rate: 0.1, label: "£10 Off Friend Referral" },
  PATRON10: { rate: 0.1, label: "£10 Off VIP Voucher" },
  PATRON20: { rate: 0.2, label: "£20 Off VIP Voucher" },
  PATRON50: { rate: 0.5, label: "£50 Off VIP Voucher" },
  PATRON100: { amount: 100, label: "£100 Atelier Credit" },
};

export function CheckoutContent() {
  const hydrated = useHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const lines = useCartStore((s) => s.lines);
  const clearCart = useCartStore((s) => s.clear);

  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderLines, setOrderLines] = useState<CartLineDetailed[]>([]);
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

  // Sync customer profile with functional updater to avoid stale closure
  useEffect(() => {
    if (customer) {
      setEmail((prev) => (!prev && customer.email ? customer.email : prev));
      setFirstName((prev) => (!prev && customer.firstName ? customer.firstName : prev));
      setLastName((prev) => (!prev && customer.lastName ? customer.lastName : prev));
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
  const [paymentMethodType, setPaymentMethodType] = useState<"card" | "paypal">("card");
  const [saveInfo, setSaveInfo] = useState(true);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Synchronize destination country and phone dial code with store selection (e.g. chosen on home page)
  useEffect(() => {
    if (hydrated && storeCountry?.name) {
      setCountry(storeCountry.name);
      setBillingCountry((prev) => {
        if (!prev || prev === "United Kingdom" || billingSameAsShipping) {
          return storeCountry.name;
        }
        return prev;
      });
      setPhone((prev) => {
        if (!prev || prev.trim() === "" || /^\+\d+\s*$/.test(prev)) {
          return storeCountry.dialCode ? `${storeCountry.dialCode} ` : "";
        }
        return prev;
      });
    }
  }, [hydrated, storeCountry, billingSameAsShipping]);

  // Card details & Stripe Elements
  const [cardName, setCardName] = useState("");
  const [cardNameTouched, setCardNameTouched] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardBrand, setCardBrand] = useState<string | null>(null);
  const [stripeCardError, setStripeCardError] = useState<string | null>(null);
  const [stripeMounted, setStripeMounted] = useState(false);

  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const cardElementRef = useRef<StripeCardElement | null>(null);
  const cardContainerRef = useRef<HTMLDivElement | null>(null);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Auto-fill cardholder name with shipping name unless customer edited it
  useEffect(() => {
    if (!cardNameTouched) {
      const full = `${firstName} ${lastName}`.trim();
      if (full) setCardName(full);
    }
  }, [firstName, lastName, cardNameTouched]);

  // Mount Stripe Elements
  useEffect(() => {
    let active = true;

    async function initStripe() {
      if (!stripePromise) return;
      try {
        const stripe = await stripePromise;
        if (!stripe || !active) return;
        stripeRef.current = stripe;

        if (!elementsRef.current) {
          elementsRef.current = stripe.elements();
        }

        if (cardContainerRef.current && !cardElementRef.current) {
          const cardElement = elementsRef.current.create("card", {
            hidePostalCode: true,
            style: {
              base: {
                fontSize: "14px",
                color: "#171412",
                fontFamily: 'var(--font-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                letterSpacing: "0.025em",
                "::placeholder": {
                  color: "#9CA3AF",
                },
              },
              invalid: {
                color: "#DC2626",
                iconColor: "#DC2626",
              },
            },
          });

          cardElement.mount(cardContainerRef.current);
          cardElement.on("change", (event) => {
            setCardComplete(event.complete);
            setCardBrand(event.brand !== "unknown" ? event.brand : null);
            setStripeCardError(event.error ? event.error.message : null);
            if (event.complete) {
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.card;
                return next;
              });
            }
          });
          cardElementRef.current = cardElement;
          setStripeMounted(true);
        }
      } catch (e) {
        console.warn("Stripe Elements initialization error:", e);
      }
    }

    initStripe();

    return () => {
      active = false;
      if (cardElementRef.current) {
        cardElementRef.current.destroy();
        cardElementRef.current = null;
      }
    };
  }, []);

  // Restore placed order from sessionStorage on page refresh / return
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("letty_last_order");
      if (saved) {
        const data = JSON.parse(saved);
        if (data && data.orderId) {
          const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
          if (params?.get("status") === "success" || lines.length === 0) {
            setOrderId(data.orderId);
            if (data.orderLines) setOrderLines(data.orderLines);
            if (data.orderTotals) setOrderTotals(data.orderTotals);
            if (data.email && !email) setEmail(data.email);
            setStep("success");
          }
        }
      }
    } catch {}
  }, []);

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
    return (
      <p id={`${id}-error`} role="alert" className="text-[10px] text-red-600 font-medium mt-1">
        {fieldErrors[id]}
      </p>
    );
  };

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

  const selectedBillingCountryInfo =
    COUNTRIES.find(
      (c) =>
        c.name.toLowerCase() === billingCountry.toLowerCase() ||
        c.code.toLowerCase() === billingCountry.toLowerCase(),
    ) ?? selectedCountryInfo;

  const selected = {
    currency: selectedCountryInfo.currency,
    gateway: "stripe" as const,
  };

  // Reset currency-locked coupon amounts on country / currency switch
  useEffect(() => {
    if (appliedCouponInfo && appliedCouponInfo.amount) {
      setAppliedCouponInfo(null);
      setCoupon(null);
      toast.info("Currency changed. Please re-apply your voucher code.");
    }
  }, [selected.currency]);

  const detailedLines = detailCartLines(lines);
  const subtotal = cartSubtotal(detailedLines);

  const discount = appliedCouponInfo
    ? appliedCouponInfo.rate
      ? subtotal * appliedCouponInfo.rate
      : appliedCouponInfo.amount
      ? Math.min(subtotal, appliedCouponInfo.amount)
      : 0
    : coupon && COUPONS[coupon]
    ? COUPONS[coupon].rate != null
      ? subtotal * COUPONS[coupon].rate!
      : COUPONS[coupon].amount != null
      ? Math.min(subtotal, COUPONS[coupon].amount!)
      : 0
    : 0;

  const destKey = getShippingDestinationKey(selectedCountryInfo.code || country);
  const destInfo = SHIPPING_DESTINATIONS[destKey];
  const isEuropeEur = selected.currency === "EUR" && destKey === "Europe";

  const standardShippingCost = calculateShipping(
    subtotal,
    selectedCountryInfo.code || country,
    selected.currency,
    "standard",
  );

  const rawShippingCost = standardShippingCost;

  const convertedSubtotal = convertPrice(subtotal, selected.currency);
  const convertedDiscount = convertPrice(discount, selected.currency);
  const convertedShippingCost = isEuropeEur
    ? rawShippingCost
    : convertPrice(rawShippingCost, selected.currency);

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
          subtotal: convertedSubtotal,
          currency: selected.currency,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const payload = data.data || data;
        const discountAmt = payload.discount_amount ?? payload.discountAmount ?? 0;
        const discountType = payload.discount_type ?? payload.discountType ?? "fixed";
        const discountVal = payload.discount_value ?? payload.discountValue ?? 0;

        let rate: number | undefined = undefined;
        let amount: number | undefined = undefined;

        if (discountType === "percentage") {
          rate = discountVal / 100;
        } else {
          amount = discountAmt;
        }

        setCoupon(code);
        setAppliedCouponInfo({
          code,
          rate,
          amount,
          label: `${code} Applied`,
        });
        toast.success(`Privilege voucher "${code}" applied.`);
        setCouponInput("");
      } else {
        const hardcoded = COUPONS[code];
        if (hardcoded) {
          setCoupon(code);
          setAppliedCouponInfo({
            code,
            rate: hardcoded.rate,
            amount: hardcoded.amount,
            label: hardcoded.label,
          });
          toast.success(`Privilege voucher "${code}" applied.`);
          setCouponInput("");
        } else {
          toast.error("Invalid privilege code.");
        }
      }
    } catch {
      const hardcoded = COUPONS[code];
      if (hardcoded) {
        setCoupon(code);
        setAppliedCouponInfo({
          code,
          rate: hardcoded.rate,
          amount: hardcoded.amount,
          label: hardcoded.label,
        });
        toast.success(`Privilege voucher "${code}" applied.`);
        setCouponInput("");
      } else {
        toast.error("Could not validate voucher.");
      }
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setAppliedCouponInfo(null);
    toast.info("Voucher removed.");
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

    if (!cardName.trim()) {
      errors.cardName = "Name on card is required";
    }

    if (!cardComplete && cardElementRef.current) {
      errors.card = "Please enter complete card details";
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
      shippingName: `${destInfo.flag} Standard Shipping (${destInfo.label})`,
      shippingTime: destInfo.deliveryTime,
    };

    const cleanedPhone = phone && phone.replace(/^\+\d+\s*$/, "").trim() ? phone.trim() : undefined;

    try {
      const cartPayload = lines.map((l) => {
        const detailed = snapshotLines.find((d) => d.variantId === l.variantId);
        return {
          variant_id: l.variantId,
          variantId: l.variantId,
          productId: detailed?.product.id ?? l.productSlug,
          productSlug: l.productSlug,
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
          customerPhone: cleanedPhone,
          shippingAddress: {
            first_name: firstName,
            last_name: lastName,
            phone: cleanedPhone,
            street: address + (apartment ? `, ${apartment}` : ""),
            city,
            state: city,
            country: selectedCountryInfo.code,
            postal_code: postalCode,
            is_default_shipping: true,
            is_default_billing: billingSameAsShipping,
          },
          billingSameAsShipping,
          billingAddress: billingSameAsShipping
            ? undefined
            : {
                first_name: billingFirstName,
                last_name: billingLastName,
                street: billingAddress + (billingApartment ? `, ${billingApartment}` : ""),
                city: billingCity,
                state: billingCity,
                country: selectedBillingCountryInfo.code,
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
        throw new Error(errBody.error || `Checkout initialization failed (${initRes.status})`);
      }

      const init = (await initRes.json()) as {
        data: Record<string, any>;
      };
      const initData = init?.data ?? {};
      const orderNum = initData.orderNumber || initData.order_number || "ORDER";
      const cSecret = initData.clientSecret || initData.client_secret;

      if (!cSecret) {
        throw new Error("Payment gateway did not return an authorization secret.");
      }

      const stripe = stripeRef.current || (await stripePromise);
      if (!stripe || !cardElementRef.current) {
        throw new Error("Payment processor could not be initialized.");
      }

      const confirmResult = await stripe.confirmCardPayment(cSecret, {
        payment_method: {
          card: cardElementRef.current,
          billing_details: {
            name: cardName || `${firstName} ${lastName}`.trim(),
            email: email.trim(),
            phone: cleanedPhone,
            address: {
              line1: billingSameAsShipping ? address : billingAddress,
              line2: billingSameAsShipping ? apartment : billingApartment,
              city: billingSameAsShipping ? city : billingCity,
              state: billingSameAsShipping ? city : billingCity,
              postal_code: billingSameAsShipping ? postalCode : billingPostalCode,
              country: billingSameAsShipping
                ? selectedCountryInfo.code
                : selectedBillingCountryInfo.code,
            },
          },
        },
      });

      if (confirmResult.error) {
        throw new Error(confirmResult.error.message || "Payment authorization declined by card issuer.");
      }

      if (confirmResult.paymentIntent && confirmResult.paymentIntent.status === "succeeded") {
        await fetch("/api/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: initData.order_id || initData.orderId || orderNum,
            paymentIntentId: confirmResult.paymentIntent.id,
          }),
        }).catch((e) => console.warn("Payment confirmation update warning:", e));

        try {
          sessionStorage.setItem(
            "letty_last_order",
            JSON.stringify({
              orderId: orderNum,
              email,
              orderLines: snapshotLines,
              orderTotals: snapshotTotals,
            })
          );
        } catch {}

        clearCart();
        setOrderId(orderNum);
        setOrderLines(snapshotLines);
        setOrderTotals(snapshotTotals);
        setStep("success");
        toast.success("Order confirmed — payment successfully processed via Stripe.");
      } else {
        throw new Error("Payment authorization was not completed.");
      }
    } catch (err: any) {
      const message = err.message ?? "Checkout failed";
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
                  {formatPrice(orderTotals.shipping, orderTotals.currency)}
                </dd>
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
          <LinedButton
            href="/shop"
            onClick={() => {
              try {
                sessionStorage.removeItem("letty_last_order");
              } catch {}
            }}
          >
            Continue Exploring
          </LinedButton>
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
    <div className="min-h-screen bg-background text-foreground selection:bg-gold selection:text-ink">
      {/* Top Brand Header Bar with Official LETTY Logo */}
      <header className="sticky top-0 z-40 w-full border-b border-line bg-ivory/95 backdrop-blur py-3.5 px-4 shadow-[0_1px_16px_rgba(50,21,13,0.03)]">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link
            href="/shop"
            className="text-[11px] font-medium uppercase tracking-widest text-stone hover:text-ink transition-colors flex items-center gap-1.5"
          >
            <span>←</span>
            <span className="hidden sm:inline">Return to Boutique</span>
            <span className="sm:hidden">Shop</span>
          </Link>
          <Logo variant="light" className="h-9 md:h-11 w-auto" />
          <div className="flex items-center gap-1.5 text-stone text-[11px] font-medium uppercase tracking-widest">
            <Lock className="h-3.5 w-3.5 text-gold" />
            <span className="hidden sm:inline">Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Mobile Order Summary Collapsible Banner */}
      <div className="lg:hidden border-b border-line bg-surface/80">
        <button
          type="button"
          onClick={() => setSummaryExpanded(!summaryExpanded)}
          className="w-full flex items-center justify-between px-4 py-3.5 text-xs font-medium text-ink"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-stone" />
            <span className="font-medium text-ink">
              {summaryExpanded ? "Hide order summary" : "Show order summary"}
            </span>
            {summaryExpanded ? <ChevronUp className="h-3.5 w-3.5 text-stone" /> : <ChevronDown className="h-3.5 w-3.5 text-stone" />}
          </span>
          <span className="font-serif text-sm font-medium text-ink">
            {formatPrice(grandTotal, selected.currency)}
          </span>
        </button>

        {summaryExpanded && (
          <div className="px-4 py-5 border-t border-line bg-background/60 space-y-4">
            <ul className="divide-y divide-line">
              {detailedLines.map((line) => (
                <li key={line.variantId} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-14 w-14 rounded-[2px] border border-line shrink-0 bg-white">
                      <div className="relative h-full w-full rounded-[2px] overflow-hidden">
                        <LettyImage
                          imageKey={line.product.media[0]?.imageKey ?? "productShampoo"}
                          alt={line.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="absolute -top-1.5 -right-1.5 h-4.5 min-w-4.5 px-1 rounded-full bg-ink text-ivory text-[10px] font-mono flex items-center justify-center shadow-xs">
                        {line.quantity}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-serif text-xs font-medium text-ink truncate">{line.product.name}</p>
                      <p className="text-[11px] text-stone truncate">
                        {line.variant.size || line.variant.color || line.variant.sku}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-medium text-ink shrink-0">
                    {formatPrice(convertPrice(line.lineTotal, selected.currency), selected.currency)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Mobile Discount Code */}
            <form onSubmit={applyCoupon} className="flex gap-2 pt-2">
              <Input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Discount / Voucher code"
                className="h-11 flex-1 rounded-[2px] border border-stone/20 bg-white px-3.5 text-xs text-ink placeholder:text-stone/40 focus:border-ink uppercase tracking-wide"
              />
              <button
                type="submit"
                disabled={validatingCoupon}
                className="h-11 px-4 rounded-[2px] border border-stone/20 bg-surface hover:bg-stone/10 text-[11px] font-medium uppercase tracking-widest text-ink transition-colors"
              >
                {validatingCoupon ? "..." : "Apply"}
              </button>
            </form>

            {coupon && (
              <p className="inline-flex items-center gap-1.5 text-xs text-ink bg-surface border border-line px-2.5 py-1">
                <Tag className="h-3 w-3 text-gold" />
                <span className="font-mono font-medium">{coupon}</span>
                <button type="button" onClick={removeCoupon} className="ml-1 text-stone hover:text-ink">
                  <X className="h-3.5 w-3.5" />
                </button>
              </p>
            )}

            <dl className="space-y-2 pt-3 border-t border-line text-xs">
              <div className="flex justify-between text-stone">
                <dt>Subtotal</dt>
                <dd className="font-mono font-medium text-ink">{formatPrice(convertedSubtotal, selected.currency)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <dt>Discount ({coupon})</dt>
                  <dd className="font-mono font-medium">−{formatPrice(convertedDiscount, selected.currency)}</dd>
                </div>
              )}
              <div className="flex justify-between text-stone">
                <dt>Shipping</dt>
                <dd className="font-mono font-medium text-ink">
                  {formatPrice(convertedShippingCost, selected.currency)}
                </dd>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-line text-sm font-medium text-ink">
                <dt className="font-serif">Total</dt>
                <dd className="flex items-baseline gap-1">
                  <span className="text-[11px] font-normal text-stone uppercase">{selected.currency}</span>
                  <span className="font-serif text-base font-medium">{formatPrice(grandTotal, selected.currency)}</span>
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {/* Main 2-Column Checkout Layout */}
      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Left Column: Checkout Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handlePlaceOrder} className="space-y-8">
              {/* Express Checkout */}
              <div>
                <p className="text-center text-xs font-medium uppercase tracking-widest text-stone mb-3">
                  Express checkout
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {/* PayPal Pill Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethodType("paypal");
                      toast.info("PayPal selected for checkout.");
                    }}
                    className="h-12 w-full rounded-[2px] bg-[#FFC439] hover:bg-[#F2BA36] flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                    aria-label="Checkout with PayPal"
                  >
                    <span className="font-sans font-black italic text-lg tracking-tight">
                      <span className="text-[#003087]">Pay</span>
                      <span className="text-[#0079C1]">Pal</span>
                    </span>
                  </button>

                  {/* Google Pay Pill Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethodType("card");
                      toast.info("Card / Express checkout ready.");
                    }}
                    className="h-12 w-full rounded-[2px] bg-ink hover:bg-stone text-ivory flex items-center justify-center gap-1 transition-all shadow-2xs cursor-pointer font-medium text-sm"
                    aria-label="Checkout with Google Pay"
                  >
                    <span className="font-bold text-base tracking-tight flex items-center gap-0.5">
                      <span className="text-white">G</span>
                      <span className="text-white font-medium ml-1">Pay</span>
                    </span>
                  </button>
                </div>

                {/* OR Divider */}
                <div className="relative my-6 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-line" />
                  </div>
                  <span className="relative bg-background px-4 text-[11px] font-medium uppercase tracking-widest text-stone">
                    OR
                  </span>
                </div>
              </div>

              {/* Contact Section */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h2 className="font-serif text-lg font-medium text-ink">Contact</h2>
                  {!customer ? (
                    <Link
                      href="/login?redirect=/checkout"
                      className="text-xs font-medium text-ink underline hover:text-gold transition-colors"
                    >
                      Sign in
                    </Link>
                  ) : (
                    <span className="text-xs text-stone">{customer.email}</span>
                  )}
                </div>

                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    placeholder="Email"
                    value={email}
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={fieldErrors.email ? "email-error" : undefined}
                    onChange={(e) => {
                      clearError("email");
                      setEmail(e.target.value);
                    }}
                    className="h-12 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 pr-10 text-sm text-ink placeholder:text-stone/40 focus:border-ink focus:ring-1 focus:ring-ink transition-colors"
                  />
                  <span
                    title="Order confirmation and shipping tracking will be sent to this email"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full border border-stone/40 text-[10px] text-stone cursor-help"
                  >
                    ?
                  </span>
                </div>
                {renderFieldError("email")}

                <label className="mt-3 flex items-start gap-2.5 text-xs text-stone cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={subscribe}
                    onChange={(e) => setSubscribe(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded-[2px] border-stone/20 text-ink accent-ink focus:ring-0"
                  />
                  <span>
                    I'd like to receive privilege updates and private invitations from LETTY.
                  </span>
                </label>
              </div>

              {/* Delivery Section */}
              <div>
                <h2 className="font-serif text-lg font-medium text-ink mb-3">Delivery</h2>

                <div className="space-y-3">
                  {/* Country / Region Selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                      className="h-14 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 py-1.5 flex items-center justify-between text-left hover:border-ink/50 transition-colors cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] text-stone uppercase tracking-wider font-medium">Country / Region</span>
                        <span className="text-sm font-medium text-ink flex items-center gap-2">
                          <CountryFlag
                            code={selectedCountryInfo.code}
                            name={selectedCountryInfo.name}
                            flagFallback={selectedCountryInfo.flag}
                            size="xs"
                          />
                          <span>{selectedCountryInfo.name}</span>
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-stone shrink-0" />
                    </button>

                    {countryDropdownOpen && (
                      <div className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-[2px] border border-line bg-white p-1 shadow-xl">
                        {COUNTRIES.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setCountry(c.name);
                              setStoreCountry(c.code);
                              setCountryDropdownOpen(false);
                              setPhone((prev) => {
                                if (!prev || prev.trim() === "" || prev.startsWith("+")) {
                                  const currentDigits = prev.replace(/^\+\d+\s*/, "");
                                  return currentDigits ? `${c.dialCode} ${currentDigits}` : `${c.dialCode} `;
                                }
                                return `${c.dialCode} ${prev}`;
                              });
                            }}
                            className="flex w-full items-center justify-between px-3 py-2 text-xs text-ink hover:bg-surface rounded-[2px] transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <CountryFlag code={c.code} name={c.name} flagFallback={c.flag} size="sm" />
                              <span>{c.name}</span>
                            </span>
                            <span className="text-stone font-mono text-[11px]">{c.currency} ({c.currencySymbol})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Input
                        id="firstName"
                        autoComplete="given-name"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => {
                          clearError("firstName");
                          setFirstName(e.target.value);
                        }}
                        className="h-11 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink focus:ring-1 focus:ring-ink"
                      />
                      {renderFieldError("firstName")}
                    </div>
                    <div>
                      <Input
                        id="lastName"
                        autoComplete="family-name"
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => {
                          clearError("lastName");
                          setLastName(e.target.value);
                        }}
                        className="h-11 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink focus:ring-1 focus:ring-ink"
                      />
                      {renderFieldError("lastName")}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <Input
                      id="address"
                      autoComplete="address-line1"
                      placeholder="Address"
                      value={address}
                      onChange={(e) => {
                        clearError("address");
                        setAddress(e.target.value);
                      }}
                      className="h-11 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink focus:ring-1 focus:ring-ink"
                    />
                    {renderFieldError("address")}
                  </div>

                  {/* Apartment, suite, etc. (optional) */}
                  <div>
                    <Input
                      id="apartment"
                      autoComplete="address-line2"
                      placeholder="Apartment, suite, etc. (optional)"
                      value={apartment}
                      onChange={(e) => setApartment(e.target.value)}
                      className="h-11 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink focus:ring-1 focus:ring-ink"
                    />
                  </div>

                  {/* City & Postal Code */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Input
                        id="city"
                        autoComplete="address-level2"
                        placeholder="City"
                        value={city}
                        onChange={(e) => {
                          clearError("city");
                          setCity(e.target.value);
                        }}
                        className="h-11 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink focus:ring-1 focus:ring-ink"
                      />
                      {renderFieldError("city")}
                    </div>
                    <div>
                      <Input
                        id="postalCode"
                        autoComplete="postal-code"
                        placeholder="Postal code / ZIP"
                        value={postalCode}
                        onChange={(e) => {
                          clearError("postalCode");
                          setPostalCode(e.target.value.toUpperCase());
                        }}
                        className="h-11 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink focus:ring-1 focus:ring-ink"
                      />
                      {renderFieldError("postalCode")}
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="Phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 pr-10 text-sm text-ink placeholder:text-stone/40 focus:border-ink focus:ring-1 focus:ring-ink font-mono"
                    />
                    <span
                      title="In case we need to contact you regarding your delivery"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full border border-stone/40 text-[10px] text-stone cursor-help"
                    >
                      ?
                    </span>
                  </div>

                  {/* Save info checkbox */}
                  <label className="mt-2 flex items-center gap-2.5 text-xs text-stone cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={saveInfo}
                      onChange={(e) => setSaveInfo(e.target.checked)}
                      className="h-4 w-4 rounded-[2px] border-stone/20 text-ink accent-ink focus:ring-0"
                    />
                    <span>Save this information for next time</span>
                  </label>
                </div>
              </div>

              {/* Shipping Method Section */}
              <div>
                <h2 className="font-serif text-lg font-medium text-ink mb-3">Shipping Method</h2>
                <div
                  className="border border-ink bg-surface/90 rounded-[2px] p-4 flex items-center justify-between cursor-pointer transition-all shadow-2xs"
                >
                  <div>
                    <p className="font-medium text-sm text-ink flex items-center gap-2">
                      <span>{destInfo.flag}</span>
                      <span>Standard Shipping</span>
                      <span className="text-xs text-stone">({destInfo.label})</span>
                    </p>
                    <p className="text-xs text-stone mt-0.5">
                      Delivered within {destInfo.deliveryTime}.
                    </p>
                  </div>
                  <span className="font-mono text-sm font-medium text-ink">
                    {formatPrice(convertedShippingCost, selected.currency)}
                  </span>
                </div>
              </div>

              {/* Payment Section */}
              <div>
                <h2 className="font-serif text-lg font-medium text-ink mb-1">Payment</h2>
                <p className="text-xs text-stone mb-3">
                  All transactions are secure and encrypted.
                </p>

                {/* Payment method selector tabs */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethodType("card")}
                    className={`h-12 rounded-[2px] border px-3 flex items-center gap-2 text-xs font-medium transition-all cursor-pointer ${
                      paymentMethodType === "card"
                        ? "border-ink bg-white text-ink shadow-2xs"
                        : "border-stone/20 bg-surface/60 text-stone hover:text-ink hover:bg-surface"
                    }`}
                  >
                    <CreditCard className="h-4 w-4 text-ink" />
                    <span>Credit / Debit Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethodType("paypal")}
                    className={`h-12 rounded-[2px] border px-3 flex items-center gap-2 text-xs font-medium transition-all cursor-pointer ${
                      paymentMethodType === "paypal"
                        ? "border-ink bg-white text-ink shadow-2xs"
                        : "border-stone/20 bg-surface/60 text-stone hover:text-ink hover:bg-surface"
                    }`}
                  >
                    <span className="font-sans font-black italic text-sm tracking-tight">
                      <span className="text-[#003087]">Pay</span>
                      <span className="text-[#0079C1]">Pal</span>
                    </span>
                    <span>PayPal</span>
                  </button>
                </div>

                {/* Card input box */}
                {paymentMethodType === "card" ? (
                  <div className="border border-stone/20 rounded-[2px] p-4 space-y-3 bg-surface/40">
                    {/* Card Number Container */}
                    <div>
                      <div className="relative">
                        <div
                          id="stripe-card-element"
                          ref={cardContainerRef}
                          className="min-h-[46px] w-full rounded-[2px] border border-stone/20 bg-white px-3.5 py-3 text-sm focus-within:border-ink"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <span className="px-1 py-0.5 text-[9px] font-bold bg-[#1A1F71] text-white rounded-[2px]">VISA</span>
                          <span className="px-1 py-0.5 text-[9px] font-bold bg-[#EB001B] text-white rounded-[2px]">MC</span>
                          <span className="px-1 py-0.5 text-[9px] font-bold bg-[#006FCF] text-white rounded-[2px]">AMEX</span>
                          <span className="text-[10px] text-stone font-medium">+5</span>
                        </div>
                      </div>
                      {(stripeCardError || fieldErrors.card) && (
                        <p role="alert" className="text-[10px] text-red-600 font-medium mt-1">
                          {stripeCardError || fieldErrors.card}
                        </p>
                      )}
                    </div>

                    {/* Name on Card */}
                    <div>
                      <Input
                        id="cardName"
                        autoComplete="cc-name"
                        placeholder="Name on card"
                        value={cardName}
                        onChange={(e) => {
                          setCardNameTouched(true);
                          clearError("cardName");
                          setCardName(e.target.value);
                        }}
                        className="h-11 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink focus:ring-1 focus:ring-ink"
                      />
                      {renderFieldError("cardName")}
                    </div>
                  </div>
                ) : (
                  <div className="border border-stone/20 rounded-[2px] p-5 bg-surface/50 text-center text-xs text-stone">
                    <p>After clicking "PAY NOW", you will be redirected to PayPal to complete your purchase securely.</p>
                  </div>
                )}

                {/* Billing Address Checkbox */}
                <label className="mt-4 flex items-center gap-2.5 text-xs text-stone cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={billingSameAsShipping}
                    onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                    className="h-4 w-4 rounded-[2px] border-stone/20 text-ink accent-ink focus:ring-0"
                  />
                  <span className="font-medium text-ink">Use shipping address as billing address</span>
                </label>

                {!billingSameAsShipping && (
                  <div className="mt-3 p-3.5 border border-stone/20 rounded-[2px] bg-surface/40 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        id="billingFirstName"
                        placeholder="First name"
                        value={billingFirstName}
                        onChange={(e) => {
                          clearError("billingFirstName");
                          setBillingFirstName(e.target.value);
                        }}
                        className="h-11 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink"
                      />
                      <Input
                        id="billingLastName"
                        placeholder="Last name"
                        value={billingLastName}
                        onChange={(e) => {
                          clearError("billingLastName");
                          setBillingLastName(e.target.value);
                        }}
                        className="h-11 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink"
                      />
                    </div>
                    <Input
                      id="billingAddress"
                      placeholder="Address"
                      value={billingAddress}
                      onChange={(e) => {
                        clearError("billingAddress");
                        setBillingAddress(e.target.value);
                      }}
                      className="h-11 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        id="billingCity"
                        placeholder="City"
                        value={billingCity}
                        onChange={(e) => {
                          clearError("billingCity");
                          setBillingCity(e.target.value);
                        }}
                        className="h-11 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink"
                      />
                      <Input
                        id="billingPostalCode"
                        placeholder="Postal code / ZIP"
                        value={billingPostalCode}
                        onChange={(e) => {
                          clearError("billingPostalCode");
                          setBillingPostalCode(e.target.value.toUpperCase());
                        }}
                        className="h-11 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Legal Acceptance Text & PAY NOW Button */}
              <div className="mt-6 space-y-4">
                {paymentError && (
                  <div className="p-3.5 border border-red-300 bg-red-50 text-center text-xs font-medium text-red-800 rounded-[2px]">
                    {paymentError}
                  </div>
                )}

                <p className="text-xs text-stone leading-relaxed">
                  By placing your order, you confirm that you have read and accept our{" "}
                  <Link href="/terms" className="underline font-medium text-ink hover:text-gold transition-colors">
                    Terms &amp; Conditions of Use
                  </Link>
                  ,{" "}
                  <Link href="/terms" className="underline font-medium text-ink hover:text-gold transition-colors">
                    Terms &amp; Conditions of Sale
                  </Link>
                  , and{" "}
                  <Link href="/privacy" className="underline font-medium text-ink hover:text-gold transition-colors">
                    Privacy Policy
                  </Link>
                  .
                </p>

                {/* LETTY Theme Luxury Primary Action Button */}
                <button
                  type="submit"
                  disabled={step === "processing"}
                  className="w-full h-13 rounded-none sm:rounded-[2px] bg-ink hover:bg-stone active:scale-[0.99] text-ivory font-medium text-xs tracking-[0.22em] uppercase transition-all shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  {step === "processing" ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ivory border-t-transparent" />
                      PROCESSING ORDER...
                    </span>
                  ) : (
                    "PAY NOW"
                  )}
                </button>

                <div className="text-center pt-2">
                  <Link
                    href="/privacy"
                    className="text-[11px] font-medium uppercase tracking-widest text-stone hover:text-ink underline transition-colors"
                  >
                    COOKIE PREFERENCES
                  </Link>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary (Shopify-Style Structure in LETTY Theme) */}
          <aside className="hidden lg:block lg:col-span-5">
            <div className="sticky top-24 space-y-6 lg:pl-8 lg:border-l lg:border-line">
              {/* Product Line Items with Circle Count Badge */}
              <ul className="divide-y divide-line">
                {detailedLines.map((line) => (
                  <li key={line.variantId} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Product Thumbnail with Circular Quantity Badge */}
                      <div className="relative h-16 w-16 rounded-[2px] border border-line shrink-0 bg-white">
                        <div className="relative h-full w-full rounded-[2px] overflow-hidden">
                          <LettyImage
                            imageKey={line.product.media[0]?.imageKey ?? "productShampoo"}
                            alt={line.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-ink text-ivory text-[10px] font-mono flex items-center justify-center shadow-xs">
                          {line.quantity}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="font-serif text-sm font-medium text-ink leading-snug truncate">
                          {line.product.name}
                        </p>
                        <p className="text-xs text-stone truncate mt-0.5">
                          {line.variant.size || line.variant.color || line.variant.sku}
                        </p>
                      </div>
                    </div>

                    <span className="font-mono text-sm font-medium text-ink shrink-0">
                      {formatPrice(convertPrice(line.lineTotal, selected.currency), selected.currency)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Discount Code Box */}
              <form onSubmit={applyCoupon} className="flex gap-2">
                <Input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Discount / Voucher code"
                  className="h-11 flex-1 rounded-[2px] border border-stone/20 bg-white px-3.5 text-xs text-ink placeholder:text-stone/40 focus:border-ink uppercase tracking-wide"
                />
                <button
                  type="submit"
                  disabled={validatingCoupon}
                  className="h-11 px-5 rounded-[2px] border border-stone/20 bg-surface hover:bg-stone/10 text-xs font-medium uppercase tracking-widest text-ink transition-colors cursor-pointer disabled:opacity-50"
                >
                  {validatingCoupon ? "..." : "Apply"}
                </button>
              </form>

              {coupon && (
                <p className="inline-flex items-center gap-1.5 text-xs text-ink bg-surface border border-line px-2.5 py-1">
                  <Tag className="h-3 w-3 text-gold" />
                  <span className="font-mono font-medium">{coupon}</span> ({appliedCouponInfo?.label ?? "Promo applied"})
                  <button type="button" onClick={removeCoupon} className="ml-1 text-stone hover:text-ink cursor-pointer">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </p>
              )}

              {/* Pricing Breakdown */}
              <dl className="space-y-3 pt-3 border-t border-line text-sm">
                <div className="flex justify-between text-stone">
                  <dt className="font-medium">Subtotal</dt>
                  <dd className="font-mono font-medium text-ink">
                    {formatPrice(convertedSubtotal, selected.currency)}
                  </dd>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-800">
                    <dt>Discount ({coupon})</dt>
                    <dd className="font-mono font-medium">
                      −{formatPrice(convertedDiscount, selected.currency)}
                    </dd>
                  </div>
                )}

                <div className="flex justify-between text-stone">
                  <dt className="font-medium">Shipping</dt>
                  <dd className="font-mono font-medium text-ink">
                    {formatPrice(convertedShippingCost, selected.currency)}
                  </dd>
                </div>

                <div className="flex justify-between items-baseline pt-4 border-t border-line">
                  <dt className="font-serif text-base font-medium text-ink">Total</dt>
                  <dd className="flex items-baseline gap-1.5 font-medium text-ink">
                    <span className="text-xs font-normal text-stone uppercase">{selected.currency}</span>
                    <span className="font-serif text-2xl font-medium">{formatPrice(grandTotal, selected.currency)}</span>
                  </dd>
                </div>
              </dl>

              {/* Quiet Luxury Ribbon / Packaging Note */}
              <div className="mt-6 pt-4 border-t border-line/60 text-xs text-stone flex items-center gap-2.5">
                <Package className="h-4 w-4 text-gold shrink-0" />
                <span>Complimentary signature packaging with bespoke ribbon included with every order.</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
