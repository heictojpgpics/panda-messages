import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pandamessages.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Panda Messages | Free Cute Panda eCards & Personalized Cards",
    template: "%s | Panda Messages",
  },
  description:
    "Make a personal card in a minute and send it like a gift. A panda brings it to their inbox on the morning you pick. Free to make, $4.99 to surprise them.",
  keywords: [
    "panda ecards",
    "personalized cards",
    "digital greeting cards",
    "birthday ecards",
    "love messages",
    "free ecards",
    "schedule a card",
  ],
  authors: [{ name: "Panda Messages" }],
  openGraph: {
    title: "Panda Messages | Cute panda cards that feel like a hug",
    description:
      "A personal card, made in a minute, delivered like a gift on the morning you pick. Panda brings it to their inbox.",
    url: SITE_URL,
    siteName: "Panda Messages",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "A panda holding a heart, next to a card that arrives like a gift",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Panda Messages",
    description: "Cute panda cards that feel like a hug. Free to make.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/panda/d-center.png",
    apple: "/panda/d-center.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#FBF9F4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fraunces.variable} ${inter.variable} antialiased bg-background text-foreground font-sans`}
      >
        {children}
        <Toaster position="bottom-center" richColors={false} closeButton />
      </body>
    </html>
  );
}
