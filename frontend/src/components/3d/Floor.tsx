"use client";

/**
 * Phase 1 – Ground plane under the floor plan.
 * Receives shadows so rooms feel grounded.
 */
export function Floor({ size = 24 }: { size?: number }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#0F1524" roughness={0.95} metalness={0.05} />
      </mesh>
      <gridHelper args={[size, size, "#1E293B", "#151B2B"]} position={[0, 0.005, 0]} />
    </group>
  );
}
