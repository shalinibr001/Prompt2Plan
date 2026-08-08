"use client";

import { motion } from "framer-motion";
import { usePlanStore } from "@/store/planStore";
import { ROOM_COLORS, type RoomType } from "@/lib/types";

/** Phase 5 – sidebar controls + room list */
export function Sidebar() {
  const rooms = usePlanStore((s) => s.rooms);
  const source = usePlanStore((s) => s.source);
  const loading = usePlanStore((s) => s.loading);
  const lastPrompt = usePlanStore((s) => s.lastPrompt);
  const regenerate = usePlanStore((s) => s.regenerate);
  const clear = usePlanStore((s) => s.clear);
  const loadHardcoded = usePlanStore((s) => s.loadHardcoded);

  const types = Array.from(new Set(rooms.map((r) => r.type))) as RoomType[];

  return (
    <aside className="flex h-full flex-col gap-4">
      <div className="glass-strong rounded-2xl p-4">
        <h2 className="font-display text-sm font-semibold tracking-wide text-slate-200">Controls</h2>
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            className="btn-primary w-full"
            disabled={loading}
            onClick={() => void regenerate()}
          >
            Regenerate
          </button>
          <button type="button" className="btn-ghost w-full" disabled={loading} onClick={loadHardcoded}>
            Reset sample
          </button>
          <button
            type="button"
            className="btn-ghost w-full"
            disabled={loading || !rooms.length}
            onClick={clear}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="glass-strong flex-1 overflow-hidden rounded-2xl p-4">
        <h2 className="font-display text-sm font-semibold tracking-wide text-slate-200">Layout</h2>

        {!rooms.length ? (
          <p className="mt-4 text-sm text-slate-500">No rooms yet.</p>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 space-y-4 overflow-y-auto pr-1"
            style={{ maxHeight: "calc(100vh - 280px)" }}
          >
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Stat label="Rooms" value={String(rooms.length)} />
              <Stat label="Source" value={source} />
            </div>

            {lastPrompt && (
              <p className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-xs leading-relaxed text-slate-400">
                “{lastPrompt}”
              </p>
            )}

            <ul className="space-y-2">
              {rooms.map((room) => (
                <li
                  key={room.id}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      background: ROOM_COLORS[room.type],
                      boxShadow: `0 0 8px ${ROOM_COLORS[room.type]}66`,
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-200">{room.label ?? room.type}</p>
                    <p className="text-[11px] text-slate-500">
                      {room.width} × {room.length} m
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {types.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">Legend</p>
                <div className="flex flex-wrap gap-2">
                  {types.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/5 px-2 py-0.5 text-[11px] text-slate-400"
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: ROOM_COLORS[t] }} />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 font-mono text-sm text-slate-200">{value}</p>
    </div>
  );
}
