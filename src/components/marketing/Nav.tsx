"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // The menu never survives a navigation: every route change snaps it shut
  // (including back/forward swipes, which fire no click on the links).
  // Adjusting state during render is the React-endorsed way to do this
  // without a cascading effect.
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(false);
  }

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

  // Escape closes, a tap on the world outside closes, and the page behind
  // stands still while the menu is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      document.body.style.overflow = "";
    };
  }, [open]);

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

          <div className="hidden lg:flex items-center gap-1">
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

          <div className="hidden lg:flex items-center gap-2">
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
            className="lg:hidden -m-1.5 p-3 rounded-full hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade/40"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {open && (
          <div
            id="mobile-menu"
            ref={menuRef}
            className="lg:hidden mt-2 glass-card rounded-2xl p-3 flex flex-col gap-1 menu-drop"
          >
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-xl text-[15px] font-medium text-ink/80 hover:bg-ink/5 transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <div className="h-px bg-ink/8 my-1" />
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-xl text-[15px] font-semibold text-jade"
              >
                My cards
              </Link>
            ) : (
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-xl text-[15px] font-semibold text-jade"
              >
                Sign in
              </Link>
            )}
            <Link
              href="/create"
              onClick={() => setOpen(false)}
              className="mt-1 inline-flex justify-center items-center gap-1.5 rounded-full bg-jade px-4 py-3 text-[15px] font-semibold text-white active:scale-[0.98] transition-transform"
            >
              <Send className="h-4 w-4" />
              Send a card
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
