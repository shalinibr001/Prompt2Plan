/**
 * Shared domain types for Prompt2Plan.
 * Single source of truth for room / layout shapes on the frontend.
 */

export const ROOM_TYPES = [
  "bedroom",
  "kitchen",
  "hall",
  "living",
  "bathroom",
  "balcony",
  "dining",
  "office",
  "closet",
  "utility",
  "garage",
  "other",
] as const;

export type RoomType = (typeof ROOM_TYPES)[number];

export type LayoutSource = "hardcoded" | "manual" | "ollama" | "gemini" | "fallback";

export interface RoomData {
  id: string;
  type: RoomType;
  width: number;
  length: number;
  x: number;
  z: number;
  height?: number;
  label?: string;
}

export interface LayoutBounds {
  min_x: number;
  max_x: number;
  min_z: number;
  max_z: number;
  width: number;
  depth: number;
}

export interface PlanSnapshot {
  id: string;
  prompt: string;
  rooms: RoomData[];
  source: LayoutSource;
  createdAt: number;
}

/** Soft Apple-like room accents */
export const ROOM_COLORS: Record<RoomType, string> = {
  bedroom: "#6B8CFF",
  kitchen: "#D4A574",
  hall: "#8E8E93",
  living: "#7EB6FF",
  bathroom: "#8EC5E8",
  balcony: "#7DCFB6",
  dining: "#B8A1E3",
  office: "#8FA3D9",
  closet: "#A1A1AA",
  utility: "#C4A484",
  garage: "#8A8580",
  other: "#9CA3AF",
};

export function isRoomType(value: string): value is RoomType {
  return (ROOM_TYPES as readonly string[]).includes(value);
}
