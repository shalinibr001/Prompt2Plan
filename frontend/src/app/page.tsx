"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { PromptInput } from "@/components/ui/PromptInput";
import { Sidebar } from "@/components/ui/Sidebar";

const SceneCanvas = dynamic(
  () => import("@/components/3d/SceneCanvas").then((m) => m.SceneCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-apple-bg">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#3B82F6]" />
          <span className="text-xs font-light tracking-wide text-apple-muted">Preparing scene…</span>
        </motion.div>
      </div>
    ),
  },
);

/**
 * Immersive Apple-style shell:
 * full-bleed 3D · floating glass chrome · bottom prompt pill
 */
export default function HomePage() {
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-apple-bg">
      {/* Full immersive 3D */}
      <div className="absolute inset-0">
        <SceneCanvas />
      </div>

      {/* Soft vignette + subtle top wash */}
      <div className="vignette pointer-events-none absolute inset-0 z-10" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-black/50 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-56 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

      <Navbar />

      {/* Floating sidebar */}
      <div className="pointer-events-none absolute bottom-36 left-4 top-20 z-20 md:bottom-28 md:left-6 md:top-24">
        <div className="pointer-events-auto h-full max-h-full overflow-hidden">
          <Sidebar />
        </div>
      </div>

      {/* Center-bottom floating prompt */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
        className="absolute inset-x-0 bottom-6 z-30 md:bottom-8"
      >
        <PromptInput />
      </motion.div>
    </div>
  );
}
