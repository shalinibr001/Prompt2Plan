"use client";

import { motion } from "framer-motion";
import { usePlanStore } from "@/store/planStore";
import { ROOM_COLORS, type RoomType } from "@/lib/types";

/** Floating glass sidebar — Apple-minimal controls + room list */
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
    <motion.aside
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
      className="flex w-[260px] max-w-[84vw] flex-col gap-3"
    >
      <div className="glass-panel rounded-3xl p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-apple-muted">
          Controls
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary w-full"
            disabled={loading}
            onClick={() => void regenerate()}
          >
            Regenerate
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            className="btn-ghost w-full"
            disabled={loading}
            onClick={loadHardcoded}
          >
            Reset sample
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            className="btn-ghost w-full"
            disabled={loading || !rooms.length}
            onClick={clear}
          >
            Clear
          </motion.button>
        </div>
      </div>

      <div className="glass-panel flex min-h-0 flex-1 flex-col rounded-3xl p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-apple-muted">
            Layout
          </p>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-light capitalize text-apple-muted">
            {source}
          </span>
        </div>

        {!rooms.length ? (
          <p className="mt-6 text-sm font-light text-apple-muted">No rooms yet.</p>
        ) : (
          <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Rooms" value={String(rooms.length)} />
              <Stat label="Mode" value={source === "hardcoded" ? "Sample" : source} />
            </div>

            {lastPrompt && (
              <p className="rounded-2xl border border-white/5 bg-black/20 px-3 py-2.5 text-xs font-light leading-relaxed text-apple-muted">
                “{lastPrompt}”
              </p>
            )}

            <ul className="space-y-1.5">
              {rooms.map((room, i) => (
                <motion.li
                  key={room.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-2.5 transition-colors duration-300 hover:bg-white/[0.06]"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background: ROOM_COLORS[room.type],
                      boxShadow: `0 0 10px ${ROOM_COLORS[room.type]}55`,
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium tracking-tight text-white/90">
                      {room.label ?? room.type}
                    </p>
                    <p className="text-[11px] font-light text-apple-muted">
                      {room.width} × {room.length} m
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>

            {types.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {types.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/5 px-2 py-0.5 text-[10px] font-light text-apple-muted"
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: ROOM_COLORS[t] }} />
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.aside>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 px-3 py-2.5">
      <p className="text-[10px] font-light uppercase tracking-wider text-apple-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium tracking-tight text-white/90">{value}</p>
    </div>
  );
}
