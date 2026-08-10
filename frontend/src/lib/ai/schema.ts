/**
 * Zod schemas — validate AI / API layout payloads.
 */

import { z } from "zod";
import { ROOM_TYPES, type RoomData, type DoorData, type FurnitureData, type WindowData } from "@/lib/types";

export const RoomTypeSchema = z.enum(ROOM_TYPES);

export const ApiRoomSchema = z.object({
  id: z.string().min(1),
  type: z.string(),
  width: z.number().positive().max(30),
  length: z.number().positive().max(30),
  label: z.string().nullable().optional(),
  x: z.number(),
  z: z.number(),
  height: z.number().positive().max(10).optional().default(2.8),
  floor: z.number().int().min(0).max(5).optional().default(0),
});

export const DoorSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  x: z.number(),
  z: z.number(),
  axis: z.enum(["x", "z"]).default("x"),
  width: z.number().positive().default(0.9),
});

export const FurnitureSchema = z.object({
  id: z.string(),
  room_id: z.string(),
  kind: z.string(),
  x: z.number(),
  z: z.number(),
  width: z.number().positive(),
  length: z.number().positive(),
  rotation_y: z.number().default(0),
});

export const WindowSchema = z.object({
  id: z.string(),
  room_id: z.string(),
  x: z.number(),
  z: z.number(),
  axis: z.enum(["x", "z"]),
  width: z.number().positive().default(1.2),
});

export const BoundsSchema = z.object({
  min_x: z.number(),
  max_x: z.number(),
  min_z: z.number(),
  max_z: z.number(),
  width: z.number(),
  depth: z.number(),
});

export const GenerateLayoutResponseSchema = z.object({
  prompt: z.string(),
  rooms: z.array(ApiRoomSchema).min(1).max(16),
  doors: z.array(DoorSchema).optional().default([]),
  adjacency: z
    .array(z.object({ a: z.string(), b: z.string(), via: z.enum(["door", "open"]).default("door") }))
    .optional()
    .default([]),
  furniture: z.array(FurnitureSchema).optional().default([]),
  windows: z.array(WindowSchema).optional().default([]),
  bounds: BoundsSchema,
  source: z.enum(["ollama", "gemini", "fallback"]),
  sample: z.boolean().optional().default(false),
  id: z.string().nullable().optional(),
  floors: z.number().int().min(1).max(6).optional().default(1),
  pipeline: z
    .array(
      z.object({
        name: z.string(),
        detail: z.string(),
        meta: z.record(z.unknown()).optional().default({}),
      }),
    )
    .optional()
    .default([]),
  version: z.number().int().optional().nullable(),
});

export type ValidatedLayoutResponse = z.infer<typeof GenerateLayoutResponseSchema>;

export function toRoomData(rooms: z.infer<typeof ApiRoomSchema>[]): RoomData[] {
  return rooms.map((r) => {
    const parsed = RoomTypeSchema.safeParse(r.type);
    return {
      id: r.id,
      type: parsed.success ? parsed.data : "other",
      width: r.width,
      length: r.length,
      x: r.x,
      z: r.z,
      height: r.height ?? 2.8,
      label: r.label ?? r.type,
      floor: r.floor ?? 0,
    };
  });
}

export function toDoors(doors: z.infer<typeof DoorSchema>[]): DoorData[] {
  return doors.map((d) => ({
    id: d.id,
    from: d.from,
    to: d.to,
    x: d.x,
    z: d.z,
    axis: d.axis,
    width: d.width,
  }));
}

export function toFurniture(items: z.infer<typeof FurnitureSchema>[]): FurnitureData[] {
  return items.map((f) => ({ ...f }));
}

export function toWindows(items: z.infer<typeof WindowSchema>[]): WindowData[] {
  return items.map((w) => ({ ...w }));
}
