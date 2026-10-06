import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  reactStrictMode: false,
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
