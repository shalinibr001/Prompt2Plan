/** Download helpers */

import type { DoorData, FurnitureData, LayoutSource, RoomData, WindowData } from "@/lib/types";
import { computeClientBounds } from "@/lib/geometry/rooms";

export function downloadPlanJson(opts: {
  prompt: string | null;
  rooms: RoomData[];
  doors?: DoorData[];
  furniture?: FurnitureData[];
  windows?: WindowData[];
  source: LayoutSource;
}) {
  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    prompt: opts.prompt,
    source: opts.source,
    rooms: opts.rooms,
    doors: opts.doors ?? [],
    furniture: opts.furniture ?? [],
    windows: opts.windows ?? [],
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
