"use client";

/**
 * CatalogManager — brands + categories in two stacked sections.
 * Each is a small inline-add + inline-edit list.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  createBrandAction,
  updateBrandAction,
  deleteBrandAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/lib/actions/admin-settings";

interface Brand {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}
interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  is_active: boolean;
  position: number;
  created_at: string;
}

export function CatalogManager({
  initialBrands,
  initialCategories,
}: {
  initialBrands: Brand[];
  initialCategories: Category[];
}) {
  const router = useRouter();
  return (
    <div className="space-y-10">
      <BrandsSection brands={initialBrands} onChange={() => router.refresh()} />
      <CategoriesSection categories={initialCategories} onChange={() => router.refresh()} />
    </div>
  );
}

function BrandsSection({ brands, onChange }: { brands: Brand[]; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");

  function add() {
    if (!name.trim()) return;
    startTransition(async () => {
      const res = await createBrandAction({ name: name.trim() });
      if (res.error) toast.error(res.error);
      else {
        toast.success("Brand created");
        setName("");
        setOpen(false);
        onChange();
      }
    });
  }

  return (
    <section>
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-stone">Brands</h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink hover:text-stone"
        >
          <Plus className="h-3.5 w-3.5" />
          New brand
        </button>
      </header>
      <div className="border border-line bg-ivory">
        {brands.length === 0 && !open ? (
          <p className="px-4 py-8 text-center text-sm text-stone">No brands yet.</p>
        ) : (
          <ul>
            {brands.map((b) => (
              <BrandRow key={b.id} brand={b} onChange={onChange} />
            ))}
          </ul>
        )}
        {open ? (
          <div className="border-t border-line p-4 flex items-center justify-end gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Brand name"
              className="letty-input flex-1"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-9 px-3 text-[11px] uppercase tracking-[0.18em] text-stone"
            >
              <X className="h-3.5 w-3.5 inline mr-1" />
              Cancel
            </button>
            <button
              type="button"
              onClick={add}
              disabled={pending}
              className="h-9 px-4 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory disabled:opacity-60 inline-flex items-center gap-2"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Add
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function BrandRow({ brand, onChange }: { brand: Brand; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(brand.name);
  const [active, setActive] = useState(brand.is_active);

  function save() {
    startTransition(async () => {
      const res = await updateBrandAction(brand.id, { name, is_active: active });
      if (res.error) toast.error(res.error);
      else {
        toast.success("Saved");
        setEditing(false);
        onChange();
      }
    });
  }
  function remove() {
    if (!confirm(`Deactivate brand "${brand.name}"?`)) return;
    startTransition(async () => {
      const res = await deleteBrandAction(brand.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Deactivated");
        onChange();
      }
    });
  }

  return (
    <li className="border-b border-line last:border-0 px-4 py-3 flex items-center justify-between gap-3">
      {editing ? (
        <div className="flex-1 flex items-center justify-end gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} className="letty-input flex-1" />
          <label className="inline-flex items-center gap-2 h-9 px-3 border border-line text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-3.5 w-3.5 accent-ink" />
            <span className="text-stone">Active</span>
          </label>
          <button type="button" onClick={save} disabled={pending} className="h-8 px-3 text-[10px] uppercase tracking-[0.18em] bg-ink text-ivory">
            Save
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm text-ink">{brand.name}</span>
            <span className="font-mono text-[11px] text-stone">{brand.slug}</span>
            <span className={`inline-block h-2 w-2 ${brand.is_active ? "bg-ink" : "bg-stone/30"}`} />
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setEditing(true)} className="h-7 px-2 text-[10px] uppercase tracking-[0.18em] text-stone hover:text-ink inline-flex items-center gap-1">
              <ChevronRight className="h-3 w-3" /> Edit
            </button>
            <button type="button" onClick={remove} aria-label="Deactivate" className="h-7 w-7 grid place-items-center text-stone hover:text-ink">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}
    </li>
  );
}

function CategoriesSection({ categories, onChange }: { categories: Category[]; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");

  function add() {
    if (!name.trim()) return;
    startTransition(async () => {
      const res = await createCategoryAction({ name: name.trim(), parent_id: parentId || null, is_active: true });
      if (res.error) toast.error(res.error);
      else {
        toast.success("Category created");
        setName("");
        setParentId("");
        setOpen(false);
        onChange();
      }
    });
  }

  return (
    <section>
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-stone">Categories</h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink hover:text-stone"
        >
          <Plus className="h-3.5 w-3.5" />
          New category
        </button>
      </header>
      <div className="border border-line bg-ivory">
        {categories.length === 0 && !open ? (
          <p className="px-4 py-8 text-center text-sm text-stone">No categories yet.</p>
        ) : (
          <ul>
            {categories.map((c) => (
              <CategoryRow key={c.id} category={c} all={categories} onChange={onChange} />
            ))}
          </ul>
        )}
        {open ? (
          <div className="border-t border-line p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
              className="letty-input"
            />
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="letty-input">
              <option value="">— No parent —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="h-9 px-3 text-[11px] uppercase tracking-[0.18em] text-stone">Cancel</button>
              <button type="button" onClick={add} disabled={pending} className="h-9 px-4 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory disabled:opacity-60 inline-flex items-center gap-2">
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Add
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function CategoryRow({ category, all, onChange }: { category: Category; all: Category[]; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(category.name);
  const [parentId, setParentId] = useState(category.parent_id ?? "");
  const [active, setActive] = useState(category.is_active);
  const [position, setPosition] = useState(category.position);

  function save() {
    startTransition(async () => {
      const res = await updateCategoryAction(category.id, {
        name,
        parent_id: parentId || null,
        is_active: active,
        position,
      });
      if (res.error) toast.error(res.error);
      else {
        toast.success("Saved");
        setEditing(false);
        onChange();
      }
    });
  }
  function remove() {
    if (!confirm(`Deactivate category "${category.name}"?`)) return;
    startTransition(async () => {
      const res = await deleteCategoryAction(category.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Deactivated");
        onChange();
      }
    });
  }

  return (
    <li className="border-b border-line last:border-0 px-4 py-3">
      {editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} className="letty-input" placeholder="Name" />
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="letty-input">
              <option value="">— No parent —</option>
              {all.filter((c) => c.id !== category.id).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="number"
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
              className="letty-input tabular-nums"
              placeholder="Position"
            />
            <label className="inline-flex items-center gap-2 h-10 px-3 border border-line text-sm">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-3.5 w-3.5 accent-ink" />
              <span className="text-stone">Active</span>
            </label>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} className="h-8 px-3 text-[10px] uppercase tracking-[0.18em] text-stone">Cancel</button>
            <button type="button" onClick={save} disabled={pending} className="h-8 px-4 text-[10px] uppercase tracking-[0.18em] bg-ink text-ivory">Save</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm text-ink">{category.name}</span>
            <span className="font-mono text-[11px] text-stone">{category.slug}</span>
            {category.parent_id ? <span className="text-[11px] uppercase tracking-[0.18em] text-stone">sub</span> : null}
            <span className="text-[11px] uppercase tracking-[0.18em] text-stone">pos {category.position}</span>
            <span className={`inline-block h-2 w-2 ${category.is_active ? "bg-ink" : "bg-stone/30"}`} />
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setEditing(true)} className="h-7 px-2 text-[10px] uppercase tracking-[0.18em] text-stone hover:text-ink inline-flex items-center gap-1">
              <ChevronRight className="h-3 w-3" /> Edit
            </button>
            <button type="button" onClick={remove} aria-label="Deactivate" className="h-7 w-7 grid place-items-center text-stone hover:text-ink">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
