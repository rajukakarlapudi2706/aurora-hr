import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [{ hostname: "localhost" }],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
