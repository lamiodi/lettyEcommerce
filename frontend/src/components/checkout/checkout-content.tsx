"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { loadStripe } from "@stripe/stripe-js/pure";
import type {
  Stripe,
  StripeCardCvcElement,
  StripeCardExpiryElement,
  StripeCardNumberElement,
  StripeElements,
  StripeExpressCheckoutElement,
  StripeExpressCheckoutElementConfirmEvent,
  StripePaymentElement,
} from "@stripe/stripe-js";
import { useCustomerAuthStore } from "@/lib/store/customer-auth";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Gift,
  Lock,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  CartLineItemSkeleton,
  OrderSummarySkeleton,
} from "@/components/shared/skeletons";
import { useHydrated } from "@/hooks/use-hydrated";
import { cartSubtotal, detailCartLines } from "@/lib/cart-details";
import {
  getAfterpayBrandName,
  getCheckoutPaymentExclusions,
  getExpressCheckoutLayout,
} from "@/lib/checkout-payment-methods";
import { getCheckoutFieldErrors } from "@/lib/checkout-validation";
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
import type { CartLine } from "@/types";

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

const CHECKOUT_FIELD_LABELS: Record<string, string> = {
  email: "Email address", firstName: "First name", lastName: "Last name",
  address: "Street address", city: "City", state: "State / province",
  postalCode: "Postal code / ZIP",
  billingFirstName: "Billing first name", billingLastName: "Billing last name",
  billingAddress: "Billing street address", billingCity: "Billing city",
  billingState: "Billing state / province", billingPostalCode: "Billing postal code / ZIP",
  payment: "Payment details",
};

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

/**
 * Live state of the split Stripe card fields (number / expiry / CVC), driven
 * by each element's `change` event. `empty` drives the placeholder overlay.
 */
interface CardFieldState {
  empty: boolean;
  complete: boolean;
  error?: string;
}

const INITIAL_CARD_FIELDS: Record<"number" | "expiry" | "cvc", CardFieldState> = {
  number: { empty: true, complete: false },
  expiry: { empty: true, complete: false },
  cvc: { empty: true, complete: false },
};

const STRIPE_APPEARANCE = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#32150d",
    colorBackground: "#ffffff",
    colorText: "#32150d",
    colorDanger: "#8c3a2b",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    spacingUnit: "4px",
    borderRadius: "6px",
    fontSizeBase: "14px",
  },
  rules: {
    ".AccordionItem": {
      border: "1px solid rgba(50, 21, 13, 0.15)",
      backgroundColor: "#ffffff",
      boxShadow: "none",
      borderRadius: "6px",
    },
    ".Input": {
      border: "1px solid rgba(50, 21, 13, 0.15)",
      borderRadius: "6px",
      boxShadow: "none",
      padding: "13px 14px",
      backgroundColor: "#ffffff",
      fontSize: "14px",
      color: "#32150d",
    },
    ".Input:focus": {
      border: "1px solid #32150d",
      boxShadow: "0 0 0 1px #32150d",
    },
    ".Input--invalid": {
      border: "1px solid #8c3a2b",
    },
  },
};

/** Line shape shown on the order-confirmed screen. */
interface ConfirmedLine {
  variantId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  name: string;
  variantLabel: string;
  image?: string | null;
}

/**
 * Server-priced lines returned by /api/checkout/init are the amounts actually
 * charged (manual currency overrides vs live-FX conversions differ from any
 * client-side estimate). Client mock-catalog lines are a display-only
 * fallback for older backend responses without `items`.
 */
function toConfirmedLines(
  initData: { items?: unknown } | null | undefined,
  lines: CartLine[],
  convert: (gbpAmount: number, targetCurrency?: CurrencyCode) => number,
  currency: string,
): ConfirmedLine[] {
  const serverItems = Array.isArray(initData?.items)
    ? (initData.items as Array<{
        variantId: string;
        name: string;
        sku: string;
        options?: Array<{ name: string; value: string }>;
        image?: string | null;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      }>)
    : null;
  if (serverItems && serverItems.length > 0) {
    return serverItems.map((it) => ({
      variantId: it.variantId,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      lineTotal: it.lineTotal,
      name: it.name,
      variantLabel: (it.options ?? []).map((o) => o.value).join(" · ") || it.sku,
      image: it.image ?? null,
    }));
  }
  return detailCartLines(lines).map((l) => ({
    variantId: l.variantId,
    quantity: l.quantity,
    unitPrice: convert(l.unitPrice, currency as CurrencyCode),
    lineTotal: convert(l.lineTotal, currency as CurrencyCode),
    name: l.product.name,
    variantLabel: [l.variant.color, l.variant.size].filter(Boolean).join(" · ") || l.variant.sku,
    image: l.variant.image || l.variant.images?.[0] || l.product.media[0]?.imageKey || null,
  }));
}

