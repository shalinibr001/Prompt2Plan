"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const ease = [0.4, 0, 0.2, 1] as const;

export function CTA() {
  return (
    <section id="pricing" className="py-24 md:py-28">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease }}
          className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] px-8 py-16 text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl md:px-16"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.18),transparent_55%)]" />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Start building smarter
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[#A1A1AA]">
              Open the workspace and generate your first interactive floor plan in seconds.
            </p>
            <Link
              href="/workspace"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] px-7 py-3 text-sm font-medium text-white shadow-[0_0_24px_rgba(59,130,246,0.35)] transition-transform duration-300 hover:scale-105 active:scale-[0.97]"
            >
              Try Prompt2Plan
            </Link>
          </div>
        </motion.div>

        {/* Lightweight Docs anchor target */}
        <div id="docs" className="sr-only">
          Docs
        </div>
      </div>
    </section>
  );
}
