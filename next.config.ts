import type { NextConfig } from "next";

const DEFAULT_EC2_BACKEND_ORIGIN = "http://32.196.238.144";
const backendOrigin = (
  process.env.BACKEND_ORIGIN ||
  (process.env.VERCEL ? DEFAULT_EC2_BACKEND_ORIGIN : "")
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ["pdf-parse"],
  async rewrites() {
    if (!backendOrigin) return [];

    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${backendOrigin}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
