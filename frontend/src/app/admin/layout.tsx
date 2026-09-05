"use client";

/**
 * Admin layout — gates every /admin/* route on a valid admin session.
 * Unauthenticated requests are redirected to /admin/login?next=...
 *
 * Renders nothing until the session is confirmed. Then renders the
 * AdminShell (side nav + top bar) around the page.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminShell, type AdminNavItem } from "@/components/admin/admin-shell";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Ticket,
  Star,
  Bell,
  Truck,
  Receipt,
  BarChart3,
  Settings,
  UserCog,
  Mail,
  Inbox,
  Tag,
  CreditCard,
  ImageIcon,
  Layers,
  Video,
} from "lucide-react";

interface Me {
  id: string;
  email: string;
  role: "owner" | "admin" | "manager" | "inventory" | "support" | "marketing" | "editor";
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  // The login page lives at /admin/login but is not gated.
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (isLogin) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/me", { credentials: "include", cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) {
            const next = encodeURIComponent(pathname ?? "/admin");
            router.replace(`/admin/login?next=${next}`);
          }
          return;
        }
        const json = (await res.json()) as { data: Me };
        if (!cancelled) setMe(json.data);
      } catch (err) {
        toast.error("Could not verify your session.");
        router.replace("/admin/login");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLogin, pathname, router]);

  const nav = useMemo<AdminNavItem[]>(
    () => [
      { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { href: "/admin/orders", label: "Orders", icon: <ShoppingBag className="h-4 w-4" /> },
      { href: "/admin/products", label: "Products", icon: <Package className="h-4 w-4" /> },
      { href: "/admin/inventory", label: "Inventory", icon: <Receipt className="h-4 w-4" /> },
      { href: "/admin/catalog", label: "Catalog", icon: <Layers className="h-4 w-4" /> },
      { href: "/admin/customers", label: "Customers", icon: <Users className="h-4 w-4" /> },
      { href: "/admin/coupons", label: "Coupons", icon: <Ticket className="h-4 w-4" /> },
      { href: "/admin/gift-cards", label: "Gift Cards", icon: <CreditCard className="h-4 w-4" /> },
      { href: "/admin/reviews", label: "Reviews", icon: <Star className="h-4 w-4" /> },
      { href: "/admin/shipping", label: "Shipping", icon: <Truck className="h-4 w-4" /> },
      { href: "/admin/tax", label: "Tax", icon: <Tag className="h-4 w-4" /> },
      { href: "/admin/analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
      { href: "/admin/abandoned-carts", label: "Abandoned Carts", icon: <Inbox className="h-4 w-4" /> },
      { href: "/admin/waitlist", label: "Waitlist", icon: <Bell className="h-4 w-4" /> },
      { href: "/admin/newsletter", label: "Newsletter", icon: <Mail className="h-4 w-4" /> },
      { href: "/admin/banners", label: "Banners", icon: <ImageIcon className="h-4 w-4" /> },
      { href: "/admin/ugc", label: "UGC Videos", icon: <Video className="h-4 w-4" /> },
      { href: "/admin/notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
      { href: "/admin/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
      { href: "/admin/team", label: "Team", icon: <UserCog className="h-4 w-4" /> },
    ],
    [],
  );

  if (isLogin) {
    return <>{children}</>;
  }

  if (loading || !me) {
    return (
      <div className="min-h-screen grid place-items-center bg-ivory">
        <p className="text-[11px] uppercase tracking-[0.18em] text-stone">Loading…</p>
      </div>
    );
  }

  // Page title is derived from the active nav item.
  const active = nav.find((n) =>
    n.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(n.href),
  );
  const title = active?.label ?? "Admin";

  return (
    <AdminShell title={title} subtitle={me.email} navItems={nav}>
      {children}
    </AdminShell>
  );
}
