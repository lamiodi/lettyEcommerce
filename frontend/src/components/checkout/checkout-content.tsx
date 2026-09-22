"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Lock,
  Package,
  Search,
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
} from "@/lib/constants";
import { useCartStore } from "@/lib/store/cart";
import { cn, formatPrice } from "@/lib/utils";
import { CountryFlag } from "@/components/ui/country-flag";
import { COUNTRIES } from "@/lib/data/countries";
import { useCurrencyStore } from "@/lib/store/currency";
import { SubdivisionSelect } from "@/components/checkout/subdivision-select";
import { getSubdivisionConfig } from "@/lib/data/subdivisions";
import { AddressAutocomplete } from "@/components/checkout/address-autocomplete";
import type { CartLineDetailed } from "@/types";

/**
 * Checkout runs in two phases:
 *
 *  1. "form"      — customer details are collected and submitted to the backend
 *                   `/api/checkout/init`, which prices the cart server-side,
 *                   reserves inventory and creates the Stripe PaymentIntent.
 *  2. "payment"   — Stripe Express Checkout + Payment Element are mounted from
 *                   the server-issued clientSecret. The amount charged is
 *                   therefore fixed by the backend, never by this client.
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
  const [initializing, setInitializing] = useState(false);
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
  const [expressReady, setExpressReady] = useState(false);
  /** null = still detecting; true = at least one wallet button; false = none. */
  const [expressHasWallets, setExpressHasWallets] = useState<boolean | null>(null);
  const [expressUnavailable, setExpressUnavailable] = useState(false);

  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const paymentElementRef = useRef<StripePaymentElement | null>(null);
  const expressElementRef = useRef<StripeExpressCheckoutElement | null>(null);
  const paymentContainerRef = useRef<HTMLDivElement | null>(null);
  const expressContainerRef = useRef<HTMLDivElement | null>(null);
  const isMountingRef = useRef(false);

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

            // Confirmation fallback in case the webhook has not completed yet —
            // the backend verifies the PaymentIntent with Stripe before
            // trusting it, so this call cannot forge a paid state.
            const paymentIntentId = params?.get("payment_intent");
            if (paymentIntentId) {
              fetch("/api/checkout/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: data.orderIdUuid,
                  paymentIntentId,
                }),
              }).catch(() => {});
            }
          }
        }
      }
    } catch {}
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
  const convertedShippingCost = isEuropeEur
    ? rawShippingCost
    : convertPrice(rawShippingCost, selected.currency);

  const isAddressFilled = Boolean(
    address.trim().length >= 3 && city.trim().length >= 2
  );

  // Client-side estimate shown while collecting details. The charged amount is
  // whatever the backend returns after pricing the cart itself.
  const estimatedTotal =
    Math.max(0, convertedSubtotal - convertedDiscount) +
    (isAddressFilled ? convertedShippingCost : 0);

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

  const handleContinueToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initializing) return;

    const errors = validateForm();
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

    setInitializing(true);
    setPaymentError(null);

    const cleanedPhone = phone && phone.replace(/^\+\d+\s*$/, "").trim() ? phone.trim() : undefined;

    try {
      // Only variant ids + quantities are sent. The backend prices every line
      // from the database, so no client-computed amount can influence the charge.
      const res = await fetch("/api/checkout/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          cart: lines.map((l) => ({
            variant_id: l.variantId,
            quantity: l.quantity,
          })),
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
            state: state.trim() || city,
            country: selectedCountryInfo.code,
            postal_code: postalCode,
            is_default_shipping: saveInfo,
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
                state: billingState.trim() || billingCity,
                country: selectedBillingCountryInfo.code,
                postal_code: billingPostalCode,
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

      const init = (await res.json()) as { data?: Record<string, any> };
      const initData = init?.data ?? {};
      const orderUuid = initData.order_id || initData.orderId;
      const orderNum = initData.orderNumber || initData.order_number;
      const cSecret = initData.clientSecret || initData.client_secret;

      if (!orderUuid || !cSecret) {
        throw new Error("The payment gateway did not return an authorization secret. Please try again.");
      }

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

      // Pre-cache order details in case 3D Secure triggers a page redirect
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
      setActiveOrder({
        orderId: orderUuid,
        orderNumber: orderNum,
        clientSecret: cSecret,
        amount: Number(initData.amount) || estimatedTotal,
        currency: String(initData.currency || selected.currency),
      });
      setStep("payment");
    } catch (err: any) {
      const message = err.message ?? "We could not start your checkout. Please try again.";
      setPaymentError(message);
      toast.error(message);
    } finally {
      setInitializing(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Phase 2: Express Checkout + Payment Element on server intent      */
  /* ---------------------------------------------------------------- */

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
    setStripeMounted(false);
    setExpressReady(false);
    setExpressHasWallets(null);
    setExpressUnavailable(false);
  }, []);

  const backToForm = () => {
    teardownElements();
    setActiveOrder(null);
    setStep("form");
  };

  // Shared confirmation result handling for the Pay button and wallet buttons.
  const processConfirmResult = useCallback(
    async (
      error: unknown,
      paymentIntent: { id: string; status?: string } | undefined,
    ) => {
      const err = error as
        | { message?: string; payment_intent?: { id: string; status?: string } }
        | undefined;

      // A "payment unexpected state" error usually means the wallet flow
      // already confirmed the intent — trust it only if it now reads succeeded.
      const intent = paymentIntent ?? err?.payment_intent;

      if (intent && (intent.status === "succeeded" || intent.status === "processing")) {
        // Tell the backend to verify with Stripe and mark the order paid.
        fetch("/api/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: activeOrder?.orderId,
            paymentIntentId: intent.id,
          }),
        }).catch(() => {});

        clearCart();
        setOrderId(activeOrder?.orderNumber ?? null);
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
        toast.success("Order confirmed — payment successfully processed via Stripe.");
        return;
      }

      const message =
        err?.message ||
        (intent?.status === "requires_payment_method"
          ? "Payment was not completed. Please review your payment details."
          : "Payment authorization was not completed.");
      setPaymentError(message);
      setStripePaymentError(message);
      setStep("payment");
    },
    [activeOrder, clearCart, email, subscribe],
  );

  const confirmWithStripe = useCallback(
    async (expressEvent?: StripeExpressCheckoutElementConfirmEvent) => {
      const stripe = stripeRef.current;
      const elements = elementsRef.current;
      const currentOrder = activeOrder;
      if (!stripe || !elements || !currentOrder) {
        expressEvent?.paymentFailed?.({ reason: "fail", message: "Payment is still initializing." });
        setPaymentError("Payment processor could not be initialized. Please go back and try again.");
        setStep("payment");
        return;
      }

      setStep("processing");
      setPaymentError(null);
      setStripePaymentError(null);

      // Wallet sheets (Apple Pay / Google Pay / Link) carry the billing
      // details the shopper just confirmed — prefer them over form fields.
      const w = expressEvent?.billingDetails;
      const formName = cardName || `${firstName} ${lastName}`.trim();

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret: currentOrder.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout?status=success`,
          payment_method_data: {
            billing_details: {
              name: w?.name || formName,
              email: w?.email || email.trim(),
              ...(w?.phone || phone
                ? { phone: (w?.phone || phone.replace(/^\+\d+\s*$/, "")).trim() }
                : {}),
              address: w?.address
                ? {
                    line1: w.address.line1 || (billingSameAsShipping ? address : billingAddress),
                    line2: w.address.line2 || (billingSameAsShipping ? apartment : billingApartment),
                    city: w.address.city || (billingSameAsShipping ? city : billingCity),
                    state: w.address.state || (billingSameAsShipping ? state.trim() || city : billingState.trim() || billingCity),
                    postal_code: w.address.postal_code || (billingSameAsShipping ? postalCode : billingPostalCode).trim() || undefined,
                    country: w.address.country || (billingSameAsShipping ? selectedCountryInfo.code : selectedBillingCountryInfo.code),
                  }
                : {
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

      if (error) {
        // Surface the failure inside the wallet sheet, not just the page.
        expressEvent?.paymentFailed?.({ reason: "fail", message: error.message });
      }

      await processConfirmResult(error, paymentIntent);
    },
    [
      activeOrder,
      address,
      apartment,
      billingAddress,
      billingApartment,
      billingCity,
      billingCountry,
      billingPostalCode,
      billingSameAsShipping,
      billingState,
      cardName,
      city,
      email,
      firstName,
      lastName,
      phone,
      postalCode,
      processConfirmResult,
      selectedBillingCountryInfo.code,
      selectedCountryInfo.code,
      state,
    ],
  );

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "processing") return;

    if (!cardName.trim()) {
      setFieldErrors((prev) => ({ ...prev, cardName: "Name on card is required" }));
      return;
    }

    if (!elementsRef.current) {
      setFieldErrors((prev) => ({
        ...prev,
        payment: "Payment element is still initializing. Please wait a moment.",
      }));
      return;
    }

    setStep("processing");
    const { error: submitError } = await elementsRef.current.submit();
    if (submitError) {
      setFieldErrors((prev) => ({
        ...prev,
        payment: submitError.message || "Please complete payment details.",
      }));
      setStripePaymentError(submitError.message || "Please complete payment details.");
      setStep("payment");
      return;
    }

    await confirmWithStripe();
  };

  // Mount Express Checkout + Payment Element once the payment phase renders.
  useEffect(() => {
    if (step !== "payment" || !activeOrder) return;
    if (paymentElementRef.current || isMountingRef.current) return;
    if (!paymentContainerRef.current || !expressContainerRef.current) return;
    isMountingRef.current = true;

    const clientSecret = activeOrder.clientSecret;

    (async () => {
      const promise = getStripePromise();
      if (!promise) {
        isMountingRef.current = false;
        setStripePaymentError(
          "Payment configuration error: Stripe publishable key is missing. Please contact support.",
        );
        return;
      }
      try {
        const stripe = await promise;
        if (!stripe || !paymentContainerRef.current || !expressContainerRef.current) {
          isMountingRef.current = false;
          return;
        }
        stripeRef.current = stripe;

        const elements = stripe.elements({
          clientSecret,
          appearance: STRIPE_APPEARANCE,
          loader: "auto",
        });
        elementsRef.current = elements;

        // Express Checkout (Apple Pay / Google Pay / Link). The amount charged
        // comes from the PaymentIntent created by the backend.
        const expressElement = elements.create("expressCheckout", {
          buttonHeight: 48,
          buttonTheme: {
            applePay: "black",
            googlePay: "black",
          },
        });
        expressElement.on("ready", (event) => {
          // availablePaymentMethods is undefined when no wallet can show on
          // this device/browser — collapse the section instead of leaving a
          // blank strip above the card form.
          const apm = event.availablePaymentMethods;
          setExpressHasWallets(Boolean(apm && Object.values(apm).some(Boolean)));
          setExpressReady(true);
        });
        expressElement.on("loaderror", () => setExpressUnavailable(true));
        expressElement.on("cancel", () => setStep("payment"));
        expressElement.on("confirm", (event) => {
          void confirmWithStripe(event);
        });
        expressElement.mount(expressContainerRef.current);
        expressElementRef.current = expressElement;

        // Card / bank payment methods
        const paymentElement = elements.create("payment", {
          layout: "tabs",
          fields: {
            billingDetails: {
              name: "never",
              email: "never",
              phone: "never",
              address: "never",
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
        setStripePaymentError(
          e?.message || "Failed to initialize the payment form. Please check your network connection.",
        );
      }
    })();
  }, [step, activeOrder, cardName, email, firstName, lastName, confirmWithStripe]);

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
                        imageKey={line.product.media[0]?.imageKey ?? "productLipstick"}
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
              {city}{state ? `, ${state}` : ""}{postalCode ? ` ${postalCode}` : ""}, {country}
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

          {/* Order Totals — the total row is the amount the backend actually charged */}
          {orderTotals && (
            <dl className="mt-6 space-y-2.5 border-t border-line pt-6 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone">Subtotal</dt>
                <dd className="font-medium text-ink">{formatPrice(orderTotals.subtotal, orderTotals.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone">Delivery, Taxes &amp; Savings</dt>
                <dd className="font-medium text-ink">
                  {formatPrice(Math.max(0, orderTotals.total - orderTotals.subtotal), orderTotals.currency)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-medium text-ink">Total Paid</dt>
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

  /* ------------------ Payment phase (Express Checkout + Payment Element) ------- */

  if (step === "payment" || step === "processing") {
    const processing = step === "processing";
    return (
      <div className="checkout-page min-h-screen bg-background text-foreground selection:bg-gold selection:text-ink">
        <div className="mx-auto max-w-6xl px-4 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            {/* Left Column: Payment */}
            <div className="lg:col-span-7">
              {/* Progress context */}
              <div className="mb-8">
                <button
                  type="button"
                  onClick={backToForm}
                  disabled={processing}
                  className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-luxe text-stone hover:text-ink transition disabled:opacity-50 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to delivery details</span>
                </button>
                <h1 className="mt-4 font-serif text-3xl font-medium text-ink">Payment</h1>
                <p className="mt-2 text-xs text-stone">
                  Order <span className="font-mono font-medium text-ink">{activeOrder?.orderNumber}</span> is
                  reserved. Complete payment below to confirm your order.
                </p>
              </div>

              <form onSubmit={handlePayNow} className="space-y-8">
                {/* Express Checkout (Apple Pay / Google Pay / Link).
                    Hidden entirely once the element reports no eligible
                    wallets for this device/browser. The mount container
                    always keeps its layout height — wallets refuse to
                    render inside zero-height/hidden containers. */}
                {expressHasWallets !== false && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-serif text-lg font-medium text-ink">Express Checkout</h2>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-stone font-medium">One-tap</span>
                        <Lock className="h-3 w-3 text-gold" />
                      </div>
                    </div>
                    <div
                      ref={expressContainerRef}
                      className={cn(
                        "min-h-[52px] w-full transition-opacity duration-200",
                        expressReady && !expressUnavailable ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {!expressReady && !expressUnavailable && (
                      <div className="flex h-12 items-center justify-center border border-stone/15 bg-[#FAF8F5] rounded-[2px] animate-pulse">
                        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink border-t-transparent mr-2.5" />
                        <span className="text-xs text-stone/60">Checking available wallets…</span>
                      </div>
                    )}
                    {expressUnavailable && (
                      <p className="text-[11px] text-stone">
                        Express wallets are not available on this device or browser — continue with card below.
                      </p>
                    )}
                  </div>
                )}

                {/* Divider */}
                {expressHasWallets !== false && (
                  <div className="flex items-center gap-4" aria-hidden="true">
                    <span className="h-px flex-1 bg-line" />
                    <span className="text-[10px] uppercase tracking-widest text-stone">Or pay with card</span>
                    <span className="h-px flex-1 bg-line" />
                  </div>
                )}

                {/* Card payment */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-serif text-lg font-medium text-ink">Card Details</h2>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-stone font-medium">Secured by</span>
                      <div className="relative h-4 w-10 shrink-0">
                        <Image
                          src="/ima/stripe_logo.png"
                          alt="Stripe"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-stone mb-3">
                    All transactions are secure, encrypted, and processed directly through Stripe.
                  </p>

                  <div className="border border-stone/20 rounded-[2px] p-4 space-y-3.5 bg-surface/40 transition-colors">
                    <div className="flex items-center justify-between pb-2.5 border-b border-line">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-ink" />
                        <span className="text-xs font-medium uppercase tracking-wider text-ink">
                          Payment Method
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded-[2px] transition-all ${
                            cardBrand === "visa"
                              ? "bg-[#1A1F71] text-white ring-1 ring-gold shadow-xs"
                              : "bg-[#1A1F71] text-white opacity-85"
                          }`}
                        >
                          VISA
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded-[2px] transition-all ${
                            cardBrand === "mastercard"
                              ? "bg-[#EB001B] text-white ring-1 ring-gold shadow-xs"
                              : "bg-[#EB001B] text-white opacity-85"
                          }`}
                        >
                          MC
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded-[2px] transition-all ${
                            cardBrand === "amex"
                              ? "bg-[#006FCF] text-white ring-1 ring-gold shadow-xs"
                              : "bg-[#006FCF] text-white opacity-85"
                          }`}
                        >
                          AMEX
                        </span>
                        <span className="ml-1 inline-flex items-center gap-1 rounded-full border border-line bg-secondary/60 px-1.5 py-[2px] text-[8px] font-medium uppercase tracking-[0.14em] text-stone">
                          <ShieldCheck className="h-2.5 w-2.5 text-gold" aria-hidden />
                          Secure
                        </span>
                      </div>
                    </div>

                    {/* Payment Element */}
                    <div>
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
                      <p className="text-[10px] text-stone/60 mt-2">
                        All payment information is encrypted and transmitted securely directly through Stripe.
                      </p>
                      {(stripePaymentError || fieldErrors.payment) && (
                        <p role="alert" className="text-[10px] text-red-600 font-medium mt-1.5">
                          {stripePaymentError || fieldErrors.payment}
                        </p>
                      )}
                    </div>

                    {/* Name on Card */}
                    <div>
                      <Label htmlFor="cardName" className="text-[11px] font-medium uppercase tracking-wider text-stone mb-1.5 block">
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
                      `PAY NOW · ${formatPrice(activeOrder?.amount ?? estimatedTotal, activeOrder?.currency ?? selected.currency)}`
                    )}
                  </button>

                  <div className="pt-3 flex flex-col items-center justify-center gap-2 text-center">
                    <div className="flex items-center gap-1.5 text-stone text-[11px]">
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
                      className="text-[10px] font-medium uppercase tracking-widest text-stone/70 hover:text-ink underline transition-colors"
                    >
                      COOKIE PREFERENCES
                    </Link>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Column: Order Summary (authoritative backend total) */}
            <aside className="hidden lg:block lg:col-span-5">
              <div className="sticky top-24 space-y-6 lg:pl-8 lg:border-l lg:border-line">
                <ul className="divide-y divide-line">
                  {detailedLines.map((line) => (
                    <li key={line.variantId} className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative h-16 w-16 rounded-[2px] border border-line shrink-0 bg-white">
                          <div className="relative h-full w-full rounded-[2px] overflow-hidden">
                            <LettyImage
                              imageKey={line.product.media[0]?.imageKey ?? "productLipstick"}
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

                {coupon && (
                  <p className="inline-flex items-center gap-1.5 text-xs text-ink bg-surface border border-line px-2.5 py-1">
                    <Tag className="h-3 w-3 text-gold" />
                    <span className="font-mono font-medium">{coupon}</span> ({appliedCouponInfo?.label ?? "Promo applied"})
                    <button type="button" onClick={removeCoupon} className="ml-1 text-stone hover:text-ink cursor-pointer">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </p>
                )}

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
                    <dt className="font-medium">Delivery</dt>
                    <dd className="font-mono font-medium text-ink">
                      {isAddressFilled ? (
                        formatPrice(convertedShippingCost, selected.currency)
                      ) : (
                        <span className="text-xs text-stone font-normal italic font-sans">
                          Calculated at payment
                        </span>
                      )}
                    </dd>
                  </div>

                  <div className="flex justify-between items-baseline pt-4 border-t border-line">
                    <div>
                      <dt className="font-serif text-base font-medium text-ink">Total Due</dt>
                      <p className="text-[10px] text-stone/70 font-sans font-normal mt-0.5">
                        Final amount verified at payment
                      </p>
                    </div>
                    <dd className="flex items-baseline gap-1.5 font-medium text-ink">
                      <span className="text-xs font-normal text-stone uppercase">
                        {activeOrder?.currency ?? selected.currency}
                      </span>
                      <span className="font-serif text-2xl font-medium">
                        {formatPrice(activeOrder?.amount ?? estimatedTotal, activeOrder?.currency ?? selected.currency)}
                      </span>
                    </dd>
                  </div>
                </dl>

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

  /* ------------------ Form phase (contact / delivery / billing) ---------------- */

  return (
    <div className="checkout-page min-h-screen bg-background text-foreground selection:bg-gold selection:text-ink">

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
            {formatPrice(estimatedTotal, selected.currency)}
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
                          imageKey={line.product.media[0]?.imageKey ?? "productLipstick"}
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
                  {isAddressFilled ? (
                    formatPrice(convertedShippingCost, selected.currency)
                  ) : (
                    <span className="text-xs text-stone font-normal italic font-sans">
                      Calculated at next step
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-line text-sm font-medium text-ink">
                <div>
                  <dt className="font-serif">Total</dt>
                  {!isAddressFilled && (
                    <p className="text-[10px] text-stone/70 font-sans font-normal">Excl. delivery</p>
                  )}
                </div>
                <dd className="flex items-baseline gap-1">
                  <span className="text-[11px] font-normal text-stone uppercase">{selected.currency}</span>
                  <span className="font-serif text-base font-medium">{formatPrice(estimatedTotal, selected.currency)}</span>
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
            <form onSubmit={handleContinueToPayment} className="space-y-8">
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
                    I&apos;d like to receive privilege updates and private invitations from LETTY.
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
                                    <span className="flex items-center gap-2 truncate">
                                      <CountryFlag code={c.code} name={c.name} flagFallback={c.flag} size="sm" />
                                      <span className="truncate">{c.name}</span>
                                    </span>
                                    <span className="text-stone font-mono text-[11px] shrink-0 ml-2">{c.currency} ({c.currencySymbol})</span>
                                  </button>
                                ))
                              )
                            ) : (
                              <>
                                <div className="px-3 py-1.5 text-[9px] font-medium tracking-wider uppercase text-stone/70 bg-surface/30">
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
                                    <span className="flex items-center gap-2 truncate">
                                      <CountryFlag code={c.code} name={c.name} flagFallback={c.flag} size="sm" />
                                      <span className="truncate">{c.name}</span>
                                    </span>
                                    <span className="text-stone font-mono text-[11px] shrink-0 ml-2">{c.currency} ({c.currencySymbol})</span>
                                  </button>
                                ))}
                                <div className="px-3 py-1.5 text-[9px] font-medium tracking-wider uppercase text-stone/70 bg-surface/30 mt-1">
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
                                    <span className="flex items-center gap-2 truncate">
                                      <CountryFlag code={c.code} name={c.name} flagFallback={c.flag} size="sm" />
                                      <span className="truncate">{c.name}</span>
                                    </span>
                                    <span className="text-stone font-mono text-[11px] shrink-0 ml-2">{c.currency} ({c.currencySymbol})</span>
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
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-serif text-lg font-medium text-ink">Shipping Method</h2>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-stone/70">
                    Step 2 of 3
                  </span>
                </div>

                {!isAddressFilled ? (
                  <div className="rounded-[2px] border border-dashed border-stone/30 bg-surface/50 p-4 text-center sm:text-left flex flex-col sm:flex-row items-center gap-3.5 transition-all">
                    <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-stone shrink-0">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-ink">
                        Enter delivery address to view shipping options
                      </p>
                      <p className="text-[11px] text-stone mt-0.5">
                        Tracked couriers, exact transit times, and regional delivery rates will calculate automatically once your address is provided.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border border-ink bg-surface/90 rounded-[2px] p-4 flex items-center justify-between cursor-pointer transition-all shadow-2xs animate-in fade-in-50 duration-300">
                    <div>
                      <p className="text-medium text-sm text-ink flex items-center gap-2">
                        <span>{destInfo.flag}</span>
                        <span>Standard Tracked Shipping</span>
                        <span className="text-[9px] uppercase font-mono tracking-wider bg-secondary border border-line px-1.5 py-0.5 rounded text-stone">
                          Regional Verified
                        </span>
                      </p>
                      <p className="text-xs text-stone mt-0.5">
                        Delivered within {destInfo.deliveryTime} ({destInfo.label}).
                      </p>
                    </div>
                    <span className="font-mono text-sm font-medium text-ink">
                      {formatPrice(convertedShippingCost, selected.currency)}
                    </span>
                  </div>
                )}
              </div>

              {/* Billing Address Section */}
              <div>
                <h2 className="font-serif text-lg font-medium text-ink mb-3">Billing Address</h2>

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
                        className="h-12 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 py-1.5 flex items-center justify-between text-left hover:border-ink/50 transition-colors cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="text-[9px] text-stone uppercase tracking-wider font-medium">Billing Country / Region</span>
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
                                      <span className="flex items-center gap-2 truncate">
                                        <CountryFlag code={c.code} name={c.name} flagFallback={c.flag} size="sm" />
                                        <span className="truncate">{c.name}</span>
                                      </span>
                                      <span className="text-stone font-mono text-[11px] shrink-0 ml-2">{c.currency} ({c.currencySymbol})</span>
                                    </button>
                                  ))
                                )
                              ) : (
                                <>
                                  <div className="px-3 py-1.5 text-[9px] font-medium tracking-wider uppercase text-stone/70 bg-surface/30">
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
                                      <span className="flex items-center gap-2 truncate">
                                        <CountryFlag code={c.code} name={c.name} flagFallback={c.flag} size="sm" />
                                        <span className="truncate">{c.name}</span>
                                      </span>
                                      <span className="text-stone font-mono text-[11px] shrink-0 ml-2">{c.currency} ({c.currencySymbol})</span>
                                    </button>
                                  ))}
                                  <div className="px-3 py-1.5 text-[9px] font-medium tracking-wider uppercase text-stone/70 bg-surface/30 mt-1">
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
                                      <span className="flex items-center gap-2 truncate">
                                        <CountryFlag code={c.code} name={c.name} flagFallback={c.flag} size="sm" />
                                        <span className="truncate">{c.name}</span>
                                      </span>
                                      <span className="text-stone font-mono text-[11px] shrink-0 ml-2">{c.currency} ({c.currencySymbol})</span>
                                    </button>
                                  ))}
                                </>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
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

              {/* Legal Acceptance Text & CONTINUE Button */}
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
                  disabled={initializing}
                  className="w-full h-13 rounded-none sm:rounded-[2px] bg-ink hover:bg-stone active:scale-[0.99] text-ivory font-medium text-xs tracking-[0.22em] uppercase transition-all shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {initializing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ivory border-t-transparent" />
                      RESERVING YOUR ORDER...
                    </span>
                  ) : !isAddressFilled ? (
                    "ENTER DELIVERY ADDRESS TO CONTINUE"
                  ) : (
                    `CONTINUE TO PAYMENT · ${formatPrice(estimatedTotal, selected.currency)}`
                  )}
                </button>

                <div className="pt-3 flex flex-col items-center justify-center gap-2 text-center">
                  <div className="flex items-center gap-1.5 text-stone text-[11px]">
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
                    className="text-[10px] font-medium uppercase tracking-widest text-stone/70 hover:text-ink underline transition-colors"
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
                            imageKey={line.product.media[0]?.imageKey ?? "productLipstick"}
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
                    {isAddressFilled ? (
                      formatPrice(convertedShippingCost, selected.currency)
                    ) : (
                      <span className="text-xs text-stone font-normal italic font-sans">
                        Calculated at next step
                      </span>
                    )}
                  </dd>
                </div>

                <div className="flex justify-between items-baseline pt-4 border-t border-line">
                  <div>
                    <dt className="font-serif text-base font-medium text-ink">Total</dt>
                    {!isAddressFilled && (
                      <p className="text-[10px] text-stone/70 font-sans font-normal mt-0.5">Excluding delivery</p>
                    )}
                  </div>
                  <dd className="flex items-baseline gap-1.5 font-medium text-ink">
                    <span className="text-xs font-normal text-stone uppercase">{selected.currency}</span>
                    <span className="font-serif text-2xl font-medium">{formatPrice(estimatedTotal, selected.currency)}</span>
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
