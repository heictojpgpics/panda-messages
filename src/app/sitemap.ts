import type { MetadataRoute } from "next";
import { LIBRARY } from "@/data/library";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pandamessages.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const core: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/create`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/messages`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/tools/message-writer`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/remember`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/about`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE}/feedback`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/refund-policy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/sign-in`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const library: MetadataRoute.Sitemap = LIBRARY.map((p) => ({
    url: `${BASE}/messages/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  return [...core, ...library];
}
