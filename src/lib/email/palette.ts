import { getTheme } from "@/data/themes";

/**
 * Email palette.
 *
 * Every theme renders a bespoke mail piece: the postal band takes the
 * envelope flap color, the button takes the wax seal color, and the text
 * colors are adjusted until they pass WCAG contrast, because email clients
 * cannot be trusted with opacity or modern color functions.
 */

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = (c: number) => (amount >= 0 ? c + (255 - c) * amount : c * (1 + amount));
  return rgbToHex(f(r), f(g), f(b));
}

/** Relative luminance, the WCAG way. */
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Darken a color until white text on it clears AA contrast, for buttons. */
function buttonSafe(hex: string): string {
  let color = hex;
  for (let i = 0; i < 10; i++) {
    if (contrastRatio(color, "#FFFFFF") >= 4.5) break;
    color = shade(color, -0.08);
  }
  return color;
}

/** Blend a fg color toward its bg, the email-safe replacement for opacity. */
function blend(fg: string, bg: string, alpha: number): string {
  const [r1, g1, b1] = hexToRgb(fg);
  const [r2, g2, b2] = hexToRgb(bg);
  return rgbToHex(r2 + (r1 - r2) * alpha, g2 + (g1 - g2) * alpha, b2 + (b1 - b2) * alpha);
}

export interface EmailPalette {
  /** Theme display name. */
  name: string;
  /** Page behind the mail piece. */
  page: string;
  /** Mail piece background. */
  paper: string;
  /** Postal band (the envelope flap). */
  band: string;
  /** Text on the band, guaranteed readable. */
  bandText: string;
  /** Postmark ink, a quieter tone of bandText. */
  postmark: string;
  /** Headline color. */
  heading: string;
  /** Body text, neutral and calm. */
  ink: string;
  /** Secondary text. */
  muted: string;
  /** Footer text. */
  footer: string;
  /** Hairlines and borders. */
  line: string;
  /** Button background, dark enough for white text. */
  button: string;
  /** A wash for quote cards and the footer strip. */
  wash: string;
}

export function emailPalette(themeId?: string): EmailPalette {
  const theme = getTheme(themeId ?? "bamboo-grove");
  const c = theme.colors;

  const bandIsDark = luminance(c.flap) < 0.45;
  const bandText = bandIsDark ? "#FFFFFF" : shade(c.heading, -0.15);
  const postmark = bandIsDark ? blend("#FFFFFF", c.flap, 0.72) : blend(bandText, c.flap, 0.6);

  return {
    name: theme.name,
    page: c.page,
    paper: c.paper,
    band: c.flap,
    bandText,
    postmark,
    heading: c.heading,
    ink: "#333F38",
    muted: "#5C675F",
    footer: "#6E7871",
    line: blend(c.heading, c.paper, 0.18),
    button: buttonSafe(c.seal),
    wash: blend(c.envelope, "#FFFFFF", 0.45),
  };
}
