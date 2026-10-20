/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.LETTY_AUDIT_BUILD ? ".next-launch-audit" : ".next",
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    ...(process.env.LETTY_AUDIT_BUILD ? { cpus: 2 } : {}),
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
