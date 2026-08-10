/**
 * Next.js BFF proxy → FastAPI GET /plan/{id}/versions
 */

import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ detail: "Missing plan id" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${API_URL}/plan/${encodeURIComponent(id)}/versions`, {
      cache: "no-store",
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { detail: "Upstream FastAPI unavailable. Start the backend on port 8000." },
      { status: 502 },
    );
  }
}
