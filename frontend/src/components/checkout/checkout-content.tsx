"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  loadStripe,
  type Stripe,
  type StripeElements,
  type StripeExpressCheckoutElement,
  type StripeExpressCheckoutElementConfirmEvent,
  type StripePaymentElement,
} from "@stripe/stripe-js";
import { useCustomerAuthStore } from "@/lib/store/customer-auth";
import {
  CheckCircle2,
  ChevronDown,
  Search,
  ShoppingBag,
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
} from "@/lib/constants";
import { useCartStore } from "@/lib/store/cart";
import { cn, formatPrice } from "@/lib/utils";
import { CountryFlag } from "@/components/ui/country-flag";
import { COUNTRIES, type CurrencyCode } from "@/lib/data/countries";
import { useCurrencyStore } from "@/lib/store/currency";
import { SubdivisionSelect } from "@/components/checkout/subdivision-select";
import { getSubdivisionConfig } from "@/lib/data/subdivisions";
import { AddressAutocomplete } from "@/components/checkout/address-autocomplete";
import type { CartLineDetailed } from "@/types";

/**
 * One-Page Unified Checkout:
 *
 * All checkout sections (Contact, Delivery, Shipping, Payment, Billing)
 * are rendered together on a single page. Stripe Elements (Express Checkout +
 * Payment Element) are mounted in deferred intent mode on page load.
 * Clicking "PAY NOW" validates all form inputs, verifies payment details,
 * creates the backend order/intent, and confirms the charge with Stripe.
 */

const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null;

let stripePromiseInstance: Promise<Stripe | null> | null = null;
function getStripePromise(): Promise<Stripe | null> | null {
  if (typeof window === "undefined") return null;
  if (!STRIPE_PUBLISHABLE_KEY) return null;
  if (!stripePromiseInstance) {
    stripePromiseInstance = loadStripe(STRIPE_PUBLISHABLE_KEY).catch((err) => {
      stripePromiseInstance = null;
      throw err;
    });
  }
  return stripePromiseInstance;
}

const COUNTRIES_WITHOUT_POSTAL_CODES = new Set([
  "AE", "QA", "HK", "MO", "BS", "FJ", "PA", "AG", "BZ", "BJ", "BW", "BF", "BI",
  "CM", "CF", "KM", "CG", "CD", "DJ", "DM", "GQ", "ER", "GM", "GH", "GD", "GN",
  "GY", "KI", "ML", "MR", "NR", "RW", "KN", "LC", "ST", "SC", "SL", "SB", "SO",
  "SR", "SY", "TG", "TO", "TV", "UG", "VU", "YE", "ZW"
]);

/**
 * Stripe's minimum charge for the supported 2-decimal currencies is 0.30 in
 * major units. Flooring the elements amount higher than that made the wallet
 * authorize (and display) more than the backend charges for sub-£10 totals,
 * which fails wallet confirmation on amount mismatch.
 */
const ELEMENTS_MIN_AMOUNT = 30;
const toElementsAmount = (majorUnits: number) =>
  Math.max(ELEMENTS_MIN_AMOUNT, Math.round((majorUnits || 0) * 100));

/** Order created by the backend. `amount` is the authoritative charge total. */
interface ActiveOrder {
  orderId: string;
  orderNumber: string;
  clientSecret: string;
  amount: number;
  currency: string;
}

const STRIPE_APPEARANCE = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#171412",
    colorBackground: "#ffffff",
    colorText: "#171412",
    colorDanger: "#dc2626",
    fontFamily: 'var(--font-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    spacingUnit: "4px",
    borderRadius: "2px",
    fontSizeBase: "14px",
  },
  rules: {
    ".Tab": {
      border: "1px solid rgba(23, 20, 18, 0.15)",
      backgroundColor: "#FAF8F5",
      borderRadius: "2px",
      color: "#171412",
    },
    ".Tab:hover": {
      border: "1px solid rgba(23, 20, 18, 0.4)",
      backgroundColor: "#ffffff",
    },
    ".Tab--selected": {
      border: "1px solid #171412",
      backgroundColor: "#ffffff",
      boxShadow: "none",
    },
    ".AccordionItem": {
      border: "1px solid rgba(23, 20, 18, 0.15)",
      backgroundColor: "#FAF8F5",
      borderRadius: "2px",
      color: "#171412",
      marginBottom: "8px",
    },
    ".AccordionItem:hover": {
      border: "1px solid rgba(23, 20, 18, 0.4)",
      backgroundColor: "#ffffff",
    },
    ".AccordionItem--selected": {
      border: "1px solid #171412",
      backgroundColor: "#ffffff",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
    },
    ".Input": {
      border: "1px solid rgba(23, 20, 18, 0.2)",
      borderRadius: "2px",
      boxShadow: "none",
    },
    ".Input:focus": {
      border: "1px solid #171412",
      boxShadow: "0 0 0 1px #171412",
    },
    ".Label": {
      color: "#78716c",
      textTransform: "uppercase",
      fontSize: "11px",
      fontWeight: "500",
      letterSpacing: "0.05em",
      marginBottom: "4px",
    },
  },
};

