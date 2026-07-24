"use client";

/**
 * ProductForm — shared client form for create + edit. Editorial
 * hairline layout, bottom-borderless inputs, single "Save" button at
 * the end. Toggles for status flags use a minimalist checkbox style.
 *
 * Props:
 *  - mode: "create" | "edit"
 *  - product: existing product (edit mode) or null
 *  - options: { brands, categories } for selects
 *  - initialMedia / initialVariants: unused here; only the page uses
 *    them to render the sibling sections
 */
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createProductAction,
  updateProductAction,
  type ProductPayload,
  type ProductUpdatePayload,
} from "@/lib/actions/admin-products";

interface Option {
  id: string;
  name: string;
  slug: string;
}

interface FormProduct {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  short_description: string | null;
  base_price_ngn: number;
  base_price_usd: number;
  compare_at_price_ngn: number | null;
  compare_at_price_usd: number | null;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  brand_id: string | null;
  category_id: string | null;
}

interface ProductFormProps {
  mode: "create" | "edit";
  product: FormProduct | null;
  options: { brands: Option[]; categories: Option[] };
  // The next two are required for typing parity with the parent page,
  // even though this component doesn't render them directly.
  initialMedia?: unknown[];
  initialVariants?: unknown[];
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function ProductForm({ mode, product, options }: ProductFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [slugTouched, setSlugTouched] = useState<boolean>(mode === "edit");

  const [form, setForm] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    brand_id: product?.brand_id ?? "",
    category_id: product?.category_id ?? "",
    description: product?.description ?? "",
    short_description: product?.short_description ?? "",
    base_price_ngn: product?.base_price_ngn ?? 0,
    base_price_usd: product?.base_price_usd ?? 0,
    compare_at_price_ngn: product?.compare_at_price_ngn ?? "",
    compare_at_price_usd: product?.compare_at_price_usd ?? "",
    is_active: product?.is_active ?? true,
    is_featured: product?.is_featured ?? false,
    is_new: product?.is_new ?? false,
    is_bestseller: product?.is_bestseller ?? false,
  });

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "name" && !slugTouched) {
        next.slug = slugify(String(v));
      }
      return next;
    });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (form.base_price_ngn < 0 || form.base_price_usd < 0) {
      toast.error("Prices must be non-negative");
      return;
    }
    const compare_ngn =
      form.compare_at_price_ngn === "" ? null : Number(form.compare_at_price_ngn);
    const compare_usd =
      form.compare_at_price_usd === "" ? null : Number(form.compare_at_price_usd);

    startTransition(async () => {
      if (mode === "create") {
        const payload: ProductPayload = {
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          brand_id: form.brand_id || null,
          category_id: form.category_id || null,
          description: form.description || null,
          short_description: form.short_description || null,
          base_price_ngn: Number(form.base_price_ngn),
          base_price_usd: Number(form.base_price_usd),
          compare_at_price_ngn: compare_ngn,
          compare_at_price_usd: compare_usd,
          is_active: form.is_active,
          is_featured: form.is_featured,
          is_new: form.is_new,
          is_bestseller: form.is_bestseller,
        };
        const res = await createProductAction(payload);
        if (res.error || !res.data) {
          toast.error(res.error ?? "Could not create product");
          return;
        }
        toast.success("Product created");
        router.push(`/admin/products/${res.data.id}`);
        router.refresh();
      } else {
        const payload: ProductUpdatePayload = {
          name: form.name.trim(),
          brand_id: form.brand_id || null,
          category_id: form.category_id || null,
          description: form.description || null,
          short_description: form.short_description || null,
          base_price_ngn: Number(form.base_price_ngn),
          base_price_usd: Number(form.base_price_usd),
          compare_at_price_ngn: compare_ngn,
          compare_at_price_usd: compare_usd,
          is_active: form.is_active,
          is_featured: form.is_featured,
          is_new: form.is_new,
          is_bestseller: form.is_bestseller,
        };
        const res = await updateProductAction(product!.id, payload);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success("Saved");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="border border-line bg-ivory p-5 sm:p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Name" required>
          <input
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            className="letty-input"
            required
            maxLength={200}
          />
        </Field>
        <Field label="Slug" hint="Lowercase, hyphens only. Leave blank to auto-generate.">
          <input
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setField("slug", e.target.value);
            }}
            className="letty-input font-mono text-sm"
            maxLength={160}
            pattern="[a-z0-9-]*"
          />
        </Field>
        <Field label="Brand">
          <select
            value={form.brand_id}
            onChange={(e) => setField("brand_id", e.target.value)}
            className="letty-input"
          >
            <option value="">— None —</option>
            {options.brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Category">
          <select
            value={form.category_id}
            onChange={(e) => setField("category_id", e.target.value)}
            className="letty-input"
          >
            <option value="">— None —</option>
            {options.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Short description" hint="Up to 400 characters. Shown on cards and search results.">
        <textarea
          value={form.short_description}
          onChange={(e) => setField("short_description", e.target.value)}
          className="letty-input min-h-[80px] resize-y"
          maxLength={400}
        />
      </Field>
      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          className="letty-input min-h-[180px] resize-y"
        />
      </Field>

      <div className="border-t border-line pt-6 space-y-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-stone">Pricing</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Base price · NGN" required>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.base_price_ngn}
              onChange={(e) => setField("base_price_ngn", e.target.value as unknown as number)}
              className="letty-input tabular-nums"
            />
          </Field>
          <Field label="Base price · USD" required>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.base_price_usd}
              onChange={(e) => setField("base_price_usd", e.target.value as unknown as number)}
              className="letty-input tabular-nums"
            />
          </Field>
          <Field label="Compare-at · NGN" hint="Optional. Shown strikethrough when set higher than base.">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.compare_at_price_ngn}
              onChange={(e) => setField("compare_at_price_ngn", e.target.value)}
              className="letty-input tabular-nums"
            />
          </Field>
          <Field label="Compare-at · USD">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.compare_at_price_usd}
              onChange={(e) => setField("compare_at_price_usd", e.target.value)}
              className="letty-input tabular-nums"
            />
          </Field>
        </div>
      </div>

      <div className="border-t border-line pt-6 space-y-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-stone">Status & merchandising</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Toggle
            label="Active"
            hint="Live on the storefront"
            checked={form.is_active}
            onChange={(v) => setField("is_active", v)}
          />
          <Toggle
            label="Featured"
            hint="Show in featured row"
            checked={form.is_featured}
            onChange={(v) => setField("is_featured", v)}
          />
          <Toggle
            label="New"
            hint="Show 'New' badge"
            checked={form.is_new}
            onChange={(v) => setField("is_new", v)}
          />
          <Toggle
            label="Bestseller"
            hint="Show 'Bestseller' badge"
            checked={form.is_bestseller}
            onChange={(v) => setField("is_bestseller", v)}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="h-10 px-5 text-[11px] uppercase tracking-[0.18em] text-stone hover:text-ink transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="h-10 px-6 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory hover:bg-stone transition disabled:opacity-60 inline-flex items-center gap-2"
        >
          {pending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {mode === "create" ? "Creating…" : "Saving…"}
            </>
          ) : mode === "create" ? (
            "Create product"
          ) : (
            "Save changes"
          )}
        </button>
      </div>

      {/* Local input class — registered in globals.css as hairline, no rounded corners. */}
      <style jsx>{`
        :global(.letty-input) {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid #ECECEC;
          padding: 0.5rem 0;
          font-size: 0.875rem;
          color: #111111;
          transition: border-color 0.2s ease;
          border-radius: 0;
        }
        :global(.letty-input:focus) {
          outline: none;
          border-bottom-color: #111111;
        }
        :global(.letty-input:disabled) {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.18em] text-stone">
        {label}
        {required ? <span className="text-ink"> *</span> : null}
      </span>
      <div className="mt-1">{children}</div>
      {hint ? <span className="mt-1 block text-[11px] text-stone">{hint}</span> : null}
    </label>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`text-left border p-4 transition ${
        checked ? "border-ink bg-ivory" : "border-line hover:border-stone"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.18em] text-ink">{label}</span>
        <span
          className={`inline-flex h-4 w-7 items-center border ${
            checked ? "border-ink bg-ink" : "border-line bg-ivory"
          }`}
        >
          <span
            className={`block h-3 w-3 transform bg-ivory transition ${
              checked ? "translate-x-3" : "translate-x-0.5"
            } ${checked ? "bg-ivory" : "bg-stone/40"}`}
          />
        </span>
      </div>
      {hint ? <p className="mt-2 text-[11px] text-stone">{hint}</p> : null}
    </button>
  );
}
