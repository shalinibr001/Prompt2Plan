/**
 * Phase 1 – Hardcoded floor-plan data (NO AI).
 * Rooms are placed manually so the 3D scene always has something to render.
 */

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

export interface RoomData {
  id: string;
  type: RoomType;
  width: number;
  length: number;
  /** World-space center X (meters) */
  x: number;
  /** World-space center Z (meters) */
  z: number;
  height?: number;
  label?: string;
}

/** Exact MVP sample from the roadmap, with manual positions. */
export const HARDCODED_LAYOUT: { rooms: RoomData[] } = {
  rooms: [
    {
      id: "room-bedroom",
      type: "bedroom",
      width: 4,
      length: 4,
      x: -4,
      z: 0,
      height: 2.8,
      label: "Bedroom",
    },
    {
      id: "room-kitchen",
      type: "kitchen",
      width: 3,
      length: 2,
      x: 0.5,
      z: -1,
      height: 2.8,
      label: "Kitchen",
    },
    {
      id: "room-hall",
      type: "hall",
      width: 5,
      length: 4,
      x: 5,
      z: 0,
      height: 2.8,
      label: "Hall",
    },
  ],
};

/** Colors used by the Room mesh. */
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

const DEFAULT_SIZES: Record<RoomType, { width: number; length: number }> = {
  bedroom: { width: 4, length: 4 },
  kitchen: { width: 3, length: 2.5 },
  hall: { width: 5, length: 4 },
  living: { width: 5, length: 4 },
  bathroom: { width: 2, length: 2.5 },
  balcony: { width: 2.5, length: 1.5 },
  dining: { width: 3.5, length: 3 },
  office: { width: 3, length: 3 },
  closet: { width: 1.5, length: 2 },
  utility: { width: 2, length: 2 },
  garage: { width: 5, length: 3 },
  other: { width: 3, length: 3 },
};

const CYCLE: RoomType[] = ["hall", "bedroom", "kitchen", "bathroom", "living", "balcony"];

/**
 * Phase 2 – Generate N rooms dynamically (frontend only, no AI).
 * Places them in a simple non-overlapping grid row/column pack.
 */
export function generateRoomsByCount(count: number): RoomData[] {
  const n = Math.max(1, Math.min(12, Math.floor(count)));
  const rooms: RoomData[] = [];
  let cursorX = 0;

  for (let i = 0; i < n; i++) {
    const type = CYCLE[i % CYCLE.length];
    const size = DEFAULT_SIZES[type];
    const x = cursorX + size.width / 2;
    rooms.push({
      id: `gen-${i + 1}`,
      type,
      width: size.width,
      length: size.length,
      x,
      z: 0,
      height: 2.8,
      label: `${type.charAt(0).toUpperCase()}${type.slice(1)} ${i + 1}`,
    });
    cursorX += size.width + 0.25; // small gap between rooms
  }

  // Center the row on the origin
  const mid = cursorX / 2;
  return rooms.map((r) => ({ ...r, x: r.x - mid }));
}
