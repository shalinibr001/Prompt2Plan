"use client";

import { create } from "zustand";
import { generateLayout } from "@/lib/api";
import {
  generateRoomsByCount,
  HARDCODED_LAYOUT,
  ROOM_COLORS,
  type RoomData,
} from "@/lib/types";

export type LayoutSource = "hardcoded" | "manual" | "ollama" | "gemini" | "fallback";

interface PlanState {
  /** Phase 1 default: hardcoded rooms */
  rooms: RoomData[];
  roomCount: number;
  prompt: string;
  source: LayoutSource;
  loading: boolean;
  error: string | null;
  lastPrompt: string | null;

  setRoomCount: (n: number) => void;
  setPrompt: (prompt: string) => void;

  /** Phase 1 – reset to hardcoded sample */
  loadHardcoded: () => void;
  /** Phase 2 – generate N rooms on the frontend */
  generateByCount: () => void;
  /** Phase 3 – ask backend (Ollama) for a layout */
  generateFromPrompt: (prompt?: string) => Promise<void>;
  regenerate: () => Promise<void>;
  clear: () => void;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  rooms: HARDCODED_LAYOUT.rooms,
  roomCount: 3,
  prompt: "",
  source: "hardcoded",
  loading: false,
  error: null,
  lastPrompt: null,

  setRoomCount: (n) => set({ roomCount: n, error: null }),
  setPrompt: (prompt) => set({ prompt, error: null }),

  loadHardcoded: () =>
    set({
      rooms: HARDCODED_LAYOUT.rooms,
      source: "hardcoded",
      error: null,
      lastPrompt: null,
    }),

  generateByCount: () => {
    const { roomCount } = get();
    if (!Number.isFinite(roomCount) || roomCount < 1) {
      set({ error: "Enter a number of rooms between 1 and 12." });
      return;
    }
    set({
      rooms: generateRoomsByCount(roomCount),
      source: "manual",
      error: null,
      lastPrompt: null,
    });
  },

  generateFromPrompt: async (override) => {
    const prompt = (override ?? get().prompt).trim();
    if (prompt.length < 3) {
      set({ error: "Describe your floor plan in a few words." });
      return;
    }

    set({ loading: true, error: null, prompt });
    try {
      const data = await generateLayout(prompt);
      const rooms: RoomData[] = data.rooms.map((r) => {
        const type = (Object.keys(ROOM_COLORS).includes(r.type) ? r.type : "other") as RoomData["type"];
        return {
          id: r.id,
          type,
          width: r.width,
          length: r.length,
          x: r.x,
          z: r.z,
          height: r.height,
          label: r.label ?? r.type,
        };
      });
      set({
        rooms,
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
    const { lastPrompt, prompt, source, roomCount } = get();
    if (source === "manual") {
      get().generateByCount();
      return;
    }
    if (source === "hardcoded") {
      get().loadHardcoded();
      return;
    }
    await get().generateFromPrompt(lastPrompt ?? prompt);
    void roomCount; // keep lint quiet if unused in branch
  },

  clear: () =>
    set({
      rooms: [],
      error: null,
      lastPrompt: null,
      source: "manual",
    }),
}));
