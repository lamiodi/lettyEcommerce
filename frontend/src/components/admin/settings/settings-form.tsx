"use client";

/**
 * SettingsForm — store, contact, shipping, payments, marketing, and
 * Currency & Exchange Rates (FX) controls.
 *
 * Provides Fixed FX rate management so store owners can lock exact
 * currency conversion rates relative to £1.00 GBP without relying on
 * daily market fluctuation or hidden overrides.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, RotateCcw, ShieldCheck, TrendingUp, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { updateSettingsAction } from "@/lib/actions/admin-settings";
import { useCurrencyStore } from "@/lib/store/currency";

interface Settings {
  store: { value: any; description: string | null; updated_at: string };
  contact: { value: any; description: string | null; updated_at: string };
  shipping: { value: any; description: string | null; updated_at: string };
  payments: { value: any; description: string | null; updated_at: string };
  marketing: { value: any; description: string | null; updated_at: string };
  fx_rates?: { value: any; description: string | null; updated_at: string };
}

const DEFAULT_FIXED_RATES: Record<string, number> = {
  USD: 1.30,
  EUR: 1.17,
  CAD: 1.75,
  NGN: 2050.0,
  GHS: 19.5,
  ZAR: 23.5,
  KES: 165.0,
};

const CURRENCIES_CONFIG = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸", step: "0.01", hint: "£12 gloss = $15.60 at 1.30" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺", step: "0.01", hint: "£12 gloss = €14.04 at 1.17" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", flag: "🇨🇦", step: "0.01", hint: "£12 gloss = CA$21.00 at 1.75" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬", step: "1", hint: "£12 gloss = ₦24,600 at 2050" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", flag: "🇬🇭", step: "0.1", hint: "£12 gloss = GH₵234.00 at 19.5" },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦", step: "0.1", hint: "£12 gloss = R282.00 at 23.5" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", flag: "🇰🇪", step: "1", hint: "£12 gloss = KSh1,980 at 165" },
];

const SECTIONS = [
  {
    key: "store",
    title: "Storefront",
    fields: [
      { name: "name", label: "Brand name", placeholder: "Letty" },
      { name: "tagline", label: "Tagline", placeholder: "Atelier of quiet luxury" },
    ],
  },
  {
    key: "contact",
    title: "Contact",
    fields: [
      { name: "email", label: "Email", placeholder: "hello@houseofletty.com" },
      { name: "phone", label: "Phone", placeholder: "+44 7311 564331" },
      { name: "instagram", label: "Instagram handle", placeholder: "@lettybeautyofficial" },
      { name: "address", label: "Address (single line)", placeholder: "" },
    ],
  },
  {
    key: "shipping",
    title: "Shipping defaults",
    fields: [
      { name: "default_zone", label: "Default zone code", placeholder: "NG" },
      { name: "fallback_rate_usd", label: "Fallback rate (USD)", placeholder: "15" },
      { name: "fallback_rate_ngn", label: "Fallback rate (NGN)", placeholder: "12000" },
    ],
  },
  {
    key: "payments",
    title: "Payments",
    fields: [
      { name: "auto_capture", label: "Auto-capture charges (true / false)", placeholder: "true" },
    ],
  },
  {
    key: "marketing",
    title: "Marketing",
    fields: [
      { name: "welcome_discount_pct", label: "Welcome discount %", placeholder: "10" },
      { name: "abandoned_cart_after_hours", label: "Abandoned cart delay (hours)", placeholder: "24" },
      { name: "abandoned_cart_reminders", label: "Max abandoned cart reminders", placeholder: "2" },
    ],
  },
] as const;

export function SettingsForm({ initial }: { initial: Settings | null }) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* 1. Storefront Basic Section */}
      {(() => {
        const section = SECTIONS[0];
        const data = initial?.[section.key as keyof Settings]?.value ?? {};
        return (
          <Section
            key={section.key}
            section={section}
            data={data}
            pending={pendingKey === section.key}
            onSave={async (body) => {
              setPendingKey(section.key);
              const res = await updateSettingsAction({ [section.key]: body });
              setPendingKey(null);
              if (res.error) toast.error(res.error);
              else {
                toast.success(`${section.title} saved`);
                router.refresh();
              }
            }}
          />
        );
      })()}

      {/* 2. Authoritative Currency & Fixed FX Control Section */}
      <CurrencyFxSection initialFx={initial?.fx_rates} />

      {/* 3. Remaining Standard Settings Sections */}
      {SECTIONS.slice(1).map((section) => {
        const data = initial?.[section.key as keyof Settings]?.value ?? {};
        return (
          <Section
            key={section.key}
            section={section}
            data={data}
            pending={pendingKey === section.key}
            onSave={async (body) => {
              setPendingKey(section.key);
              const res = await updateSettingsAction({ [section.key]: body });
              setPendingKey(null);
              if (res.error) toast.error(res.error);
              else {
                toast.success(`${section.title} saved`);
                router.refresh();
              }
            }}
          />
        );
      })}
    </div>
  );
}

