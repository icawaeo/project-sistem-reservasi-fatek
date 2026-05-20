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
};

export default nextConfig;
