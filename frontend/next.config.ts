import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 80, 85],
    minimumCacheTTL: 2592000,
    deviceSizes: [390, 430, 640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "sonner"],
  },
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "https://lettyecommerce.onrender.com";
    return {
      beforeFiles: [],
      afterFiles: [
        // Bare API paths (no subpath) need exact rewrites: the "/api/x/:path*"
        // rules below forward an empty :path* WITH a trailing slash, and the
        // backend 308-redirects to strip it — an infinite redirect loop for
        // POST /api/newsletter, /api/contact, /api/feedback and /api/waitlist.
        {
          source: "/api/contact",
          destination: `${backendUrl}/api/contact`,
        },
        {
          source: "/api/newsletter",
          destination: `${backendUrl}/api/newsletter`,
        },
        {
          source: "/api/feedback",
          destination: `${backendUrl}/api/feedback`,
        },
        {
          source: "/api/waitlist",
          destination: `${backendUrl}/api/waitlist`,
        },
        {
          source: "/api/admin/:path*",
          destination: `${backendUrl}/api/admin/:path*`,
        },
        {
          source: "/api/customer/:path*",
          destination: `${backendUrl}/api/customer/:path*`,
        },
        {
          source: "/api/cart/:path*",
          destination: `${backendUrl}/api/cart/:path*`,
        },
        {
          source: "/api/coupon/:path*",
          destination: `${backendUrl}/api/coupon/:path*`,
        },
        {
          source: "/api/giftcard/:path*",
          destination: `${backendUrl}/api/giftcard/:path*`,
        },
        {
          source: "/api/checkout/:path*",
          destination: `${backendUrl}/api/checkout/:path*`,
        },
        {
          source: "/api/public/:path*",
          destination: `${backendUrl}/api/public/:path*`,
        },
        {
          source: "/api/contact/:path*",
          destination: `${backendUrl}/api/contact/:path*`,
        },
        {
          source: "/api/newsletter/:path*",
          destination: `${backendUrl}/api/newsletter/:path*`,
        },
      ],
      fallback: [
        {
          source: "/api/:path*",
          destination: `${backendUrl}/api/:path*`,
        },
      ],
    };
  },
  async redirects() {
    return [
      { source: "/refunds", destination: "/returns", permanent: true },
      { source: "/refund", destination: "/returns", permanent: true },
      { source: "/delivery", destination: "/shipping", permanent: true },
      { source: "/policy", destination: "/privacy", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
