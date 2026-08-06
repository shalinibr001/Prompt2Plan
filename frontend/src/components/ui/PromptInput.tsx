"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePlanStore } from "@/store/planStore";
import { SAMPLE_PROMPTS } from "@/lib/types";
import { fetchSamplePrompts } from "@/lib/api";

export function PromptInput() {
  const prompt = usePlanStore((s) => s.prompt);
  const setPrompt = usePlanStore((s) => s.setPrompt);
  const generate = usePlanStore((s) => s.generate);
  const loading = usePlanStore((s) => s.loading);
  const error = usePlanStore((s) => s.error);
  const [samples, setSamples] = useState<string[]>(SAMPLE_PROMPTS);

  useEffect(() => {
    fetchSamplePrompts().then((list) => {
      if (list.length) setSamples(list);
    });
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void generate();
  };

  return (
    <div className="w-full max-w-3xl">
      <form onSubmit={onSubmit} className="relative">
        <div className="glass-strong group relative overflow-hidden rounded-2xl p-1.5 shadow-glow transition focus-within:shadow-glow-cyan">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-neon-indigo/10 via-transparent to-neon-cyan/10 opacity-60" />
          <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='e.g. "2BHK house with kitchen and balcony"'
              className="w-full flex-1 bg-transparent px-4 py-3.5 text-[15px] text-slate-100 outline-none placeholder:text-slate-500"
              disabled={loading}
              aria-label="Floor plan prompt"
            />
            <button type="submit" disabled={loading} className="btn-primary m-1 shrink-0 sm:m-0 sm:mr-1">
              {loading ? "Generating…" : "Generate"}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-center text-sm text-rose-400"
        >
          {error}
        </motion.p>
      )}

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {samples.slice(0, 4).map((sample) => (
          <button
            key={sample}
            type="button"
            disabled={loading}
            onClick={() => {
              setPrompt(sample);
              void generate(sample);
            }}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 transition hover:border-neon-indigo/40 hover:text-slate-200"
          >
            {sample.length > 42 ? `${sample.slice(0, 40)}…` : sample}
          </button>
        ))}
      </div>
    </div>
  );
}
