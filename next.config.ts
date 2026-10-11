import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/**
 * Security headers. CSP is intentionally permissive where the product needs
 * it (YouTube embeds for songs, inline styles for the card art and email
 * previews) and strict everywhere else: no third-party scripts run on this
 * site, ever.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js needs inline scripts for hydration; styles carry the theme art.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      // Songs are YouTube embeds on the recipient's card page.
      "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com",
      "font-src 'self' data:",
      "connect-src 'self' https://api.resend.com https://api.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
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
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

// Makes the local R2 simulation available to route handlers during Next dev.
// Production uses the capability-scoped CARD_PHOTOS binding in wrangler.toml.
initOpenNextCloudflareForDev();
