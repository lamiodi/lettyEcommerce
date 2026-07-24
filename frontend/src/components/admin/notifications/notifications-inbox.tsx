"use client";

/**
 * NotificationsInbox — full-page view of admin notifications.
 * Tabs: Unread · All. Mark single / mark all.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { markNotificationReadAction } from "@/lib/actions/admin-newsletter";

interface Notification {
  id: string;
  type: string;
  entity_id: string | null;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationsInbox({ initial }: { initial: Notification[] }) {
  const [tab, setTab] = useState<"unread" | "all">("unread");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function markRead(id: string) {
    startTransition(async () => {
      const res = await markNotificationReadAction(id);
      if (res.error) toast.error(res.error);
      else router.refresh();
    });
  }

  function markAllRead() {
    const unread = initial.filter((n) => !n.is_read);
    Promise.all(unread.map((n) => markNotificationReadAction(n.id))).then(() => {
      toast.success(`${unread.length} marked read`);
      router.refresh();
    });
  }

  const list = tab === "unread" ? initial.filter((n) => !n.is_read) : initial;
  const unreadCount = initial.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="inline-flex items-center border border-line">
          <button
            type="button"
            onClick={() => setTab("unread")}
            className={`h-8 px-4 text-[11px] uppercase tracking-[0.18em] ${
              tab === "unread" ? "bg-ink text-ivory" : "text-stone hover:text-ink"
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`h-8 px-4 text-[11px] uppercase tracking-[0.18em] ${
              tab === "all" ? "bg-ink text-ivory" : "text-stone hover:text-ink"
            }`}
          >
            All ({initial.length})
          </button>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={markAllRead}
            disabled={pending}
            className="inline-flex items-center gap-2 h-8 px-3 text-[10px] uppercase tracking-[0.18em] text-stone hover:text-ink"
          >
            <Check className="h-3 w-3" /> Mark all read
          </button>
        ) : null}
      </div>
      <div className="border border-line bg-ivory">
        {list.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-stone">
            {tab === "unread" ? "Inbox zero. Nothing pending." : "No notifications."}
          </p>
        ) : (
          <ul>
            {list.map((n) => (
              <li
                key={n.id}
                className={`border-b border-line last:border-0 px-4 py-3 ${
                  n.is_read ? "" : "bg-ivory"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-ink">
                      {n.link ? (
                        <Link href={n.link} className="hover:underline underline-offset-2">
                          {n.title}
                        </Link>
                      ) : (
                        n.title
                      )}
                    </p>
                    {n.body ? <p className="text-xs text-stone mt-1">{n.body}</p> : null}
                    <p className="text-[11px] uppercase tracking-[0.18em] text-stone mt-1">
                      {n.type} · {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!n.is_read ? (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      disabled={pending}
                      aria-label="Mark read"
                      className="h-7 w-7 grid place-items-center text-stone hover:text-ink"
                    >
                      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
