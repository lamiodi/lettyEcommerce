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
      { protocol: "https", hostname: "coresg-normal.trae.ai" },
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
};

export default nextConfig;
