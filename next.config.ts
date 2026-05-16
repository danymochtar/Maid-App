import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "sw/service-worker.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default withSerwist(nextConfig);
