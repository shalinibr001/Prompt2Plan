"use client";

import { Text } from "@react-three/drei";
import { ROOM_COLORS, type PlacedRoom } from "@/lib/types";

const WALL_THICKNESS = 0.08;

interface RoomProps {
  room: PlacedRoom;
  selected?: boolean;
}

/**
 * Rectangular room: floor slab, four walls, translucent volume, floating label.
 */
export function Room({ room, selected = false }: RoomProps) {
  const color = ROOM_COLORS[room.type] ?? ROOM_COLORS.other;
  const h = room.height;
  const w = room.width;
  const d = room.length;
  const wallH = h * 0.92;

  return (
    <group position={[room.x, 0, room.z]}>
      {/* Floor slab */}
      <mesh position={[0, 0.02, 0]} receiveShadow castShadow>
        <boxGeometry args={[w - 0.02, 0.04, d - 0.02]} />
        <meshStandardMaterial
          color={color}
          roughness={0.65}
          metalness={0.08}
          emissive={color}
          emissiveIntensity={selected ? 0.22 : 0.08}
        />
      </mesh>

      {/* Soft translucent volume so rooms read as spaces */}
      <mesh position={[0, wallH / 2, 0]}>
        <boxGeometry args={[w - WALL_THICKNESS * 2, wallH, d - WALL_THICKNESS * 2]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.12}
          roughness={0.4}
          metalness={0.1}
          depthWrite={false}
        />
      </mesh>

      {/* Four walls */}
      <Wall length={w} height={wallH} thickness={WALL_THICKNESS} position={[0, wallH / 2, -d / 2]} />
      <Wall length={w} height={wallH} thickness={WALL_THICKNESS} position={[0, wallH / 2, d / 2]} />
      <Wall
        length={d}
        height={wallH}
        thickness={WALL_THICKNESS}
        position={[-w / 2, wallH / 2, 0]}
        rotateY
      />
      <Wall
        length={d}
        height={wallH}
        thickness={WALL_THICKNESS}
        position={[w / 2, wallH / 2, 0]}
        rotateY
      />

      {/* Label */}
      <Text
        position={[0, h + 0.15, 0]}
        fontSize={0.35}
        color="#E8EDF7"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#0B0F19"
      >
        {room.label ?? room.type}
      </Text>
    </group>
  );
}

function Wall({
  length,
  height,
  thickness,
  position,
  rotateY = false,
}: {
  length: number;
  height: number;
  thickness: number;
  position: [number, number, number];
  rotateY?: boolean;
}) {
  return (
    <mesh
      position={position}
      rotation={rotateY ? [0, Math.PI / 2, 0] : [0, 0, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[length, height, thickness]} />
      <meshStandardMaterial color="#1E293B" roughness={0.85} metalness={0.05} />
    </mesh>
  );
}
