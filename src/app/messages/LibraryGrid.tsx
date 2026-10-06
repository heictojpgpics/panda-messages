"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { LibraryPage } from "@/data/library";

export function LibraryGrid({ pages }: { pages: LibraryPage[] }) {
  return (
    <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {pages.map((p, i) => (
        <motion.div
          key={p.slug}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
        >
          <Link
            href={`/messages/${p.slug}`}
            className="card-lift block rounded-2xl bg-paper border border-ink/8 p-5 h-full"
          >
            <p className="font-medium text-ink/90 text-[15px]">{p.title}</p>
            <p className="text-[12px] text-ink/45 mt-1.5">{p.messages.length} message ideas</p>
            <p className="mt-3 text-[13px] text-ink-soft line-clamp-2 leading-relaxed">
              {p.messages[0]}
            </p>
            <span className="mt-3.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-jade">
              Read them all <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
