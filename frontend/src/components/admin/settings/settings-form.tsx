"use client";

/**
 * SettingsForm — five sections. Each section saves independently.
 * No nested tabs, no JSON editor: every field is a plain input.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateSettingsAction } from "@/lib/actions/admin-settings";

interface Settings {
  store: { value: any; description: string | null; updated_at: string };
  contact: { value: any; description: string | null; updated_at: string };
  shipping: { value: any; description: string | null; updated_at: string };
  payments: { value: any; description: string | null; updated_at: string };
  marketing: { value: any; description: string | null; updated_at: string };
}

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
      { name: "email", label: "Email", placeholder: "hello@letty.com" },
      { name: "phone", label: "Phone", placeholder: "+1 000 000 0000" },
      { name: "instagram", label: "Instagram handle", placeholder: "@letty" },
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
      {SECTIONS.map((section) => {
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
