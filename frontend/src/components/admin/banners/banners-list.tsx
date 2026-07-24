"use client";

/**
 * BannersList — flat list with inline edit row, add form at top.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  createBannerAction,
  updateBannerAction,
  deleteBannerAction,
} from "@/lib/actions/admin-settings";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  position: number;
  starts_at: string | null;
  ends_at: string | null;
}

interface BannerFormState {
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  position: number;
  starts_at: string;
  ends_at: string;
}

function empty(): BannerFormState {
  return { title: "", subtitle: "", image_url: "", link_url: "", is_active: true, position: 0, starts_at: "", ends_at: "" };
}

function bannerToForm(b: Banner): BannerFormState {
  return {
    title: b.title,
    subtitle: b.subtitle ?? "",
    image_url: b.image_url ?? "",
    link_url: b.link_url ?? "",
    is_active: b.is_active,
    position: b.position,
    starts_at: b.starts_at?.slice(0, 16) ?? "",
    ends_at: b.ends_at?.slice(0, 16) ?? "",
  };
}

export function BannersList({ initial }: { initial: Banner[] }) {
  const router = useRouter();
  return (
    <div className="border border-line bg-ivory">
      {initial.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-stone">No banners yet.</p>
      ) : (
        <ul>
          {initial.map((b) => (
            <Row key={b.id} banner={b} onChange={() => router.refresh()} />
          ))}
        </ul>
      )}
      <AddForm onDone={() => router.refresh()} />
    </div>
  );
}

function Row({ banner, onChange }: { banner: Banner; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<BannerFormState>(bannerToForm(banner));

  function save() {
    startTransition(async () => {
      const body: Record<string, any> = {
        title: form.title.trim(),
        subtitle: form.subtitle || null,
        image_url: form.image_url || null,
        link_url: form.link_url || null,
        is_active: form.is_active,
        position: Number(form.position) || 0,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      };
      const res = await updateBannerAction(banner.id, body);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Saved");
        setEditing(false);
        onChange();
      }
    });
  }

  function remove() {
    if (!confirm("Delete this banner?")) return;
    startTransition(async () => {
      const res = await deleteBannerAction(banner.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Deleted");
        onChange();
      }
    });
  }

  if (editing) {
    return (
      <li className="border-b border-line last:border-0 p-4 bg-ivory space-y-3">
        <BannerFormFields form={form} setForm={setForm} />
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="h-8 px-3 text-[10px] uppercase tracking-[0.18em] text-stone"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="h-8 px-4 text-[10px] uppercase tracking-[0.18em] bg-ink text-ivory disabled:opacity-60 inline-flex items-center gap-2"
          >
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Save
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="border-b border-line last:border-0 px-4 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-ink">{banner.title}</p>
        {banner.subtitle ? <p className="text-xs text-stone">{banner.subtitle}</p> : null}
        <p className="text-[11px] uppercase tracking-[0.18em] text-stone mt-1">
          {banner.position >= 0 ? `pos ${banner.position}` : ""}
          {banner.starts_at ? ` · from ${new Date(banner.starts_at).toLocaleDateString()}` : ""}
          {banner.ends_at ? ` · until ${new Date(banner.ends_at).toLocaleDateString()}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <span
          className={`inline-block h-2 w-2 ${banner.is_active ? "bg-ink" : "bg-stone/30"}`}
          aria-label={banner.is_active ? "active" : "inactive"}
        />
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="h-7 px-2 text-[10px] uppercase tracking-[0.18em] text-stone hover:text-ink inline-flex items-center gap-1"
        >
          <ChevronRight className="h-3 w-3" />
          Edit
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          aria-label="Delete"
          className="h-7 w-7 grid place-items-center text-stone hover:text-ink"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

function AddForm({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<BannerFormState>(empty());

  function submit() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    startTransition(async () => {
      const body: Record<string, any> = {
        title: form.title.trim(),
        subtitle: form.subtitle || null,
        image_url: form.image_url || null,
        link_url: form.link_url || null,
        is_active: form.is_active,
        position: Number(form.position) || 0,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      };
      const res = await createBannerAction(body);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Banner created");
        setOpen(false);
        setForm(empty());
        onDone();
      }
    });
  }

  if (!open) {
    return (
      <div className="px-4 py-3 border-t border-line">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink hover:text-stone"
        >
          <Plus className="h-3.5 w-3.5" />
          New banner
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-line p-4 space-y-3 bg-ivory">
      <BannerFormFields form={form} setForm={setForm} />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-9 px-4 text-[11px] uppercase tracking-[0.18em] text-stone"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="h-9 px-5 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory disabled:opacity-60 inline-flex items-center gap-2"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Create banner
        </button>
      </div>
    </div>
  );
}

function BannerFormFields({
  form,
  setForm,
}: {
  form: BannerFormState;
  setForm: (v: BannerFormState) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Title *</span>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="letty-input mt-1 w-full"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Subtitle</span>
          <input
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            className="letty-input mt-1 w-full"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Image URL</span>
          <input
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            className="letty-input mt-1 w-full"
            placeholder="https://…"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Link URL</span>
          <input
            value={form.link_url}
            onChange={(e) => setForm({ ...form, link_url: e.target.value })}
            className="letty-input mt-1 w-full"
            placeholder="https://… or /shop/…"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Position</span>
          <input
            type="number"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
            className="letty-input mt-1 w-full tabular-nums"
          />
        </label>
        <label className="block sm:col-span-1">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Starts</span>
          <input
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
            className="letty-input mt-1 w-full"
          />
        </label>
        <label className="block sm:col-span-1">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Ends</span>
          <input
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            className="letty-input mt-1 w-full"
          />
        </label>
      </div>
      <label className="inline-flex items-center gap-2 h-9 px-3 border border-line text-sm">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          className="h-3.5 w-3.5 accent-ink"
        />
        <span className="text-stone">Active</span>
      </label>
    </div>
  );
}
