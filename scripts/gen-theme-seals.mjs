// Generate portable per-theme wax-seal HTML fixtures from the site's seal SVG.
// Usage: node scripts/gen-theme-seals.mjs [output-directory]
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const OUT = resolve(process.argv[2] ?? "artifacts/email-seal-fixtures");
mkdirSync(OUT, { recursive: true });

const THEMES = [
  { id: "bamboo-grove", seal: "#157A55" },
  { id: "pressed-flowers", seal: "#B0713F" },
  { id: "rose-garden", seal: "#C9A227" },
  { id: "long-distance", seal: "#C9A227" },
  { id: "moonlit-garden", seal: "#B08BC9" },
  { id: "midnight-velvet", seal: "#C9A227" },
  { id: "golden-hour", seal: "#8C5A10" },
  { id: "winter-wonderland", seal: "#5B7FA6" },
  { id: "autumn-leaves", seal: "#6E3A10" },
  { id: "birthday-bash", seal: "#E0607E" },
  { id: "confetti-pop", seal: "#157A55" },
  { id: "sea-glass", seal: "#267B78" },
  { id: "berry-kiss", seal: "#E6AD56" },
  { id: "night-market", seal: "#D7A637" },
];

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (c) => Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount));
  const to = (v) => v.toString(16).padStart(2, "0");
  return `#${to(f(r))}${to(f(g))}${to(f(b))}`;
}

const WAX_BLOB = "M50 4.5 C66.5 3.5 84.5 13 91.5 30.5 C97.5 45 95.5 62.5 86 74.5 C92.5 77.5 94 82.5 92.5 85.5 C90.5 89 84 89 79.5 86.5 C70.5 94.5 57 98.5 44 95.5 C40.5 99 34.5 99.5 31.5 96 C28.5 92.5 30 87.5 33.5 84.5 C20.5 77.5 10 64 8.5 47.5 C7 31.5 15 15.5 29 8.5 C35.5 5.2 42.8 5 50 4.5 Z";

const PORTRAIT = resolve("public/panda/d-center.png");

for (const t of THEMES) {
  const base = t.seal;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;background:transparent}
</style></head><body>
<div style="width:300px;height:300px">
<svg viewBox="0 0 100 100" style="width:100%;height:100%">
  <defs>
    <radialGradient id="waxbody" cx="36%" cy="30%" r="80%">
      <stop offset="0%" stop-color="${shade(base, 0.3)}"/>
      <stop offset="55%" stop-color="${base}"/>
      <stop offset="100%" stop-color="${shade(base, -0.32)}"/>
    </radialGradient>
    <radialGradient id="waxgloss" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <path d="${WAX_BLOB}" fill="url(#waxbody)"/>
  <path d="${WAX_BLOB}" fill="none" stroke="${shade(base, -0.42)}" stroke-width="2.4" opacity="0.55"/>
  <path d="${WAX_BLOB}" fill="none" stroke="${shade(base, 0.35)}" stroke-width="1.1" opacity="0.5" transform="translate(0.6,0.9)"/>
  <circle cx="50" cy="49" r="31.5" fill="none" stroke="${shade(base, -0.4)}" stroke-width="1.6" opacity="0.5"/>
  <path d="M22 46 A28.5 28.5 0 0 1 50 20.5" fill="none" stroke="${shade(base, 0.42)}" stroke-width="1.8" opacity="0.7" stroke-linecap="round"/>
  <clipPath id="pandaclip"><circle cx="50" cy="49" r="27"/></clipPath>
  <g clip-path="url(#pandaclip)">
    <image href="file://${PORTRAIT}" x="25" y="24" width="50" height="50" preserveAspectRatio="xMidYMid meet" style="mix-blend-mode:multiply"/>
  </g>
  <circle cx="50" cy="49" r="27" fill="none" stroke="${shade(base, -0.45)}" stroke-width="1.4" opacity="0.35"/>
  <ellipse cx="37" cy="27" rx="15" ry="8.5" transform="rotate(-24 37 27)" fill="url(#waxgloss)"/>
</svg>
</div>
</body></html>`;
  writeFileSync(join(OUT, `${t.id}.html`), html);
}
console.log(`wrote ${THEMES.length} seal html files to ${OUT}`);
