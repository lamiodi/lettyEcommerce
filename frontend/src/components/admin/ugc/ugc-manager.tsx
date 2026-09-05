"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Film,
  Loader2,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { UgcVideo } from "@/lib/data/ugc-videos";
import {
  createUgcVideoAction,
  updateUgcVideoAction,
  deleteUgcVideoAction,
} from "@/lib/actions/admin-ugc";

// Preset products and shades for quick tagging
interface CatalogProductPreset {
  slug: string;
  name: string;
  price: string;
  shades: Array<{ shade: string; image: string }>;
}

const CATALOG_PRESETS: CatalogProductPreset[] = [
  {
    slug: "letty-velvet-lip-liner",
    name: "Letty Velvet Sculpt Lip Liner",
    price: "£9.00",
    shades: [
      { shade: "01 Cafe Creme", image: "/products/lip-liner/01-cafe-creme/IMG_6625 (1).PNG" },
      { shade: "02 Cocoa Bean", image: "/products/lip-liner/02-cocoa-bean/IMG_6626 (1).PNG" },
      { shade: "03 Honeycomb", image: "/products/lip-liner/03-honeycomb/IMG_6627.PNG" },
      { shade: "04 Crimson", image: "/products/lip-liner/04-crimson/IMG_6628.PNG" },
      { shade: "05 Terra", image: "/products/lip-liner/05-terra/IMG_6629.PNG" },
      { shade: "06 Chestnut", image: "/products/lip-liner/06-chestnut/IMG_6631.PNG" },
      { shade: "07 Nightfall", image: "/products/lip-liner/07-nightfall/IMG_6632.PNG" },
    ],
  },
  {
    slug: "letty-glass-lip-gloss",
    name: "Letty Glass Shine Lip Gloss",
    price: "£12.00",
    shades: [
      { shade: "01 Berry Glow", image: "/products/lip-gloss/01-berry-glow/IMG_6590.PNG" },
      { shade: "02 Rich Mocha", image: "/products/lip-gloss/02-rich-mocha/IMG_6597.PNG" },
      { shade: "03 Plum Wine", image: "/products/lip-gloss/03-plum-wine/IMG_6603.PNG" },
      { shade: "04 Velvet Nude", image: "/products/lip-gloss/04-velvet-nude/IMG_6606.PNG" },
      { shade: "05 Classic Red", image: "/products/lip-gloss/05-classic-red/IMG_6611.PNG" },
      { shade: "06 Midas Touch", image: "/products/lip-gloss/06-midas-touch/IMG_6638.PNG" },
    ],
  },
];

interface VideoFormState {
  id?: string;
  src: string;
  poster: string;
  handle: string;
  caption: string;
  location: string;
  productSlug: string;
  productName: string;
  productShade: string;
  productPrice: string;
  productImage: string;
  isActive: boolean;
}

function emptyForm(): VideoFormState {
  const defaultPreset = CATALOG_PRESETS[0];
  const defaultShade = defaultPreset.shades[0];
  return {
    src: "",
    poster: "",
    handle: "@",
    caption: "",
    location: "London",
    productSlug: defaultPreset.slug,
    productName: defaultPreset.name,
    productShade: defaultShade.shade,
    productPrice: defaultPreset.price,
    productImage: defaultShade.image,
    isActive: true,
  };
}

