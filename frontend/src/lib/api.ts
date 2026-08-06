import type { GenerateLayoutResponse } from "./types";

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
      if (body?.detail) detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      /* ignore parse errors */
    }
    throw new ApiError(detail, res.status);
  }

  return res.json();
}

export async function fetchSamplePrompts(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/sample-prompts`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.prompts ?? [];
  } catch {
    return [];
  }
}
