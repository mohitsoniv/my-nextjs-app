import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Enables generating the `.next/standalone` folder
  experimental: {
    serverActions: {}, // Enables support for Server Actions (valid structure)
  },
};

export default nextConfig;
