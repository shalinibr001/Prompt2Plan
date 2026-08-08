"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import * as THREE from "three";
import { usePlanStore } from "@/store/planStore";
import { Floor } from "./Floor";
import { Room } from "./Room";

/** Smooth camera framing when the layout span changes. */
function CameraRig({ span }: { span: number }) {
  const { camera } = useThree();
  const goal = useRef(new THREE.Vector3(12, 10, 12));

  useEffect(() => {
    const d = Math.max(10, span * 1.3);
    goal.current.set(d * 0.72, d * 0.58, d * 0.72);
  }, [span]);

  useFrame(() => {
    camera.position.lerp(goal.current, 0.04);
  });

  return null;
}

function SceneContent() {
  const rooms = usePlanStore((s) => s.rooms);

  const span = useMemo(() => {
    if (!rooms.length) return 12;
    const xs = rooms.flatMap((r) => [r.x - r.width / 2, r.x + r.width / 2]);
    const zs = rooms.flatMap((r) => [r.z - r.length / 2, r.z + r.length / 2]);
    return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs), 8);
  }, [rooms]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[12, 10, 12]} fov={40} near={0.1} far={200} />
      <CameraRig span={span} />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        minDistance={4}
        maxDistance={55}
        maxPolarAngle={Math.PI / 2.08}
        target={[0, 0.4, 0]}
      />

      <ambientLight intensity={0.32} color="#E8EEF9" />
      <directionalLight
        castShadow
        position={[14, 20, 10]}
        intensity={1.15}
        color="#FFF8F0"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={60}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-12, 8, -8]} intensity={0.28} color="#93C5FD" />
      <hemisphereLight args={["#1A1A1A", "#0A0A0A", 0.35]} />
      <Environment preset="apartment" environmentIntensity={0.28} />

      <Floor size={Math.max(28, span + 10)} />

      {rooms.map((room) => (
        <Room key={room.id} room={room} />
      ))}

      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.45}
        scale={Math.max(24, span + 12)}
        blur={2.6}
        far={10}
        color="#000000"
      />
    </>
  );
}

export function SceneCanvas() {
  const rooms = usePlanStore((s) => s.rooms);
  const loading = usePlanStore((s) => s.loading);

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        className="h-full w-full"
      >
        <color attach="background" args={["#0A0A0A"]} />
        <fog attach="fog" args={["#0A0A0A", 26, 58]} />
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>

      <AnimatePresence>
        {!rooms.length && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <p className="text-sm font-light tracking-wide text-apple-muted">
              Your floor plan will appear here
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="glass-panel flex items-center gap-3 rounded-full px-5 py-3"
            >
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-[#3B82F6]" />
              <span className="text-sm font-light tracking-tight text-white/90">
                Generating layout…
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute right-6 top-24 hidden lg:block">
        <p className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-light tracking-wide text-apple-muted backdrop-blur-xl">
          Drag to orbit · Scroll to zoom
        </p>
      </div>
    </div>
  );
}
