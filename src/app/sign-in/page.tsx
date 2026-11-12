"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { motion } from "framer-motion";

function SignIn() {
  const router = useRouter();
  const params = useSearchParams();
  // Where to land after the handshake. Defaults to the cards, but a
  // dashboard handoff (a card just paid for) arrives as ?next=.
  const next = params.get("next") || "/dashboard";

  useEffect(() => {
    // Already signed in? Straight to where you were headed.
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => d.user && router.replace(next))
      .catch(() => {});
  }, [router, next]);

  return (
    <div className="min-h-screen bg-ivory relative flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 hero-forest grain" aria-hidden />
      <div className="absolute inset-0 bamboo-bg opacity-40" aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="glass-card rounded-3xl p-7 sm:p-9">
          <h1 className="text-center font-display font-semibold text-ink text-2xl">
            Welcome back
          </h1>
          <p className="text-center text-[13.5px] text-ink-soft mt-2 mb-7">
            Your cards have been waiting patiently for you.
          </p>
          <AuthPanel
            mode="signin"
            onAuthed={() => router.push(next)}
          />
        </div>
        <p className="mt-5 text-center text-[13px] text-ink/50">
          New here?{" "}
          <Link href="/sign-up" className="text-jade font-semibold link-pretty">
            Make a free account
          </Link>{" "}
          · or just{" "}
          <Link href="/create" className="text-jade font-semibold link-pretty">
            make a card first
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory" />}>
      <SignIn />
    </Suspense>
  );
}
