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
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl bg-ink-50/50">
        <span className="text-sm text-slate-500">Loading 3D viewer…</span>
      </div>
    ),
  },
);

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(99,102,241,0.15) 1px, transparent 0)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)",
        }}
      />
      <div className="pointer-events-none absolute -left-32 top-40 h-72 w-72 rounded-full bg-neon-indigo/20 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-neon-cyan/10 blur-[120px]" />

      <Navbar />

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 pb-10 md:px-8">
        {/* Hero — brand first, one composition */}
        <section className="flex flex-col items-center pb-10 pt-6 text-center md:pt-10">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="font-display text-5xl font-bold tracking-tight text-white md:text-6xl"
          >
            Prompt
            <span className="bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-cyan bg-clip-text text-transparent">
              2
            </span>
            Plan
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="mt-4 max-w-xl text-base text-slate-400 md:text-lg"
          >
            Describe a home in plain English. Get an interactive 3D floor plan in seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mt-8 flex w-full justify-center"
          >
            <PromptInput />
          </motion.div>
        </section>

        {/* Workspace */}
        <motion.section
          id="workspace"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22 }}
          className="grid gap-4 lg:grid-cols-[280px_1fr]"
        >
          <Sidebar />

          <div className="glass-strong relative min-h-[480px] overflow-hidden rounded-2xl p-2 shadow-glow md:min-h-[560px]">
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-3">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">3D Viewer</span>
              <span className="rounded-full border border-white/10 bg-ink/60 px-2.5 py-0.5 text-[10px] text-slate-400 backdrop-blur">
                Shadows · Orbit · Zoom
              </span>
            </div>
            <div className="h-[calc(100%-0.5rem)] min-h-[460px] pt-8">
              <SceneCanvas />
            </div>
          </div>
        </motion.section>

        <footer className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-white/5 pt-6 text-xs text-slate-600 sm:flex-row">
          <p>Built with Next.js · React Three Fiber · FastAPI · Ollama</p>
          <p>Dark theme · Glassmorphism · Local-first AI</p>
        </footer>
      </main>
    </div>
  );
}
