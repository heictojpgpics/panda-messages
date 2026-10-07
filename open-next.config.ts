/**
 * OpenNext Cloudflare adapter configuration.
 *
 * This is the shape the adapter's build validates: the node handler
 * wrapped for Workers, edge request conversion, fetch for external
 * requests, and in-memory caches. The dummy caches are per-isolate and
 * reset on restarts, which is fine here: every dynamic route reads its
 * truth from D1, and static assets are served from the ASSETS binding,
 * not the cache.
 *
 * Deliberately has no imports: the file is read by
 * `opennextjs-cloudflare build` (install it with
 * `npm install -D @opennextjs/cloudflare wrangler`), and a plain clone
 * must still typecheck without the adapter installed.
 */
const config = {
  // The repository keeps bun.lock for Bun users and package-lock.json for
  // npm users. OpenNext otherwise picks Bun first, even on hosts where it
  // is not installed, so make the production build tool explicit.
  buildCommand: "npm run build",
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
  edgeExternals: ["node:crypto"],
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
} as const;

export default config;
