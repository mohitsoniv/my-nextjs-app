import type { NextConfig } from "next";

/**
 * Production-ready Next.js configuration
 */
const nextConfig: NextConfig = {
  output: "standalone", // Required for deploying with custom Node.js servers (like PM2)

  experimental: {
    serverActions: {}, // Enables the new Server Actions feature (valid for Next.js 14+)
  },

  // Optional: You can enforce stricter React settings
  reactStrictMode: true,

  // Optional: Add image domain whitelist if using next/image
  images: {
    domains: ['your-cdn.com'], // Replace with actual domains if needed
  },
};

export default nextConfig;
