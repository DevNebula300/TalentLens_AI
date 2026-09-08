import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone is for Docker; Vercel uses its own output handling
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" as const } : {}),
  // Next 16 defaults to Turbopack; keep an empty config so webpack aliases below are intentional for --webpack builds.
  turbopack: {},
  webpack: (config) => {
    // @xenova/transformers runs in the browser; stub Node-only packages.
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false,
    };
    return config;
  },
};

export default nextConfig;
