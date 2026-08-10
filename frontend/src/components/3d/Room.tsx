"use client";

import { memo, useMemo } from "react";
import { Text } from "@react-three/drei";
import { ROOM_COLORS, type DoorData, type FurnitureData, type RoomData, type WindowData } from "@/lib/types";

const WALL_T = 0.1;
const FLOOR_T = 0.1;
const DOOR_H = 2.1;

interface RoomProps {
  room: RoomData;
  doors: DoorData[];
  windows: WindowData[];
  furniture: FurnitureData[];
  highlighted?: boolean;
  onHover?: (id: string | null) => void;
  onClick?: (id: string) => void;
}

type Edge = "n" | "s" | "e" | "w";

function RoomComponent({
  room,
  doors,
  windows,
  furniture,
  highlighted = false,
  onHover,
  onClick,
}: RoomProps) {
  const color = ROOM_COLORS[room.type] ?? ROOM_COLORS.other;
  const h = room.height ?? 2.8;
  const w = room.width;
  const d = room.length;

  const roomDoors = useMemo(
    () => doors.filter((door) => door.from === room.id || door.to === room.id),
    [doors, room.id],
  );
  const roomWindows = useMemo(
    () => windows.filter((win) => win.room_id === room.id),
    [windows, room.id],
  );
  const roomFurniture = useMemo(
    () => furniture.filter((f) => f.room_id === room.id),
    [furniture, room.id],
  );

  return (
    <group
      position={[room.x, 0, room.z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover?.(room.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        onHover?.(null);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(room.id);
      }}
    >
      {/* Floor */}
      <mesh position={[0, FLOOR_T / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[w - 0.02, FLOOR_T, d - 0.02]} />
        <meshStandardMaterial
          color={highlighted ? "#E8EEF9" : color}
          roughness={0.75}
          metalness={0.08}
          emissive={highlighted ? "#3B82F6" : color}
          emissiveIntensity={highlighted ? 0.25 : 0.05}
        />
      </mesh>

      {/* Soft volume */}
      <mesh position={[0, h * 0.45, 0]}>
        <boxGeometry args={[w - WALL_T * 2.2, h * 0.85, d - WALL_T * 2.2]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={highlighted ? 0.2 : 0.08}
          depthWrite={false}
        />
      </mesh>

      <WallEdge edge="n" room={room} wallH={h} doors={roomDoors} windows={roomWindows} />
      <WallEdge edge="s" room={room} wallH={h} doors={roomDoors} windows={roomWindows} />
      <WallEdge edge="e" room={room} wallH={h} doors={roomDoors} windows={roomWindows} />
      <WallEdge edge="w" room={room} wallH={h} doors={roomDoors} windows={roomWindows} />

      {roomFurniture.map((f) => (
        <FurnitureMesh key={f.id} item={f} room={room} />
      ))}

      <Text
        position={[0, h + 0.2, 0]}
        fontSize={0.3}
        color="#F4F4F5"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.016}
        outlineColor="#0A0A0A"
      >
        {room.label ?? room.type}
      </Text>
    </group>
  );
}

function WallEdge({
  edge,
  room,
  wallH,
  doors,
  windows,
}: {
  edge: Edge;
  room: RoomData;
  wallH: number;
  doors: DoorData[];
  windows: WindowData[];
}) {
  const w = room.width;
  const d = room.length;
  const along = edge === "n" || edge === "s" ? w : d;
  const axis: "x" | "z" = edge === "n" || edge === "s" ? "z" : "x";

  // Openings projected onto this edge as local 1D ranges along the wall.
  const openings: { start: number; end: number; kind: "door" | "window" }[] = [];

  for (const door of doors) {
    if (door.axis !== axis) continue;
    const local = edge === "n" || edge === "s" ? door.x - room.x : door.z - room.z;
    // Must lie near this edge
    const onEdge =
      (edge === "n" && Math.abs(door.z - (room.z + d / 2)) < 0.35) ||
      (edge === "s" && Math.abs(door.z - (room.z - d / 2)) < 0.35) ||
      (edge === "e" && Math.abs(door.x - (room.x + w / 2)) < 0.35) ||
      (edge === "w" && Math.abs(door.x - (room.x - w / 2)) < 0.35);
    if (!onEdge) continue;
    openings.push({
      start: local - door.width / 2,
      end: local + door.width / 2,
      kind: "door",
    });
  }

  for (const win of windows) {
    if (win.axis !== axis) continue;
    const local = edge === "n" || edge === "s" ? win.x - room.x : win.z - room.z;
    const onEdge =
      (edge === "n" && Math.abs(win.z - (room.z + d / 2)) < 0.35) ||
      (edge === "s" && Math.abs(win.z - (room.z - d / 2)) < 0.35) ||
      (edge === "e" && Math.abs(win.x - (room.x + w / 2)) < 0.35) ||
      (edge === "w" && Math.abs(win.x - (room.x - w / 2)) < 0.35);
    if (!onEdge) continue;
    openings.push({
      start: local - win.width / 2,
      end: local + win.width / 2,
      kind: "window",
    });
  }

  openings.sort((a, b) => a.start - b.start);

  // Merge segments of solid wall
  const half = along / 2;
  const segments: { start: number; end: number }[] = [];
  let cursor = -half;
  for (const op of openings) {
    const s = Math.max(-half, op.start);
    const e = Math.min(half, op.end);
    if (s > cursor + 0.02) segments.push({ start: cursor, end: s });
    cursor = Math.max(cursor, e);
  }
  if (cursor < half - 0.02) segments.push({ start: cursor, end: half });

  const yBase = FLOOR_T;
  const solidH = wallH - FLOOR_T;

  return (
    <group>
      {segments.map((seg, i) => {
        const len = seg.end - seg.start;
        if (len < 0.05) return null;
        const mid = (seg.start + seg.end) / 2;
        const pos = edgePosition(edge, mid, w, d, solidH / 2 + yBase);
        return (
          <mesh key={i} position={pos} rotation={edgeRotation(edge)} castShadow receiveShadow>
            <boxGeometry args={[len, solidH, WALL_T]} />
            <meshStandardMaterial color="#2C2C2E" roughness={0.88} metalness={0.04} />
          </mesh>
        );
      })}

      {/* Door lintel + window glass */}
      {openings.map((op, i) => {
        const mid = (op.start + op.end) / 2;
        const len = Math.max(0.2, op.end - op.start);
        if (op.kind === "door") {
          const lintelH = Math.max(0.2, solidH - DOOR_H);
          const pos = edgePosition(edge, mid, w, d, yBase + DOOR_H + lintelH / 2);
          return (
            <mesh key={`door-${i}`} position={pos} rotation={edgeRotation(edge)} castShadow>
              <boxGeometry args={[len, lintelH, WALL_T]} />
              <meshStandardMaterial color="#2C2C2E" roughness={0.88} />
            </mesh>
          );
        }
        // Window glass panel
        const winH = 1.1;
        const sill = 0.9;
        const pos = edgePosition(edge, mid, w, d, yBase + sill + winH / 2);
        return (
          <mesh key={`win-${i}`} position={pos} rotation={edgeRotation(edge)}>
            <boxGeometry args={[len * 0.92, winH, WALL_T * 0.35]} />
            <meshPhysicalMaterial
              color="#A5D8FF"
              transmission={0.75}
              thickness={0.2}
              roughness={0.05}
              metalness={0.05}
              transparent
              opacity={0.55}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function edgePosition(
  edge: Edge,
  alongMid: number,
  w: number,
  d: number,
  y: number,
): [number, number, number] {
  if (edge === "n") return [alongMid, y, d / 2];
  if (edge === "s") return [alongMid, y, -d / 2];
  if (edge === "e") return [w / 2, y, alongMid];
  return [-w / 2, y, alongMid];
}

function edgeRotation(edge: Edge): [number, number, number] {
  return edge === "e" || edge === "w" ? [0, Math.PI / 2, 0] : [0, 0, 0];
}

function FurnitureMesh({ item, room }: { item: FurnitureData; room: RoomData }) {
  const lx = item.x - room.x;
  const lz = item.z - room.z;
  const color =
    item.kind === "bed"
      ? "#4A5568"
      : item.kind === "sofa"
        ? "#3B82F6"
        : item.kind === "counter"
          ? "#D6D3D1"
          : item.kind === "wardrobe"
            ? "#57534E"
            : "#78716C";
  const height =
    item.kind === "bed" ? 0.45 : item.kind === "wardrobe" ? 1.8 : item.kind === "sofa" ? 0.7 : 0.75;

  return (
    <mesh
      position={[lx, FLOOR_T + height / 2, lz]}
      rotation={[0, item.rotation_y, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[item.width, height, item.length]} />
      <meshStandardMaterial color={color} roughness={0.7} metalness={0.05} />
    </mesh>
  );
}

export const Room = memo(RoomComponent);
