import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.houseofletty.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Exclude paginated, filtered, admin, and transactional routes
        disallow: ["/cart", "/checkout", "/search", "/api/", "/_next/", "/admin", "/admin/", "/account"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
