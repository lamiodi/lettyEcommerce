/**
 * /admin/products/[id] — product edit screen.
 * Tabs: Details · Variants · Media. Saves details inline, then
 * delegates to the VariantsMatrix and MediaManager for the rest.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { ProductForm } from "@/components/admin/products/product-form";
import { VariantsMatrix } from "@/components/admin/products/variants-matrix";
import { MediaManager } from "@/components/admin/products/media-manager";

interface Option {
  id: string;
  name: string;
  slug: string;
}
interface OptionsResponse {
  brands: Option[];
  categories: Option[];
}

interface VariantOption {
  id: string;
  option_name: string;
  option_value: string;
}
interface Variant {
  id: string;
  sku: string;
  barcode: string | null;
  price_override_ngn: number | null;
  price_override_usd: number | null;
  weight_grams: number | null;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  position: number;
  variant_options: VariantOption[];
}
interface Media {
  id: string;
  url: string;
  alt_text: string | null;
  position: number;
  is_primary: boolean;
  type: "image" | "video";
  created_at: string;
}
interface Product {
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
  brand: Option | null;
  category: Option | null;
  product_media: Media[];
  product_variants: Variant[];
}

export const dynamic = "force-dynamic";

async function fetchJSON<T>(path: string): Promise<T | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const cookieHeader = cookies().getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  try {
    const res = await fetch(`${base}${path}`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: T };
    return json.data;
  } catch {
    return null;
  }
}

export default async function EditProductPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [product, options] = await Promise.all([
    fetchJSON<Product>(`/api/admin/products/${id}`),
    fetchJSON<OptionsResponse>(`/api/admin/options`),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-stone hover:text-ink"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to products
          </Link>
          <h2 className="font-serif text-2xl text-ink mt-2">{product.name}</h2>
          <p className="text-xs text-stone mt-1">
            /{product.slug}
          </p>
        </div>
        <Link
          href={`/product/${product.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-stone hover:text-ink"
        >
          View on site <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <section className="space-y-3">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-stone">Details</h3>
        <ProductForm
          mode="edit"
          product={product}
          options={options ?? { brands: [], categories: [] }}
          initialMedia={product.product_media ?? []}
          initialVariants={product.product_variants ?? []}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-stone">Variants</h3>
        <VariantsMatrix productId={product.id} initial={product.product_variants ?? []} />
      </section>

      <section className="space-y-3">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-stone">Media</h3>
        <MediaManager productId={product.id} initial={product.product_media ?? []} />
      </section>
    </div>
  );
}
