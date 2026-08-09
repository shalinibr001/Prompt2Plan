"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const ease = [0.4, 0, 0.2, 1] as const;

/** Simulated 3D floor-plan preview — glass card with floating rooms. */
function HeroVisual() {
  return (
    <motion.div
      aria-hidden
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="relative mx-auto w-full max-w-lg"
    >
      {/* Glow behind card */}
      <div className="pointer-events-none absolute -inset-8 rounded-[32px] bg-gradient-to-br from-[#3B82F6]/30 via-[#8B5CF6]/15 to-transparent blur-3xl" />

      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-6">
        {/* Window chrome */}
        <div className="mb-5 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="ml-3 text-[11px] font-light tracking-wide text-[#71717A]">
            2BHK · interactive preview
          </span>
        </div>

        {/* Fake isometric floor plan */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#222] bg-gradient-to-b from-[#121212] to-[#0A0A0A]">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          {/* Rooms */}
          <motion.div
            className="absolute left-[12%] top-[18%] h-[38%] w-[34%] rounded-xl border border-[#3B82F6]/40 bg-[#3B82F6]/15 shadow-[0_0_24px_rgba(59,130,246,0.2)]"
            animate={{ opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="absolute left-3 top-2 text-[10px] font-medium tracking-wide text-white/70">
              Hall
            </span>
          </motion.div>
          <div className="absolute right-[12%] top-[18%] h-[28%] w-[30%] rounded-xl border border-[#8B5CF6]/35 bg-[#8B5CF6]/12">
            <span className="absolute left-3 top-2 text-[10px] font-medium tracking-wide text-white/70">
              Kitchen
            </span>
          </div>
          <div className="absolute bottom-[14%] left-[12%] h-[32%] w-[30%] rounded-xl border border-white/15 bg-white/[0.06]">
            <span className="absolute left-3 top-2 text-[10px] font-medium tracking-wide text-white/70">
              Bedroom
            </span>
          </div>
          <div className="absolute bottom-[14%] right-[12%] h-[32%] w-[34%] rounded-xl border border-emerald-400/25 bg-emerald-400/10">
            <span className="absolute left-3 top-2 text-[10px] font-medium tracking-wide text-white/70">
              Bedroom
            </span>
          </div>

          {/* Prompt chip */}
          <div className="absolute bottom-3 left-1/2 w-[86%] -translate-x-1/2 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-center text-[11px] font-light text-[#A1A1AA] backdrop-blur-md">
            “2 bedroom house with kitchen and hall”
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.22),transparent_65%)] blur-2xl" />
        <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.18),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-[1200px] items-center gap-14 px-5 md:grid-cols-2 md:gap-16 md:px-8">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="mb-5 inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-light tracking-wide text-[#A1A1AA]"
          >
            AI floor plans · Local-first
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05, ease }}
            className="max-w-xl text-4xl font-semibold leading-[1.15] tracking-tight text-white sm:text-5xl md:text-[56px]"
          >
            Design spaces{" "}
            <span className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">
              with words
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12, ease }}
            className="mt-6 max-w-md text-base font-normal leading-relaxed text-[#A1A1AA] sm:text-lg"
          >
            Transform simple prompts into interactive 3D floor plans instantly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18, ease }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/workspace"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] px-6 py-3 text-sm font-medium text-white shadow-[0_0_24px_rgba(59,130,246,0.35)] transition-transform duration-300 hover:scale-105 active:scale-[0.97]"
            >
              Get Started
            </Link>
            <Link
              href="/workspace"
              className="inline-flex items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:scale-105 hover:bg-white/[0.08] active:scale-[0.97]"
            >
              View Demo
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.15, ease }}
        >
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  );
}
