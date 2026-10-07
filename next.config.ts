import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  reactStrictMode: false,
  serverExternalPackages: ["better-sqlite3"],
  // The repo ships two lockfiles (bun and npm). Pin the workspace root so
  // Turbopack never has to guess it from the lockfile layout.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;

// Makes the local R2 simulation available to route handlers during Next dev.
// Production uses the capability-scoped CARD_PHOTOS binding in wrangler.toml.
initOpenNextCloudflareForDev();
