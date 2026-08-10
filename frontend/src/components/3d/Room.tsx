"use client";

import { memo } from "react";
import { Text } from "@react-three/drei";
import { ROOM_COLORS, type RoomData } from "@/lib/types";

const WALL_THICKNESS = 0.1;
const FLOOR_THICKNESS = 0.08;

interface RoomProps {
  room: RoomData;
}

/**
 * Memoized room mesh — avoids re-creating geometry when sibling rooms update.
 */
function RoomComponent({ room }: RoomProps) {
  const color = ROOM_COLORS[room.type] ?? ROOM_COLORS.other;
  const h = room.height ?? 2.8;
  const w = room.width;
  const d = room.length;
  const wallH = h * 0.9;

  return (
    <group position={[room.x, 0, room.z]}>
      {/* Thick floor slab */}
      <mesh position={[0, FLOOR_THICKNESS / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.02, FLOOR_THICKNESS, d - 0.02]} />
        <meshStandardMaterial
          color={color}
          roughness={0.7}
          metalness={0.06}
          emissive={color}
          emissiveIntensity={0.04}
        />
      </mesh>

      {/* Soft volume */}
      <mesh position={[0, wallH / 2 + FLOOR_THICKNESS, 0]}>
        <boxGeometry args={[w - WALL_THICKNESS * 2, wallH, d - WALL_THICKNESS * 2]} />
        <meshStandardMaterial color={color} transparent opacity={0.12} depthWrite={false} />
      </mesh>

      <Wall length={w} height={wallH} thickness={WALL_THICKNESS} position={[0, wallH / 2 + FLOOR_THICKNESS, -d / 2]} />
      <Wall length={w} height={wallH} thickness={WALL_THICKNESS} position={[0, wallH / 2 + FLOOR_THICKNESS, d / 2]} />
      <Wall
        length={d}
        height={wallH}
        thickness={WALL_THICKNESS}
        position={[-w / 2, wallH / 2 + FLOOR_THICKNESS, 0]}
        rotateY
      />
      <Wall
        length={d}
        height={wallH}
        thickness={WALL_THICKNESS}
        position={[w / 2, wallH / 2 + FLOOR_THICKNESS, 0]}
        rotateY
      />

      <Text
        position={[0, h + 0.25, 0]}
        fontSize={0.32}
        color="#F4F4F5"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.018}
        outlineColor="#0A0A0A"
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
      <meshStandardMaterial color="#2A2A2C" roughness={0.9} metalness={0.03} />
    </mesh>
  );
}

export const Room = memo(RoomComponent);
