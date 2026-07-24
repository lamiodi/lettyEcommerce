import type { NextConfig } from "next";

/**
 * Next.js 15 configuration for the LETTY backend.
 *
 * - Standalone output for efficient containerized deployment.
 * - Explicit CORS allow-list for the frontend origin(s).
 * - All other concerns are handled by route handlers + middleware.
 */
const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Server Actions are allowed up to 2MB (file uploads, etc.)
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
