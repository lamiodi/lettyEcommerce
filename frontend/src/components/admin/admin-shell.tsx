"use client";

/**
 * AdminShell — side-nav + top bar shell for every /admin page.
 *
 * Layout:
 *   ┌────────┬─────────────────────┐
 *   │ side   │ top bar (title, bell, profile) │
 *   │ nav    ├─────────────────────┤
 *   │        │ content slot        │
 *   └────────┴─────────────────────┘
 *
 * On mobile: side nav collapses to a top-of-page drawer triggered by
 * a hamburger. Active link is highlighted with a hairline underline.
 *
 * Props:
 *   - title: page title shown in the top bar
 *   - subtitle: optional smaller line under the title
 *   - navItems: array of { href, label, icon? } — full set is here, the
 *     active state is computed from the current pathname
 *   - children: page content
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Menu, X, Bell, User } from "lucide-react";
import { AdminNotificationBell } from "./notification-bell";

export interface AdminNavItem {
  href: string;
  label: string;
  icon?: ReactNode;
}

interface AdminShellProps {
  title: string;
  subtitle?: string;
  navItems: AdminNavItem[];
  /** When true, hide nav (login page). */
  bare?: boolean;
  children: ReactNode;
}

export function AdminShell({ title, subtitle, navItems, bare, children }: AdminShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (bare) {
    return <div className="min-h-screen bg-ivory text-ink">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-ivory text-ink">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-line bg-ivory">
        <div className="flex items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden h-9 w-9 grid place-items-center border border-line"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="font-serif text-lg text-ink truncate">{title}</h1>
              {subtitle ? (
                <p className="text-[11px] uppercase tracking-[0.18em] text-stone truncate">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <AdminNotificationBell />
            <Link
              href="/admin/profile"
              className="h-9 w-9 grid place-items-center border border-line hover:border-ink transition"
              aria-label="Profile"
            >
              <User className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop side nav */}
        <nav
          aria-label="Admin navigation"
          className="hidden lg:block w-60 shrink-0 border-r border-line min-h-[calc(100vh-4rem)]"
        >
          <ul className="px-3 py-6 space-y-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 text-sm transition ${
                      active ? "text-ink border-b border-ink" : "text-stone hover:text-ink"
                    }`}
                  >
                    {item.icon ? <span className="h-4 w-4 grid place-items-center">{item.icon}</span> : null}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile drawer */}
        {drawerOpen ? (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-ink/40"
              onClick={() => setDrawerOpen(false)}
              aria-hidden
            />
            <aside className="absolute inset-y-0 left-0 w-72 bg-ivory border-r border-line">
              <div className="flex items-center justify-between px-4 h-16 border-b border-line">
                <span className="font-serif text-lg text-ink">LETTY Admin</span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="h-9 w-9 grid place-items-center border border-line"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ul className="px-3 py-4 space-y-1">
                {navItems.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 text-sm ${
                          active ? "text-ink border-b border-ink" : "text-stone"
                        }`}
                      >
                        {item.icon ? <span className="h-4 w-4 grid place-items-center">{item.icon}</span> : null}
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </aside>
          </div>
        ) : null}

        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className="p-4 sm:p-6 lg:p-10 max-w-screen-2xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Re-export the bell so consumers don't reach into a sub-file.
export { Bell };
