"use client";

/**
 * Ground plane — deep charcoal with a quiet grid.
 */
export function Floor({ size = 28 }: { size?: number }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#111111" roughness={0.96} metalness={0.04} />
      </mesh>
      <gridHelper
        args={[size, Math.floor(size), "#1F1F1F", "#161616"]}
        position={[0, 0.002, 0]}
      />
    </group>
  );
}
