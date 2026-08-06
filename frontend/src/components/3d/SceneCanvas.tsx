"use client";

import { Suspense, useMemo } from "react";
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

function SceneContent() {
  const rooms = usePlanStore((s) => s.rooms);
  const bounds = usePlanStore((s) => s.bounds);

  const cameraDistance = useMemo(() => {
    if (!bounds) return 14;
    const span = Math.max(bounds.width, bounds.depth, 6);
    return Math.max(10, span * 1.35);
  }, [bounds]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[cameraDistance * 0.7, cameraDistance * 0.65, cameraDistance * 0.7]} fov={42} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={60}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0.5, 0]}
      />

      {/* Ambient fill — cool, soft */}
      <ambientLight intensity={0.28} color="#A5B4FC" />

      {/* Key light — warm sun from upper-right, casts shadows */}
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

      {/* Fill / rim — cyan accent from opposite side */}
      <directionalLight position={[-10, 8, -6]} intensity={0.35} color="#22D3EE" />

      {/* Soft hemisphere for sky/ground bounce */}
      <hemisphereLight args={["#1E293B", "#0B0F19", 0.45]} />

      {/* Subtle point light for interior glow */}
      <pointLight position={[0, 6, 0]} intensity={0.4} color="#818CF8" distance={30} decay={2} />

      <Environment preset="city" environmentIntensity={0.35} />

      <Floor bounds={bounds} />

      {rooms.map((room) => (
        <Room key={room.id} room={room} />
      ))}

      {/* Soft contact shadows under the whole plan */}
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.55}
        scale={Math.max(20, (bounds?.width ?? 10) + 8)}
        blur={2.4}
        far={8}
        color="#020617"
      />
    </>
  );
}

function EmptyHint() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="max-w-sm text-center">
        <p className="font-display text-lg font-medium text-slate-300">Your floor plan appears here</p>
        <p className="mt-2 text-sm text-slate-500">
          Enter a prompt above to generate an interactive 3D layout.
        </p>
      </div>
    </div>
  );
}

export function SceneCanvas() {
  const rooms = usePlanStore((s) => s.rooms);
  const loading = usePlanStore((s) => s.loading);

  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-2xl">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        className="h-full w-full"
        style={{ background: "transparent" }}
      >
        <color attach="background" args={["#0B0F19"]} />
        <fog attach="fog" args={["#0B0F19", 28, 55]} />
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>

      {!rooms.length && !loading && <EmptyHint />}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-ink-50/90 px-5 py-3 text-sm text-slate-200 shadow-glow">
            <span className="h-2 w-2 animate-pulse rounded-full bg-neon-cyan" />
            Generating layout…
          </div>
        </div>
      )}

      {/* Camera hint */}
      <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-white/10 bg-ink-50/70 px-3 py-1.5 text-[11px] text-slate-400 backdrop-blur">
        Drag to orbit · Scroll to zoom · Right-drag to pan
      </div>
    </div>
  );
}
