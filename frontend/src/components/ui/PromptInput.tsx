"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePlanStore } from "@/store/planStore";
import { SAMPLE_PROMPTS } from "@/lib/api";

/**
 * Apple-style floating pill prompt — bottom center, glass + focus glow.
 */
export function PromptInput() {
  const prompt = usePlanStore((s) => s.prompt);
  const setPrompt = usePlanStore((s) => s.setPrompt);
  const roomCount = usePlanStore((s) => s.roomCount);
  const setRoomCount = usePlanStore((s) => s.setRoomCount);
  const generateByCount = usePlanStore((s) => s.generateByCount);
  const generateFromPrompt = usePlanStore((s) => s.generateFromPrompt);
  const loading = usePlanStore((s) => s.loading);
  const error = usePlanStore((s) => s.error);
  const [focused, setFocused] = useState(false);
  const [showTools, setShowTools] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void generateFromPrompt();
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4">
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="mb-3 text-center text-xs text-red-400/90"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Sample chips — minimal */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mb-3 flex flex-wrap justify-center gap-2"
      >
        {SAMPLE_PROMPTS.slice(0, 3).map((sample) => (
          <motion.button
            key={sample}
            type="button"
            disabled={loading}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setPrompt(sample);
              void generateFromPrompt(sample);
            }}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-light text-apple-muted backdrop-blur-xl transition-colors duration-300 hover:border-white/20 hover:text-white/90"
          >
            {sample.length > 36 ? `${sample.slice(0, 34)}…` : sample}
          </motion.button>
        ))}
      </motion.div>

      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div
          className={`glass-panel relative flex items-center gap-2 rounded-full p-1.5 pl-5 transition-shadow duration-500 ease-apple ${
            focused ? "shadow-glow ring-1 ring-[#3B82F6]/35" : "shadow-soft"
          }`}
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Describe a floor plan…"
            disabled={loading}
            aria-label="Floor plan prompt"
            className="prompt-field min-w-0 flex-1 bg-transparent py-3 text-[15px] font-light tracking-tight text-white outline-none placeholder:font-light"
          />

          <motion.button
            type="button"
            aria-label="Manual tools"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowTools((v) => !v)}
            className="icon-btn shrink-0"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </motion.button>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-white shadow-glow-sm transition-shadow duration-300 hover:shadow-glow disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </motion.button>
        </div>
      </motion.form>

      <AnimatePresence>
        {showTools && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 8, height: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-3 overflow-hidden"
          >
            <div className="glass-panel mx-auto flex max-w-md items-center gap-2 rounded-full p-2">
              <span className="pl-3 text-[11px] font-light uppercase tracking-wider text-apple-muted">
                Rooms
              </span>
              <input
                type="number"
                min={1}
                max={12}
                value={roomCount}
                onChange={(e) => setRoomCount(Number(e.target.value))}
                className="w-16 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-center text-sm font-light text-white outline-none focus:border-[#3B82F6]/40"
                aria-label="Enter number of rooms"
              />
              <button type="button" className="btn-ghost flex-1 py-2 text-xs" onClick={generateByCount}>
                Build
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
