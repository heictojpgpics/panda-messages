"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { PandaMoodFace } from "@/components/brand/PandaMood";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

function SetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (password.length < 8) {
      setError("At least 8 characters, please.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not set the password.");
        return;
      }
      router.push("/dashboard");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory relative flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 hero-forest grain" aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-sm glass-card rounded-3xl p-7 sm:p-8"
      >
        <div className="flex justify-center">
          <PandaMoodFace mood="bashful" size={76} />
        </div>
        <h1 className="text-center font-display font-semibold text-ink text-[22px] mt-4">
          Set your password
        </h1>
        <p className="text-center text-[13px] text-ink-soft mt-2 mb-6">
          And your cards are yours for good.
        </p>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pw" className="text-[13px]">Password</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/30" />
              <Input
                id="pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                maxLength={200}
                className="rounded-full h-11 pl-11 bg-paper"
                autoFocus
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw2" className="text-[13px]">Once more</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/30" />
              <Input
                id="pw2"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                maxLength={200}
                placeholder="Same one again"
                className="rounded-full h-11 pl-11 bg-paper"
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
          </div>
          {error && <p className="text-[12.5px] text-blush">{error}</p>}
          <Button
            onClick={submit}
            disabled={busy || !password || !confirm}
            className="sheen w-full h-12 rounded-full font-semibold"
            size="lg"
          >
            {busy ? "Saving..." : "Make it mine"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory" />}>
      <SetPasswordInner />
    </Suspense>
  );
}
