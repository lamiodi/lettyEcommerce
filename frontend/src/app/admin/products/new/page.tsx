/**
 * /admin/products/new — create a new product.
 * Renders the shared ProductForm in "create" mode.
 */
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/products/product-form";

interface Option {
  id: string;
  name: string;
  slug: string;
}

interface OptionsResponse {
  brands: Option[];
  categories: Option[];
}

export const dynamic = "force-dynamic";

async function fetchOptions(): Promise<OptionsResponse> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  try {
    const res = await fetch(`${base}/api/admin/options`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return { brands: [], categories: [] };
    const json = (await res.json()) as { data: OptionsResponse };
    return json.data ?? { brands: [], categories: [] };
  } catch {
    return { brands: [], categories: [] };
  }
}

export default async function NewProductPage() {
  const options = await fetchOptions();
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-stone hover:text-ink"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to products
        </Link>
        <h2 className="font-serif text-2xl text-ink mt-2">New product</h2>
        <p className="text-xs text-stone mt-1">
          Save the basics first — you can add variants and media after the product exists.
        </p>
      </div>
      <ProductForm
        mode="create"
        options={options}
        product={null}
        initialMedia={[]}
        initialVariants={[]}
      />
    </div>
  );
}
