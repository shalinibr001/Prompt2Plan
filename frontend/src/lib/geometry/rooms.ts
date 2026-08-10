/**
 * Deterministic room geometry helpers (no AI).
 * Phase 1 hardcoded sample + Phase 2 count-based generator.
 */

import type { RoomData, RoomType } from "@/lib/types";

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

/** MVP hardcoded layout — always available offline. */
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

/** Generate N rooms in a non-overlapping row (frontend-only). */
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
    cursorX += size.width + 0.25;
  }

  const mid = cursorX / 2;
  return rooms.map((r) => ({ ...r, x: r.x - mid }));
}

/** Axis-aligned bounds for camera framing. */
export function computeClientBounds(rooms: RoomData[]) {
  if (!rooms.length) {
    return { min_x: 0, max_x: 0, min_z: 0, max_z: 0, width: 0, depth: 0 };
  }
  const min_x = Math.min(...rooms.map((r) => r.x - r.width / 2));
  const max_x = Math.max(...rooms.map((r) => r.x + r.width / 2));
  const min_z = Math.min(...rooms.map((r) => r.z - r.length / 2));
  const max_z = Math.max(...rooms.map((r) => r.z + r.length / 2));
  return {
    min_x,
    max_x,
    min_z,
    max_z,
    width: max_x - min_x,
    depth: max_z - min_z,
  };
}
