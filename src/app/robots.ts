import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pandamessages.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/c/", "/dashboard", "/checkout/", "/set-password"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
