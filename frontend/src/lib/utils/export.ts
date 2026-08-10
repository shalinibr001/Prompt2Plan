/** Download helpers */

import type { LayoutSource, RoomData } from "@/lib/types";
import { computeClientBounds } from "@/lib/geometry/rooms";

/** Export the current plan as a downloadable JSON file. */
export function downloadPlanJson(opts: {
  prompt: string | null;
  rooms: RoomData[];
  source: LayoutSource;
}) {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    prompt: opts.prompt,
    source: opts.source,
    rooms: opts.rooms,
    bounds: computeClientBounds(opts.rooms),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prompt2plan-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