export function UgcManager({ initial }: { initial: UgcVideo[] }) {
  const router = useRouter();
  const [items, setItems] = useState<UgcVideo[]>(initial);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<UgcVideo | null>(null);
  const [pending, startTransition] = useTransition();

  const handleCreatedOrUpdated = (video: UgcVideo) => {
    setItems((prev) => {
      const idx = prev.findIndex((v) => v.id === video.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = video;
        return next;
      }
      return [video, ...prev];
    });
    setShowAddModal(false);
    setEditingItem(null);
    router.refresh();
  };

  const handleDeleted = (id: string) => {
    setItems((prev) => prev.filter((v) => v.id !== id));
    router.refresh();
  };

  const toggleActive = (video: UgcVideo) => {
    const nextActive = !video.isActive;
    startTransition(async () => {
      const res = await updateUgcVideoAction(video.id, { isActive: nextActive });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(nextActive ? "Video published" : "Video set to hidden");
        setItems((prev) =>
          prev.map((v) => (v.id === video.id ? { ...v, isActive: nextActive } : v)),
        );
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-serif text-2xl font-medium text-ink">UGC Video Wall</h1>
          <p className="mt-1 text-xs text-stone">
            Curate customer video reels and tag matching products &amp; shades with direct store links.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-medium uppercase tracking-luxe text-ivory transition hover:bg-stone active:scale-95 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add UGC Video
        </button>
      </div>

      {/* Video Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((video, idx) => {
          const productUrl = `/products/${video.productSlug}${
            video.productShade ? `?shade=${encodeURIComponent(video.productShade)}` : ""
          }`;

          return (
            <div
              key={video.id || idx}
              className="flex flex-col overflow-hidden rounded-xl border border-line bg-ivory shadow-xs transition hover:shadow-md"
            >
              {/* Video Preview Container */}
              <div className="relative aspect-[9/16] w-full bg-black">
                <video
                  src={video.src}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />

                {/* Status pill */}
                <div className="absolute left-2.5 top-2.5 z-10">
                  <button
                    type="button"
                    onClick={() => toggleActive(video)}
                    disabled={pending}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider backdrop-blur-md transition ${
                      video.isActive
                        ? "border border-emerald-500/40 bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900"
                        : "border border-stone/40 bg-stone/80 text-ivory/80 hover:bg-stone"
                    }`}
                  >
                    {video.isActive ? (
                      <>
                        <Eye className="h-3 w-3" /> Live
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" /> Hidden
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Video Card Details */}
              <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-ink">{video.handle}</span>
                    {video.location && (
                      <span className="text-[10px] uppercase tracking-wider text-stone">
                        {video.location}
                      </span>
                    )}
                  </div>
                  <p className="font-serif text-sm italic text-stone line-clamp-2">
                    &ldquo;{video.caption}&rdquo;
                  </p>
                </div>

                {/* Tagged Product Box */}
                <div className="rounded-lg border border-line bg-secondary/30 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-luxe font-medium text-stone">
                      Tagged Product
                    </span>
                    <Link
                      href={productUrl}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[9px] font-medium text-gold hover:underline"
                    >
                      Test Link <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    {video.productImage ? (
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-line bg-white">
                        <Image
                          src={video.productImage}
                          alt={video.productName}
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
                      </div>
                    ) : (
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line bg-secondary text-stone">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                    )}
                    <div className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate text-xs font-medium text-ink">
                        {video.productName}
                      </span>
                      <span className="truncate text-[10px] text-stone">
                        {video.productShade ? `Shade: ${video.productShade}` : "No shade"}
                        {video.productPrice ? ` · ${video.productPrice}` : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/60">
                  <button
                    type="button"
                    onClick={() => setEditingItem(video)}
                    className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-stone transition hover:border-ink hover:text-ink"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm(`Delete UGC video by ${video.handle}?`)) return;
                      startTransition(async () => {
                        const res = await deleteUgcVideoAction(video.id);
                        if (res.error) toast.error(res.error);
                        else {
                          toast.success("Deleted");
                          handleDeleted(video.id);
                        }
                      });
                    }}
                    className="rounded-md border border-line p-1 text-xs text-rose-500 transition hover:bg-rose-50 hover:border-rose-300"
                    title="Delete video"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal Drawer */}
      {(showAddModal || editingItem) && (
        <VideoFormModal
          video={editingItem ?? undefined}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}
          onSave={handleCreatedOrUpdated}
        />
      )}
    </div>
  );
}

function VideoFormModal({
  video,
  onClose,
  onSave,
}: {
  video?: UgcVideo;
  onClose: () => void;
  onSave: (video: UgcVideo) => void;
}) {
  const [form, setForm] = useState<VideoFormState>(() => {
    if (video) {
      return {
        id: video.id,
        src: video.src,
        poster: video.poster ?? "",
        handle: video.handle,
        caption: video.caption,
        location: video.location ?? "",
        productSlug: video.productSlug,
        productName: video.productName,
        productShade: video.productShade ?? "",
        productPrice: video.productPrice ?? "",
        productImage: video.productImage ?? "",
        isActive: video.isActive !== false,
      };
    }
    return emptyForm();
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected preset matching current slug
  const activePreset = CATALOG_PRESETS.find((p) => p.slug === form.productSlug);

  const handleProductPresetChange = (slug: string) => {
    const preset = CATALOG_PRESETS.find((p) => p.slug === slug);
    if (preset) {
      const defaultShade = preset.shades[0];
      setForm((prev) => ({
        ...prev,
        productSlug: preset.slug,
        productName: preset.name,
        productPrice: preset.price,
        productShade: defaultShade.shade,
        productImage: defaultShade.image,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        productSlug: slug,
      }));
    }
  };

  const handleShadeChange = (shadeName: string) => {
    const matched = activePreset?.shades.find((s) => s.shade === shadeName);
    setForm((prev) => ({
      ...prev,
      productShade: shadeName,
      productImage: matched?.image || prev.productImage,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.src.trim()) {
      toast.error("Video URL is required");
      return;
    }
    if (!form.handle.trim()) {
      toast.error("Creator handle is required");
      return;
    }
    if (!form.caption.trim()) {
      toast.error("Caption is required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (form.id) {
        // Update existing
        const res = await updateUgcVideoAction(form.id, {
          src: form.src.trim(),
          poster: form.poster.trim() || undefined,
          handle: form.handle.trim(),
          caption: form.caption.trim(),
          location: form.location.trim() || undefined,
          productSlug: form.productSlug.trim(),
          productName: form.productName.trim(),
          productShade: form.productShade.trim() || undefined,
          productPrice: form.productPrice.trim() || undefined,
          productImage: form.productImage.trim() || undefined,
          isActive: form.isActive,
        });

        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("UGC video updated");
          onSave({
            ...form,
            id: form.id,
          });
        }
      } else {
        // Create new
        const res = await createUgcVideoAction({
          src: form.src.trim(),
          poster: form.poster.trim() || undefined,
          handle: form.handle.trim(),
          caption: form.caption.trim(),
          location: form.location.trim() || undefined,
          productSlug: form.productSlug.trim(),
          productName: form.productName.trim(),
          productShade: form.productShade.trim() || undefined,
          productPrice: form.productPrice.trim() || undefined,
          productImage: form.productImage.trim() || undefined,
          isActive: form.isActive,
        });

        if (res.error) {
          toast.error(res.error);
        } else if (res.data) {
          toast.success("UGC video added successfully");
          onSave(res.data);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-line bg-ivory p-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-ink" />
            <h2 className="font-serif text-lg font-medium text-ink">
              {video ? "Edit UGC Video Reel" : "Add UGC Video Reel"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-stone hover:bg-stone/10 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Video URL */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium uppercase tracking-luxe text-stone">
              Video File URL / Path *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. /IMG_6572.MOV or https://res.cloudinary.com/.../reel.mp4"
              value={form.src}
              onChange={(e) => setForm({ ...form, src: e.target.value })}
              className="w-full rounded-md border border-line bg-white px-3 py-2 text-xs text-ink placeholder:text-stone/50 focus:border-ink focus:outline-none"
            />
            <p className="text-[10px] text-stone">
              Accepts public paths (e.g. /IMG_6572.MOV) or hosted URLs from Cloudinary, S3, or CDN.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Creator Handle */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium uppercase tracking-luxe text-stone">
                Creator Handle *
              </label>
              <input
                type="text"
                required
                placeholder="@username"
                value={form.handle}
                onChange={(e) => setForm({ ...form, handle: e.target.value })}
                className="w-full rounded-md border border-line bg-white px-3 py-2 text-xs text-ink placeholder:text-stone/50 focus:border-ink focus:outline-none"
              />
            </div>

            {/* Location */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium uppercase tracking-luxe text-stone">
                City / Location
              </label>
              <input
                type="text"
                placeholder="e.g. London, Paris, Lagos"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full rounded-md border border-line bg-white px-3 py-2 text-xs text-ink placeholder:text-stone/50 focus:border-ink focus:outline-none"
              />
            </div>
          </div>

          {/* Caption */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium uppercase tracking-luxe text-stone">
              Caption / Quote *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Terra Lip Liner with subtle glow"
              value={form.caption}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              className="w-full rounded-md border border-line bg-white px-3 py-2 text-xs text-ink placeholder:text-stone/50 focus:border-ink focus:outline-none"
            />
          </div>

          {/* Tagged Product Section */}
          <div className="rounded-xl border border-line bg-secondary/20 p-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-line/60 pb-2">
              <Sparkles className="h-4 w-4 text-gold" />
              <h3 className="text-xs font-semibold uppercase tracking-luxe text-ink">
                Tag Boutique Product
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Product Preset Dropdown */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium uppercase tracking-luxe text-stone">
                  Catalog Product
                </label>
                <select
                  value={form.productSlug}
                  onChange={(e) => handleProductPresetChange(e.target.value)}
                  className="w-full rounded-md border border-line bg-white px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none"
                >
                  {CATALOG_PRESETS.map((preset) => (
                    <option key={preset.slug} value={preset.slug}>
                      {preset.name} ({preset.price})
                    </option>
                  ))}
                  <option value="custom">-- Custom Product Slug --</option>
                </select>
              </div>

              {/* Shade Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium uppercase tracking-luxe text-stone">
                  Matching Shade
                </label>
                {activePreset ? (
                  <select
                    value={form.productShade}
                    onChange={(e) => handleShadeChange(e.target.value)}
                    className="w-full rounded-md border border-line bg-white px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none"
                  >
                    {activePreset.shades.map((s) => (
                      <option key={s.shade} value={s.shade}>
                        {s.shade}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. 05 Terra"
                    value={form.productShade}
                    onChange={(e) => setForm({ ...form, productShade: e.target.value })}
                    className="w-full rounded-md border border-line bg-white px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none"
                  />
                )}
              </div>
            </div>

            {/* Custom fields if slug is custom */}
            {form.productSlug === "custom" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-line/40">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-stone">Product Name</label>
                  <input
                    type="text"
                    required
                    value={form.productName}
                    onChange={(e) => setForm({ ...form, productName: e.target.value })}
                    className="w-full rounded-md border border-line bg-white px-3 py-1.5 text-xs text-ink"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-stone">Price Display</label>
                  <input
                    type="text"
                    placeholder="e.g. £12.00"
                    value={form.productPrice}
                    onChange={(e) => setForm({ ...form, productPrice: e.target.value })}
                    className="w-full rounded-md border border-line bg-white px-3 py-1.5 text-xs text-ink"
                  />
                </div>
              </div>
            )}

            {/* Live Product Pill Preview */}
            <div className="rounded-lg border border-line bg-ink/90 p-3 text-ivory">
              <div className="text-[9px] uppercase tracking-wider text-ivory/60 mb-2">
                Storefront Click Preview:
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {form.productImage && (
                    <div className="relative h-7 w-7 rounded-full overflow-hidden border border-ivory/20 bg-ivory/10">
                      <Image
                        src={form.productImage}
                        alt="Preview"
                        fill
                        className="object-cover"
                        sizes="28px"
                      />
                    </div>
                  )}
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] font-medium text-ivory">{form.productName}</span>
                    <span className="text-[9px] text-ivory/70">
                      {form.productShade} {form.productPrice ? `· ${form.productPrice}` : ""}
                    </span>
                  </div>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gold">
                  Shop <ArrowRight className="h-2.5 w-2.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Visibility switch */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-medium text-ink">Publish to Storefront</span>
              <p className="text-[10px] text-stone">
                When active, this video immediately displays in the UGC wall on the storefront.
              </p>
            </div>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-line text-ink focus:ring-gold"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-line px-4 py-2 text-xs font-medium uppercase tracking-luxe text-stone hover:border-ink hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-xs font-medium uppercase tracking-luxe text-ivory hover:bg-stone disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {video ? "Save Changes" : "Add Video"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
