"use client";

import { motion } from "framer-motion";
import { usePlanStore } from "@/store/planStore";
import { ROOM_COLORS, type RoomType } from "@/lib/types";

const ease = [0.4, 0, 0.2, 1] as const;

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

/** Floating glass sidebar with controls, export, history, theme. */
export function Sidebar({ open = true, onClose }: SidebarProps) {
  const rooms = usePlanStore((s) => s.rooms);
  const doors = usePlanStore((s) => s.doors);
  const furniture = usePlanStore((s) => s.furniture);
  const source = usePlanStore((s) => s.source);
  const loading = usePlanStore((s) => s.loading);
  const lastPrompt = usePlanStore((s) => s.lastPrompt);
  const history = usePlanStore((s) => s.history);
  const theme = usePlanStore((s) => s.theme);
  const regenerate = usePlanStore((s) => s.regenerate);
  const clear = usePlanStore((s) => s.clear);
  const loadHardcoded = usePlanStore((s) => s.loadHardcoded);
  const exportJson = usePlanStore((s) => s.exportJson);
  const sharePlan = usePlanStore((s) => s.sharePlan);
  const shareUrl = usePlanStore((s) => s.shareUrl);
  const loadFromHistory = usePlanStore((s) => s.loadFromHistory);
  const wipeHistory = usePlanStore((s) => s.wipeHistory);
  const toggleThemeMode = usePlanStore((s) => s.toggleThemeMode);

  const types = Array.from(new Set(rooms.map((r) => r.type))) as RoomType[];

  return (
    <motion.aside
      initial={{ opacity: 0, x: -24 }}
      animate={{
        opacity: open ? 1 : 0,
        x: open ? 0 : -24,
        pointerEvents: open ? "auto" : "none",
      }}
      transition={{ duration: 0.45, ease }}
      className="flex w-[240px] max-w-[85vw] flex-col gap-3"
    >
      <div className="glass-panel rounded-panel p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ds-muted">
            Controls
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Toggle theme"
              onClick={toggleThemeMode}
              className="icon-btn h-7 w-7"
              title={`Switch to ${theme === "dark" ? "light" : "dark"}`}
            >
              {theme === "dark" ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            {onClose && (
              <button type="button" aria-label="Close" onClick={onClose} className="icon-btn h-7 w-7 md:hidden">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary w-full"
            disabled={loading}
            onClick={() => void regenerate()}
          >
            Regenerate
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="btn-ghost w-full"
            disabled={loading || !rooms.length}
            onClick={() => void sharePlan()}
          >
            Share link
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="btn-ghost w-full"
            disabled={loading || !rooms.length}
            onClick={exportJson}
          >
            Export JSON
          </motion.button>
          {shareUrl && (
            <p className="truncate px-1 text-[10px] font-light text-[#3B82F6]" title={shareUrl}>
              Copied · {shareUrl.replace(/^https?:\/\//, "")}
            </p>
          )}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="btn-ghost w-full"
            disabled={loading}
            onClick={loadHardcoded}
          >
            Reset sample
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="btn-ghost w-full"
            disabled={loading || !rooms.length}
            onClick={clear}
          >
            Clear
          </motion.button>
        </div>
      </div>

      <div className="glass-panel flex min-h-0 flex-1 flex-col rounded-panel p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ds-muted">Layout</p>
          <span className="rounded-full bg-white/[0.05] px-2.5 py-0.5 text-[10px] font-light capitalize text-ds-secondary">
            {source}
          </span>
        </div>

        {!rooms.length ? (
          <div className="mt-6 space-y-2">
            <p className="text-small text-ds-muted">No rooms yet.</p>
            <p className="text-[12px] font-light text-ds-muted">
              Try a sample prompt below the input, or reset the Phase 1 layout.
            </p>
          </div>
        ) : (
          <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Rooms" value={String(rooms.length)} />
              <Stat label="Doors" value={String(doors.length)} />
              <Stat label="Furniture" value={String(furniture.length)} />
              <Stat label="Mode" value={source === "hardcoded" ? "Sample" : source} />
            </div>

            {lastPrompt && (
              <p className="rounded-card border border-white/[0.08] bg-black/25 px-3 py-2.5 text-small leading-relaxed text-ds-secondary">
                “{lastPrompt}”
              </p>
            )}

            <ul className="space-y-1.5">
              {rooms.map((room, i) => (
                <motion.li
                  key={room.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3), ease }}
                  role="button"
                  tabIndex={0}
                  onClick={() => usePlanStore.getState().setFocusedRoom(room.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      usePlanStore.getState().setFocusedRoom(room.id);
                    }
                  }}
                  className="flex cursor-pointer items-center gap-3 rounded-card border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 transition-colors duration-fast hover:bg-white/[0.06]"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background: ROOM_COLORS[room.type],
                      boxShadow: `0 0 10px ${ROOM_COLORS[room.type]}44`,
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-small font-medium tracking-tight text-white">
                      {room.label ?? room.type}
                    </p>
                    <p className="text-[12px] font-light text-ds-muted">
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
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] px-2 py-0.5 text-[10px] font-light text-ds-muted"
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: ROOM_COLORS[t] }} />
                    {t}
                  </span>
                ))}
              </div>
            )}

            {history.length > 0 && (
              <div className="border-t border-white/[0.06] pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ds-muted">
                    History
                  </p>
                  <button
                    type="button"
                    onClick={wipeHistory}
                    className="text-[10px] font-light text-ds-muted hover:text-white"
                  >
                    Clear
                  </button>
                </div>
                <ul className="space-y-1">
                  {history.slice(0, 5).map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        onClick={() => loadFromHistory(h.id)}
                        className="w-full truncate rounded-xl border border-transparent px-2 py-1.5 text-left text-[11px] font-light text-ds-secondary transition hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-white"
                      >
                        {h.prompt}
                      </button>
                    </li>
                  ))}
                </ul>
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
    <div className="rounded-card border border-white/[0.08] bg-black/25 px-3 py-2.5">
      <p className="text-[10px] font-light uppercase tracking-wider text-ds-muted">{label}</p>
      <p className="mt-1 truncate text-small font-medium tracking-tight text-white">{value}</p>
    </div>
  );
}
