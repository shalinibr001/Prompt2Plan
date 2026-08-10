/**
 * Zod schemas — validate AI / API layout payloads before they hit the 3D scene.
 */

import { z } from "zod";
import { ROOM_TYPES, type RoomData } from "@/lib/types";

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
  rooms: z.array(ApiRoomSchema).min(1).max(12),
  bounds: BoundsSchema,
  source: z.enum(["ollama", "gemini", "fallback"]),
  sample: z.boolean().optional().default(false),
});

export type ValidatedLayoutResponse = z.infer<typeof GenerateLayoutResponseSchema>;

/** Normalize API rooms into typed RoomData for the renderer. */
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
    };
  });
}
