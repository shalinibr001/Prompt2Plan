"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import { usePlanStore } from "@/store/planStore";
import { Floor } from "./Floor";
import { Room } from "./Room";

/**
 * Phase 1 scene core + Phase 5 lighting/shadows.
 * Reads rooms from Zustand so Phases 2–3 can update the view dynamically.
 */
function SceneContent() {
  const rooms = usePlanStore((s) => s.rooms);

  return (
    <>
      <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={42} />

      {/* Phase 1 – OrbitControls: zoom, rotate, pan */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0.5, 0]}
      />

      {/* Phase 1 lights */}
      <ambientLight intensity={0.35} color="#A5B4FC" />
      <directionalLight
        castShadow
        position={[12, 18, 8]}
        intensity={1.35}
        color="#FFF7ED"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0002}
      />

      {/* Phase 5 – richer lighting */}
      <directionalLight position={[-10, 8, -6]} intensity={0.35} color="#22D3EE" />
      <hemisphereLight args={["#1E293B", "#0B0F19", 0.4]} />
      <pointLight position={[0, 6, 0]} intensity={0.35} color="#818CF8" distance={30} />
      <Environment preset="city" environmentIntensity={0.3} />

      <Floor />

      {rooms.map((room) => (
        <Room key={room.id} room={room} />
      ))}

      <ContactShadows position={[0, 0.001, 0]} opacity={0.5} scale={28} blur={2.2} far={8} color="#020617" />
    </>
  );
}

export function SceneCanvas() {
  const rooms = usePlanStore((s) => s.rooms);
  const loading = usePlanStore((s) => s.loading);

  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-2xl">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }} className="h-full w-full">
        <color attach="background" args={["#0B0F19"]} />
        <fog attach="fog" args={["#0B0F19", 28, 55]} />
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>

      {!rooms.length && !loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-slate-500">No rooms to display</p>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-ink-50/90 px-5 py-3 text-sm text-slate-200 shadow-glow">
            <span className="h-2 w-2 animate-pulse rounded-full bg-neon-cyan" />
            Generating layout…
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-white/10 bg-ink-50/70 px-3 py-1.5 text-[11px] text-slate-400 backdrop-blur">
        Drag to orbit · Scroll to zoom · Right-drag to pan
      </div>
    </div>
  );
}
