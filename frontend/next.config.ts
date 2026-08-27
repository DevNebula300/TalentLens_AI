import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone is for Docker; Vercel uses its own output handling
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" as const } : {}),
};

export default nextConfig;
