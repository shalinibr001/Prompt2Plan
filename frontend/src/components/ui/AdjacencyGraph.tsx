"use client";

import { memo, useMemo } from "react";
import type { AdjacencyEdge, RoomData } from "@/lib/types";

interface AdjacencyGraphProps {
  rooms: RoomData[];
  adjacency: AdjacencyEdge[];
  focusedRoomId: string | null;
  onSelectRoom?: (id: string) => void;
}

/** Compact 2D force-ish graph of room connectivity — demo “intelligence” panel. */
function AdjacencyGraphComponent({
  rooms,
  adjacency,
  focusedRoomId,
  onSelectRoom,
}: AdjacencyGraphProps) {
  const layout = useMemo(() => {
    const w = 220;
    const h = 140;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.36;
    const nodes = rooms.map((room, i) => {
      const angle = (i / Math.max(rooms.length, 1)) * Math.PI * 2 - Math.PI / 2;
      return {
        id: room.id,
        label: (room.label ?? room.type).slice(0, 10),
        type: room.type,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
      };
    });
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const links = adjacency
      .map((e) => {
        const a = byId[e.a];
        const b = byId[e.b];
        if (!a || !b) return null;
        return { ...e, a, b };
      })
      .filter(Boolean) as Array<AdjacencyEdge & { a: (typeof nodes)[0]; b: (typeof nodes)[0] }>;
    return { w, h, nodes, links };
  }, [rooms, adjacency]);

  if (!rooms.length) return null;

  return (
    <div className="rounded-card border border-white/[0.08] bg-black/25 p-2">
      <p className="mb-1 px-1 text-[10px] font-medium uppercase tracking-[0.16em] text-ds-muted">
        Adjacency graph
      </p>
      <svg viewBox={`0 0 ${layout.w} ${layout.h}`} className="h-[140px] w-full">
        {layout.links.map((link, i) => (
          <line
            key={`${link.a.id}-${link.b.id}-${i}`}
            x1={link.a.x}
            y1={link.a.y}
            x2={link.b.x}
            y2={link.b.y}
            stroke={link.via === "door" ? "#3B82F6" : "#52525B"}
            strokeWidth={link.via === "door" ? 1.6 : 1}
            strokeOpacity={0.85}
          />
        ))}
        {layout.nodes.map((n) => {
          const active = n.id === focusedRoomId;
          return (
            <g
              key={n.id}
              style={{ cursor: "pointer" }}
              onClick={() => onSelectRoom?.(n.id)}
            >
              <circle
                cx={n.x}
                cy={n.y}
                r={active ? 11 : 9}
                fill={active ? "#3B82F6" : "#27272A"}
                stroke={active ? "#93C5FD" : "#3F3F46"}
                strokeWidth={1.2}
              />
              <text
                x={n.x}
                y={n.y + 22}
                textAnchor="middle"
                fill="#A1A1AA"
                fontSize="8"
                fontFamily="system-ui, sans-serif"
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export const AdjacencyGraph = memo(AdjacencyGraphComponent);
