import type { NextConfig } from "next";

/**
 * ✅ Production-ready Next.js configuration
 */
const nextConfig: NextConfig = {
  // Enables standalone output for deploying with PM2 or custom Node.js servers
  output: "standalone",

  // Enables React strict mode for highlighting potential issues
  reactStrictMode: true,

  // Enables faster builds and smaller bundles using SWC
  swcMinify: true,

  // Removes the `X-Powered-By: Next.js` header from HTTP responses
  poweredByHeader: false,

  // Experimental features (only use if on Next.js 14+)
  experimental: {
    serverActions: {}, // Enables new server actions API
  },

  // Configure remote image domains (required if using next/image with external images)
  images: {
    domains: ["your-cdn.com"], // 🔁 Replace with your actual CDN/image host
  },
};

export default nextConfig;
