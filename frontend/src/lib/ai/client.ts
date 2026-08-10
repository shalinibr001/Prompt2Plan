/**
 * AI / layout API client with Zod validation.
 */

import {
  GenerateLayoutResponseSchema,
  toDoors,
  toFurniture,
  toRoomData,
  toWindows,
  type ValidatedLayoutResponse,
} from "@/lib/ai/schema";
import type { AdjacencyEdge, DoorData, FurnitureData, RoomData, WindowData } from "@/lib/types";

const API_PATH = "/api/generate-layout";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const SAMPLE_PROMPTS = [
  "2 bedroom house with kitchen and hall",
  "2BHK house with kitchen and balcony",
  "Studio apartment with kitchenette and bathroom",
  "3BHK family home with living room, dining, and two bathrooms",
  "Open plan loft with living, kitchen, office, and balcony",
] as const;

export interface GenerateResult {
  prompt: string;
  rooms: RoomData[];
  doors: DoorData[];
  furniture: FurnitureData[];
  windows: WindowData[];
  adjacency: AdjacencyEdge[];
  bounds: ValidatedLayoutResponse["bounds"];
  source: ValidatedLayoutResponse["source"];
  sample: boolean;
  id?: string | null;
}

function parseLayout(json: unknown): GenerateResult {
  const parsed = GenerateLayoutResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError(`Invalid layout payload: ${parsed.error.issues[0]?.message ?? "schema error"}`);
  }
  const data = parsed.data;
  return {
    prompt: data.prompt,
    rooms: toRoomData(data.rooms),
    doors: toDoors(data.doors),
    furniture: toFurniture(data.furniture),
    windows: toWindows(data.windows),
    adjacency: data.adjacency,
    bounds: data.bounds,
    source: data.source,
    sample: data.sample ?? false,
    id: data.id,
  };
}

export async function generateLayout(prompt: string): Promise<GenerateResult> {
  let res: Response;
  try {
    res = await fetch(API_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
  } catch {
    throw new ApiError("Cannot reach the API. Is the FastAPI server running on port 8000?");
  }

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) {
        detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      /* ignore */
    }
    throw new ApiError(detail, res.status);
  }

  return parseLayout(await res.json());
}

export async function savePlan(payload: Record<string, unknown>): Promise<{ id: string; url: string }> {
  let res: Response;
  try {
    res = await fetch("/api/save-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError("Cannot reach the API. Is the FastAPI server running on port 8000?");
  }
  if (!res.ok) throw new ApiError("Could not save plan", res.status);
  return res.json();
}

export async function loadPlan(id: string): Promise<GenerateResult> {
  let res: Response;
  try {
    res = await fetch(`/api/plan/${encodeURIComponent(id)}`, { cache: "no-store" });
  } catch {
    throw new ApiError("Cannot reach the API. Is the FastAPI server running on port 8000?");
  }
  if (!res.ok) throw new ApiError("Plan not found", res.status);
  return parseLayout(await res.json());
}
