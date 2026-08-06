"use client";

import { create } from "zustand";
import { generateLayout } from "@/lib/api";
import type { GenerateLayoutResponse, LayoutSource, PlacedRoom } from "@/lib/types";

interface PlanState {
  prompt: string;
  rooms: PlacedRoom[];
  bounds: GenerateLayoutResponse["bounds"] | null;
  source: LayoutSource | null;
  loading: boolean;
  error: string | null;
  lastPrompt: string | null;

  setPrompt: (prompt: string) => void;
  generate: (prompt?: string) => Promise<void>;
  regenerate: () => Promise<void>;
  clear: () => void;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  prompt: "",
  rooms: [],
  bounds: null,
  source: null,
  loading: false,
  error: null,
  lastPrompt: null,

  setPrompt: (prompt) => set({ prompt, error: null }),

  generate: async (override) => {
    const prompt = (override ?? get().prompt).trim();
    if (prompt.length < 3) {
      set({ error: "Describe your floor plan in a few words." });
      return;
    }

    set({ loading: true, error: null, prompt });
    try {
      const data = await generateLayout(prompt);
      set({
        rooms: data.rooms,
        bounds: data.bounds,
        source: data.source,
        lastPrompt: data.prompt,
        loading: false,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not generate layout. Is the API running?";
      set({ loading: false, error: message });
    }
  },

  regenerate: async () => {
    const { lastPrompt, prompt } = get();
    await get().generate(lastPrompt ?? prompt);
  },

  clear: () =>
    set({
      rooms: [],
      bounds: null,
      source: null,
      error: null,
      lastPrompt: null,
    }),
}));