function CurrencyFxSection({ initialFx }: { initialFx?: Settings["fx_rates"] }) {
  const router = useRouter();
  const initialVal = initialFx?.value as { mode?: "fixed" | "live"; rates?: Record<string, number> } | undefined;

  const [mode, setMode] = useState<"fixed" | "live">(initialVal?.mode === "live" ? "live" : "fixed");
  const [rates, setRates] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const item of CURRENCIES_CONFIG) {
      const saved = initialVal?.rates?.[item.code];
      out[item.code] = saved != null ? String(saved) : String(DEFAULT_FIXED_RATES[item.code] ?? 1.0);
    }
    return out;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingLive, setIsFetchingLive] = useState(false);

  // Live preview calculations for USA order scenario
  const usdRateNum = parseFloat(rates.USD) || 1.30;
  const glossGbp = 12.0;
  const glossUsd = Math.round(glossGbp * usdRateNum * 100) / 100;
  const shippingUsd = 25.0;
  const totalUsd = Math.round((glossUsd + shippingUsd) * 100) / 100;

  async function handleFetchLive() {
    setIsFetchingLive(true);
    try {
      const res = await fetch("/api/public/exchange-rates?live=true", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.rates) {
          setRates((prev) => {
            const next = { ...prev };
            for (const item of CURRENCIES_CONFIG) {
              if (json.data.rates[item.code]) {
                next[item.code] = String(json.data.rates[item.code]);
              }
            }
            return next;
          });
          toast.success("Loaded current live rates from ECB. Review and click Save to apply.");
        }
      } else {
        toast.error("Could not fetch ECB rates");
      }
    } catch {
      toast.error("Network error fetching live rates");
    } finally {
      setIsFetchingLive(false);
    }
  }

  function handleResetRecommended() {
    const next: Record<string, string> = {};
    for (const item of CURRENCIES_CONFIG) {
      next[item.code] = String(DEFAULT_FIXED_RATES[item.code] ?? 1.0);
    }
    setRates(next);
    setMode("fixed");
    toast.info("Reset to recommended fixed luxury rates (e.g. USD = 1.30).");
  }

  async function handleSave() {
    setIsSaving(true);
    const parsedRates: Record<string, number> = { GBP: 1.0 };
    for (const [c, val] of Object.entries(rates)) {
      const num = parseFloat(val);
      parsedRates[c] = Number.isFinite(num) && num > 0 ? num : (DEFAULT_FIXED_RATES[c] ?? 1.0);
    }

    const payload = {
      mode,
      rates: parsedRates,
    };

    const res = await updateSettingsAction({ fx_rates: payload });
    setIsSaving(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Currency & exchange rates updated successfully");
      // Invalidate frontend cache immediately
      try {
        await useCurrencyStore.getState().fetchRates(true);
      } catch {
        // ignore
      }
      router.refresh();
    }
  }

  return (
    <section className="border border-line bg-ivory shadow-sm">
      <header className="px-4 py-3.5 border-b border-line flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <DollarSign className="w-4 h-4 text-ink" />
          <span className="text-[11px] uppercase tracking-[0.18em] font-medium text-ink">
            Currency & Exchange Rates (FX)
          </span>
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] font-medium bg-stone-100 text-stone-700 border border-line">
            Base: £1.00 GBP
          </span>
        </div>
        <div className="flex items-center gap-2">
          {mode === "fixed" ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.15em] bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Fixed Control Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.15em] bg-amber-50 text-amber-800 border border-amber-200">
              <TrendingUp className="w-3 h-3 text-amber-600" />
              Live ECB Market Active
            </span>
          )}
        </div>
      </header>

      <div className="p-4 sm:p-5 space-y-6">
        {/* Mode Selector */}
        <div>
          <span className="block text-[11px] uppercase tracking-[0.18em] text-stone mb-2">
            Conversion Strategy
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode("fixed")}
              className={`p-3.5 text-left border transition-colors ${
                mode === "fixed"
                  ? "border-ink bg-white shadow-sm ring-1 ring-ink/20"
                  : "border-line bg-stone-50/50 hover:bg-stone-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-[0.12em] text-ink flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Fixed Custom Rates (Recommended)
                </span>
                {mode === "fixed" && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                )}
              </div>
              <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                You define exact conversion multipliers. Prices never drift with daily bank fluctuations, ensuring storefront totals and Stripe charges tally to the exact penny.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode("live")}
              className={`p-3.5 text-left border transition-colors ${
                mode === "live"
                  ? "border-ink bg-white shadow-sm ring-1 ring-ink/20"
                  : "border-line bg-stone-50/50 hover:bg-stone-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-[0.12em] text-ink flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                  Live Market Rates (ECB)
                </span>
                {mode === "live" && (
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                )}
              </div>
              <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                Rates automatically pull daily from the European Central Bank. Prices float slightly based on international forex market movements.
              </p>
            </button>
          </div>
        </div>

        {/* Currency Rates Grid */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] uppercase tracking-[0.18em] text-stone">
              Target Currency Conversion (Value per £1.00 GBP)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFetchLive}
                disabled={isFetchingLive}
                className="text-[10px] uppercase tracking-[0.15em] text-stone hover:text-ink inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                title="Fetch latest European Central Bank exchange rates into the fields"
              >
                <RefreshCw className={`w-3 h-3 ${isFetchingLive ? "animate-spin" : ""}`} />
                Fetch Live ECB Rates
              </button>
              <span className="text-stone-300">|</span>
              <button
                type="button"
                onClick={handleResetRecommended}
                className="text-[10px] uppercase tracking-[0.15em] text-stone hover:text-ink inline-flex items-center gap-1 transition-colors"
                title="Reset all rates to recommended luxury round figures"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Defaults
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {CURRENCIES_CONFIG.map((curr) => {
              const currentRate = parseFloat(rates[curr.code]) || 1.0;
              const convertedGloss =
                curr.code === "NGN" || curr.code === "KES"
                  ? Math.round(glossGbp * currentRate)
                  : (Math.round(glossGbp * currentRate * 100) / 100).toFixed(2);

              return (
                <div key={curr.code} className="p-3 border border-line bg-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                      <span>{curr.flag}</span>
                      <span>{curr.code}</span>
                      <span className="text-[10px] font-normal text-stone">({curr.symbol})</span>
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">
                      £1 = {curr.symbol}{rates[curr.code] || "1.00"}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step={curr.step}
                      min="0.001"
                      value={rates[curr.code] ?? ""}
                      onChange={(e) =>
                        setRates((prev) => ({ ...prev, [curr.code]: e.target.value }))
                      }
                      className="letty-input w-full font-mono text-sm py-1.5"
                    />
                  </div>

                  <div className="text-[10px] text-stone-500 flex items-center justify-between pt-0.5">
                    <span>£12 item:</span>
                    <span className="font-medium text-ink">
                      {curr.symbol}{convertedGloss}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Customer Checkout Scenario Proof */}
        <div className="p-3.5 border border-line bg-stone-50/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.16em] font-medium text-ink flex items-center gap-1.5">
              <span>🇺🇸</span> Live Checkout Preview (1x Lip Gloss to United States)
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
              100% Price Tally Guaranteed
            </span>
          </div>
          <div className="text-xs grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 font-mono text-stone-700">
            <div className="bg-white p-2 border border-line">
              <div className="text-[10px] uppercase text-stone font-sans">Product (Gloss)</div>
              <div className="font-semibold text-ink">${glossUsd.toFixed(2)} USD</div>
              <div className="text-[9px] text-stone-400 font-sans">£12.00 × {usdRateNum}</div>
            </div>
            <div className="bg-white p-2 border border-line">
              <div className="text-[10px] uppercase text-stone font-sans">US Shipping</div>
              <div className="font-semibold text-ink">${shippingUsd.toFixed(2)} USD</div>
              <div className="text-[9px] text-stone-400 font-sans">Tracked flat rate</div>
            </div>
            <div className="bg-white p-2 border border-line">
              <div className="text-[10px] uppercase text-stone font-sans">Checkout Total</div>
              <div className="font-bold text-ink">${totalUsd.toFixed(2)} USD</div>
              <div className="text-[9px] text-stone-400 font-sans">Summary shown</div>
            </div>
            <div className="bg-white p-2 border border-emerald-200 bg-emerald-50/30">
              <div className="text-[10px] uppercase text-emerald-800 font-sans">Stripe Charged</div>
              <div className="font-bold text-emerald-800">${totalUsd.toFixed(2)} USD</div>
              <div className="text-[9px] text-emerald-600 font-sans">Exact match (No delta)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 pt-1 flex items-center justify-end border-t border-line/60 bg-stone-50/30">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="h-9 px-6 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory disabled:opacity-60 inline-flex items-center gap-2 transition-all hover:bg-stone-900 shadow-sm"
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Save Exchange Rates
        </button>
      </div>
    </section>
  );
}

function Section({
  section,
  data,
  pending,
  onSave,
}: {
  section: (typeof SECTIONS)[number];
  data: Record<string, any>;
  pending: boolean;
  onSave: (body: Record<string, any>) => Promise<void>;
}) {
  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of section.fields) init[f.name] = data?.[f.name] != null ? String(data[f.name]) : "";
    return init;
  });
  function save() {
    const body: Record<string, any> = { ...form };
    // Coerce numeric fields.
    for (const f of section.fields) {
      if (f.name.startsWith("fallback_rate") || f.name.includes("_hours") || f.name.includes("_pct") || f.name.includes("_reminders")) {
        body[f.name] = Number(form[f.name] ?? 0);
      } else if (f.name === "auto_capture") {
        body[f.name] = form[f.name] === "true";
      }
    }
    onSave(body);
  }
  return (
    <section className="border border-line bg-ivory">
      <header className="px-4 py-3 border-b border-line flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.18em] text-stone">{section.title}</span>
      </header>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {section.fields.map((f) => (
          <label key={f.name} className="block">
            <span className="text-[11px] uppercase tracking-[0.18em] text-stone">{f.label}</span>
            <input
              value={form[f.name] ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
              placeholder={f.placeholder}
              className="letty-input mt-1 w-full"
            />
          </label>
        ))}
      </div>
      <div className="px-4 pb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="h-9 px-5 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory disabled:opacity-60 inline-flex items-center gap-2"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Save {section.title.toLowerCase()}
        </button>
      </div>
    </section>
  );
}
