import type { NextConfig } from "next";

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
