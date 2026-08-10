/**
 * AI / layout API client with Zod validation + typed errors.
 */

import {
  GenerateLayoutResponseSchema,
  toRoomData,
  type ValidatedLayoutResponse,
} from "@/lib/ai/schema";
import type { RoomData } from "@/lib/types";

/** Prefer same-origin Next.js proxy; fall back to direct FastAPI URL. */
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
  bounds: ValidatedLayoutResponse["bounds"];
  source: ValidatedLayoutResponse["source"];
  sample: boolean;
}

/** Call layout API (via Next proxy) and validate the structured response. */
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

  const json: unknown = await res.json();
  const parsed = GenerateLayoutResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError(`Invalid layout payload: ${parsed.error.issues[0]?.message ?? "schema error"}`);
  }

  const data = parsed.data;
  return {
    prompt: data.prompt,
    rooms: toRoomData(data.rooms),
    bounds: data.bounds,
    source: data.source,
    sample: data.sample ?? false,
  };
}