export function CheckoutContent() {  const hydrated = useHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const lines = useCartStore((s) => s.lines);
  const clearCart = useCartStore((s) => s.clear);

  const [step, setStep] = useState<"form" | "payment" | "processing" | "success">("form");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [orderLines, setOrderLines] = useState<ConfirmedLine[]>([]);
  const [orderTotals, setOrderTotals] = useState<{
    subtotal: number;
    discount?: number;
    shipping: number;
    tax: number;
    taxInclusive?: boolean;
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
  const storeCurrency = useCurrencyStore((s) => s.currency);
  const hasChosenCountry = useCurrencyStore((s) => s.hasChosenCountry);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- clearError recreates each render; lastSyncedCountryRef guard prevents loops
  }, [hydrated, storeCountry?.name, storeCountry?.dialCode, billingSameAsShipping]);

  // Stripe mounts once after cart hydration, using deferred intent mode.
  const [stripePaymentError, setStripePaymentError] = useState<string | null>(null);
  const [stripeMounted, setStripeMounted] = useState(false);
  const [expressReady, setExpressReady] = useState(false);
  const [expressError, setExpressError] = useState<string | null>(null);
  const [expressAvailable, setExpressAvailable] = useState(false);
  const [paymentRetry, setPaymentRetry] = useState(0);
  const [paymentPending, setPaymentPending] = useState(false);
  // Payment Element tucked away after a load error while card still works.
  const [peHidden, setPeHidden] = useState(false);

  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const walletElementsRef = useRef<StripeElements | null>(null);
  const paymentElementRef = useRef<StripePaymentElement | null>(null);
  const expressElementRef = useRef<StripeExpressCheckoutElement | null>(null);
  const paymentContainerRef = useRef<HTMLDivElement | null>(null);
  const expressContainerRef = useRef<HTMLDivElement | null>(null);
  const elementsGenerationRef = useRef(0);
  const isMountingRef = useRef(false);

  // Split card fields (one field per line, Shopify-style) live on their own
  // deferred-intent Elements instance, separate from the Payment Element that
  // renders the selected alternative method (Klarna / Clearpay / PayPal).
  // Alt values are Stripe payment-method types so eligibility checks line up.
  const [payMethod, setPayMethod] = useState<
    "card" | "klarna" | "afterpay_clearpay" | "paypal"
  >("card");
  const [cardMounted, setCardMounted] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardFields, setCardFields] = useState(INITIAL_CARD_FIELDS);
  const cardFieldsRef = useRef(cardFields);
  cardFieldsRef.current = cardFields;
  const cardElementsRef = useRef<StripeElements | null>(null);
  const cardNumberElementRef = useRef<StripeCardNumberElement | null>(null);
  const cardExpiryElementRef = useRef<StripeCardExpiryElement | null>(null);
  const cardCvcElementRef = useRef<StripeCardCvcElement | null>(null);
  const cardNumberContainerRef = useRef<HTMLDivElement | null>(null);
  const cardExpiryContainerRef = useRef<HTMLDivElement | null>(null);
  const cardCvcContainerRef = useRef<HTMLDivElement | null>(null);

  // One automatic remount per stalled load before the timeout message shows.
  const expressAutoRetryRef = useRef(false);
  const expressConfirmRef = useRef<
    (event: StripeExpressCheckoutElementConfirmEvent, elementsOverride?: StripeElements | null) => Promise<void>
  | null>(null);
  // Express wallet handlers are attached once at mount, so they read live
  // pricing and shipping from this ref instead of stale closure values.
  const expressPricingRef = useRef({
    subtotal: 0,
    discount: 0,
    giftApplied: 0,
    currency: "GBP" as string,
    shippingCost: 0,
    deliveryTime: "2-3 business days",
  });

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Restore placed order from sessionStorage on page return from 3DS redirect or page refresh
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const currentCartLines = useCartStore.getState().lines;
        if (currentCartLines.length > 0) {
          // The user currently has items in their cart and navigated to checkout.
          // This is definitively a new checkout session, so discard any previous confirmation.
          try {
            sessionStorage.removeItem("letty_confirmed_order");
            sessionStorage.removeItem("letty_last_order");
          } catch {}
          return;
        }

        const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const isExplicitConfirmation =
          params?.get("confirmed") === "true" ||
          params?.get("status") === "success" ||
          params?.get("redirect_status") === "succeeded";

        // 1. Check for already confirmed order (persists across page refresh of the confirmation screen)
        const confirmed = sessionStorage.getItem("letty_confirmed_order");
        if (confirmed) {
          const data = JSON.parse(confirmed);
          if (
            data &&
            data.orderId &&
            Date.now() - (data.timestamp || 0) < 2 * 60 * 60 * 1000 &&
            isExplicitConfirmation
          ) {
            if (cancelled) return;
            setOrderId(data.orderId);
            if (data.orderLines) setOrderLines(data.orderLines);
            if (data.orderTotals) setOrderTotals(data.orderTotals);
            if (data.email) setEmail(data.email);
            if (data.firstName) setFirstName(data.firstName);
            if (data.lastName) setLastName(data.lastName);
            if (data.address) setAddress(data.address);
            if (data.apartment) setApartment(data.apartment);
            if (data.city) setCity(data.city);
            if (data.state) setState(data.state);
            if (data.country) setCountry(data.country);
            if (data.postalCode) setPostalCode(data.postalCode);
            setPaymentPending(Boolean(data.paymentPending));
            setStep("success");
            return;
          }
        }

        // 2. Check for 3DS redirect return
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
                if (data.shippingAddress.firstName) setFirstName(data.shippingAddress.firstName);
                if (data.shippingAddress.lastName) setLastName(data.shippingAddress.lastName);
                if (data.shippingAddress.address) setAddress(data.shippingAddress.address);
                if (data.shippingAddress.apartment) setApartment(data.shippingAddress.apartment);
                if (data.shippingAddress.state) setState(data.shippingAddress.state);
                if (data.shippingAddress.city) setCity(data.shippingAddress.city);
                if (data.shippingAddress.country) setCountry(data.shippingAddress.country);
                if (data.shippingAddress.postalCode) setPostalCode(data.shippingAddress.postalCode);
              }
              try {
                sessionStorage.setItem(
                  "letty_confirmed_order",
                  JSON.stringify({
                    orderId: data.orderId,
                    orderIdUuid: data.orderIdUuid,
                    orderLines: data.orderLines,
                    orderTotals: data.orderTotals,
                    email: data.email,
                    firstName: data.shippingAddress?.firstName,
                    lastName: data.shippingAddress?.lastName,
                    address: data.shippingAddress?.address,
                    apartment: data.shippingAddress?.apartment,
                    city: data.shippingAddress?.city,
                    state: data.shippingAddress?.state,
                    country: data.shippingAddress?.country,
                    postalCode: data.shippingAddress?.postalCode,
                    paymentPending: result.data.status === "processing",
                    timestamp: Date.now(),
                  }),
                );
                sessionStorage.removeItem("letty_last_order");
              } catch {}
              if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                url.searchParams.set("confirmed", "true");
                if (data.orderId) url.searchParams.set("order_id", data.orderId);
                window.history.replaceState(null, "", url.toString());
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

  const fieldAccessibility = (id: string, required = true) => ({
    "aria-label": CHECKOUT_FIELD_LABELS[id],
    "aria-required": required,
    "aria-invalid": Boolean(fieldErrors[id]),
    "aria-describedby": fieldErrors[id] ? `${id}-error` : undefined,
    required,
  });

  const focusCheckoutField = (id: string) => {
    if (id === "payment") {
      if (payMethod === "card") cardNumberElementRef.current?.focus();
      else paymentElementRef.current?.focus();
    } else {
      document.getElementById(id)?.focus({ preventScroll: true });
    }
    const scrollTargetId =
      id === "payment" ? (payMethod === "card" ? "stripe-card-number" : "stripe-payment-element") : id;
    document.getElementById(scrollTargetId)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center",
    });
  };

  const validateFieldOnBlur = (event: React.FocusEvent<HTMLFormElement>) => {
    const id = event.target.id;
    if (!CHECKOUT_FIELD_LABELS[id] || id === "payment") return;
    const error = validateForm()[id];
    setFieldErrors((previous) => {
      if (previous[id] === error) return previous;
      const next = { ...previous };
      if (error) next[id] = error;
      else delete next[id];
      return next;
    });
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

  // Gift card (currency-locked; balance capped at subtotal − discount by the
  // backend — shipping and tax always collect through Stripe).
  const [giftCardInput, setGiftCardInput] = useState("");
  const [appliedGiftCard, setAppliedGiftCard] = useState<{
    code: string;
    balance: number; // in the card's (display) currency
  } | null>(null);
  const [validatingGiftCard, setValidatingGiftCard] = useState(false);

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
    currency: hasChosenCountry ? storeCurrency : selectedCountryInfo.currency,
    gateway: "stripe" as const,
  };

  // Card is rendered by our own split-field form, so the Payment Element only
  // carries the alternative methods (Klarna / Clearpay / PayPal) — and is
  // skipped entirely in markets where none of them is eligible.
  const elementExclusions = useMemo(
    () => [...getCheckoutPaymentExclusions(selectedCountryInfo.code, selected.currency), "card"],
    [selectedCountryInfo.code, selected.currency],
  );
  const elementMethodsAvailable = ["klarna", "afterpay_clearpay", "paypal"].some(
    (method) => !elementExclusions.includes(method),
  );

  // Which alternative methods this destination can actually use — drives the
  // selector rows below the card option.
  const altMethods = useMemo(() => {
    const excluded = getCheckoutPaymentExclusions(selectedCountryInfo.code, selected.currency);
    const afterpay = getAfterpayBrandName(selectedCountryInfo.code);
    const all: { id: "klarna" | "afterpay_clearpay" | "paypal"; label: string; hint: string }[] = [
      { id: "klarna", label: "Klarna", hint: "Pay in 3 interest-free instalments" },
      { id: "afterpay_clearpay", label: afterpay.label, hint: afterpay.hint },
      { id: "paypal", label: "PayPal", hint: "Pay with your PayPal account" },
    ];
    return all.filter((m) => !excluded.includes(m.id));
  }, [selectedCountryInfo.code, selected.currency]);

  // While an alternative method is selected, the Payment Element is narrowed
  // to that single method so Stripe renders its dedicated UI (instalment
  // summary, PayPal consent) instead of its own method selector.
  const selectedElementExclusions = useMemo(() => {
    if (payMethod === "card") return null;
    const others = ["klarna", "afterpay_clearpay", "paypal"].filter((m) => m !== payMethod);
    return [...elementExclusions, ...others];
  }, [payMethod, elementExclusions]);

  // A destination change can invalidate the chosen method (Klarna outside its
  // markets, Clearpay outside GB) — fall back to card instead of failing at
  // confirmation time.
  useEffect(() => {
    if (payMethod === "card") return;
    if (!altMethods.some((m) => m.id === payMethod)) setPayMethod("card");
  }, [altMethods, payMethod]);

  const isShippingPostalRequired = !COUNTRIES_WITHOUT_POSTAL_CODES.has(selectedCountryInfo.code);
  const isBillingPostalRequired = !COUNTRIES_WITHOUT_POSTAL_CODES.has(selectedBillingCountryInfo.code);

  // Reset currency-locked coupon amounts and gift cards on country / currency switch
  useEffect(() => {
    if (appliedGiftCard) {
      setAppliedGiftCard(null);
      toast.info("Currency changed. Please re-apply your gift card.");
    }
    if (appliedCouponInfo && appliedCouponInfo.amount) {
      setAppliedCouponInfo(null);
      setCoupon(null);
      toast.info("Currency changed. Please re-apply your voucher code.");
    }
  }, [selected.currency]);

  const detailedLines = useMemo(() => detailCartLines(lines), [lines]);
  const subtotal = cartSubtotal(detailedLines);

  const convertedLines = useMemo(
    () =>
      detailedLines.map((line) => ({
        ...line,
        convertedLineTotal: convertPrice(line.lineTotal, selected.currency),
      })),
    [detailedLines, convertPrice, selected.currency],
  );

  const convertedSubtotal = useMemo(
    () => convertedLines.reduce((sum, l) => sum + l.convertedLineTotal, 0),
    [convertedLines],
  );

  const convertedDiscount = useMemo(() => {
    if (!appliedCouponInfo) return 0;
    if (appliedCouponInfo.rate) {
      return Math.round(convertedSubtotal * appliedCouponInfo.rate * 100) / 100;
    }
    if (appliedCouponInfo.amount) {
      return Math.min(convertedSubtotal, Math.round(appliedCouponInfo.amount * 100) / 100);
    }
    return 0;
  }, [appliedCouponInfo, convertedSubtotal]);

  const discount = appliedCouponInfo?.rate
    ? Math.round(subtotal * appliedCouponInfo.rate * 100) / 100
    : convertedDiscount;

  const destKey = getShippingDestinationKey(selectedCountryInfo.code || country);
  const destInfo = SHIPPING_DESTINATIONS[destKey];
  // Destinations with a native eurRate (Europe, Rest of World) are already
  // euro-denominated by calculateShipping and must not be converted again.
  const isEurDirect = selected.currency === "EUR" && destInfo.eurRate != null;

  const standardShippingCost = calculateShipping(
    subtotal,
    selectedCountryInfo.code || country,
    selected.currency,
    "standard",
  );

  const rawShippingCost = standardShippingCost;

  // Client-side fallback estimate (mirrors the backend's fallback table). The
  // displayed fee is the server quote below, so it matches what
  // /api/checkout/init charges even when dashboard shipping rates change.
  // Free shipping was removed — every order pays the quoted rate, so the
  // fallback must never zero the fee (a wallet would authorize the wrong
  // amount and /api/checkout/init would charge more than displayed).
  const estimatedShippingCost = isEurDirect
    ? rawShippingCost
    : convertPrice(rawShippingCost, selected.currency);

  // Shipping rate for a destination, used as the express wallet fallback when
  // the quote endpoint is unreachable.
  const estimateShippingForCountry = (countryCode: string, currency: string, orderSubtotal: number) => {
    const rate = calculateShipping(orderSubtotal, countryCode, currency, "standard");
    const dest = SHIPPING_DESTINATIONS[getShippingDestinationKey(countryCode)];
    return currency === "EUR" && dest.eurRate != null
      ? rate
      : convertPrice(rate, currency as CurrencyCode);
  };

  // Server-priced quote for the selected destination (same calculateShipping
  // call the backend uses when creating the order).
  const [serverShippingRate, setServerShippingRate] = useState<number | null>(null);
  const shippingCountryCode = selectedCountryInfo.code || country;
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    // Stale quotes must never survive a destination/currency change: if the
    // refetch below fails, the previous country's rate would stay displayed.
    setServerShippingRate(null);
    fetch(
      `/api/public/shipping-quote?country=${encodeURIComponent(shippingCountryCode)}&currency=${encodeURIComponent(selected.currency)}&subtotal=${convertedSubtotal.toFixed(2)}`,
      { signal: controller.signal },
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled) return;
        const rawRate = json?.data?.rate;
        if (rawRate == null) return;
        const rate = Number(rawRate);
        if (Number.isFinite(rate) && rate >= 0) setServerShippingRate(rate);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [shippingCountryCode, selected.currency, convertedSubtotal]);

  const convertedShippingCost = serverShippingRate ?? estimatedShippingCost;

  // Whether user has entered a shipping address
  const hasShippingAddress = Boolean(address.trim() || (city.trim() && postalCode.trim()));

  // Client-side estimate shown while collecting details. The charged amount is
  // whatever the backend returns after pricing the cart itself.
  const baseTotal = Math.max(0, Math.round((convertedSubtotal - convertedDiscount) * 100) / 100);
  // Deducted amount mirrors the server: balance capped at subtotal minus
  // discount. Shipping (and non-inclusive tax) are always charged on top.
  const giftAppliedDisplay = appliedGiftCard
    ? Math.max(0, Math.min(Math.round(appliedGiftCard.balance * 100) / 100, baseTotal))
    : 0;
  const estimatedTotal = Math.max(
    0,
    Math.round(
      (baseTotal - giftAppliedDisplay + (hasShippingAddress ? convertedShippingCost : 0)) * 100,
    ) / 100,
  );

  // Keep the express wallet handlers' pricing and shipping fresh across renders.
  useEffect(() => {
    expressPricingRef.current = {
      subtotal: convertedSubtotal,
      discount: convertedDiscount,
      giftApplied: giftAppliedDisplay,
      currency: selected.currency,
      shippingCost: convertedShippingCost,
      deliveryTime: destInfo.deliveryTime,
    };
  }, [convertedSubtotal, convertedDiscount, giftAppliedDisplay, selected.currency, convertedShippingCost, destInfo.deliveryTime]);

  /* ---------------------------------------------------------------- */
  /*  Phase 1 → 2: create the order with the backend                    */
  /* ---------------------------------------------------------------- */

  const validateForm = () => {
    const shippingRegion = getSubdivisionConfig(country);
    const billingRegion = getSubdivisionConfig(billingCountry);
    return getCheckoutFieldErrors({
      email,
      shipping: {
        firstName, lastName, address, city, state, postalCode,
        regionRequired: shippingRegion.required,
        regionLabel: shippingRegion.label,
        postalRequired: isShippingPostalRequired,
      },
      billing: billingSameAsShipping ? undefined : {
        firstName: billingFirstName, lastName: billingLastName,
        address: billingAddress, city: billingCity, state: billingState,
        postalCode: billingPostalCode,
        regionRequired: billingRegion.required,
        regionLabel: billingRegion.label,
        postalRequired: isBillingPostalRequired,
      },
    });
  };

  const teardownElements = useCallback(() => {
    elementsGenerationRef.current += 1;
    try {
      paymentElementRef.current?.destroy();
    } catch {}
    try {
      expressElementRef.current?.destroy();
    } catch {}
    try {
      cardNumberElementRef.current?.destroy();
    } catch {}
    try {
      cardExpiryElementRef.current?.destroy();
    } catch {}
    try {
      cardCvcElementRef.current?.destroy();
    } catch {}
    paymentElementRef.current = null;
    expressElementRef.current = null;
    elementsRef.current = null;
    walletElementsRef.current = null;
    cardElementsRef.current = null;
    cardNumberElementRef.current = null;
    cardExpiryElementRef.current = null;
    cardCvcElementRef.current = null;
    isMountingRef.current = false;
    setStripeMounted(false);
    setExpressReady(false);
    setExpressError(null);
    setExpressAvailable(false);
    setCardMounted(false);
    setCardFields(INITIAL_CARD_FIELDS);
    setPeHidden(false);
  }, []);

  const retryPaymentOptions = () => {
    teardownElements();
    setStripePaymentError(null);
    setPaymentRetry((attempt) => attempt + 1);
  };

  // Shared confirmation result handling for the Pay button and wallet buttons.
  const processConfirmResult = useCallback(
    async (
      error: unknown,
      paymentIntent: { id: string; status?: string } | undefined,
      orderUuid?: string,
      orderNum?: string,
      addressOverride?: {
        firstName?: string;
        lastName?: string;
        address?: string;
        apartment?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        email?: string;
      },
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

        const effectiveEmail = addressOverride?.email || email;
        const effectiveFirstName = addressOverride?.firstName || firstName;
        const effectiveLastName = addressOverride?.lastName || lastName;
        const effectiveAddress = addressOverride?.address || address;
        const effectiveApartment = addressOverride?.apartment || apartment;
        const effectiveCity = addressOverride?.city || city;
        const effectiveState = addressOverride?.state || state;
        const effectiveCountry = addressOverride?.country || country;
        const effectivePostalCode = addressOverride?.postalCode || postalCode;

        if (addressOverride) {
          if (addressOverride.firstName) setFirstName(addressOverride.firstName);
          if (addressOverride.lastName) setLastName(addressOverride.lastName);
          if (addressOverride.address) setAddress(addressOverride.address);
          if (addressOverride.apartment) setApartment(addressOverride.apartment);
          if (addressOverride.city) setCity(addressOverride.city);
          if (addressOverride.state) setState(addressOverride.state);
          if (addressOverride.country) setCountry(addressOverride.country);
          if (addressOverride.postalCode) setPostalCode(addressOverride.postalCode);
          if (addressOverride.email) setEmail(addressOverride.email);
        }

        clearCart();
        setOrderId(targetNum ?? null);
        setPaymentPending(intent.status === "processing");
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.set("confirmed", "true");
          if (targetNum) url.searchParams.set("order_id", targetNum);
          window.history.replaceState(null, "", url.toString());
        }
        setStep("success");
        try {
          const confirmedOrder = {
            orderId: targetNum,
            orderIdUuid: targetUuid,
            orderLines,
            orderTotals,
            email: effectiveEmail,
            firstName: effectiveFirstName,
            lastName: effectiveLastName,
            address: effectiveAddress,
            apartment: effectiveApartment,
            city: effectiveCity,
            state: effectiveState,
            country: effectiveCountry,
            postalCode: effectivePostalCode,
            paymentPending: intent.status === "processing",
            timestamp: Date.now(),
          };
          sessionStorage.setItem("letty_confirmed_order", JSON.stringify(confirmedOrder));
          sessionStorage.removeItem("letty_last_order");
        } catch {}
        if (subscribe && effectiveEmail) {
          fetch("/api/newsletter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: effectiveEmail, source: "checkout" }),
          }).catch(() => {});
        }
        if (intent.status === "processing") {
          toast.info("Payment pending, we will email you once it is confirmed.");
        } else {
          toast.success("Order confirmed, payment successfully processed via Stripe.");
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
    [activeOrder, address, apartment, city, clearCart, country, email, firstName, lastName, postalCode, state, subscribe],
  );

  const handleExpressConfirm = useCallback(
    async (
      expressEvent: StripeExpressCheckoutElementConfirmEvent,
      elementsOverride?: StripeElements | null,
    ) => {
      const stripe = stripeRef.current;
      const elements = elementsOverride ?? elementsRef.current;
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
        shipCity = s.address.city || s.address.state || s.address.country || city.trim() || "";
        shipState = s.address.state || shipCity;
        shipCountry = s.address.country || selectedCountryInfo.code;
        shipPostal = s.address.postal_code || undefined;
      } else if (!shipStreet && w?.address?.line1) {
        shipStreet = w.address.line1 + (w.address.line2 ? `, ${w.address.line2}` : "");
        shipCity = w.address.city || w.address.state || w.address.country || city.trim() || "";
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
            giftCardCode: appliedGiftCard?.code ?? undefined,
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

      const snapshotLines = toConfirmedLines(initData, lines, convertPrice, selected.currency);
      const snapshotTotals = {
        subtotal: typeof initData.subtotal === "number" ? initData.subtotal : (convertedSubtotal - convertedDiscount),
        discount: typeof initData.discount_total === "number" ? initData.discount_total : convertedDiscount,
        shipping: typeof initData.shipping_total === "number" ? initData.shipping_total : convertedShippingCost,
        tax: typeof initData.tax_total === "number" ? initData.tax_total : 0,
        taxInclusive: Boolean(initData.tax_inclusive),
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

      const resolvedCountryName =
        COUNTRIES.find(
          (c) =>
            c.code.toLowerCase() === shipCountry.toLowerCase() ||
            c.name.toLowerCase() === shipCountry.toLowerCase(),
        )?.name || shipCountry;

      await processConfirmResult(error, paymentIntent, orderUuid, orderNum, {
        firstName: payerFirstName,
        lastName: payerLastName,
        address: s?.address?.line1 || shipStreet,
        apartment: s?.address?.line2 || apartment,
        city: shipCity,
        state: shipState,
        country: resolvedCountryName,
        postalCode: shipPostal,
        email: payerEmail,
      });
    },
    [
      address,
      apartment,
      appliedGiftCard?.code,
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

  // Synchronous double-click guard: `processing` state is also checked, but
  // a second click landing before React re-renders would slip past it and
  // create two pending orders.
  const payInFlightRef = useRef(false);

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (processing || payInFlightRef.current) return;
    payInFlightRef.current = true;
    try {
      await runPayNow();
    } catch {
      setStep("form");
      const message = "We couldn't verify the payment result. Check your order status or confirmation email before trying again.";
      setPaymentError(message);
      toast.error(message);
    } finally {
      payInFlightRef.current = false;
    }
  };

  const runPayNow = async () => {
    if (processing) return;

    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstId = Object.keys(errors)[0];
      requestAnimationFrame(() => focusCheckoutField(firstId));
      toast.error("Please review the highlighted fields before paying.");
      return;
    }

    if (lines.length === 0) {
      toast.error("Your bag is empty.");
      return;
    }

    const stripe = stripeRef.current;
    const usingCard = payMethod === "card";
    const activeElements = usingCard ? cardElementsRef.current : elementsRef.current;
    if (!stripe || !activeElements) {
      setFieldErrors((prev) => ({
        ...prev,
        payment: "Payment is still initializing. Please wait a moment.",
      }));
      toast.error("Payment is still initializing. Please wait a moment.");
      focusCheckoutField("payment");
      return;
    }

    // Alternative methods need their Payment Element UI mounted before submit.
    if (!usingCard && !stripeMounted) {
      setFieldErrors((prev) => ({
        ...prev,
        payment: `${altMethods.find((m) => m.id === payMethod)?.label ?? "That method"} is still loading. Please wait a moment.`,
      }));
      toast.error("That payment method is still loading. Please wait a moment.");
      focusCheckoutField("payment");
      return;
    }

    if (usingCard && (!cardFields.number.complete || !cardFields.expiry.complete || !cardFields.cvc.complete)) {
      const message = "Please complete your card details before paying.";
      setFieldErrors((prev) => ({ ...prev, payment: message }));
      setStripePaymentError(message);
      toast.error(message);
      const focusTarget = !cardFields.number.complete
        ? cardNumberElementRef.current
        : !cardFields.expiry.complete
          ? cardExpiryElementRef.current
          : cardCvcElementRef.current;
      focusTarget?.focus();
      document.getElementById("stripe-card-number")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "center",
      });
      return;
    }

    setStep("processing");
    setPaymentError(null);
    setStripePaymentError(null);

    // Validate the selected method before creating the order.
    {
      const { error: submitError } = await activeElements.submit();
      if (submitError) {
        setStep("form");
        setFieldErrors((prev) => ({
          ...prev,
          payment: submitError.message || "Please complete payment details.",
        }));
        setStripePaymentError(submitError.message || "Please complete payment details.");
        toast.error(submitError.message || "Please complete payment details.");
        focusCheckoutField("payment");
        return;
      }
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
          giftCardCode: appliedGiftCard?.code ?? undefined,
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
    // initData.amount === 0 is real (gift card covered everything) — don't
    // let the `||` fallback swallow it.
    const chargedAmount = Number.isFinite(Number(initData.amount))
      ? Number(initData.amount)
      : estimatedTotal;

    if (!orderUuid) {
      setStep("form");
      setPaymentError("The payment gateway did not return an authorization secret. Please try again.");
      toast.error("Payment authorization failed.");
      return;
    }

    setActiveOrder({
      orderId: orderUuid,
      orderNumber: orderNum,
      clientSecret: clientSecret ?? "",
      amount: chargedAmount,
      currency: String(initData.currency || selected.currency),
    });

    const snapshotLines = toConfirmedLines(initData, lines, convertPrice, selected.currency);
    const snapshotTotals = {
      subtotal: typeof initData.subtotal === "number" ? initData.subtotal : (convertedSubtotal - convertedDiscount),
      discount: typeof initData.discount_total === "number" ? initData.discount_total : convertedDiscount,
      shipping: typeof initData.shipping_total === "number" ? initData.shipping_total : convertedShippingCost,
      tax: typeof initData.tax_total === "number" ? initData.tax_total : 0,
      taxInclusive: Boolean(initData.tax_inclusive),
      total: chargedAmount,
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

    if (!clientSecret) {
      // Gift card covered the entire order — the backend finalized it
      // synchronously (no PaymentIntent to confirm; the confirmation email
      // was already sent by post-payment during init).
      clearCart();
      setOrderId(orderNum ?? null);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("confirmed", "true");
        if (orderNum) url.searchParams.set("order_id", orderNum);
        window.history.replaceState(null, "", url.toString());
      }
      try {
        const confirmedOrder = {
          orderId: orderNum,
          orderIdUuid: orderUuid,
          orderLines: snapshotLines,
          orderTotals: snapshotTotals,
          email,
          firstName,
          lastName,
          address,
          apartment,
          city,
          state,
          country,
          postalCode,
          paymentPending: false,
          timestamp: Date.now(),
        };
        sessionStorage.setItem("letty_confirmed_order", JSON.stringify(confirmedOrder));
        sessionStorage.removeItem("letty_last_order");
      } catch {}
      setStep("success");
      return;
    }

    // Confirm Payment with Stripe
    const formName = billingSameAsShipping
      ? `${firstName.trim()} ${lastName.trim()}`
      : `${billingFirstName.trim()} ${billingLastName.trim()}`;

    // Stripe confirms the selected card, wallet or local payment method.
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements: activeElements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/checkout?status=success`,
        payment_method_data: {
          billing_details: {
            name: usingCard && cardName.trim() ? cardName.trim() : formName,
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

    await processConfirmResult(error, paymentIntent, orderUuid, orderNum, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      address: address.trim(),
      apartment: apartment.trim(),
      city: city.trim(),
      state: state.trim() || city.trim(),
      country: selectedCountryInfo.name || country,
      postalCode: postalCode.trim(),
      email: email.trim(),
    });
  };

  // Mount Express Checkout + card fields + Payment Element on page load (deferred intent mode)
  useEffect(() => {
    if (!hydrated || detailedLines.length === 0 || step === "success") return;
    if (paymentElementRef.current || cardElementsRef.current || expressElementRef.current || isMountingRef.current) return;
    if (!paymentContainerRef.current && !cardNumberContainerRef.current) return;
    isMountingRef.current = true;
    const generation = elementsGenerationRef.current;

    (async () => {
      const promise = getStripePromise();
      if (!promise) {
        isMountingRef.current = false;
        setExpressReady(true);
        setExpressError("Express Checkout couldn't load. Please retry below.");
        setStripePaymentError(
          "Payment configuration error: Stripe publishable key is missing. Please contact support.",
        );
        return;
      }
      try {
        const stripe = await promise;
        if (generation !== elementsGenerationRef.current) return;
        if (!stripe || !paymentContainerRef.current) {
          isMountingRef.current = false;
          throw new Error("Payment options couldn't load. Please retry.");
        }
        stripeRef.current = stripe;

        // Express Checkout (wallets like Apple Pay and Google Pay) requires "card"
        // enabled on its Elements group to process. We exclude market-ineligible
        // alternatives here without disabling card-backed wallets.
        const walletExclusions = getCheckoutPaymentExclusions(selectedCountryInfo.code, selected.currency);
        const walletElements = stripe.elements({
          mode: "payment",
          amount: toElementsAmount(estimatedTotal),
          currency: selected.currency.toLowerCase(),
          appearance: STRIPE_APPEARANCE,
          loader: "auto",
          excludedPaymentMethodTypes: walletExclusions,
        });
        walletElementsRef.current = walletElements;

        const elements = stripe.elements({
          mode: "payment",
          amount: toElementsAmount(estimatedTotal),
          currency: selected.currency.toLowerCase(),
          appearance: STRIPE_APPEARANCE,
          loader: "auto",
          // Card is rendered by our own split fields; alternative methods are
          // filtered per market (see getCheckoutPaymentExclusions).
          excludedPaymentMethodTypes: elementExclusions,
        });
        elementsRef.current = elements;

        // Both wallet locations share pricing, shipping and confirmation logic.
        // Apple Pay in Payment needs its own Elements instance because Stripe
        // otherwise deduplicates it into the top Express Checkout element.
        const mountWallet = (walletElements: StripeElements, container: HTMLDivElement) => {
          try {
            const markExpressReady = (available: boolean) => {
              if (generation !== elementsGenerationRef.current) return;
              expressAutoRetryRef.current = false;
              setExpressReady(true);
              setExpressAvailable(available);
              setExpressError(null);
            };

            const initialShippingFee = convertedShippingCost;
            const expressElement = walletElements.create("expressCheckout", {
              business: { name: "LETTY" },
              buttonHeight: 48,
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
              layout: getExpressCheckoutLayout(window.matchMedia("(min-width: 640px)").matches),
              paymentMethodOrder: ["applePay", "googlePay", "link", "paypal"],
              paymentMethods: {
                amazonPay: "never",
                klarna: "never",
                applePay: "always",
                googlePay: "always",
                link: "auto",
                paypal: "auto",
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
              markExpressReady(Boolean(event.availablePaymentMethods && Object.values(event.availablePaymentMethods).some(Boolean)));
            });

            expressElement.on("availablepaymentmethodschange", (event) => {
              markExpressReady(Boolean(event.paymentMethods && Object.values(event.paymentMethods).some(method => method?.available)));
            });

            expressElement.on("loaderror", () => {
              if (generation !== elementsGenerationRef.current) return;
              setExpressReady(true);
              setExpressAvailable(false);
            });

            expressElement.on("cancel", () => setStep("form"));

            // Wallet-collected shipping: the payment sheet asks for the
            // delivery address, we quote the standard tracked rate for it from
            // the backend (client estimate as fallback) and keep the displayed
            // amount inclusive of the selected shipping fee.
            const walletBaseTotal = () => {
              const p = expressPricingRef.current;
              return Math.max(0, p.subtotal - p.discount - (p.giftApplied ?? 0));
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
                  const rawRate = (await res.json())?.data?.rate;
                  const rate = rawRate == null ? NaN : Number(rawRate);
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
                if (generation !== elementsGenerationRef.current) { event.reject(); return; }
                walletElements.update({ amount: walletElementsAmount(fee) });
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
                walletElements.update({
                  amount: walletElementsAmount(event.shippingRate.amount / 100),
                });
                event.resolve();
              } catch {
                event.reject();
              }
            });

            expressElement.on("confirm", async (event) => {
              if (payInFlightRef.current) {
                event.paymentFailed({ reason: "fail", message: "A payment is already being processed. Please wait." });
                return;
              }
              payInFlightRef.current = true;
              try {
                await expressConfirmRef.current?.(event, walletElements);
              } catch {
                const message = "We couldn't verify the payment result. Check your order status or confirmation email before trying again.";
                setStep("form");
                setPaymentError(message);
                event.paymentFailed({ reason: "fail", message });
                toast.error(message);
              } finally {
                payInFlightRef.current = false;
              }
            });

            // Store before mounting so a failed mount is cleaned up on retry.
            expressElementRef.current = expressElement;
            expressElement.mount(container);
          } catch {
            setExpressReady(true);
            setExpressAvailable(false);
          }
        };
        if (expressContainerRef.current) mountWallet(walletElements, expressContainerRef.current);

        // Split card fields, one per line — on their own deferred-intent
        // instance so they can be laid out Shopify-style matching the LETTY UI theme.
        const cardElements = stripe.elements({
          mode: "payment",
          amount: toElementsAmount(estimatedTotal),
          currency: selected.currency.toLowerCase(),
          appearance: STRIPE_APPEARANCE,
          paymentMethodTypes: ["card"],
        });
        cardElementsRef.current = cardElements;
        const onCardFieldChange =
          (field: "number" | "expiry" | "cvc") =>
          (event: { empty?: boolean; complete?: boolean; error?: { message?: string } }) => {
            setCardFields((prev) => ({
              ...prev,
              [field]: {
                empty: event.empty !== false,
                complete: Boolean(event.complete),
                error: event.error?.message,
              },
            }));
          };

        const cardElementStyle = {
          base: {
            fontSize: "14px",
            lineHeight: "24px",
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: "#32150d",
            "::placeholder": {
              color: "#8a7b70",
            },
          },
          invalid: {
            color: "#8c3a2b",
            iconColor: "#8c3a2b",
          },
        };

        if (cardNumberContainerRef.current) {
          const cardNumber = cardElements.create("cardNumber", {
            showIcon: false,
            placeholder: "Card number",
            style: cardElementStyle,
          });
          cardNumber.on("ready", () => {
            if (generation !== elementsGenerationRef.current) return;
            setCardMounted(true);
            isMountingRef.current = false;
          });
          cardNumber.on("change", onCardFieldChange("number"));
          cardNumber.mount(cardNumberContainerRef.current);
          cardNumberElementRef.current = cardNumber;
        }
        if (cardExpiryContainerRef.current) {
          const cardExpiry = cardElements.create("cardExpiry", {
            placeholder: "Expiration date (MM / YY)",
            style: cardElementStyle,
          });
          cardExpiry.on("change", onCardFieldChange("expiry"));
          cardExpiry.mount(cardExpiryContainerRef.current);
          cardExpiryElementRef.current = cardExpiry;
        }
        if (cardCvcContainerRef.current) {
          const cardCvc = cardElements.create("cardCvc", {
            placeholder: "Security code",
            style: cardElementStyle,
          });
          cardCvc.on("change", onCardFieldChange("cvc"));
          cardCvc.mount(cardCvcContainerRef.current);
          cardCvcElementRef.current = cardCvc;
        }

        // Stripe ranks enabled methods by customer location and eligibility.
        // Card is excluded here — it is rendered by the split fields above —
        // and in markets where no alternative method is eligible the Payment
        // Element is skipped entirely.
        if (elementMethodsAvailable && paymentContainerRef.current) {
          const paymentElement = elements.create("payment", {
            layout: {
              type: "accordion",
              defaultCollapsed: false,
              radios: "always",
              spacedAccordionItems: true,
              visibleAccordionItemsCount: 5,
            },
            paymentMethodOrder: ["klarna", "afterpay_clearpay", "paypal"],
            defaultValues: {
              billingDetails: { address: { country: selectedCountryInfo.code } },
            },
            wallets: {
              applePay: "never",
              googlePay: "never",
              link: "never",
            },
            fields: {
              billingDetails: {
                name: "never",
                email: "never",
                phone: "never",
                address: "never",
              },
            },
          });

          paymentElement.mount(paymentContainerRef.current);

          paymentElement.on("ready", () => {
            setStripeMounted(true);
            isMountingRef.current = false;
          });

          paymentElement.on("loaderror", () => {
            isMountingRef.current = false;
            setStripeMounted(false);
            if (cardFieldsRef.current.number.complete || cardFieldsRef.current.expiry.complete) {
              // Card is usable — tuck the alternatives away instead of
              // blocking checkout behind them.
              setPeHidden(true);
              setPayMethod("card");
            } else {
              setStripePaymentError("Payment options couldn't load. Check your internet connection, then retry below.");
            }
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

          paymentElementRef.current = paymentElement;
        } else {
          isMountingRef.current = false;
        }
      } catch (e: any) {
        isMountingRef.current = false;
        setExpressReady(true);
        setExpressError("Express Checkout couldn't load. Please retry below.");
        setStripePaymentError(
          e?.message || "Failed to initialize the payment form. Please check your network connection.",
        );
      }
    })();
  }, [hydrated, detailedLines.length, step, paymentRetry]);

  // A blocked Stripe request must not leave shoppers on an endless spinner.
  // When nothing has loaded at all, remount once automatically before falling
  // back to the timeout message; if card or the Payment Element is already
  // usable, only the stuck piece is reported so in-progress input survives.
  useEffect(() => {
    if (!hydrated || detailedLines.length === 0 || step === "success") return;
    const timeout = window.setTimeout(() => {
      if (!expressReady && !cardMounted && !stripeMounted && !expressAutoRetryRef.current) {
        expressAutoRetryRef.current = true;
        retryPaymentOptions();
        return;
      }
      if (!expressReady) {
        setExpressReady(true);
        setExpressError("Express Checkout is taking too long to load. Please retry, or use Payment below.");
      }
      if (!cardMounted && !stripeMounted) {
        setStripePaymentError("Payment options are taking too long to load. Please retry below.");
      } else if (!stripeMounted && elementMethodsAvailable && !peHidden) {
        setStripePaymentError("Some payment methods are taking too long to load. You can pay by card below, or retry.");
      }
    }, 20000);
    return () => window.clearTimeout(timeout);
  }, [hydrated, detailedLines.length, step, paymentRetry, expressReady, stripeMounted, cardMounted, elementMethodsAvailable, peHidden]);

  // Resize the existing wallet element without discarding its payment state.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 640px)");
    const updateLayout = () => {
      expressElementRef.current?.update({
        layout: getExpressCheckoutLayout(desktop.matches),
      });
    };
    updateLayout();
    desktop.addEventListener("change", updateLayout);
    return () => desktop.removeEventListener("change", updateLayout);
  }, [stripeMounted]);

  // Re-evaluate methods when destination, currency or total changes.
  useEffect(() => {
    if (!elementsRef.current && !cardElementsRef.current && !walletElementsRef.current) return;
    try {
      if (walletElementsRef.current) {
        walletElementsRef.current.update({
          amount: toElementsAmount(estimatedTotal),
          currency: selected.currency.toLowerCase(),
          excludedPaymentMethodTypes: getCheckoutPaymentExclusions(selectedCountryInfo.code, selected.currency),
        });
      }
      if (elementsRef.current && (stripeMounted || !elementMethodsAvailable)) {
        elementsRef.current.update({
          amount: toElementsAmount(estimatedTotal),
          currency: selected.currency.toLowerCase(),
          excludedPaymentMethodTypes: selectedElementExclusions ?? elementExclusions,
        });
        paymentElementRef.current?.update({
          defaultValues: {
            billingDetails: { address: { country: selectedCountryInfo.code } },
          },
        });
      }
      if (cardElementsRef.current && cardMounted) {
        cardElementsRef.current.update({
          amount: toElementsAmount(estimatedTotal),
          currency: selected.currency.toLowerCase(),
        });
      }
    } catch {
      // ignore
    }
  }, [estimatedTotal, selected.currency, selectedCountryInfo.code, elementExclusions, selectedElementExclusions, stripeMounted, cardMounted, elementMethodsAvailable]);

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

    // CIRCLE10 rules (patrons only, per-currency minimum) are enforced
    // server-side by migration 027 — the server's error messages surface
    // through the failure branch below.

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
  /*  Gift card                                                        */
  /* ---------------------------------------------------------------- */

  const applyGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = giftCardInput.trim().toUpperCase();
    if (!code) return;

    setValidatingGiftCard(true);
    try {
      const res = await fetch("/api/giftcard/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, currency: selected.currency }),
      });
      if (res.ok) {
        const data = await res.json();
        const payload = data.data || data;
        const balance = Number(payload.currentBalance ?? payload.current_balance ?? 0);
        if (balance <= 0) {
          toast.error("Gift card has no remaining balance.");
          return;
        }
        // The card is currency-locked (the endpoint rejects mismatches), so
        // `balance` is in the selected display currency. The deducted amount
        // mirrors the server cap: balance capped at subtotal minus discount —
        // shipping and tax always collect through Stripe.
        setAppliedGiftCard({ code: payload.code ?? code, balance });
        setGiftCardInput("");
        toast.success(`Gift card "${payload.code ?? code}" applied, up to ${formatPrice(balance, selected.currency)} will be deducted.`);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || "Invalid gift card code.");
      }
    } catch {
      toast.error("Could not validate gift card. Please try again.");
    } finally {
      setValidatingGiftCard(false);
    }
  };

  const removeGiftCard = () => {
    setAppliedGiftCard(null);
    toast.info("Gift card removed.");
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
                        imageKey={line.image || "productLipstick"}
                        alt={line.variantLabel ? `${line.name} — ${line.variantLabel}` : line.name}
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
                        {line.name}
                      </p>
                      {line.variantLabel && (
                        <p className="mt-1 text-xs uppercase tracking-luxe-sm text-stone">
                          {line.variantLabel}
                        </p>
                      )}
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
            {[firstName, lastName].filter(Boolean).join(" ") && (
              <p className="mt-2 text-sm font-medium text-ink">
                {[firstName, lastName].filter(Boolean).join(" ")}
              </p>
            )}
            {address && (
              <p className="text-sm text-stone">
                {address} {apartment && `, ${apartment}`}
              </p>
            )}
            <p className="text-sm text-stone">
              {[
                city,
                [state, postalCode].filter(Boolean).join(" "),
                COUNTRIES.find(
                  (c) =>
                    c.code.toLowerCase() === country.toLowerCase() ||
                    c.name.toLowerCase() === country.toLowerCase(),
                )?.name || country,
              ]
                .filter(Boolean)
                .join(", ")}
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

          {/* Order Totals — authoritative server breakdown */}
          {orderTotals && (
            <dl className="mt-6 space-y-2.5 border-t border-line pt-6 text-sm">
              <div className="flex flex-wrap justify-between gap-x-3 gap-y-2">
                <dt className="text-stone">Subtotal</dt>
                <dd className="font-medium text-ink">{formatPrice(orderTotals.subtotal, orderTotals.currency)}</dd>
              </div>
              {typeof orderTotals.discount === "number" && orderTotals.discount > 0 && (
                <div className="flex flex-wrap justify-between gap-x-3 gap-y-2">
                  <dt className="text-stone">Discount</dt>
                  <dd className="font-medium text-ink">&minus;{formatPrice(orderTotals.discount, orderTotals.currency)}</dd>
                </div>
              )}
              <div className="flex flex-wrap justify-between gap-x-3 gap-y-2">
                <dt className="text-stone">Shipping</dt>
                <dd className="font-medium text-ink">
                  {typeof orderTotals.shipping === "number"
                    ? (orderTotals.shipping === 0 ? "Complimentary" : formatPrice(orderTotals.shipping, orderTotals.currency))
                    : formatPrice(Math.max(0, orderTotals.total - orderTotals.subtotal), orderTotals.currency)}
                </dd>
              </div>
              {typeof orderTotals.tax === "number" && orderTotals.tax > 0 && (
                <div className="flex flex-wrap justify-between gap-x-3 gap-y-2">
                  <dt className="text-stone">Tax {orderTotals.taxInclusive ? "(included)" : ""}</dt>
                  <dd className="font-medium text-ink">{formatPrice(orderTotals.tax, orderTotals.currency)}</dd>
                </div>
              )}
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
                sessionStorage.removeItem("letty_confirmed_order");
              } catch {}
            }}
          >
            Continue Exploring
          </LinedButton>
          <LinedButton
            href="/contact"
            width="max-w-[240px]"
            onClick={() => {
              try {
                sessionStorage.removeItem("letty_last_order");
                sessionStorage.removeItem("letty_confirmed_order");
              } catch {}
            }}
          >
            Contact Concierge
          </LinedButton>
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
            <form noValidate onSubmit={handlePayNow} onBlurCapture={validateFieldOnBlur} className="space-y-8">
              {detailedLines.some(line => line.product.isPreorder) && (
                <aside aria-label="Preorder dispatch information" className="rounded-xl border border-gold/25 bg-surface p-4 text-xs leading-6 text-stone">
                  <p className="font-medium text-ink">Your bag includes a preorder.</p>
                  {detailedLines.filter(line => line.product.isPreorder).map(line => (
                    <p key={line.variantId}>{line.product.name} · {line.variant.color}: estimated dispatch {line.product.preorderDispatch}. Full payment is taken when you place your order.</p>
                  ))}
                </aside>
              )}
              {Object.keys(fieldErrors).length > 0 && (
                <div role="alert" className="rounded-[4px] border border-red-300 bg-red-50 p-4 text-sm text-red-800">
                  <p className="font-medium">Please review {Object.keys(fieldErrors).length === 1 ? "this field" : "these fields"} before paying:</p>
                  <ul className="mt-2 space-y-1">
                    {Object.entries(fieldErrors).map(([id, message]) => (
                      <li key={id}>
                        <button type="button" onClick={() => focusCheckoutField(id)} className="cursor-pointer text-left underline underline-offset-2">
                          {CHECKOUT_FIELD_LABELS[id] ?? "Payment"}: {message}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Express Checkout (Apple Pay / Google Pay / Link / PayPal) —
                  moved above the form flow; element config and handlers live
                  in the Stripe Elements mount effect below. */}
              {(!expressReady || expressAvailable || expressError) && (
                <div>
                  <h2 className="font-serif text-lg font-medium text-ink text-center sm:text-left mb-3">
                    Express Checkout
                  </h2>
                  <div className="relative min-h-[48px] w-full transition-[min-height] duration-200">
                    <div
                      id="stripe-express-element"
                      ref={expressContainerRef}
                      className={cn(
                        "w-full transition-opacity duration-200",
                        expressReady ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {!expressReady && (
                      <div
                        className="flex min-h-[48px] items-center justify-center rounded-[4px] border border-stone/15 bg-surface animate-pulse"
                        role="status"
                        aria-live="polite"
                      >
                        <span className="mr-2.5 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                        <span className="text-xs text-stone/60">Loading express checkout…</span>
                      </div>
                    )}
                    {expressError && (
                      <div role="alert" className="space-y-2 rounded-[4px] border border-line bg-surface p-3 text-xs text-stone">
                        <p>{expressError}</p>
                        <button type="button" onClick={retryPaymentOptions} className="min-h-11 cursor-pointer font-medium text-ink underline underline-offset-2">
                          Retry payment options
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-4 my-6" aria-hidden="true">
                    <span className="h-px flex-1 bg-line" />
                    <span className="text-xs uppercase tracking-widest text-stone">OR</span>
                    <span className="h-px flex-1 bg-line" />
                  </div>
                </div>
              )}

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
                    aria-required="true" aria-label="Email address"
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

                  {/* First Name & Last Name (Full Width) */}
                  <div className="space-y-3">
                    <div>
                      <Input
                        id="firstName"
                        {...fieldAccessibility("firstName")}
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
                        {...fieldAccessibility("lastName")}
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
                      required
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
                        {...fieldAccessibility("city")}
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
                        {...fieldAccessibility("postalCode", isShippingPostalRequired)}
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

              {/* Step 3: Shipping Method */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-y-2">
                  <h2 className="text-xl sm:text-[22px] font-bold tracking-tight text-ink">
                    Shipping Method
                  </h2>
                  {hasShippingAddress && (
                    <span className="text-xs uppercase font-mono tracking-wider text-stone/70">
                      {destInfo.flag} {selectedCountryInfo.name}
                    </span>
                  )}
                </div>

                {!hasShippingAddress ? (
                  <div className="bg-secondary rounded-[2px] p-5 sm:p-6">
                    <p className="text-base sm:text-lg font-bold tracking-tight text-stone/70 leading-snug">
                      Enter your shipping address to view available shipping methods.
                    </p>
                  </div>
                ) : (
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
                )}
              </div>

              {/* Step 3: Payment Section */}
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <h2 className="font-serif text-lg font-medium text-ink flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-ivory text-xs font-mono font-medium">3</span>
                    Payment
                  </h2>
                  <p className="text-xs sm:text-[13px] text-stone">
                    All transactions are secure and encrypted.
                  </p>
                </div>

                {/* Payment Container matching image with LETTY UI Theme Colors */}
                <div className="border border-stone/25 rounded-[6px] overflow-hidden bg-white shadow-xs">
                  {/* Header Row */}
                  <div
                    onClick={() => setPayMethod("card")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setPayMethod("card");
                      }
                    }}
                    className="flex w-full items-center justify-between gap-3 p-4 cursor-pointer bg-white select-none transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Concentric circle radio button in theme colors */}
                      <span
                        className={cn(
                          "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                          payMethod === "card"
                            ? "border-ink bg-white"
                            : "border-stone/40 bg-white"
                        )}
                      >
                        {payMethod === "card" && (
                          <span className="h-2.5 w-2.5 rounded-full bg-ink" />
                        )}
                      </span>
                      <span className="text-[15px] font-semibold text-ink">
                        Credit/Debit Card
                      </span>
                    </div>

                    {/* Card Brand Badges */}
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                      {/* VISA badge */}
                      <span className="flex h-6 w-9 items-center justify-center rounded-[3px] bg-[#1A1F71] px-1 text-[11px] font-black italic tracking-tighter text-white shadow-xs">
                        VISA
                      </span>
                      {/* Mastercard badge */}
                      <span className="flex h-6 w-9 items-center justify-center rounded-[3px] border border-stone/20 bg-white px-1 shadow-xs">
                        <span className="flex -space-x-1.5 items-center">
                          <span className="h-3.5 w-3.5 rounded-full bg-[#EB001B]" />
                          <span className="h-3.5 w-3.5 rounded-full bg-[#F79E1B] opacity-90" />
                        </span>
                      </span>
                      {/* Maestro badge */}
                      <span className="flex h-6 w-9 items-center justify-center rounded-[3px] border border-stone/20 bg-white px-1 shadow-xs">
                        <span className="flex -space-x-1.5 items-center">
                          <span className="h-3.5 w-3.5 rounded-full bg-[#00A1DF]" />
                          <span className="h-3.5 w-3.5 rounded-full bg-[#EB001B] opacity-90" />
                        </span>
                      </span>
                      {/* +5 badge matching theme */}
                      <span className="flex h-6 items-center justify-center rounded-[3px] border border-stone/25 bg-surface px-1.5 text-[11px] font-semibold text-stone">
                        +5
                      </span>
                    </div>
                  </div>

                  {/* Divider line separating header from inputs */}
                  <div className="h-px w-full bg-stone/15" />

                  {/* Split Stripe Fields Line by Line inside warm background */}
                  <div className={cn("bg-[#FAF8F5] p-3.5 sm:p-4 space-y-3", payMethod !== "card" && "hidden")}>
                    {/* Line 1: Card number */}
                    <div
                      onClick={() => cardNumberElementRef.current?.focus()}
                      className="relative flex h-12 sm:h-13 w-full items-center rounded-[6px] border border-stone/25 bg-white px-3.5 transition-all focus-within:border-ink focus-within:ring-1 focus-within:ring-ink cursor-text"
                    >
                      <div id="stripe-card-number" ref={cardNumberContainerRef} className="w-full flex-1 min-h-[24px]" />
                      <Lock className="pointer-events-none ml-2 h-4 w-4 text-stone/50 shrink-0" aria-hidden="true" />
                    </div>

                    {/* Line 2: Expiration date (MM / YY) */}
                    <div
                      onClick={() => cardExpiryElementRef.current?.focus()}
                      className="relative flex h-12 sm:h-13 w-full items-center rounded-[6px] border border-stone/25 bg-white px-3.5 transition-all focus-within:border-ink focus-within:ring-1 focus-within:ring-ink cursor-text"
                    >
                      <div id="stripe-card-expiry" ref={cardExpiryContainerRef} className="w-full flex-1 min-h-[24px]" />
                    </div>

                    {/* Line 3: Security code */}
                    <div
                      onClick={() => cardCvcElementRef.current?.focus()}
                      className="relative flex h-12 sm:h-13 w-full items-center rounded-[6px] border border-stone/25 bg-white px-3.5 transition-all focus-within:border-ink focus-within:ring-1 focus-within:ring-ink cursor-text"
                    >
                      <div id="stripe-card-cvc" ref={cardCvcContainerRef} className="w-full flex-1 min-h-[24px]" />
                      <span
                        title="The 3 or 4-digit security code on your card"
                        className="pointer-events-none ml-2 flex h-4 w-4 items-center justify-center rounded-full border border-stone/40 text-[10px] font-medium text-stone/70 shrink-0 cursor-help"
                        aria-hidden="true"
                      >
                        ?
                      </span>
                    </div>

                    {/* Line 4: Name on card */}
                    <div className="relative flex h-12 sm:h-13 w-full items-center rounded-[6px] border border-stone/25 bg-white px-3.5 transition-all focus-within:border-ink focus-within:ring-1 focus-within:ring-ink">
                      <input
                        id="cardName"
                        type="text"
                        autoComplete="cc-name"
                        placeholder="Name on card"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full h-full bg-transparent text-sm text-ink placeholder:text-stone/50 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Alternative payment methods — house-styled selector rows;
                      the Payment Element below renders only the chosen method's
                      dedicated Stripe UI. */}
                  {elementMethodsAvailable && !peHidden && (
                    <div className="border-t border-stone/15 bg-white">
                      {altMethods.map((method, idx) => {
                        const selected = payMethod === method.id;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setPayMethod(method.id)}
                            aria-pressed={selected}
                            className={cn(
                              "flex w-full items-center gap-3 p-4 text-left cursor-pointer select-none transition-colors hover:bg-surface",
                              idx < altMethods.length - 1 && "border-b border-stone/15",
                            )}
                          >
                            <span
                              className={cn(
                                "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                selected
                                  ? "border-ink bg-white"
                                  : "border-stone/40 bg-white"
                              )}
                            >
                              {selected && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
                            </span>
                            <span className="flex flex-col gap-0.5">
                              <span className="text-[15px] font-semibold text-ink">{method.label}</span>
                              <span className="text-xs text-stone">{method.hint}</span>
                            </span>
                          </button>
                        );
                      })}

                      {/* The selected method's Stripe UI (instalment summary,
                          PayPal consent). Stays mounted — hidden while card is
                          chosen — so switching methods never remounts it. */}
                      <div
                        className={cn(
                          "relative min-h-[50px] border-t border-stone/15 bg-[#FAF8F5] p-3.5",
                          payMethod === "card" && "hidden",
                        )}
                      >
                        <div
                          id="stripe-payment-element"
                          ref={paymentContainerRef}
                          className={cn(
                            "w-full transition-opacity duration-200",
                            stripeMounted ? "opacity-100" : "opacity-0 h-0 overflow-hidden",
                          )}
                        />
                        {!stripeMounted && !stripePaymentError && (
                          <div className="flex items-center justify-center py-4 text-xs text-stone/60 bg-surface border border-stone/15 rounded-[4px] animate-pulse">
                            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink border-t-transparent mr-2.5" />
                            Loading {altMethods.find((m) => m.id === payMethod)?.label ?? "payment method"}...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment error if any */}
                  {(stripePaymentError || fieldErrors.payment) && (
                    <div className="p-3 bg-red-50/80 border-t border-red-200">
                      <p id="payment-error" role="alert" className="text-xs text-red-700 font-medium">
                        {stripePaymentError || fieldErrors.payment}
                      </p>
                    </div>
                  )}
                  {!stripeMounted && !cardMounted && stripePaymentError && (
                    <div className="p-3 bg-white border-t border-stone/15 text-center">
                      <button
                        type="button"
                        onClick={retryPaymentOptions}
                        className="min-h-10 cursor-pointer rounded-[4px] border border-stone/30 bg-white px-4 text-xs font-medium text-ink hover:bg-surface transition-colors"
                      >
                        Retry loading payment options
                      </button>
                    </div>
                  )}
                </div>

                {/* Use shipping address as billing address */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !billingSameAsShipping;
                      setBillingSameAsShipping(nextVal);
                      if (nextVal) {
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
                    className="flex items-center gap-3 cursor-pointer select-none text-left group"
                  >
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-colors",
                        billingSameAsShipping
                          ? "bg-ink text-white"
                          : "border-2 border-stone-400 bg-white group-hover:border-stone-600"
                      )}
                    >
                      {billingSameAsShipping && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <span className="text-[14px] font-bold text-ink">
                      Use shipping address as billing address
                    </span>
                  </button>

                          {/* Nested Billing Address Form (only when unchecked) */}
                          {!billingSameAsShipping && (
                            <div className="mt-3.5 pt-3.5 border-t border-stone/15 space-y-3">
                              {/* Billing Country / Region Selector */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setBillingCountryDropdownOpen(!billingCountryDropdownOpen)}
                                  className="h-12 w-full rounded-[4px] border border-stone/20 bg-white px-3.5 py-1.5 flex flex-wrap items-center justify-between gap-y-2 text-left hover:border-ink/50 transition-colors cursor-pointer"
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
                                    <div className="absolute z-30 mt-1 max-h-72 w-full overflow-hidden rounded-[4px] border border-line bg-white shadow-xl flex flex-col">
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

                              <div className="space-y-3">
                                <div>
                                  <Input
                                    id="billingFirstName"
                        {...fieldAccessibility("billingFirstName")}
                                    autoComplete="billing given-name"
                                    placeholder="First name"
                                    value={billingFirstName}
                                    onChange={(e) => {
                                      clearError("billingFirstName");
                                      setBillingFirstName(e.target.value);
                                    }}
                                    className="h-11 w-full rounded-[4px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink"
                                  />
                                  {renderFieldError("billingFirstName")}
                                </div>
                                <div>
                                  <Input
                                    id="billingLastName"
                        {...fieldAccessibility("billingLastName")}
                                    autoComplete="billing family-name"
                                    placeholder="Last name"
                                    value={billingLastName}
                                    onChange={(e) => {
                                      clearError("billingLastName");
                                      setBillingLastName(e.target.value);
                                    }}
                                    className="h-11 w-full rounded-[4px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink"
                                  />
                                  {renderFieldError("billingLastName")}
                                </div>
                              </div>
                              {/* Billing Address with Autocomplete */}
                              <div>
                                <AddressAutocomplete
                                  id="billingAddress"
                                  required
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
                                  className="h-11 w-full rounded-[4px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink"
                                />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <Input
                                    id="billingCity"
                        {...fieldAccessibility("billingCity")}
                                    autoComplete="billing address-level2"
                                    placeholder="City"
                                    value={billingCity}
                                    onChange={(e) => {
                                      clearError("billingCity");
                                      setBillingCity(e.target.value);
                                    }}
                                    className="h-11 w-full rounded-[4px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink"
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
                        {...fieldAccessibility("billingPostalCode", isBillingPostalRequired)}
                                    autoComplete="billing postal-code"
                                    placeholder={isBillingPostalRequired ? "Postal code / ZIP" : "Postal code (optional)"}
                                    value={billingPostalCode}
                                    onChange={(e) => {
                                      clearError("billingPostalCode");
                                      setBillingPostalCode(e.target.value.toUpperCase());
                                    }}
                                    className="h-11 w-full rounded-[4px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink"
                                  />
                                  {renderFieldError("billingPostalCode")}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
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
                    {convertedLines.map((line) => (
                      <li key={line.variantId} className="py-3 flex flex-wrap items-center justify-between gap-y-2 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative h-14 w-14 rounded-[2px] border border-line shrink-0 bg-white">
                            <div className="relative h-full w-full rounded-[2px] overflow-hidden">
                              <LettyImage
                                imageKey={line.variant.image || line.variant.images?.[0] || (line.product.media[0]?.imageKey ?? "productLipstick")}
                                alt={line.variant.color ? `${line.product.name} — ${line.variant.color}` : line.product.name}
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
                              {[line.variant.color, line.variant.size].filter(Boolean).join(" · ") || line.variant.sku}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-medium text-ink shrink-0">
                          {formatPrice(line.convertedLineTotal, selected.currency)}
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

                {/* Gift card */}
                <div className="flex gap-2">
                  <input
                    value={giftCardInput}
                    onChange={(e) => setGiftCardInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void applyGiftCard(e);
                      }
                    }}
                    placeholder="Gift card code"
                    className="h-11 min-w-0 flex-1 rounded-[2px] border border-stone/20 bg-white px-3.5 text-xs text-ink placeholder:text-stone/40 focus:border-ink uppercase tracking-wide"
                  />
                  <button
                    type="button"
                    onClick={applyGiftCard}
                    disabled={validatingGiftCard}
                    className="h-11 px-4 rounded-[2px] border border-stone/20 bg-surface hover:bg-stone/10 text-xs font-medium uppercase tracking-widest text-ink transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {validatingGiftCard ? "..." : "Apply"}
                  </button>
                </div>

                {appliedGiftCard && (
                  <p className="inline-flex max-w-full flex-wrap items-center gap-1.5 text-xs text-ink bg-white border border-line px-2.5 py-1">
                    <Gift className="h-3 w-3 text-gold" />
                    <span className="font-mono font-medium">{appliedGiftCard.code}</span> (Gift card · {formatPrice(appliedGiftCard.balance, selected.currency)})
                    <button type="button" onClick={removeGiftCard} className="ml-1 text-stone hover:text-ink cursor-pointer">
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
                  {convertedDiscount > 0 && (
                    <div className="flex flex-wrap justify-between gap-x-3 gap-y-2 text-emerald-800">
                      <dt>Discount ({coupon})</dt>
                      <dd className="font-mono font-medium">−{formatPrice(convertedDiscount, selected.currency)}</dd>
                    </div>
                  )}
                  {giftAppliedDisplay > 0 && appliedGiftCard && (
                    <div className="flex flex-wrap justify-between gap-x-3 gap-y-2 text-emerald-800">
                      <dt>Gift card ({appliedGiftCard.code})</dt>
                      <dd className="font-mono font-medium">−{formatPrice(giftAppliedDisplay, selected.currency)}</dd>
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
                    </div>
                    <dd className="font-mono font-medium text-ink text-right">
                      {!hasShippingAddress ? (
                        <span className="text-stone/70 font-sans text-xs font-normal">
                          Enter shipping address
                        </span>
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
                        {hasShippingAddress
                          ? `Includes delivery to ${selectedCountryInfo.name}`
                          : "Calculated with shipping address"}
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
                  <div role="alert" className="p-3.5 border border-red-300 bg-red-50 text-center text-xs font-medium text-red-800 rounded-[2px]">
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
                {convertedLines.map((line) => (
                  <li key={line.variantId} className="py-4 flex flex-wrap items-center justify-between gap-y-2 gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Product Thumbnail with Circular Quantity Badge */}
                      <div className="relative h-16 w-16 rounded-[2px] border border-line shrink-0 bg-white">
                        <div className="relative h-full w-full rounded-[2px] overflow-hidden">
                          <LettyImage
                            imageKey={line.variant.image || line.variant.images?.[0] || (line.product.media[0]?.imageKey ?? "productLipstick")}
                            alt={line.variant.color ? `${line.product.name} — ${line.variant.color}` : line.product.name}
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
                          {[line.variant.color, line.variant.size].filter(Boolean).join(" · ") || line.variant.sku}
                        </p>
                      </div>
                    </div>

                    <span className="font-mono text-sm font-medium text-ink shrink-0">
                      {formatPrice(line.convertedLineTotal, selected.currency)}
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

              {/* Gift card */}
              <form onSubmit={applyGiftCard} className="flex gap-2">
                <Input
                  value={giftCardInput}
                  onChange={(e) => setGiftCardInput(e.target.value)}
                  placeholder="Gift card code"
                  className="h-11 min-w-0 flex-1 rounded-[2px] border border-stone/20 bg-white px-3.5 text-xs text-ink placeholder:text-stone/40 focus:border-ink uppercase tracking-wide"
                />
                <button
                  type="submit"
                  disabled={validatingGiftCard}
                  className="h-11 px-5 rounded-[2px] border border-stone/20 bg-surface hover:bg-stone/10 text-xs font-medium uppercase tracking-widest text-ink transition-colors cursor-pointer disabled:opacity-50"
                >
                  {validatingGiftCard ? "..." : "Apply"}
                </button>
              </form>

              {appliedGiftCard && (
                <p className="inline-flex max-w-full flex-wrap items-center gap-1.5 text-xs text-ink bg-surface border border-line px-2.5 py-1">
                  <Gift className="h-3 w-3 text-gold" />
                  <span className="font-mono font-medium">{appliedGiftCard.code}</span> (Gift card · {formatPrice(appliedGiftCard.balance, selected.currency)})
                  <button type="button" onClick={removeGiftCard} className="ml-1 text-stone hover:text-ink cursor-pointer">
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

                {convertedDiscount > 0 && (
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-2 text-emerald-800">
                    <dt>Discount ({coupon})</dt>
                    <dd className="font-mono font-medium">
                      −{formatPrice(convertedDiscount, selected.currency)}
                    </dd>
                  </div>
                )}

                {giftAppliedDisplay > 0 && appliedGiftCard && (
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-2 text-emerald-800">
                    <dt>Gift card ({appliedGiftCard.code})</dt>
                    <dd className="font-mono font-medium">
                      −{formatPrice(giftAppliedDisplay, selected.currency)}
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
                  </div>
                  <dd className="font-mono font-medium text-ink text-right">
                    {!hasShippingAddress ? (
                      <span className="text-stone/70 font-sans text-xs font-normal">
                        Enter shipping address
                      </span>
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
                      {hasShippingAddress
                        ? `Includes delivery to ${selectedCountryInfo.name}`
                        : "Calculated with shipping address"}
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
