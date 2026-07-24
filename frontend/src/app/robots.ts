import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://letty.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Exclude paginated, filtered, and transactional routes
        disallow: ["/cart", "/checkout", "/search", "/api/", "/_next/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
