/** Local plan history (localStorage) */

import type { LayoutSource, PlanSnapshot, RoomData } from "@/lib/types";

const KEY = "prompt2plan.history.v1";
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
  source: LayoutSource;
}): PlanSnapshot[] {
  if (!canUseStorage()) return [];
  const next: PlanSnapshot = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    prompt: entry.prompt,
    rooms: entry.rooms,
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
