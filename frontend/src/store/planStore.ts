"use client";

import { create } from "zustand";
import { generateLayout } from "@/lib/ai/client";
import { generateRoomsByCount, HARDCODED_LAYOUT } from "@/lib/geometry/rooms";
import { downloadPlanJson } from "@/lib/utils/export";
import { clearHistory, loadHistory, saveHistoryEntry } from "@/lib/utils/history";
import { applyTheme, getStoredTheme, toggleTheme, type ThemeMode } from "@/lib/utils/theme";
import type { LayoutSource, PlanSnapshot, RoomData } from "@/lib/types";

interface PlanState {
  rooms: RoomData[];
  roomCount: number;
  prompt: string;
  source: LayoutSource;
  loading: boolean;
  error: string | null;
  lastPrompt: string | null;
  history: PlanSnapshot[];
  theme: ThemeMode;

  setRoomCount: (n: number) => void;
  setPrompt: (prompt: string) => void;
  hydrate: () => void;

  loadHardcoded: () => void;
  generateByCount: () => void;
  generateFromPrompt: (prompt?: string) => Promise<void>;
  regenerate: () => Promise<void>;
  clear: () => void;

  exportJson: () => void;
  loadFromHistory: (id: string) => void;
  wipeHistory: () => void;
  toggleThemeMode: () => void;
}

function pushHistory(
  set: (partial: Partial<PlanState>) => void,
  prompt: string,
  rooms: RoomData[],
  source: LayoutSource,
) {
  if (!prompt || !rooms.length) return;
  const history = saveHistoryEntry({ prompt, rooms, source });
  set({ history });
}

export const usePlanStore = create<PlanState>((set, get) => ({
  rooms: HARDCODED_LAYOUT.rooms,
  roomCount: 3,
  prompt: "",
  source: "hardcoded",
  loading: false,
  error: null,
  lastPrompt: null,
  history: [],
  theme: "dark",

  setRoomCount: (n) => set({ roomCount: n, error: null }),
  setPrompt: (prompt) => set({ prompt, error: null }),

  hydrate: () => {
    const theme = getStoredTheme();
    applyTheme(theme);
    set({ history: loadHistory(), theme });
  },

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
    const rooms = generateRoomsByCount(roomCount);
    set({ rooms, source: "manual", error: null, lastPrompt: null });
    pushHistory(set, `Manual ${roomCount} rooms`, rooms, "manual");
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
      set({
        rooms: data.rooms,
        source: data.source,
        lastPrompt: data.prompt,
        loading: false,
      });
      pushHistory(set, data.prompt, data.rooms, data.source);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not generate layout. Is the API running?";
      set({ loading: false, error: message });
    }
  },

  regenerate: async () => {
    const { lastPrompt, prompt, source } = get();
    if (source === "manual") {
      get().generateByCount();
      return;
    }
    if (source === "hardcoded") {
      get().loadHardcoded();
      return;
    }
    await get().generateFromPrompt(lastPrompt ?? prompt);
  },

  clear: () =>
    set({
      rooms: [],
      error: null,
      lastPrompt: null,
      source: "manual",
    }),

  exportJson: () => {
    const { rooms, lastPrompt, prompt, source } = get();
    if (!rooms.length) {
      set({ error: "Nothing to export yet." });
      return;
    }
    downloadPlanJson({ prompt: lastPrompt ?? (prompt || null), rooms, source });
  },

  loadFromHistory: (id) => {
    const item = get().history.find((h) => h.id === id);
    if (!item) return;
    set({
      rooms: item.rooms,
      source: item.source,
      lastPrompt: item.prompt,
      prompt: item.prompt,
      error: null,
    });
  },

  wipeHistory: () => {
    clearHistory();
    set({ history: [] });
  },

  toggleThemeMode: () => {
    const next = toggleTheme(get().theme);
    set({ theme: next });
  },
}));
