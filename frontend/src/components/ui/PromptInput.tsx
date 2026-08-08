"use client";

import { FormEvent } from "react";
import { motion } from "framer-motion";
import { usePlanStore } from "@/store/planStore";
import { SAMPLE_PROMPTS } from "@/lib/api";

/**
 * Phase 2 – room count input
 * Phase 3 – natural-language prompt → AI layout
 */
export function PromptInput() {
  const prompt = usePlanStore((s) => s.prompt);
  const setPrompt = usePlanStore((s) => s.setPrompt);
  const roomCount = usePlanStore((s) => s.roomCount);
  const setRoomCount = usePlanStore((s) => s.setRoomCount);
  const generateByCount = usePlanStore((s) => s.generateByCount);
  const generateFromPrompt = usePlanStore((s) => s.generateFromPrompt);
  const loadHardcoded = usePlanStore((s) => s.loadHardcoded);
  const loading = usePlanStore((s) => s.loading);
  const error = usePlanStore((s) => s.error);

  const onPromptSubmit = (e: FormEvent) => {
    e.preventDefault();
    void generateFromPrompt();
  };

  return (
    <div className="w-full max-w-3xl space-y-4">
      {/* Phase 3 – AI prompt */}
      <form onSubmit={onPromptSubmit}>
        <div className="glass-strong relative overflow-hidden rounded-2xl p-1.5 shadow-glow transition focus-within:shadow-glow-cyan">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-neon-indigo/10 via-transparent to-neon-cyan/10 opacity-60" />
          <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='e.g. "2 bedroom house with kitchen and hall"'
              className="w-full flex-1 bg-transparent px-4 py-3.5 text-[15px] text-slate-100 outline-none placeholder:text-slate-500"
              disabled={loading}
              aria-label="Floor plan prompt"
            />
            <button type="submit" disabled={loading} className="btn-primary m-1 shrink-0 sm:m-0 sm:mr-1">
              {loading ? "Generating…" : "Generate with AI"}
            </button>
          </div>
        </div>
      </form>

      {/* Phase 2 – manual room count */}
      <div className="glass flex flex-col items-stretch gap-2 rounded-2xl p-3 sm:flex-row sm:items-center">
        <label className="shrink-0 px-2 text-xs font-medium uppercase tracking-wider text-slate-500">
          Rooms (manual)
        </label>
        <input
          type="number"
          min={1}
          max={12}
          value={roomCount}
          onChange={(e) => setRoomCount(Number(e.target.value))}
          className="w-full rounded-xl border border-white/10 bg-ink/50 px-3 py-2 text-sm text-slate-100 outline-none focus:border-neon-indigo/50 sm:w-28"
          aria-label="Enter number of rooms"
        />
        <button type="button" className="btn-ghost" disabled={loading} onClick={generateByCount}>
          Build rooms
        </button>
        <button type="button" className="btn-ghost" disabled={loading} onClick={loadHardcoded}>
          Phase 1 sample
        </button>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-rose-400"
        >
          {error}
        </motion.p>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {SAMPLE_PROMPTS.map((sample) => (
          <button
            key={sample}
            type="button"
            disabled={loading}
            onClick={() => {
              setPrompt(sample);
              void generateFromPrompt(sample);
            }}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 transition hover:border-neon-indigo/40 hover:text-slate-200"
          >
            {sample.length > 40 ? `${sample.slice(0, 38)}…` : sample}
          </button>
        ))}
      </div>
    </div>
  );
}
