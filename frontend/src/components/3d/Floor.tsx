"use client";

import type { LayoutBounds } from "@/lib/types";

interface FloorProps {
  bounds: LayoutBounds | null;
}

/**
 * Ground plane under the floor plan — receives shadows for depth.
 */
export function Floor({ bounds }: FloorProps) {
  const pad = 4;
  const width = Math.max(12, (bounds?.width ?? 10) + pad * 2);
  const depth = Math.max(12, (bounds?.depth ?? 10) + pad * 2);

  return (
    <group>
      {/* Primary ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#0F1524" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Subtle grid overlay */}
      <gridHelper
        args={[Math.max(width, depth), Math.floor(Math.max(width, depth)), "#1E293B", "#151B2B"]}
        position={[0, 0.005, 0]}
      />
    </group>
  );
}
