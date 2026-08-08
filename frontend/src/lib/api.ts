/** Phase 3 – Frontend client for FastAPI /generate-layout */

export interface ApiRoom {
  id: string;
  type: string;
  width: number;
  length: number;
  label: string | null;
  x: number;
  z: number;
  height: number;
}

export interface GenerateLayoutResponse {
  prompt: string;
  rooms: ApiRoom[];
  bounds: {
    min_x: number;
    max_x: number;
    min_z: number;
    max_z: number;
    width: number;
    depth: number;
  };
  source: "ollama" | "gemini" | "fallback";
  sample: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function generateLayout(prompt: string): Promise<GenerateLayoutResponse> {
  const res = await fetch(`${API_URL}/generate-layout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

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

  return res.json();
}

export const SAMPLE_PROMPTS = [
  "2 bedroom house with kitchen and hall",
  "2BHK house with kitchen and balcony",
  "Studio apartment with kitchenette and bathroom",
  "3BHK family home with living room, dining, and two bathrooms",
];
