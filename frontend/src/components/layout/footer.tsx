import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { SITE, SOCIAL_LINKS } from "@/lib/constants";
import type { NavLink } from "@/lib/constants";

const LEFT_LINKS: NavLink[] = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Wishlist", href: "/wishlist" },
];

const RIGHT_LINKS: NavLink[] = [
  { label: "About", href: "/about" },
  { label: "Our Story", href: "/story" },
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
];

function FooterLink({ label, href }: NavLink) {
  return (
    <Link
      href={href}
      className="text-[11px] font-medium uppercase tracking-luxe text-ink transition-colors hover:text-stone whitespace-nowrap"
    >
      {label}
    </Link>
  );
}

/**
 * Template footer — single centered column with link rows flanking the
 * monogram, social links, then copyright and tagline over a hairline.
 *
 * Responsive behavior:
 *  - Mobile (default): logo on its own row, then 2-column link grid
 *  - sm+: logo and links flow into a single row
 *  - xl+: large horizontal gutters so the logo has comfortable breathing room
 */
export function Footer() {
  return (
    <footer className="border-t border-line" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 px-4 py-14 text-center md:px-8 md:py-20">
        <nav
          aria-label="Footer"
          className="grid w-full grid-cols-2 items-center gap-x-4 gap-y-4 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-8 sm:gap-y-4 md:gap-x-10 lg:gap-x-14"
        >
          {LEFT_LINKS.map((link) => (
            <FooterLink key={link.label} {...link} />
          ))}

          {/* Centered monogram — spans both columns on mobile, sits inline on sm+ */}
          <div className="col-span-2 flex justify-center sm:col-span-1 sm:order-none">
            <Logo withWordmark={false} className="[&_img]:h-[53px] md:[&_img]:h-[60px]" />
          </div>

          {RIGHT_LINKS.map((link) => (
            <FooterLink key={link.label} {...link} />
          ))}
        </nav>

        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {SOCIAL_LINKS.map((s) => (
            <li key={s.label}>
              <a
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-medium uppercase tracking-luxe text-stone underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex w-full flex-col items-center gap-2 border-t border-line pt-8 text-xs text-stone">
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <p>{SITE.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
