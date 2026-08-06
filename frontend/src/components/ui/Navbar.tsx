"use client";

import { motion } from "framer-motion";

export function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative z-20 flex items-center justify-between px-6 py-5 md:px-10"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-neon-indigo to-neon-cyan shadow-glow">
          <span className="font-display text-sm font-bold text-white">P2</span>
        </div>
        <div>
          <p className="font-display text-lg font-semibold tracking-tight text-white">Prompt2Plan</p>
          <p className="text-[11px] text-slate-500">Prompt → interactive 3D floor plans</p>
        </div>
      </div>

      <nav className="hidden items-center gap-6 text-sm text-slate-400 md:flex">
        <a href="#workspace" className="transition hover:text-white">
          Workspace
        </a>
        <a
          href="http://127.0.0.1:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="transition hover:text-white"
        >
          API
        </a>
        <span className="rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1 text-xs text-neon-cyan">
          Local · Free LLM
        </span>
      </nav>
    </motion.header>
  );
}
