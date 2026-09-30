import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Member/expense forms can upload several ID proofs or bills (max 10 MB each) at once.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
