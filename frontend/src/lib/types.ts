/** Shared floor-plan types (mirrors backend schemas). */

export type RoomType =
  | "bedroom"
  | "kitchen"
  | "hall"
  | "living"
  | "bathroom"
  | "balcony"
  | "dining"
  | "office"
  | "closet"
  | "utility"
  | "garage"
  | "other";

export type LayoutSource = "ollama" | "gemini" | "fallback";

export interface PlacedRoom {
  id: string;
  type: RoomType;
  width: number;
  length: number;
  label: string | null;
  x: number;
  z: number;
  height: number;
}

export interface LayoutBounds {
  min_x: number;
  max_x: number;
  min_z: number;
  max_z: number;
  width: number;
  depth: number;
}

export interface GenerateLayoutResponse {
  prompt: string;
  rooms: PlacedRoom[];
  bounds: LayoutBounds;
  source: LayoutSource;
  sample: boolean;
}

/** Per-room accent colors for the 3D viewer. */
export const ROOM_COLORS: Record<RoomType, string> = {
  bedroom: "#6366F1",
  kitchen: "#F59E0B",
  hall: "#64748B",
  living: "#22D3EE",
  bathroom: "#38BDF8",
  balcony: "#34D399",
  dining: "#A78BFA",
  office: "#818CF8",
  closet: "#94A3B8",
  utility: "#FB923C",
  garage: "#78716C",
  other: "#9CA3AF",
};

export const SAMPLE_PROMPTS = [
  "2BHK house with kitchen and balcony",
  "Studio apartment with kitchenette and bathroom",
  "3BHK family home with living room, dining, and two bathrooms",
  "Open plan loft with living, kitchen, office, and balcony",
  "Compact 1BHK with hall, kitchen, bedroom and bathroom",
];
