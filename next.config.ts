import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {} // Use empty object to enable
  }
};

export default nextConfig;
