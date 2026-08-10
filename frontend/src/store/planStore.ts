"use client";

import { create } from "zustand";
import { generateLayout, loadPlan, savePlan } from "@/lib/ai/client";
import { generateRoomsByCount, HARDCODED_LAYOUT } from "@/lib/geometry/rooms";
import { downloadPlanJson } from "@/lib/utils/export";
import { clearHistory, loadHistory, saveHistoryEntry } from "@/lib/utils/history";
import { applyTheme, getStoredTheme, toggleTheme, type ThemeMode } from "@/lib/utils/theme";
import type {
  DoorData,
  FurnitureData,
  LayoutSource,
  PlanSnapshot,
  RoomData,
  WindowData,
} from "@/lib/types";

interface PlanState {
  rooms: RoomData[];
  doors: DoorData[];
  furniture: FurnitureData[];
  windows: WindowData[];
  roomCount: number;
  prompt: string;
  source: LayoutSource;
  loading: boolean;
  error: string | null;
  lastPrompt: string | null;
  history: PlanSnapshot[];
  theme: ThemeMode;
  hoveredRoomId: string | null;
  focusedRoomId: string | null;
  shareUrl: string | null;
  generationKey: number;

  setRoomCount: (n: number) => void;
  setPrompt: (prompt: string) => void;
  hydrate: () => void;
  setHoveredRoom: (id: string | null) => void;
  setFocusedRoom: (id: string | null) => void;

  loadHardcoded: () => void;
  generateByCount: () => void;
  generateFromPrompt: (prompt?: string) => Promise<void>;
  regenerate: () => Promise<void>;
  clear: () => void;
  exportJson: () => void;
  sharePlan: () => Promise<string | null>;
  loadSharedPlan: (id: string) => Promise<void>;
  loadFromHistory: (id: string) => void;
  wipeHistory: () => void;
  toggleThemeMode: () => void;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  rooms: HARDCODED_LAYOUT.rooms,
  doors: [],
  furniture: [],
  windows: [],
  roomCount: 3,
  prompt: "",
  source: "hardcoded",
  loading: false,
  error: null,
  lastPrompt: null,
  history: [],
  theme: "dark",
  hoveredRoomId: null,
  focusedRoomId: null,
  shareUrl: null,
  generationKey: 0,

  setRoomCount: (n) => set({ roomCount: n, error: null }),
  setPrompt: (prompt) => set({ prompt, error: null }),
  setHoveredRoom: (id) => set({ hoveredRoomId: id }),
  setFocusedRoom: (id) => set({ focusedRoomId: id }),

  hydrate: () => {
    const theme = getStoredTheme();
    applyTheme(theme);
    set({ history: loadHistory(), theme });
  },

  loadHardcoded: () =>
    set({
      rooms: HARDCODED_LAYOUT.rooms,
      doors: [],
      furniture: [],
      windows: [],
      source: "hardcoded",
      error: null,
      lastPrompt: null,
      focusedRoomId: null,
      generationKey: get().generationKey + 1,
    }),

  generateByCount: () => {
    const { roomCount } = get();
    if (!Number.isFinite(roomCount) || roomCount < 1) {
      set({ error: "Enter a number of rooms between 1 and 12." });
      return;
    }
    const rooms = generateRoomsByCount(roomCount);
    set({
      rooms,
      doors: [],
      furniture: [],
      windows: [],
      source: "manual",
      error: null,
      lastPrompt: null,
      generationKey: get().generationKey + 1,
    });
    const history = saveHistoryEntry({
      prompt: `Manual ${roomCount} rooms`,
      rooms,
      doors: [],
      furniture: [],
      windows: [],
      source: "manual",
    });
    set({ history });
  },

  generateFromPrompt: async (override) => {
    const prompt = (override ?? get().prompt).trim();
    if (prompt.length < 3) {
      set({ error: "Describe your floor plan in a few words." });
      return;
    }

    set({ loading: true, error: null, prompt, focusedRoomId: null });
    try {
      const data = await generateLayout(prompt);
      const history = saveHistoryEntry({
        prompt: data.prompt,
        rooms: data.rooms,
        doors: data.doors,
        furniture: data.furniture,
        windows: data.windows,
        source: data.source,
      });
      set({
        rooms: data.rooms,
        doors: data.doors,
        furniture: data.furniture,
        windows: data.windows,
        source: data.source,
        lastPrompt: data.prompt,
        loading: false,
        history,
        generationKey: get().generationKey + 1,
      });
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
      doors: [],
      furniture: [],
      windows: [],
      error: null,
      lastPrompt: null,
      source: "manual",
      focusedRoomId: null,
    }),

  exportJson: () => {
    const { rooms, doors, furniture, windows, lastPrompt, prompt, source } = get();
    if (!rooms.length) {
      set({ error: "Nothing to export yet." });
      return;
    }
    downloadPlanJson({
      prompt: lastPrompt ?? (prompt || null),
      rooms,
      doors,
      furniture,
      windows,
      source,
    });
  },

  sharePlan: async () => {
    const { rooms, doors, furniture, windows, lastPrompt, prompt, source } = get();
    if (!rooms.length) {
      set({ error: "Generate a plan before sharing." });
      return null;
    }
    try {
      const xs = rooms.flatMap((r) => [r.x - r.width / 2, r.x + r.width / 2]);
      const zs = rooms.flatMap((r) => [r.z - r.length / 2, r.z + r.length / 2]);
      const payload = {
        prompt: lastPrompt ?? prompt,
        rooms,
        doors,
        furniture,
        windows,
        adjacency: [],
        bounds: {
          min_x: Math.min(...xs),
          max_x: Math.max(...xs),
          min_z: Math.min(...zs),
          max_z: Math.max(...zs),
          width: Math.max(...xs) - Math.min(...xs),
          depth: Math.max(...zs) - Math.min(...zs),
        },
        source,
      };
      const { url } = await savePlan(payload);
      const full = `${window.location.origin}${url}`;
      await navigator.clipboard.writeText(full);
      set({ shareUrl: full });
      return full;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Share failed" });
      return null;
    }
  },

  loadSharedPlan: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await loadPlan(id);
      set({
        rooms: data.rooms,
        doors: data.doors,
        furniture: data.furniture,
        windows: data.windows,
        source: data.source,
        lastPrompt: data.prompt,
        prompt: data.prompt,
        loading: false,
        generationKey: get().generationKey + 1,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Could not load plan",
      });
    }
  },

  loadFromHistory: (id) => {
    const item = get().history.find((h) => h.id === id);
    if (!item) return;
    set({
      rooms: item.rooms,
      doors: item.doors,
      furniture: item.furniture,
      windows: item.windows,
      source: item.source,
      lastPrompt: item.prompt,
      prompt: item.prompt,
      error: null,
      generationKey: get().generationKey + 1,
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