export function CheckoutContent() {
  const hydrated = useHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const lines = useCartStore((s) => s.lines);
  const clearCart = useCartStore((s) => s.clear);

  const [step, setStep] = useState<"form" | "payment" | "processing" | "success">("form");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
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

  const processing = step === "processing";

  // Form inputs
  const [email, setEmail] = useState(customer?.email ?? "");
  const initialEmailRef = useRef(email);
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
  const [state, setState] = useState("");
  const [country, setCountry] = useState(storeCountry?.name ?? "United Kingdom");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState(storeCountry?.dialCode ? `${storeCountry.dialCode} ` : "");

  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingFirstName, setBillingFirstName] = useState("");
  const [billingLastName, setBillingLastName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingApartment, setBillingApartment] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingCountry, setBillingCountry] = useState(storeCountry?.name ?? "United Kingdom");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [shippingMethod] = useState("standard");
  const [saveInfo, setSaveInfo] = useState(true);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [billingCountryDropdownOpen, setBillingCountryDropdownOpen] = useState(false);
  const [billingCountrySearch, setBillingCountrySearch] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const popularCountries = useMemo(() => COUNTRIES.filter((c) => c.popular), []);

  const filteredShippingCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return null;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.includes(q)
    );
  }, [countrySearch]);

  const filteredBillingCountries = useMemo(() => {
    const q = billingCountrySearch.trim().toLowerCase();
    if (!q) return null;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.includes(q)
    );
  }, [billingCountrySearch]);

  // Track last synced country to prevent unnecessary state resets when other dependencies change
  const lastSyncedCountryRef = useRef<string | null>(storeCountry?.name ?? null);

  // Synchronize destination country and phone dial code with store selection (e.g. chosen on home page)
  useEffect(() => {
    if (hydrated && storeCountry?.name) {
      if (lastSyncedCountryRef.current !== storeCountry.name) {
        lastSyncedCountryRef.current = storeCountry.name;
        setCountry(storeCountry.name);
        setState("");
        clearError("state");
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
    }
  }, [hydrated, storeCountry?.name, billingSameAsShipping]);

  // Payment details & Stripe Elements (mounted only in the payment phase,
  // from the clientSecret issued by the backend)
  const [cardName, setCardName] = useState("");
  const [cardNameTouched, setCardNameTouched] = useState(false);
  const [cardBrand, setCardBrand] = useState<string | null>(null);
  const [stripePaymentError, setStripePaymentError] = useState<string | null>(null);
  const [stripeMounted, setStripeMounted] = useState(false);
  const [expressStatus, setExpressStatus] = useState<"loading" | "available" | "unavailable" | "error">("loading");
  const [paymentPending, setPaymentPending] = useState(false);

  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const paymentElementRef = useRef<StripePaymentElement | null>(null);
  const expressElementRef = useRef<StripeExpressCheckoutElement | null>(null);
  const paymentContainerRef = useRef<HTMLDivElement | null>(null);
  const expressContainerRef = useRef<HTMLDivElement | null>(null);
  const expressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountingRef = useRef(false);
  const expressConfirmRef = useRef<((event: StripeExpressCheckoutElementConfirmEvent) => Promise<void>) | null>(null);
  // Express wallet handlers are attached once at mount, so they read live
  // pricing and shipping from this ref instead of stale closure values.
  const expressPricingRef = useRef({
    subtotal: 0,
    discount: 0,
    currency: "GBP" as string,
    shippingCost: 0,
    deliveryTime: "2-3 business days",
  });

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Auto-fill cardholder name with shipping name unless customer edited it
  useEffect(() => {
    if (!cardNameTouched) {
      const full = `${firstName} ${lastName}`.trim();
      if (full) setCardName(full);
    }
  }, [firstName, lastName, cardNameTouched]);

  // Restore placed order from sessionStorage on page return from 3DS redirect
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const saved = sessionStorage.getItem("letty_last_order");
        if (saved) {
          const data = JSON.parse(saved);
          if (data && data.orderId) {
            const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
            const isRedirectSuccess =
              params?.get("status") === "success" ||
              params?.get("redirect_status") === "succeeded";

            if (isRedirectSuccess) {
              const paymentIntentId = params?.get("payment_intent");
              if (!paymentIntentId) return;
              const response = await fetch("/api/checkout/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: data.orderIdUuid, paymentIntentId }),
              });
              if (!response.ok) throw new Error("Could not verify payment. Please contact support before trying again.");
              const result = await response.json();
              if (cancelled) return;
              if (result.data?.status !== "paid" && result.data?.status !== "processing") {
                setPaymentError("Payment was not completed. Please review your payment details.");
                return;
              }
              setPaymentPending(result.data.status === "processing");
              setOrderId(data.orderId);
              if (data.orderLines) setOrderLines(data.orderLines);
              if (data.orderTotals) setOrderTotals(data.orderTotals);
              if (data.email && !initialEmailRef.current) setEmail(data.email);
              if (data.shippingAddress) {
                if (data.shippingAddress.state) setState(data.shippingAddress.state);
                if (data.shippingAddress.city) setCity(data.shippingAddress.city);
                if (data.shippingAddress.country) setCountry(data.shippingAddress.country);
              }
              clearCart();
              setStep("success");
            }
          }
        }
      } catch (error) {
        if (!cancelled) setPaymentError(error instanceof Error ? error.message : "Could not verify payment. Please contact support before trying again.");
      }
    })();
    return () => { cancelled = true; };
  }, [clearCart]);

  const clearError = (key: string) => {
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const renderFieldError = (id: string) => {
    if (!fieldErrors[id]) return null;
    return (
      <p id={`${id}-error`} role="alert" className="text-xs text-red-600 font-medium mt-1">
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

  // Order summary collapse (defaults to open)
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const [desktopSummaryExpanded, setDesktopSummaryExpanded] = useState(true);

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

  const isShippingPostalRequired = !COUNTRIES_WITHOUT_POSTAL_CODES.has(selectedCountryInfo.code);
  const isBillingPostalRequired = !COUNTRIES_WITHOUT_POSTAL_CODES.has(selectedBillingCountryInfo.code);

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

  // Client-side fallback estimate (mirrors the backend's fallback table). The
  // displayed fee is the server quote below, so it matches what
  // /api/checkout/init charges even when dashboard shipping rates change.
  const freeShippingApplied = convertedSubtotal >= 150;
  const estimatedShippingCost = freeShippingApplied
    ? 0
    : isEuropeEur
    ? rawShippingCost
    : convertPrice(rawShippingCost, selected.currency);

  // Shipping rate for a destination, used as the express wallet fallback when
  // the quote endpoint is unreachable.
  const estimateShippingForCountry = (countryCode: string, currency: string, orderSubtotal: number) => {
    if (orderSubtotal >= 150) return 0;
    const rate = calculateShipping(orderSubtotal, countryCode, currency, "standard");
    return currency === "EUR" && getShippingDestinationKey(countryCode) === "Europe"
      ? rate
      : convertPrice(rate, currency as CurrencyCode);
  };

  // Server-priced quote for the selected destination (same calculateShipping
  // call the backend uses when creating the order).
  const [serverShippingRate, setServerShippingRate] = useState<number | null>(null);
  const shippingCountryCode = selectedCountryInfo.code || country;
  useEffect(() => {
    let cancelled = false;
    fetch(
      `/api/public/shipping-quote?country=${encodeURIComponent(shippingCountryCode)}&currency=${encodeURIComponent(selected.currency)}&subtotal=${convertedSubtotal.toFixed(2)}`,
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled) return;
        const rate = Number(json?.data?.rate);
        if (Number.isFinite(rate) && rate >= 0) setServerShippingRate(rate);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [shippingCountryCode, selected.currency, convertedSubtotal]);

  const convertedShippingCost = serverShippingRate ?? estimatedShippingCost;

  // Shipping options (and their fee) are only meaningful once we know where the
  // order is going, so the fee stays hidden until delivery details are entered.
  const shippingStateRequired = getSubdivisionConfig(country).required;
  const deliveryDetailsComplete =
    address.trim().length > 0 &&
    city.trim().length > 0 &&
    (!shippingStateRequired || state.trim().length > 0) &&
    (!isShippingPostalRequired || postalCode.trim().length > 0);

  // Client-side estimate shown while collecting details. The charged amount is
  // whatever the backend returns after pricing the cart itself.
  const baseTotal = Math.max(0, convertedSubtotal - convertedDiscount);
  const estimatedTotal = baseTotal + (deliveryDetailsComplete ? convertedShippingCost : 0);

  // Keep the express wallet handlers' pricing and shipping fresh across renders.
  useEffect(() => {
    expressPricingRef.current = {
      subtotal: convertedSubtotal,
      discount: convertedDiscount,
      currency: selected.currency,
      shippingCost: convertedShippingCost,
      deliveryTime: destInfo.deliveryTime,
    };
  }, [convertedSubtotal, convertedDiscount, selected.currency, convertedShippingCost, destInfo.deliveryTime]);

  /* ---------------------------------------------------------------- */
  /*  Phase 1 → 2: create the order with the backend                    */
  /* ---------------------------------------------------------------- */

  const validateForm = () => {
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

    const shippingSubConfig = getSubdivisionConfig(country);
    if (shippingSubConfig.required && !state.trim()) {
      errors.state = `${shippingSubConfig.label} is required`;
    }

    if (isShippingPostalRequired && !postalCode.trim()) {
      errors.postalCode = "Postal code is required";
    }

    if (!billingSameAsShipping) {
      if (!billingFirstName.trim()) errors.billingFirstName = "First name is required";
      if (!billingLastName.trim()) errors.billingLastName = "Last name is required";
      if (!billingAddress.trim()) errors.billingAddress = "Billing street is required";
      if (!billingCity.trim()) errors.billingCity = "Billing city is required";

      const billingSubConfig = getSubdivisionConfig(billingCountry);
      if (billingSubConfig.required && !billingState.trim()) {
        errors.billingState = `${billingSubConfig.label} is required`;
      }

      if (isBillingPostalRequired && !billingPostalCode.trim()) {
        errors.billingPostalCode = "Postal code is required";
      }
    }

    return errors;
  };

  const teardownElements = useCallback(() => {
    try {
      paymentElementRef.current?.destroy();
    } catch {}
    try {
      expressElementRef.current?.destroy();
    } catch {}
    paymentElementRef.current = null;
    expressElementRef.current = null;
    elementsRef.current = null;
    isMountingRef.current = false;
    if (expressTimeoutRef.current) {
      clearTimeout(expressTimeoutRef.current);
      expressTimeoutRef.current = null;
    }
    setStripeMounted(false);
    setExpressStatus("loading");
  }, []);

  // Shared confirmation result handling for the Pay button and wallet buttons.
  const processConfirmResult = useCallback(
    async (
      error: unknown,
      paymentIntent: { id: string; status?: string } | undefined,
      orderUuid?: string,
      orderNum?: string,
    ) => {
      const err = error as
        | { message?: string; payment_intent?: { id: string; status?: string } }
        | undefined;

      const intent = paymentIntent ?? err?.payment_intent;

      if (intent && (intent.status === "succeeded" || intent.status === "processing")) {
        const targetUuid = orderUuid || activeOrder?.orderId;
        const targetNum = orderNum || activeOrder?.orderNumber;

        fetch("/api/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: targetUuid,
            paymentIntentId: intent.id,
          }),
        }).catch(() => {});

        clearCart();
        setOrderId(targetNum ?? null);
        setPaymentPending(intent.status === "processing");
        setStep("success");
        try {
          sessionStorage.removeItem("letty_last_order");
        } catch {}
        if (subscribe && email) {
          fetch("/api/newsletter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, source: "checkout" }),
          }).catch(() => {});
        }
        if (intent.status === "processing") {
          toast.info("Payment pending — we will email you once it is confirmed.");
        } else {
          toast.success("Order confirmed — payment successfully processed via Stripe.");
        }
        return;
      }

      const message =
        err?.message ||
        (intent?.status === "requires_payment_method"
          ? "Payment was not completed. Please review your payment details."
          : "Payment authorization was not completed.");
      setPaymentError(message);
      setStripePaymentError(message);
      setStep("form");

      // Give the order back so an immediate retry isn't blocked by our own
      // reservation. Server-side verifies with Stripe first — a payment that
      // actually succeeded or is still settling is never failed here.
      const deadUuid = orderUuid || activeOrder?.orderId;
      if (deadUuid) {
        fetch("/api/checkout/abandon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: deadUuid }),
        }).catch(() => {});
      }
    },
    [activeOrder, clearCart, email, subscribe],
  );

  const handleExpressConfirm = useCallback(
    async (expressEvent: StripeExpressCheckoutElementConfirmEvent) => {
      const stripe = stripeRef.current;
      const elements = elementsRef.current;
      if (!stripe || !elements) {
        expressEvent.paymentFailed?.({ reason: "fail", message: "Payment processor is still initializing." });
        toast.error("Payment processor could not be initialized. Please wait a moment.");
        return;
      }

      const w = expressEvent.billingDetails;
      const s = expressEvent.shippingAddress;
      const payerEmail = w?.email?.trim() || email.trim();
      const payerFullName = s?.name?.trim() || w?.name?.trim() || `${firstName} ${lastName}`.trim();
      const nameParts = payerFullName ? payerFullName.split(/\s+/) : [];
      const payerFirstName = firstName.trim() || nameParts[0] || "Guest";
      const payerLastName = lastName.trim() || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "Customer");
      const payerPhone = (w?.phone || (s as any)?.phone || phone.replace(/^\+\d+\s*$/, "")).trim() || undefined;

      let shipStreet = address.trim() + (apartment.trim() ? `, ${apartment.trim()}` : "");
      let shipCity = city.trim();
      let shipState = state.trim() || city.trim();
      let shipCountry = selectedCountryInfo.code;
      let shipPostal = postalCode.trim() || undefined;

      // Extract shipping address from Apple Pay / Express Checkout sheet
      if (s?.address?.line1) {
        shipStreet = s.address.line1 + (s.address.line2 ? `, ${s.address.line2}` : "");
        shipCity = s.address.city || "";
        shipState = s.address.state || shipCity;
        shipCountry = s.address.country || selectedCountryInfo.code;
        shipPostal = s.address.postal_code || undefined;
      } else if (!shipStreet && w?.address?.line1) {
        shipStreet = w.address.line1 + (w.address.line2 ? `, ${w.address.line2}` : "");
        shipCity = w.address.city || "";
        shipState = w.address.state || shipCity;
        shipCountry = w.address.country || selectedCountryInfo.code;
        shipPostal = w.address.postal_code || undefined;
      }

      if (!payerEmail) {
        expressEvent.paymentFailed?.({ reason: "fail", message: "Please provide an email address." });
        toast.error("Please enter your email address before paying.");
        return;
      }

      if (!shipStreet || !shipCity) {
        expressEvent.paymentFailed?.({ reason: "fail", message: "Please enter your delivery address." });
        toast.error("Please enter your delivery address before using Express Checkout.");
        return;
      }

      setStep("processing");
      setPaymentError(null);
      setStripePaymentError(null);

      const { error: submitError } = await elements.submit();
      if (submitError) {
        setStep("form");
        setPaymentError(submitError.message || "Please review your wallet payment details.");
        expressEvent.paymentFailed({ reason: "fail", message: submitError.message });
        return;
      }

      let initData: any = null;
      try {
        const res = await fetch("/api/checkout/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            cart: lines.map((l) => ({
              variant_id: l.variantId,
              quantity: l.quantity,
            })),
            customerEmail: payerEmail,
            customerFirstName: payerFirstName,
            customerLastName: payerLastName,
            customerPhone: payerPhone,
            shippingAddress: {
              first_name: payerFirstName,
              last_name: payerLastName,
              phone: payerPhone,
              street: shipStreet,
              city: shipCity,
              state: shipState,
              country: shipCountry,
              postal_code: shipPostal,
              is_default_shipping: saveInfo,
              is_default_billing: billingSameAsShipping,
            },
            billingSameAsShipping,
            billingAddress: billingSameAsShipping
              ? undefined
              : {
                  first_name: billingFirstName.trim() || payerFirstName,
                  last_name: billingLastName.trim() || payerLastName,
                  street: (billingAddress.trim() + (billingApartment.trim() ? `, ${billingApartment.trim()}` : "")) || shipStreet,
                  city: billingCity.trim() || shipCity,
                  state: billingState.trim() || billingCity.trim() || shipState,
                  country: selectedBillingCountryInfo.code || shipCountry,
                  postal_code: billingPostalCode.trim() || shipPostal,
                },
            currency: selected.currency,
            shippingMethodId: shippingMethod,
            couponCode: coupon ?? undefined,
          }),
        });

        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(errBody.error || `Checkout initialization failed (${res.status})`);
        }

        const initJson = await res.json();
        initData = initJson?.data ?? {};
      } catch (err: any) {
        setStep("form");
        const msg = err.message || "Failed to initialize payment. Please try again.";
        expressEvent.paymentFailed?.({ reason: "fail", message: msg });
        setPaymentError(msg);
        toast.error(msg);
        return;
      }

      const orderUuid = initData.order_id || initData.orderId;
      const orderNum = initData.orderNumber || initData.order_number;
      const clientSecret = initData.clientSecret || initData.client_secret;

      if (!orderUuid || !clientSecret) {
        setStep("form");
        expressEvent.paymentFailed?.({ reason: "fail", message: "Missing authorization secret." });
        setPaymentError("The payment gateway did not return an authorization secret. Please try again.");
        return;
      }

      setActiveOrder({
        orderId: orderUuid,
        orderNumber: orderNum,
        clientSecret,
        amount: Number(initData.amount) || estimatedTotal,
        currency: String(initData.currency || selected.currency),
      });

      const snapshotLines = detailCartLines(lines).map((l) => ({
        ...l,
        unitPrice: convertPrice(l.unitPrice, selected.currency),
        lineTotal: convertPrice(l.lineTotal, selected.currency),
      }));
      const snapshotTotals = {
        subtotal: convertedSubtotal - convertedDiscount,
        shipping: convertedShippingCost,
        tax: 0,
        total: Number(initData.amount) || estimatedTotal,
        currency: String(initData.currency || selected.currency),
        shippingName: `${destInfo.flag} Standard Shipping (${destInfo.label})`,
        shippingTime: destInfo.deliveryTime,
      };

      try {
        sessionStorage.setItem(
          "letty_last_order",
          JSON.stringify({
            orderId: orderNum,
            orderIdUuid: orderUuid,
            email: payerEmail,
            shippingAddress: {
              firstName: payerFirstName,
              lastName: payerLastName,
              address: s?.address?.line1 || shipStreet,
              apartment: s?.address?.line2 || apartment,
              city: shipCity,
              state: shipState,
              country: shipCountry,
              postalCode: shipPostal,
            },
            orderLines: snapshotLines,
            orderTotals: snapshotTotals,
          })
        );
      } catch {}

      setOrderLines(snapshotLines);
      setOrderTotals(snapshotTotals);

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout?status=success`,
          payment_method_data: {
            billing_details: {
              name: w?.name || `${payerFirstName} ${payerLastName}`.trim(),
              email: payerEmail,
              ...(payerPhone ? { phone: payerPhone } : {}),
              address: w?.address
                ? {
                    line1: w.address.line1 || shipStreet,
                    line2: w.address.line2 || (billingSameAsShipping ? apartment : billingApartment),
                    city: w.address.city || shipCity,
                    state: w.address.state || shipState,
                    postal_code: w.address.postal_code || shipPostal,
                    country: w.address.country || shipCountry,
                  }
                : {
                    line1: billingSameAsShipping ? shipStreet : billingAddress,
                    line2: billingSameAsShipping ? apartment : billingApartment,
                    city: billingSameAsShipping ? shipCity : billingCity,
                    state: billingSameAsShipping ? shipState : (billingState.trim() || billingCity),
                    postal_code: (billingSameAsShipping ? shipPostal : billingPostalCode.trim()) || undefined,
                    country: billingSameAsShipping ? shipCountry : selectedBillingCountryInfo.code,
                  },
            },
          },
        },
        redirect: "if_required",
      });

      if (error) {
        expressEvent.paymentFailed?.({ reason: "fail", message: error.message });
      }

      await processConfirmResult(error, paymentIntent, orderUuid, orderNum);
    },
    [
      address,
      apartment,
      billingAddress,
      billingApartment,
      billingCity,
      billingFirstName,
      billingLastName,
      billingPostalCode,
      billingSameAsShipping,
      billingState,
      city,
      convertPrice,
      convertedDiscount,
      convertedShippingCost,
      convertedSubtotal,
      coupon,
      destInfo,
      email,
      estimatedTotal,
      firstName,
      lastName,
      lines,
      phone,
      postalCode,
      processConfirmResult,
      saveInfo,
      selected.currency,
      selectedBillingCountryInfo.code,
      selectedCountryInfo.code,
      shippingMethod,
      state,
    ],
  );

  useEffect(() => {
    expressConfirmRef.current = handleExpressConfirm;
  }, [handleExpressConfirm]);

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (processing) return;

    const errors = validateForm();
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

    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    if (!stripe || !elements) {
      setFieldErrors((prev) => ({
        ...prev,
        payment: "Payment element is still initializing. Please wait a moment.",
      }));
      toast.error("Payment element is still initializing. Please wait a moment.");
      return;
    }

    setStep("processing");
    setPaymentError(null);
    setStripePaymentError(null);

    // Validate Stripe card / payment inputs inline
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setStep("form");
      setFieldErrors((prev) => ({
        ...prev,
        payment: submitError.message || "Please complete payment details.",
      }));
      setStripePaymentError(submitError.message || "Please complete payment details.");
      toast.error(submitError.message || "Please complete payment details.");
      return;
    }

    const cleanedPhone = phone && phone.replace(/^\+\d+\s*$/, "").trim() ? phone.trim() : undefined;
    let initData: any = null;

    try {
      const res = await fetch("/api/checkout/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          cart: lines.map((l) => ({
            variant_id: l.variantId,
            quantity: l.quantity,
          })),
          customerEmail: email.trim(),
          customerFirstName: firstName.trim(),
          customerLastName: lastName.trim(),
          customerPhone: cleanedPhone,
          shippingAddress: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: cleanedPhone,
            street: address.trim() + (apartment.trim() ? `, ${apartment.trim()}` : ""),
            city: city.trim(),
            state: state.trim() || city.trim(),
            country: selectedCountryInfo.code,
            postal_code: postalCode.trim() || undefined,
            is_default_shipping: saveInfo,
            is_default_billing: billingSameAsShipping,
          },
          billingSameAsShipping,
          billingAddress: billingSameAsShipping
            ? undefined
            : {
                first_name: billingFirstName.trim(),
                last_name: billingLastName.trim(),
                street: billingAddress.trim() + (billingApartment.trim() ? `, ${billingApartment.trim()}` : ""),
                city: billingCity.trim(),
                state: billingState.trim() || billingCity.trim(),
                country: selectedBillingCountryInfo.code,
                postal_code: billingPostalCode.trim() || undefined,
              },
          currency: selected.currency,
          shippingMethodId: shippingMethod,
          couponCode: coupon ?? undefined,
        }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as {
          error?: string;
          details?: unknown;
        };
        throw new Error(errBody.error || `Checkout initialization failed (${res.status})`);
      }

      const initJson = (await res.json()) as { data?: Record<string, any> };
      initData = initJson?.data ?? {};
    } catch (err: any) {
      setStep("form");
      const message = err.message ?? "We could not start your checkout. Please try again.";
      setPaymentError(message);
      toast.error(message);
      return;
    }

    const orderUuid = initData.order_id || initData.orderId;
    const orderNum = initData.orderNumber || initData.order_number;
    const clientSecret = initData.clientSecret || initData.client_secret;

    if (!orderUuid || !clientSecret) {
      setStep("form");
      setPaymentError("The payment gateway did not return an authorization secret. Please try again.");
      toast.error("Payment authorization failed.");
      return;
    }

    setActiveOrder({
      orderId: orderUuid,
      orderNumber: orderNum,
      clientSecret,
      amount: Number(initData.amount) || estimatedTotal,
      currency: String(initData.currency || selected.currency),
    });

    const snapshotLines = detailCartLines(lines).map((l) => ({
      ...l,
      unitPrice: convertPrice(l.unitPrice, selected.currency),
      lineTotal: convertPrice(l.lineTotal, selected.currency),
    }));
    const snapshotTotals = {
      subtotal: convertedSubtotal - convertedDiscount,
      shipping: convertedShippingCost,
      tax: 0,
      total: Number(initData.amount) || estimatedTotal,
      currency: String(initData.currency || selected.currency),
      shippingName: `${destInfo.flag} Standard Shipping (${destInfo.label})`,
      shippingTime: destInfo.deliveryTime,
    };

    try {
      sessionStorage.setItem(
        "letty_last_order",
        JSON.stringify({
          orderId: orderNum,
          orderIdUuid: orderUuid,
          email,
          shippingAddress: {
            firstName,
            lastName,
            address,
            apartment,
            city,
            state,
            country,
            postalCode,
          },
          orderLines: snapshotLines,
          orderTotals: snapshotTotals,
        })
      );
    } catch {}

    setOrderLines(snapshotLines);
    setOrderTotals(snapshotTotals);

    // Confirm Payment with Stripe
    const formName = cardName || `${firstName} ${lastName}`.trim();
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/checkout?status=success`,
        payment_method_data: {
          billing_details: {
            name: formName,
            email: email.trim(),
            ...(cleanedPhone ? { phone: cleanedPhone } : {}),
            address: {
              line1: billingSameAsShipping ? address : billingAddress,
              line2: billingSameAsShipping ? apartment : billingApartment,
              city: billingSameAsShipping ? city : billingCity,
              state: billingSameAsShipping ? (state.trim() || city) : (billingState.trim() || billingCity),
              postal_code: (billingSameAsShipping ? postalCode : billingPostalCode).trim() || undefined,
              country: billingSameAsShipping
                ? selectedCountryInfo.code
                : selectedBillingCountryInfo.code,
            },
          },
        },
      },
      redirect: "if_required",
    });

    await processConfirmResult(error, paymentIntent, orderUuid, orderNum);
  };

  // Mount Express Checkout + Payment Element on page load (deferred intent mode)
  useEffect(() => {
    if (!hydrated || detailedLines.length === 0 || step === "success") return;
    if (paymentElementRef.current || isMountingRef.current) return;
    if (!paymentContainerRef.current) return;
    isMountingRef.current = true;

    (async () => {
      const promise = getStripePromise();
      if (!promise) {
        isMountingRef.current = false;
        setExpressStatus("error");
        setStripePaymentError(
          "Payment configuration error: Stripe publishable key is missing. Please contact support.",
        );
        return;
      }
      try {
        const stripe = await promise;
        if (!stripe || !paymentContainerRef.current) {
          isMountingRef.current = false;
          setExpressStatus("error");
          return;
        }
        stripeRef.current = stripe;

        const elements = stripe.elements({
          mode: "payment",
          amount: toElementsAmount(estimatedTotal),
          currency: selected.currency.toLowerCase(),
          appearance: STRIPE_APPEARANCE,
          loader: "auto",
          excludedPaymentMethodTypes: ["amazon_pay"],
        });
        elementsRef.current = elements;

        // Express Checkout (Apple Pay / Google Pay / Link / PayPal)
        if (expressContainerRef.current) {
          try {
            const finishExpressLoading = (status: "available" | "unavailable" | "error") => {
              if (expressTimeoutRef.current) {
                clearTimeout(expressTimeoutRef.current);
                expressTimeoutRef.current = null;
              }
              setExpressStatus(status);
            };
            expressTimeoutRef.current = setTimeout(() => finishExpressLoading("error"), 10000);

            const initialShippingFee = convertedShippingCost;
            const expressElement = elements.create("expressCheckout", {
              business: { name: "LETTY" },
              buttonHeight: 52,
              buttonTheme: {
                applePay: "black",
                googlePay: "black",
                paypal: "gold",
              },
              buttonType: {
                applePay: "plain",
                googlePay: "plain",
                paypal: "paypal",
              },
              layout: {
                maxColumns: 3,
                overflow: "never",
              },
              paymentMethodOrder: ["applePay", "googlePay", "paypal"],
              paymentMethods: {
                amazonPay: "never",
                klarna: "never",
                link: "never",
                applePay: "always",
                googlePay: "always",
                paypal: "always",
              },
              shippingAddressRequired: true,
              emailRequired: true,
              phoneNumberRequired: false,
              billingAddressRequired: true,
              shippingRates: [
                {
                  id: "standard",
                  amount: Math.round(initialShippingFee * 100),
                  displayName:
                    initialShippingFee === 0
                      ? "Complimentary Tracked Shipping"
                      : "Standard Tracked Shipping",
                  deliveryEstimate: destInfo.deliveryTime,
                },
              ],
            });

            expressElement.on("click", (event) => {
              const p = expressPricingRef.current;
              event.resolve({
                shippingRates: [
                  {
                    id: "standard",
                    amount: Math.round(p.shippingCost * 100),
                    displayName:
                      p.shippingCost === 0
                        ? "Complimentary Tracked Shipping"
                        : "Standard Tracked Shipping",
                    deliveryEstimate: p.deliveryTime,
                  },
                ],
              });
            });

            expressElement.on("ready", (event) => {
              finishExpressLoading(Object.values(event.availablePaymentMethods ?? {}).some(Boolean) ? "available" : "unavailable");
            });

            expressElement.on("availablepaymentmethodschange", (event) => {
              finishExpressLoading(Object.values(event.paymentMethods ?? {}).some((method) => method?.available) ? "available" : "unavailable");
            });

            expressElement.on("loaderror", () => {
              finishExpressLoading("error");
            });

            expressElement.on("cancel", () => setStep("form"));

            // Wallet-collected shipping: the payment sheet asks for the
            // delivery address, we quote the standard tracked rate for it from
            // the backend (client estimate as fallback) and keep the displayed
            // amount inclusive of the selected shipping fee.
            const walletBaseTotal = () => {
              const p = expressPricingRef.current;
              return Math.max(0, p.subtotal - p.discount);
            };
            const walletElementsAmount = (shippingMajor: number) =>
              toElementsAmount(walletBaseTotal() + shippingMajor);
            const walletShippingFee = async (countryCode: string, currency: string, orderSubtotal: number) => {
              try {
                const res = await fetch(
                  `/api/public/shipping-quote?country=${encodeURIComponent(countryCode)}&currency=${encodeURIComponent(currency)}&subtotal=${orderSubtotal.toFixed(2)}`,
                  { signal: AbortSignal.timeout(4000) },
                );
                if (res.ok) {
                  const rate = Number((await res.json())?.data?.rate);
                  if (Number.isFinite(rate) && rate >= 0) return rate;
                }
              } catch {
                // fall back to the client-side estimate below
              }
              return estimateShippingForCountry(countryCode, currency, orderSubtotal);
            };

            expressElement.on("shippingaddresschange", async (event) => {
              try {
                const p = expressPricingRef.current;
                const destKey = getShippingDestinationKey(event.address.country);
                const fee = await walletShippingFee(event.address.country, p.currency, p.subtotal);
                elementsRef.current?.update({ amount: walletElementsAmount(fee) });
                event.resolve({
                  shippingRates: [
                    {
                      id: "standard",
                      amount: Math.round(fee * 100),
                      displayName:
                        fee === 0 ? "Complimentary Tracked Shipping" : "Standard Tracked Shipping",
                      deliveryEstimate: SHIPPING_DESTINATIONS[destKey].deliveryTime,
                    },
                  ],
                });
              } catch {
                event.reject();
              }
            });

            expressElement.on("shippingratechange", (event) => {
              try {
                elementsRef.current?.update({
                  amount: walletElementsAmount(event.shippingRate.amount / 100),
                });
                event.resolve();
              } catch {
                event.reject();
              }
            });

            expressElement.on("confirm", (event) => {
              void expressConfirmRef.current?.(event);
            });

            expressElement.mount(expressContainerRef.current);
            expressElementRef.current = expressElement;
          } catch (err) {
            console.error("[Stripe Express Checkout] Init error:", err);
            if (expressTimeoutRef.current) clearTimeout(expressTimeoutRef.current);
            expressTimeoutRef.current = null;
            setExpressStatus("error");
          }
        }

        // Card / Klarna / Clearpay / PayPal Payment Element
        const paymentElement = elements.create("payment", {
          layout: {
            type: "accordion",
            defaultCollapsed: false,
            radios: "always",
            spacedAccordionItems: true,
          },
          paymentMethodOrder: ["card", "klarna", "afterpay_clearpay", "paypal"],
          fields: {
            billingDetails: {
              name: "never",
              email: "never",
              phone: "never",
              address: "if_required",
            },
          },
          wallets: {
            applePay: "never",
            googlePay: "never",
          },
          defaultValues: {
            billingDetails: {
              name: cardName || `${firstName} ${lastName}`.trim() || undefined,
              email: email ? email.trim() : undefined,
              phone: phone ? phone.trim() : undefined,
              address: {
                country: billingSameAsShipping
                  ? (selectedCountryInfo.code || "GB")
                  : (selectedBillingCountryInfo.code || "GB"),
                line1: (billingSameAsShipping ? address : billingAddress).trim() || undefined,
                city: (billingSameAsShipping ? city : billingCity).trim() || undefined,
                state: (billingSameAsShipping ? state : billingState).trim() || undefined,
                postal_code: (billingSameAsShipping ? postalCode : billingPostalCode).trim() || undefined,
              },
            },
          },
        });

        paymentElement.mount(paymentContainerRef.current);

        paymentElement.on("ready", () => {
          setStripeMounted(true);
          isMountingRef.current = false;
        });

        paymentElement.on("change", (event) => {
          if (event.complete) {
            setStripePaymentError(null);
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.payment;
              return next;
            });
          }
        });

        paymentElement.on("carddetailschange", (event) => {
          if (event.details?.brands && event.details.brands.length > 0) {
            setCardBrand(event.details.brands[0]);
          } else {
            setCardBrand(null);
          }
        });

        paymentElementRef.current = paymentElement;
      } catch (e: any) {
        isMountingRef.current = false;
        setExpressStatus("error");
        setStripePaymentError(
          e?.message || "Failed to initialize the payment form. Please check your network connection.",
        );
      }
    })();
  }, [hydrated, detailedLines.length, step]);

  // Keep Stripe Elements amount and currency synchronized
  useEffect(() => {
    if (!elementsRef.current || !stripeMounted) return;
    try {
      elementsRef.current.update({
        amount: toElementsAmount(estimatedTotal),
        currency: selected.currency.toLowerCase(),
      });
    } catch {
      // ignore
    }
  }, [estimatedTotal, selected.currency, stripeMounted]);

  // Cleanup elements on unmount only
  useEffect(() => {
    return () => {
      teardownElements();
    };
  }, [teardownElements]);

  /* ---------------------------------------------------------------- */
  /*  Coupon                                                           */
  /* ---------------------------------------------------------------- */

  const applyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    // Gate Patron Referral Program (CIRCLE10) to authenticated patrons & £40+ subtotal
    if (code === "CIRCLE10") {
      if (!customer) {
        toast.error("Only logged-in Patrons can benefit from the Patron Referral Program (CIRCLE10). Please sign in or create an account to redeem.");
        return;
      }
      if (subtotal < 40) {
        toast.error("The CIRCLE10 referral voucher requires a minimum order value of £40.00.");
        return;
      }
    }

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
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || "Invalid privilege code.");
      }
    } catch {
      toast.error("Could not validate voucher. Please try again.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setAppliedCouponInfo(null);
    toast.info("Voucher removed.");
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

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
      <div className="checkout-page [overflow-wrap:anywhere] mx-auto max-w-3xl px-4 py-16 text-center md:py-24">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-ink">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <p className="mt-6 text-xs font-medium uppercase tracking-luxe text-stone">
          Thank you for your order
        </p>
        <h1 className="mt-2 font-serif text-4xl font-medium text-ink md:text-5xl">
          {paymentPending ? "Payment Pending" : "Order Confirmed"}
        </h1>
        <p className="mt-3 text-sm text-stone">
          {paymentPending
            ? "Your payment is still processing. Please do not pay again. We will send confirmation to "
            : "Order confirmation and delivery updates will be sent to "}
          <span className="font-medium text-ink">{email || "your email"}</span>.
        </p>

        <div className="mt-8 border border-line bg-ivory p-6 text-left md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <span className="text-xs uppercase tracking-luxe text-stone">Order Number</span>
              <p className="font-serif text-xl font-medium text-ink">{orderId}</p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-luxe text-stone">Estimated Delivery</span>
              <p className="text-sm font-medium text-ink">
                {paymentPending ? "After payment confirmation" : (orderTotals?.shippingTime ?? "2–4 business days")}
              </p>
            </div>
          </div>

          {/* Ordered Products */}
          {orderLines.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-medium uppercase tracking-luxe text-stone">
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
                        imageKey={line.product.media[0]?.imageKey ?? "productLipstick"}
                        alt={line.product.media[0]?.alt ?? line.product.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                      <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center bg-ink px-1 text-xs font-medium uppercase tracking-wider text-ivory">
                        ×{line.quantity}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="break-words font-serif text-base font-medium text-ink">
                        {line.product.name}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-luxe-sm text-stone">
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
            <h3 className="text-xs font-medium uppercase tracking-luxe text-stone">
              Shipping Destination
            </h3>
            <p className="mt-2 text-sm font-medium text-ink">
              {firstName} {lastName}
            </p>
            <p className="text-sm text-stone">
              {address} {apartment && `, ${apartment}`}
            </p>
            <p className="text-sm text-stone">
              {city}{state ? `, ${state}` : ""}{postalCode ? ` ${postalCode}` : ""}, {country}
            </p>
          </div>

          <div className="mt-6 border-t border-line pt-6">
            <h3 className="text-xs font-medium uppercase tracking-luxe text-stone mb-3">
              Delivery Method
            </h3>
            <div className="flex items-center gap-3 text-sm text-stone">
              <Truck className="h-4 w-4 text-stone" />
              <span>{orderTotals?.shippingName ?? "Tracked Delivery"}</span>
            </div>
          </div>

          {/* Order Totals — the total row is the amount the backend actually charged */}
          {orderTotals && (
            <dl className="mt-6 space-y-2.5 border-t border-line pt-6 text-sm">
              <div className="flex flex-wrap justify-between gap-x-3 gap-y-2">
                <dt className="text-stone">Subtotal</dt>
                <dd className="font-medium text-ink">{formatPrice(orderTotals.subtotal, orderTotals.currency)}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-x-3 gap-y-2">
                <dt className="text-stone">Delivery, Taxes &amp; Savings</dt>
                <dd className="font-medium text-ink">
                  {formatPrice(Math.max(0, orderTotals.total - orderTotals.subtotal), orderTotals.currency)}
                </dd>
              </div>
              <div className="flex flex-wrap justify-between gap-x-3 gap-y-2 border-t border-line pt-3 text-base">
                <dt className="font-medium text-ink">{paymentPending ? "Order Total" : "Total Paid"}</dt>
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
    <div className="checkout-page [overflow-wrap:anywhere] min-h-screen bg-background text-foreground selection:bg-gold selection:text-ink">


      {/* Main 2-Column Checkout Layout */}
      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Left Column: Checkout Form */}
          <div className="min-w-0 lg:col-span-7">
            <form onSubmit={handlePayNow} className="space-y-8">
              {/* Express Checkout section — always visible */}
              <div className="space-y-8">
                <div>
                  <div className="text-center mb-3">
                    <h2 className="font-serif text-lg font-medium text-ink">Express Checkout</h2>
                    <p className="mt-1 text-xs text-stone">
                      Check out faster with an available wallet.
                    </p>
                  </div>
                  <div className="relative min-h-[52px] w-full">
                    {/* Stripe express element stays mounted for recovery */}
                    <div
                      id="stripe-express-element"
                      ref={expressContainerRef}
                      className={cn(
                        "min-h-[52px] w-full transition-opacity duration-200",
                        expressStatus === "available" ? "opacity-100" : "opacity-0 pointer-events-none absolute inset-0",
                      )}
                    />
                    {expressStatus === "loading" && (
                      <div
                        className="absolute inset-0 flex h-[52px] items-center justify-center rounded-[2px] border border-stone/15 bg-[#FAF8F5] animate-pulse"
                        role="status"
                        aria-live="polite"
                      >
                        <span className="mr-2.5 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                        <span className="text-xs text-stone/60">Loading available express payment methods…</span>
                      </div>
                    )}
                    {(expressStatus === "unavailable" || expressStatus === "error") && (
                      <div
                        className="flex h-[52px] items-center justify-center rounded-[2px] border border-dashed border-stone/20 bg-[#FAF8F5]/60"
                        role="status"
                      >
                        <p className="text-xs text-stone/70 text-center px-4">
                          {expressStatus === "error"
                            ? "Express checkout is temporarily unavailable. Please use a payment method below."
                            : "Apple Pay, Google Pay & PayPal wallets will appear here when available on your device."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4" aria-hidden="true">
                  <span className="h-px flex-1 bg-line" />
                  <span className="text-xs uppercase tracking-widest text-stone">OR</span>
                  <span className="h-px flex-1 bg-line" />
                </div>
              </div>

              {/* Step 1: Contact Section */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-y-2 mb-2.5">
                  <h2 className="font-serif text-lg font-medium text-ink flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-ivory text-xs font-mono font-medium">1</span>
                    Contact
                  </h2>
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
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full border border-stone/40 text-xs text-stone cursor-help"
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
                    I&apos;d like to receive privilege updates and private invitations from LETTY.
                  </span>
                </label>
              </div>

              {/* Step 2: Delivery Section */}
              <div>
                <h2 className="font-serif text-lg font-medium text-ink mb-3 flex items-center gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-ivory text-xs font-mono font-medium">2</span>
                  Delivery Address
                </h2>

                <div className="space-y-3">
                  {/* Country / Region Selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                      className="h-14 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 py-1.5 flex flex-wrap items-center justify-between gap-y-2 text-left hover:border-ink/50 transition-colors cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs text-stone uppercase tracking-wider font-medium">Country / Region</span>
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
                      <>
                        <div
                          className="fixed inset-0 z-20 cursor-default"
                          onClick={() => {
                            setCountryDropdownOpen(false);
                            setCountrySearch("");
                          }}
                          aria-hidden="true"
                        />
                        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-hidden rounded-[2px] border border-line bg-white shadow-xl flex flex-col">
                          {/* Search Bar */}
                          <div className="p-2 border-b border-line bg-surface/50 sticky top-0 z-10">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone" />
                              <input
                                type="text"
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                placeholder="Search 240+ countries or code..."
                                autoFocus
                                className="h-8 w-full rounded-[2px] border border-stone/20 bg-white pl-8 pr-2.5 text-xs text-ink placeholder:text-stone/50 focus:border-ink focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Countries List */}
                          <div className="max-h-60 overflow-y-auto p-1 divide-y divide-line/20">
                            {filteredShippingCountries ? (
                              filteredShippingCountries.length === 0 ? (
                                <p className="p-4 text-center text-xs text-stone">No countries matching &ldquo;{countrySearch}&rdquo;</p>
                              ) : (
                                filteredShippingCountries.map((c) => (
                                  <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => {
                                      lastSyncedCountryRef.current = c.name;
                                      setCountry(c.name);
                                      setStoreCountry(c.code);
                                      setCountryDropdownOpen(false);
                                      setCountrySearch("");
                                      setState("");
                                      clearError("state");
                                      if (billingSameAsShipping) {
                                        setBillingCountry(c.name);
                                        setBillingState("");
                                        clearError("billingState");
                                      }
                                      setPhone((prev) => {
                                        if (!prev || prev.trim() === "" || prev.startsWith("+")) {
                                          const currentDigits = prev.replace(/^\+\d+\s*/, "");
                                          return currentDigits ? `${c.dialCode} ${currentDigits}` : `${c.dialCode} `;
                                        }
                                        return `${c.dialCode} ${prev}`;
                                      });
                                    }}
                                    className="flex w-full items-center justify-between px-3 py-2 text-xs text-ink hover:bg-surface rounded-[2px] transition-colors cursor-pointer"
                                  >
                                    <span className="flex min-w-0 flex-1 items-center gap-2">
                                      <CountryFlag code={c.code} name={c.name} flagFallback={c.flag} size="sm" />
                                      <span className="min-w-0 break-words">{c.name}</span>
                                    </span>
                                    <span className="text-stone font-mono text-xs shrink-0 ml-2">{c.currency} ({c.currencySymbol})</span>
                                  </button>
                                ))
                              )
                            ) : (
                              <>
                                <div className="px-3 py-1.5 text-xs font-medium tracking-wider uppercase text-stone/70 bg-surface/30">
                                  Popular Destinations
                                </div>
                                {popularCountries.map((c) => (
                                  <button
                                    key={`pop-${c.code}`}
                                    type="button"
                                    onClick={() => {
                                      lastSyncedCountryRef.current = c.name;
                                      setCountry(c.name);
                                      setStoreCountry(c.code);
                                      setCountryDropdownOpen(false);
                                      setCountrySearch("");
                                      setState("");
                                      clearError("state");
                                      if (billingSameAsShipping) {
                                        setBillingCountry(c.name);
                                        setBillingState("");
                                        clearError("billingState");
                                      }
                                      setPhone((prev) => {
                                        if (!prev || prev.trim() === "" || prev.startsWith("+")) {
                                          const currentDigits = prev.replace(/^\+\d+\s*/, "");
                                          return currentDigits ? `${c.dialCode} ${currentDigits}` : `${c.dialCode} `;
                                        }
                                        return `${c.dialCode} ${prev}`;
                                      });
                                    }}
                                    className="flex w-full items-center justify-between px-3 py-2 text-xs text-ink hover:bg-surface rounded-[2px] transition-colors cursor-pointer"
                                  >
                                    <span className="flex min-w-0 flex-1 items-center gap-2">
                                      <CountryFlag code={c.code} name={c.name} flagFallback={c.flag} size="sm" />
                                      <span className="min-w-0 break-words">{c.name}</span>
                                    </span>
                                    <span className="text-stone font-mono text-xs shrink-0 ml-2">{c.currency} ({c.currencySymbol})</span>
                                  </button>
                                ))}
                                <div className="px-3 py-1.5 text-xs font-medium tracking-wider uppercase text-stone/70 bg-surface/30 mt-1">
                                  All Countries ({COUNTRIES.length})
                                </div>
                                {COUNTRIES.map((c) => (
                                  <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => {
                                      lastSyncedCountryRef.current = c.name;
                                      setCountry(c.name);
                                      setStoreCountry(c.code);
                                      setCountryDropdownOpen(false);
                                      setCountrySearch("");
                                      setState("");
                                      clearError("state");
                                      if (billingSameAsShipping) {
                                        setBillingCountry(c.name);
                                        setBillingState("");
                                        clearError("billingState");
                                      }
                                      setPhone((prev) => {
                                        if (!prev || prev.trim() === "" || prev.startsWith("+")) {
                                          const currentDigits = prev.replace(/^\+\d+\s*/, "");
                                          return currentDigits ? `${c.dialCode} ${currentDigits}` : `${c.dialCode} `;
                                        }
                                        return `${c.dialCode} ${prev}`;
                                      });
                                    }}
                                    className="flex w-full items-center justify-between px-3 py-2 text-xs text-ink hover:bg-surface rounded-[2px] transition-colors cursor-pointer"
                                  >
                                    <span className="flex min-w-0 flex-1 items-center gap-2">
                                      <CountryFlag code={c.code} name={c.name} flagFallback={c.flag} size="sm" />
                                      <span className="min-w-0 break-words">{c.name}</span>
                                    </span>
                                    <span className="text-stone font-mono text-xs shrink-0 ml-2">{c.currency} ({c.currencySymbol})</span>
                                  </button>
                                ))}
                              </>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
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

                  {/* Address with Live Autocomplete Suggestions */}
                  <div>
                    <AddressAutocomplete
                      id="address"
                      placeholder="Address (start typing for suggestions)"
                      value={address}
                      country={country}
                      onChange={(val) => {
                        clearError("address");
                        setAddress(val);
                      }}
                      onSelectSuggestion={(sug) => {
                        clearError("address");
                        setAddress(sug.streetLine);
                        if (sug.city) {
                          clearError("city");
                          setCity(sug.city);
                        }
                        if (sug.postalCode) {
                          clearError("postalCode");
                          setPostalCode(sug.postalCode.toUpperCase());
                        }
                        if (sug.state) {
                          clearError("state");
                          setState(sug.state);
                        }
                        toast.success("Delivery address selected", {
                          description: sug.formatted,
                        });
                      }}
                      error={fieldErrors.address}
                    />
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

                  {/* City, State/Province, & Postal Code */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      <SubdivisionSelect
                        id="state"
                        country={country}
                        value={state}
                        onChange={(val) => {
                          clearError("state");
                          setState(val);
                        }}
                        error={fieldErrors.state}
                      />
                    </div>
                    <div>
                      <Input
                        id="postalCode"
                        autoComplete="postal-code"
                        placeholder={isShippingPostalRequired ? "Postal code / ZIP" : "Postal code (optional)"}
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
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full border border-stone/40 text-xs text-stone cursor-help"
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

              {/* Step 3: Tracked Shipping */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-y-2 mb-3">
                  <h2 className="font-serif text-lg font-medium text-ink flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-ivory text-xs font-mono font-medium">3</span>
                    Tracked Shipping
                  </h2>
                  <span className="text-xs uppercase font-mono tracking-wider text-stone/70">
                    {destInfo.flag} {selectedCountryInfo.name}
                  </span>
                </div>

                {deliveryDetailsComplete ? (
                  <div className="border border-ink/30 bg-surface/80 rounded-[2px] p-4 flex flex-wrap items-center justify-between gap-y-2 transition-all shadow-2xs">
                    <div>
                      <p className="text-medium text-sm text-ink flex flex-wrap items-center gap-2">
                        <span>{destInfo.flag}</span>
                        <span>Standard Tracked Shipping</span>
                        <span className="text-xs uppercase font-mono tracking-wider bg-secondary border border-line px-1.5 py-0.5 rounded text-stone">
                          {destInfo.label}
                        </span>
                      </p>
                      <p className="text-xs text-stone mt-0.5">
                        Delivered to {selectedCountryInfo.name} within {destInfo.deliveryTime}.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-medium text-ink block">
                        {convertedShippingCost === 0 ? (
                          <span className="text-emerald-700 font-sans font-medium uppercase text-xs">Complimentary</span>
                        ) : (
                          formatPrice(convertedShippingCost, selected.currency)
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="border border-stone/20 bg-surface/40 rounded-[2px] p-4">
                    <p className="text-sm text-stone">
                      Enter your delivery details above to see your shipping rate and delivery
                      estimate.
                    </p>
                  </div>
                )}
              </div>

              {/* Step 4: Payment Section (Stripe Payment Element) */}
              <div className="space-y-4">
                <div>
                  <h2 className="font-serif text-lg font-medium text-ink flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-ivory text-xs font-mono font-medium">4</span>
                    Payment
                  </h2>
                  <p className="mt-1 text-xs text-stone">
                    All transactions are secure and encrypted.
                  </p>
                </div>

                {/* Payment Element (Interactive Accordion Radio Selector) */}
                <div className="space-y-4">
                  <div className="relative min-h-[50px]">
                    <div
                      id="stripe-payment-element"
                      ref={paymentContainerRef}
                      className={cn(
                        "w-full rounded-[2px] transition-opacity duration-200",
                        stripeMounted ? "opacity-100" : "opacity-0 h-0 overflow-hidden",
                      )}
                    />
                    {!stripeMounted && (
                      <div className="flex items-center justify-center py-5 text-xs text-stone/60 bg-[#FAF8F5] border border-stone/15 rounded-[2px] animate-pulse">
                        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink border-t-transparent mr-2.5" />
                        Securing payment gateway...
                      </div>
                    )}
                  </div>
                  {(stripePaymentError || fieldErrors.payment) && (
                    <p role="alert" className="text-xs text-red-600 font-medium mt-1.5">
                      {stripePaymentError || fieldErrors.payment}
                    </p>
                  )}

                  {/* Name on Card */}
                  <div>
                    <Label htmlFor="cardName" className="text-xs font-medium uppercase tracking-wider text-stone mb-1.5 block">
                      Name on Card
                    </Label>
                    <Input
                      id="cardName"
                      name="cardholderName"
                      autoComplete="off"
                      data-lpignore="true"
                      data-form-type="other"
                      placeholder="Name as it appears on your card"
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
              </div>

              {/* Step 5: Billing Address Section */}
              <div>
                <h2 className="font-serif text-lg font-medium text-ink mb-3 flex items-center gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-ivory text-xs font-mono font-medium">5</span>
                  Billing Address
                </h2>

                <label className="flex items-center gap-2.5 text-xs text-stone cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={billingSameAsShipping}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setBillingSameAsShipping(checked);
                      if (checked) {
                        clearError("billingFirstName");
                        clearError("billingLastName");
                        clearError("billingAddress");
                        clearError("billingCity");
                        clearError("billingState");
                        clearError("billingPostalCode");
                      } else {
                        if (!billingCountry || billingCountry === "United Kingdom") {
                          setBillingCountry(country);
                        }
                      }
                    }}
                    className="h-4 w-4 rounded-[2px] border-stone/20 text-ink accent-ink focus:ring-0"
                  />
                  <span className="font-medium text-ink">Use shipping address as billing address</span>
                </label>

                {!billingSameAsShipping && (
                  <div className="mt-3 p-3.5 border border-stone/20 rounded-[2px] bg-surface/40 space-y-3">
                    {/* Billing Country / Region Selector */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setBillingCountryDropdownOpen(!billingCountryDropdownOpen)}
                        className="h-12 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 py-1.5 flex flex-wrap items-center justify-between gap-y-2 text-left hover:border-ink/50 transition-colors cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-stone uppercase tracking-wider font-medium">Billing Country / Region</span>
                          <span className="text-xs font-medium text-ink flex items-center gap-2">
                            <CountryFlag
                              code={selectedBillingCountryInfo.code}
                              name={selectedBillingCountryInfo.name}
                              flagFallback={selectedBillingCountryInfo.flag}
                              size="xs"
                            />
                            <span>{selectedBillingCountryInfo.name}</span>
                          </span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-stone shrink-0" />
                      </button>

                      {billingCountryDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-20 cursor-default"
                            onClick={() => {
                              setBillingCountryDropdownOpen(false);
                              setBillingCountrySearch("");
                            }}
                            aria-hidden="true"
                          />
                          <div className="absolute z-30 mt-1 max-h-72 w-full overflow-hidden rounded-[2px] border border-line bg-white shadow-xl flex flex-col">
                            {/* Search Bar */}
                            <div className="p-2 border-b border-line bg-surface/50 sticky top-0 z-10">
                              <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone" />
                                <input
                                  type="text"
                                  value={billingCountrySearch}
                                  onChange={(e) => setBillingCountrySearch(e.target.value)}
                                  placeholder="Search 240+ countries or code..."
                                  autoFocus
                                  className="h-8 w-full rounded-[2px] border border-stone/20 bg-white pl-8 pr-2.5 text-xs text-ink placeholder:text-stone/50 focus:border-ink focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Countries List */}
                            <div className="max-h-60 overflow-y-auto p-1 divide-y divide-line/20">
                              {filteredBillingCountries ? (
                                filteredBillingCountries.length === 0 ? (
                                  <p className="p-4 text-center text-xs text-stone">No countries matching &ldquo;{billingCountrySearch}&rdquo;</p>
                                ) : (
                                  filteredBillingCountries.map((c) => (
                                    <button
                                      key={c.code}
                                      type="button"
                                      onClick={() => {
                                        setBillingCountry(c.name);
                                        setBillingCountryDropdownOpen(false);
                                        setBillingCountrySearch("");
                                        setBillingState("");
                                        clearError("billingState");
                                      }}
                                      className="flex w-full items-center justify-between px-3 py-2 text-xs text-ink hover:bg-surface rounded-[2px] transition-colors cursor-pointer"
                                    >
                                      <span className="flex min-w-0 flex-1 items-center gap-2">
                                        <CountryFlag code={c.code} name={c.name} flagFallback={c.flag} size="sm" />
                                        <span className="min-w-0 break-words">{c.name}</span>
                                      </span>
                                      <span className="text-stone font-mono text-xs shrink-0 ml-2">{c.currency} ({c.currencySymbol})</span>
                                    </button>
                                  ))
                                )
                              ) : (
                                <>
                                  <div className="px-3 py-1.5 text-xs font-medium tracking-wider uppercase text-stone/70 bg-surface/30">
                                    Popular Destinations
                                  </div>
                                  {popularCountries.map((c) => (
                                    <button
                                      key={`bill-pop-${c.code}`}
                                      type="button"
                                      onClick={() => {
                                        setBillingCountry(c.name);
                                        setBillingCountryDropdownOpen(false);
                                        setBillingCountrySearch("");
                                        setBillingState("");
                                        clearError("billingState");
                                      }}
                                      className="flex w-full items-center justify-between px-3 py-2 text-xs text-ink hover:bg-surface rounded-[2px] transition-colors cursor-pointer"
                                    >
                                      <span className="flex min-w-0 flex-1 items-center gap-2">
                                        <CountryFlag code={c.code} name={c.name} flagFallback={c.flag} size="sm" />
                                        <span className="min-w-0 break-words">{c.name}</span>
                                      </span>
                                      <span className="text-stone font-mono text-xs shrink-0 ml-2">{c.currency} ({c.currencySymbol})</span>
                                    </button>
                                  ))}
                                  <div className="px-3 py-1.5 text-xs font-medium tracking-wider uppercase text-stone/70 bg-surface/30 mt-1">
                                    All Countries ({COUNTRIES.length})
                                  </div>
                                  {COUNTRIES.map((c) => (
                                    <button
                                      key={c.code}
                                      type="button"
                                      onClick={() => {
                                        setBillingCountry(c.name);
                                        setBillingCountryDropdownOpen(false);
                                        setBillingCountrySearch("");
                                        setBillingState("");
                                        clearError("billingState");
                                      }}
                                      className="flex w-full items-center justify-between px-3 py-2 text-xs text-ink hover:bg-surface rounded-[2px] transition-colors cursor-pointer"
                                    >
                                      <span className="flex min-w-0 flex-1 items-center gap-2">
                                        <CountryFlag code={c.code} name={c.name} flagFallback={c.flag} size="sm" />
                                        <span className="min-w-0 break-words">{c.name}</span>
                                      </span>
                                      <span className="text-stone font-mono text-xs shrink-0 ml-2">{c.currency} ({c.currencySymbol})</span>
                                    </button>
                                  ))}
                                </>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
                      <div>
                        <Input
                          id="billingFirstName"
                          autoComplete="billing given-name"
                          placeholder="First name"
                          value={billingFirstName}
                          onChange={(e) => {
                            clearError("billingFirstName");
                            setBillingFirstName(e.target.value);
                          }}
                          className="h-11 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink"
                        />
                        {renderFieldError("billingFirstName")}
                      </div>
                      <div>
                        <Input
                          id="billingLastName"
                          autoComplete="billing family-name"
                          placeholder="Last name"
                          value={billingLastName}
                          onChange={(e) => {
                            clearError("billingLastName");
                            setBillingLastName(e.target.value);
                          }}
                          className="h-11 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink"
                        />
                        {renderFieldError("billingLastName")}
                      </div>
                    </div>
                    {/* Billing Address with Autocomplete */}
                    <div>
                      <AddressAutocomplete
                        id="billingAddress"
                        placeholder="Billing address"
                        value={billingAddress}
                        country={billingCountry}
                        onChange={(val) => {
                          clearError("billingAddress");
                          setBillingAddress(val);
                        }}
                        onSelectSuggestion={(sug) => {
                          clearError("billingAddress");
                          setBillingAddress(sug.streetLine);
                          if (sug.city) {
                            clearError("billingCity");
                            setBillingCity(sug.city);
                          }
                          if (sug.postalCode) {
                            clearError("billingPostalCode");
                            setBillingPostalCode(sug.postalCode.toUpperCase());
                          }
                          if (sug.state) {
                            clearError("billingState");
                            setBillingState(sug.state);
                          }
                        }}
                        error={fieldErrors.billingAddress}
                      />
                    </div>
                    <div>
                      <Input
                        id="billingApartment"
                        autoComplete="billing address-line2"
                        placeholder="Apartment, suite, etc. (optional)"
                        value={billingApartment}
                        onChange={(e) => setBillingApartment(e.target.value)}
                        className="h-11 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Input
                          id="billingCity"
                          autoComplete="billing address-level2"
                          placeholder="City"
                          value={billingCity}
                          onChange={(e) => {
                            clearError("billingCity");
                            setBillingCity(e.target.value);
                          }}
                          className="h-11 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink"
                        />
                        {renderFieldError("billingCity")}
                      </div>
                      <div>
                        <SubdivisionSelect
                          id="billingState"
                          country={billingCountry}
                          value={billingState}
                          autoComplete="billing address-level1"
                          onChange={(val) => {
                            clearError("billingState");
                            setBillingState(val);
                          }}
                          error={fieldErrors.billingState}
                        />
                      </div>
                      <div>
                        <Input
                          id="billingPostalCode"
                          autoComplete="billing postal-code"
                          placeholder={isBillingPostalRequired ? "Postal code / ZIP" : "Postal code (optional)"}
                          value={billingPostalCode}
                          onChange={(e) => {
                            clearError("billingPostalCode");
                            setBillingPostalCode(e.target.value.toUpperCase());
                          }}
                          className="h-11 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink"
                        />
                        {renderFieldError("billingPostalCode")}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Order Summary (rendered below Billing Address for mobile devices) */}
              <div className="lg:hidden border border-line rounded-[2px] bg-surface/40 p-4 sm:p-5 space-y-4">
                <button
                  type="button"
                  onClick={() => setSummaryExpanded(!summaryExpanded)}
                  className="flex w-full items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-stone" />
                    <h2 className="font-serif text-lg font-medium text-ink">Order Summary</h2>
                    <span className="text-xs text-stone font-normal">
                      ({detailedLines.length} {detailedLines.length === 1 ? "item" : "items"})
                    </span>
                  </div>
                  <ChevronDown className={cn("h-5 w-5 text-stone group-hover:text-ink transition-all duration-200", summaryExpanded && "rotate-180")} />
                </button>

                {summaryExpanded && (
                  <ul className="divide-y divide-line/60 rounded-[2px] border border-line bg-white/70 px-3.5 py-1">
                    {detailedLines.map((line) => (
                      <li key={line.variantId} className="py-3 flex flex-wrap items-center justify-between gap-y-2 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative h-14 w-14 rounded-[2px] border border-line shrink-0 bg-white">
                            <div className="relative h-full w-full rounded-[2px] overflow-hidden">
                              <LettyImage
                                imageKey={line.product.media[0]?.imageKey ?? "productLipstick"}
                                alt={line.product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <span className="absolute -top-1.5 -right-1.5 h-4.5 min-w-4.5 px-1 rounded-full bg-ink text-ivory text-xs font-mono flex items-center justify-center shadow-xs">
                              {line.quantity}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-serif text-xs font-medium text-ink break-words">{line.product.name}</p>
                            <p className="text-xs text-stone break-words">
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
                )}

                {/* Mobile Discount / Voucher Code */}
                <div className="flex gap-2">
                  <Input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyCoupon(e);
                      }
                    }}
                    placeholder="Discount / Voucher code"
                    className="h-11 min-w-0 flex-1 rounded-[2px] border border-stone/20 bg-white px-3.5 text-xs text-ink placeholder:text-stone/40 focus:border-ink uppercase tracking-wide"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={validatingCoupon}
                    className="h-11 px-4 rounded-[2px] border border-stone/20 bg-surface hover:bg-stone/10 text-xs font-medium uppercase tracking-widest text-ink transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {validatingCoupon ? "..." : "Apply"}
                  </button>
                </div>

                {coupon && (
                  <p className="inline-flex max-w-full flex-wrap items-center gap-1.5 text-xs text-ink bg-white border border-line px-2.5 py-1">
                    <Tag className="h-3 w-3 text-gold" />
                    <span className="font-mono font-medium">{coupon}</span> ({appliedCouponInfo?.label ?? "Promo applied"})
                    <button type="button" onClick={removeCoupon} className="ml-1 text-stone hover:text-ink cursor-pointer">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </p>
                )}

                {/* Mobile Pricing Breakdown */}
                <dl className="space-y-2 pt-3 border-t border-line text-xs">
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-2 text-stone">
                    <dt>Subtotal</dt>
                    <dd className="font-mono font-medium text-ink">{formatPrice(convertedSubtotal, selected.currency)}</dd>
                  </div>
                  {discount > 0 && (
                    <div className="flex flex-wrap justify-between gap-x-3 gap-y-2 text-emerald-800">
                      <dt>Discount ({coupon})</dt>
                      <dd className="font-mono font-medium">−{formatPrice(convertedDiscount, selected.currency)}</dd>
                    </div>
                  )}
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-2 items-start text-stone">
                    <div>
                      <dt className="flex items-center gap-1.5">
                        <span>Shipping</span>
                        <span className="text-xs text-stone/80 font-normal">
                          ({selectedCountryInfo.flag} {selectedCountryInfo.name})
                        </span>
                      </dt>
                      {!deliveryDetailsComplete && (
                        <p className="text-xs text-stone/60 font-sans font-normal mt-0.5">
                          Calculated after delivery details
                        </p>
                      )}
                    </div>
                    <dd className="font-mono font-medium text-ink text-right">
                      {!deliveryDetailsComplete ? (
                        <span className="text-stone">—</span>
                      ) : convertedShippingCost === 0 ? (
                        <span className="text-emerald-700 font-sans font-medium uppercase text-xs">Complimentary</span>
                      ) : (
                        formatPrice(convertedShippingCost, selected.currency)
                      )}
                    </dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-2 items-baseline pt-3 border-t border-line text-sm font-medium text-ink">
                    <div>
                      <dt className="font-serif">Total</dt>
                      <p className="text-xs text-stone/70 font-sans font-normal">
                        {deliveryDetailsComplete
                          ? `Includes delivery to ${selectedCountryInfo.name}`
                          : "Delivery calculated after your details"}
                      </p>
                    </div>
                    <dd className="flex items-baseline gap-1">
                      <span className="text-xs font-normal text-stone uppercase">{selected.currency}</span>
                      <span className="font-serif text-lg font-medium">{formatPrice(estimatedTotal, selected.currency)}</span>
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Legal Acceptance Text & CONTINUE Button */}
              <div className="mt-6 space-y-4">
                {(paymentError || stripePaymentError) && (
                  <div className="p-3.5 border border-red-300 bg-red-50 text-center text-xs font-medium text-red-800 rounded-[2px]">
                    {paymentError || stripePaymentError}
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

                <div className="pt-2">

                  {/* LETTY Theme Luxury Primary Action Button */}
                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full h-13 rounded-none sm:rounded-[2px] bg-ink hover:bg-stone active:scale-[0.99] text-ivory font-medium text-xs tracking-[0.22em] uppercase transition-all shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ivory border-t-transparent" />
                      PROCESSING PAYMENT...
                    </span>
                  ) : (
                    "PAY NOW"
                  )}
                </button>

                  <div className="pt-3 flex flex-col items-center justify-center gap-2 text-center">
                    <div className="flex flex-wrap items-center justify-center gap-1.5 text-stone text-xs">
                      <ShieldCheck className="h-3.5 w-3.5 text-gold" />
                      <span>Guaranteed safe &amp; secure checkout powered by</span>
                      <div className="relative h-4 w-10 inline-block">
                        <Image
                          src="/ima/stripe_logo.png"
                          alt="Stripe"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                    <Link
                      href="/privacy"
                      className="text-xs font-medium uppercase tracking-widest text-stone/70 hover:text-ink underline transition-colors"
                    >
                      COOKIE PREFERENCES
                    </Link>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary (Shopify-Style Structure in LETTY Theme) */}
          <aside className="hidden min-w-0 lg:block lg:col-span-5">
            <div className="sticky top-24 space-y-6 lg:pl-8 lg:border-l lg:border-line">
              {/* Order Summary Header with collapsible toggle */}
              <button
                type="button"
                onClick={() => setDesktopSummaryExpanded(!desktopSummaryExpanded)}
                className="flex w-full items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-lg font-medium text-ink">Order Summary</h2>
                  <span className="text-xs text-stone font-normal">
                    ({detailedLines.length} {detailedLines.length === 1 ? "item" : "items"})
                  </span>
                </div>
                <ChevronDown className={cn("h-5 w-5 text-stone group-hover:text-ink transition-all duration-200", desktopSummaryExpanded && "rotate-180")} />
              </button>

              {/* Collapsible product list + discount code */}
              {desktopSummaryExpanded && (
                <>
              {/* Product Line Items with Circle Count Badge */}
              <ul className="divide-y divide-line">
                {detailedLines.map((line) => (
                  <li key={line.variantId} className="py-4 flex flex-wrap items-center justify-between gap-y-2 gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Product Thumbnail with Circular Quantity Badge */}
                      <div className="relative h-16 w-16 rounded-[2px] border border-line shrink-0 bg-white">
                        <div className="relative h-full w-full rounded-[2px] overflow-hidden">
                          <LettyImage
                            imageKey={line.product.media[0]?.imageKey ?? "productLipstick"}
                            alt={line.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-ink text-ivory text-xs font-mono flex items-center justify-center shadow-xs">
                          {line.quantity}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="font-serif text-sm font-medium text-ink leading-snug break-words">
                          {line.product.name}
                        </p>
                        <p className="text-xs text-stone break-words mt-0.5">
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
                  className="h-11 min-w-0 flex-1 rounded-[2px] border border-stone/20 bg-white px-3.5 text-xs text-ink placeholder:text-stone/40 focus:border-ink uppercase tracking-wide"
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
                <p className="inline-flex max-w-full flex-wrap items-center gap-1.5 text-xs text-ink bg-surface border border-line px-2.5 py-1">
                  <Tag className="h-3 w-3 text-gold" />
                  <span className="font-mono font-medium">{coupon}</span> ({appliedCouponInfo?.label ?? "Promo applied"})
                  <button type="button" onClick={removeCoupon} className="ml-1 text-stone hover:text-ink cursor-pointer">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </p>
              )}

              {/* Pricing Breakdown */}
              </>)}

              {/* Pricing Breakdown — always visible */}
              <dl className="space-y-3 pt-3 border-t border-line text-sm">
                <div className="flex flex-wrap justify-between gap-x-3 gap-y-2 text-stone">
                  <dt className="font-medium">Subtotal</dt>
                  <dd className="font-mono font-medium text-ink">
                    {formatPrice(convertedSubtotal, selected.currency)}
                  </dd>
                </div>

                {discount > 0 && (
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-2 text-emerald-800">
                    <dt>Discount ({coupon})</dt>
                    <dd className="font-mono font-medium">
                      −{formatPrice(convertedDiscount, selected.currency)}
                    </dd>
                  </div>
                )}

                <div className="flex flex-wrap justify-between gap-x-3 gap-y-2 items-start text-stone">
                  <div>
                    <dt className="font-medium flex items-center gap-1.5">
                      <span>Shipping</span>
                      <span className="text-xs text-stone/80 font-normal">
                        ({selectedCountryInfo.flag} {selectedCountryInfo.name})
                      </span>
                    </dt>
                    {!deliveryDetailsComplete && (
                      <p className="text-xs text-stone/60 font-sans font-normal mt-0.5">
                        Calculated after delivery details
                      </p>
                    )}
                  </div>
                  <dd className="font-mono font-medium text-ink text-right">
                    {!deliveryDetailsComplete ? (
                      <span className="text-stone">—</span>
                    ) : convertedShippingCost === 0 ? (
                      <span className="text-emerald-700 font-sans font-medium uppercase text-xs">Complimentary</span>
                    ) : (
                      formatPrice(convertedShippingCost, selected.currency)
                    )}
                  </dd>
                </div>

                <div className="flex flex-wrap justify-between gap-x-3 gap-y-2 items-baseline pt-4 border-t border-line">
                  <div>
                    <dt className="font-serif text-base font-medium text-ink">Total</dt>
                    <p className="text-xs text-stone/70 font-sans font-normal mt-0.5">
                      {deliveryDetailsComplete
                        ? `Includes delivery to ${selectedCountryInfo.name}`
                        : "Delivery calculated after your details"}
                    </p>
                  </div>
                  <dd className="flex items-baseline gap-1.5 font-medium text-ink">
                    <span className="text-xs font-normal text-stone uppercase">{selected.currency}</span>
                    <span className="font-serif text-2xl font-medium">{formatPrice(estimatedTotal, selected.currency)}</span>
                  </dd>
                </div>
              </dl>


            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
