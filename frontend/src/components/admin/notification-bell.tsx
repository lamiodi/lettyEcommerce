"use client";

/**
 * AdminNotificationBell — unread notification count + dropdown of recent
 * admin_notifications. Polls every 60s for low-cost updates. Click marks
 * a notification as read and navigates to its `link`.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

/** Tiny relative-time helper (no dependency). */
function formatDistanceToNow(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.max(0, Math.round((now - then) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

const POLL_MS = 60_000;

export function AdminNotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const unread = items.filter((i) => !i.is_read).length;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      try {
        const res = await fetch("/api/admin/notifications", {
          credentials: "include",
        });
        if (!res.ok) return;
        const json = (await res.json()) as { data: AdminNotification[] };
        if (!cancelled) {
          setItems(json.data ?? []);
          setBootLoading(false);
        }
      } catch {
        if (!cancelled) setBootLoading(false);
      } finally {
        if (!cancelled) timer = setTimeout(tick, POLL_MS);
      }
    }
    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function markRead(id: string, link: string | null) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notifications/${id}/read`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        toast.error("Could not mark as read.");
        return;
      }
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)));
      setOpen(false);
      if (link) router.push(link);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative h-9 w-9 grid place-items-center border border-line hover:border-ink transition"
        aria-label={`Notifications (${unread} unread)`}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -top-1 -right-1 grid place-items-center min-w-4 h-4 px-1 text-[10px] bg-ink text-ivory">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[60vh] overflow-y-auto border border-line bg-ivory z-40">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Notifications</span>
            <a href="/admin/notifications" className="text-[11px] uppercase tracking-[0.18em] text-stone hover:text-ink">
              View all
            </a>
          </div>
          {bootLoading ? (
            <ul>
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="space-y-2 border-b border-line px-4 py-3 last:border-0">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2.5 w-full" />
                  <Skeleton className="h-2 w-16" />
                </li>
              ))}
            </ul>
          ) : items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-stone">No notifications.</p>
          ) : (
            <ul>
              {items.slice(0, 20).map((n) => (
                <li key={n.id} className="border-b border-line last:border-0">
                  <button
                    type="button"
                    onClick={() => markRead(n.id, n.link)}
                    disabled={loading}
                    className="w-full text-left px-4 py-3 hover:bg-ivory/60 transition disabled:opacity-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className={`text-sm ${n.is_read ? "text-stone" : "text-ink font-medium"}`}>
                        {n.title}
                      </p>
                      {!n.is_read ? <span className="h-1.5 w-1.5 bg-ink mt-2 shrink-0" /> : null}
                    </div>
                    {n.body ? <p className="mt-1 text-xs text-stone line-clamp-2">{n.body}</p> : null}
                    <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-stone">
                      {formatDistanceToNow(n.created_at)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
