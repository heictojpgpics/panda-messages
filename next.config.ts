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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;

// Makes the local R2 simulation available to route handlers during Next dev.
// Production uses the capability-scoped CARD_PHOTOS binding in wrangler.toml.
initOpenNextCloudflareForDev();
