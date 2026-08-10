/** Local plan history (localStorage) */

import type { DoorData, FurnitureData, LayoutSource, PlanSnapshot, RoomData, WindowData } from "@/lib/types";

const KEY = "prompt2plan.history.v2";
const MAX = 12;

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function loadHistory(): PlanSnapshot[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as PlanSnapshot[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveHistoryEntry(entry: {
  prompt: string;
  rooms: RoomData[];
  doors: DoorData[];
  furniture: FurnitureData[];
  windows: WindowData[];
  source: LayoutSource;
}): PlanSnapshot[] {
  if (!canUseStorage()) return [];
  const next: PlanSnapshot = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    prompt: entry.prompt,
    rooms: entry.rooms,
    doors: entry.doors,
    furniture: entry.furniture,
    windows: entry.windows,
    source: entry.source,
    createdAt: Date.now(),
  };
  const prev = loadHistory().filter((h) => h.prompt !== entry.prompt || h.source !== entry.source);
  const list = [next, ...prev].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}

export function clearHistory() {
  if (!canUseStorage()) return;
  localStorage.removeItem(KEY);
}
