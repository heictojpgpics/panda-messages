"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PandaMoodFace } from "@/components/brand/PandaMood";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Mail, Lock, ArrowRight } from "lucide-react";

/**
 * Email + password auth, used both on the auth pages and inline in the
 * wizard right at the moment a free card needs an owner.
 */
export function AuthPanel({
  mode,
  onAuthed,
  compact = false,
}: {
  mode: "signin" | "signup";
  onAuthed?: (email: string) => void;
  compact?: boolean;
}) {
  const [tab, setTab] = useState<"signin" | "signup">(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(tab === "signin" ? "/api/auth/signin" : "/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tab === "signin" ? { email, password } : { email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something did not work. Try again?");
        return;
      }
      onAuthed?.(data.email ?? email);
    } catch {
      setError("The connection hiccuped. Try again?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("w-full", compact ? "max-w-sm" : "max-w-md mx-auto")}>
      <div className="flex justify-center">
        <PandaMoodFace mood={tab === "signup" ? "sparkle" : "sleepy"} size={70} />
      </div>

      <div className="mt-4 inline-flex p-1 rounded-full bg-ink/[0.05] border border-ink/10 w-full">
        {(
          [
            ["signin", "I have an account"],
            ["signup", "I am new here"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              setError(null);
            }}
            className={cn(
              "flex-1 px-3 py-2 rounded-full text-[12.5px] font-semibold transition-all",
              tab === id ? "bg-jade text-white" : "text-ink/60 hover:text-ink"
            )}
            aria-pressed={tab === id}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        <AnimatePresence mode="wait">
          {tab === "signup" && (
            <motion.div
              key="name"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-2">
                <Label htmlFor="auth-name" className="text-[13px]">Your name (optional)</Label>
                <Input
                  id="auth-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sam"
                  maxLength={60}
                  className="rounded-full bg-paper h-11"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          <Label htmlFor="auth-email" className="text-[13px]">Email</Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/30" />
            <Input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              className="rounded-full bg-paper h-11 pl-11"
              onKeyDown={(e) => e.key === "Enter" && password && submit()}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="auth-password" className="text-[13px]">Password</Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/30" />
            <Input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete={tab === "signin" ? "current-password" : "new-password"}
              className="rounded-full bg-paper h-11 pl-11"
              onKeyDown={(e) => e.key === "Enter" && email && password && submit()}
            />
          </div>
        </div>

        {error && <p className="text-[12.5px] text-blush">{error}</p>}

        <Button
          onClick={submit}
          disabled={busy || !email || !password}
          className="sheen w-full h-12 rounded-full font-semibold"
          size="lg"
        >
          {busy ? "One moment..." : tab === "signin" ? "Sign in" : "Create my account"}
          {!busy && <ArrowRight className="h-4 w-4" />}
        </Button>

        <p className="text-center text-[11.5px] text-ink/40 leading-relaxed">
          {tab === "signup"
            ? "Your cards stay yours, and you can watch them get opened. No spam, ever."
            : "Welcome back. Your cards have been waiting patiently."}
        </p>
      </div>
    </div>
  );
}
