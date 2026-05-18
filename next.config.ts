import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => ({
    beforeFiles: [
      {
        source: "/uploads/:path*",
        destination: "/api/uploads/:path*",
      },
    ],
  }),
  headers: async () => [
    {
      source: "/sw.js",
      headers: [
        {
          key: "Cache-Control",
          value: "no-cache, no-store, must-revalidate",
        },
        {
          key: "Service-Worker-Allowed",
          value: "/",
        },
      ],
    },
    {
      source: "/manifest.json",
      headers: [
        {
          key: "Cache-Control",
          value: "no-cache",
        },
      ],
    },
  ],
};

export default nextConfig;
