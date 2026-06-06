import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "canvas",
    "@tensorflow/tfjs",
    "@tensorflow/tfjs-backend-wasm",
    "@vladmandic/face-api",
  ],
  async headers() {
    return [
      {
        source: "/models/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/tfjs-wasm/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
