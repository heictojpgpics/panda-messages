"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoLink } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { Menu, X, Send } from "lucide-react";

const LINKS = [
  { href: "/#examples", label: "Examples" },
  { href: "/messages", label: "Message ideas" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => setUser(d.user))
      .catch(() => {});
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "py-2" : "py-4"
      )}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <nav
          className={cn(
            "flex items-center justify-between gap-3 rounded-full px-3 sm:px-5 py-2.5 transition-all duration-300 border",
            scrolled
              ? "glass-card border-white/70"
              : "bg-transparent border-transparent"
          )}
        >
          <LogoLink />

          <div className="hidden md:flex items-center gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3.5 py-2 rounded-full text-sm font-medium text-ink/75 hover:text-ink hover:bg-ink/5 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-full text-sm font-semibold text-jade hover:bg-jade/10 transition-colors"
              >
                My cards
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="px-4 py-2 rounded-full text-sm font-semibold text-jade hover:bg-jade/10 transition-colors"
              >
                Sign in
              </Link>
            )}
            <Link
              href="/create"
              className="sheen inline-flex items-center gap-1.5 rounded-full bg-jade px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(21,122,85,0.7)] hover:bg-jade-deep transition-all active:scale-[0.98]"
            >
              <Send className="h-3.5 w-3.5" />
              Send a card
            </Link>
          </div>

          {/* Mobile */}
          <button
            className="md:hidden p-2 rounded-full hover:bg-ink/5"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {open && (
          <div className="md:hidden mt-2 glass-card rounded-2xl p-3 flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-ink/80 hover:bg-ink/5"
              >
                {l.label}
              </Link>
            ))}
            <div className="h-px bg-ink/8 my-1" />
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-jade"
              >
                My cards
              </Link>
            ) : (
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-jade"
              >
                Sign in
              </Link>
            )}
            <Link
              href="/create"
              onClick={() => setOpen(false)}
              className="mt-1 inline-flex justify-center items-center gap-1.5 rounded-full bg-jade px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Send className="h-3.5 w-3.5" />
              Send a card
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
