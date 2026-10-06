"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { motion } from "framer-motion";

export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => d.user && router.replace("/dashboard"))
      .catch(() => {});
  }, [router]);

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
            Make yourself at home
          </h1>
          <p className="text-center text-[13.5px] text-ink-soft mt-2 mb-7">
            Free forever. Your cards, your moments, all in one quiet little place.
          </p>
          <AuthPanel
            mode="signup"
            onAuthed={() => router.push("/dashboard")}
          />
        </div>
        <p className="mt-5 text-center text-[13px] text-ink/50">
          Already have one?{" "}
          <Link href="/sign-in" className="text-jade font-semibold link-pretty">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
