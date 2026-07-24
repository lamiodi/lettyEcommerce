"use client";

/**
 * MediaUploader — drag-drop or click to upload images. Uses Supabase
 * Storage via a server-issued signed URL (or a direct signed upload).
 *
 * v1 implementation: posts to `/api/admin/media/sign` for a signed
 * upload URL, then uploads the file directly to the bucket. Returns
 * the public URL via the parent.
 *
 * Features:
 *  - Drag-and-drop OR click-to-select
 *  - Local preview before upload completes
 *  - Multiple files; parent controls ordering
 *  - Type & size validation; "image/*" only
 *
 * Props:
 *  - bucket: Supabase bucket name (default "product-media")
 *  - onUploaded(file, url): called for each successful upload
 *  - onError(message): called on validation/transport failure
 */
import { useCallback, useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  status: "uploading" | "done" | "error";
}

interface MediaUploaderProps {
  bucket?: string;
  /** Optional list of existing media (URLs) to show as pre-populated. */
  initial?: Array<{ id?: string; name: string; url: string }>;
  /** Called once per successful upload. */
  onUploaded?: (file: { id: string; name: string; url: string }) => void;
  onError?: (message: string) => void;
  /** Max files accepted; default 8. */
  maxFiles?: number;
  /** Max file size in MB; default 10. */
  maxSizeMb?: number;
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

export function MediaUploader({
  bucket = "product-media",
  initial = [],
  onUploaded,
  onError,
  maxFiles = 8,
  maxSizeMb = 10,
}: MediaUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>(
    initial.map((f) => ({ id: f.id ?? f.url, name: f.name, url: f.url, status: "done" })),
  );
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const list = Array.from(incoming);
      if (files.length + list.length > maxFiles) {
        const m = `Maximum ${maxFiles} files.`;
        onError?.(m);
        toast.error(m);
        return;
      }
      for (const file of list) {
        if (!file.type.startsWith("image/")) {
          onError?.(`${file.name}: not an image`);
          continue;
        }
        if (file.size > maxSizeMb * 1024 * 1024) {
          onError?.(`${file.name}: exceeds ${maxSizeMb}MB`);
          continue;
        }
        const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        // Optimistic placeholder.
        setFiles((prev) => [...prev, { id, name: file.name, url: URL.createObjectURL(file), status: "uploading" }]);

        try {
          // 1. Request a signed upload URL.
          const signRes = await fetch("/api/admin/media/sign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              bucket,
              filename: file.name,
              contentType: file.type,
              size: file.size,
            }),
          });
          if (!signRes.ok) {
            const err = (await signRes.json().catch(() => ({}))) as { error?: string };
            throw new Error(err.error ?? `Sign failed (${signRes.status})`);
          }
          const { data } = (await signRes.json()) as { data: { signedUrl: string; publicUrl: string; token: string } };

          // 2. Upload via the signed URL.
          const upRes = await fetch(data.signedUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });
          if (!upRes.ok) throw new Error(`Upload failed (${upRes.status})`);

          // 3. Replace the placeholder with the canonical URL.
          setFiles((prev) =>
            prev.map((f) =>
              f.id === id
                ? { id, name: file.name, url: data.publicUrl, status: "done" as const }
                : f,
            ),
          );
          onUploaded?.({ id, name: file.name, url: data.publicUrl });
        } catch (err) {
          setFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, status: "error" as const } : f)),
          );
          const m = (err as Error).message ?? "Upload failed";
          onError?.(m);
          toast.error(`${file.name}: ${m}`);
        }
      }
    },
    [bucket, files.length, maxFiles, maxSizeMb, onError, onUploaded],
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      void handleFiles(e.dataTransfer.files);
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 border border-dashed px-6 py-10 text-center cursor-pointer transition ${
          isDragging ? "border-ink bg-ivory" : "border-line hover:border-stone"
        }`}
        role="button"
        tabIndex={0}
      >
        <Upload className="h-5 w-5 text-stone" />
        <p className="text-sm text-ink">Drop images here or click to select</p>
        <p className="text-[11px] uppercase tracking-[0.18em] text-stone">
          JPEG · PNG · WEBP · AVIF · up to {maxSizeMb}MB · {maxFiles} max
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void handleFiles(e.target.files);
            e.currentTarget.value = "";
          }}
        />
      </div>

      {files.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {files.map((f) => (
            <li
              key={f.id}
              className="relative aspect-square border border-line bg-ivory overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.url}
                alt={f.name}
                className="h-full w-full object-cover"
              />
              {f.status === "uploading" ? (
                <div className="absolute inset-0 grid place-items-center bg-ink/40">
                  <Loader2 className="h-5 w-5 text-ivory animate-spin" />
                </div>
              ) : null}
              {f.status === "error" ? (
                <div className="absolute inset-0 grid place-items-center bg-ink/60 text-ivory text-[11px] uppercase tracking-[0.18em]">
                  Failed
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
                aria-label="Remove"
                className="absolute top-1 right-1 grid place-items-center h-6 w-6 bg-ivory border border-line"
              >
                <X className="h-3 w-3 text-ink" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
