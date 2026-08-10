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

function CinematicCamera({
  span,
  focusedRoomId,
  generationKey,
}: {
  span: number;
  focusedRoomId: string | null;
  generationKey: number;
}) {
  const { camera } = useThree();
  const rooms = usePlanStore((s) => s.rooms);
  const goalPos = useRef(new THREE.Vector3(14, 12, 14));
  const goalTarget = useRef(new THREE.Vector3(0, 0.4, 0));
  const intro = useRef(true);
  const controls = useThree((s) => s.controls) as unknown as {
    target: THREE.Vector3;
    update: () => void;
  } | null;

  useEffect(() => {
    intro.current = true;
    const d = Math.max(12, span * 1.45);
    // Fly-in from high & far
    camera.position.set(d * 1.4, d * 1.1, d * 1.4);
    goalPos.current.set(d * 0.75, d * 0.58, d * 0.75);
    goalTarget.current.set(0, 0.4, 0);
  }, [generationKey, span, camera]);

  useEffect(() => {
    if (!focusedRoomId) return;
    const room = rooms.find((r) => r.id === focusedRoomId);
    if (!room) return;
    const floorY = (room.floor ?? 0) * ((room.height ?? 2.8) + 0.35);
    const dist = Math.max(room.width, room.length) * 1.8 + 4;
    goalPos.current.set(room.x + dist * 0.7, floorY + dist * 0.85, room.z + dist * 0.7);
    goalTarget.current.set(room.x, floorY + 0.5, room.z);
    intro.current = false;
  }, [focusedRoomId, rooms]);

  useFrame(() => {
    const alpha = intro.current ? 0.035 : 0.06;
    camera.position.lerp(goalPos.current, alpha);
    if (controls?.target) {
      controls.target.lerp(goalTarget.current, alpha);
      controls.update();
    }
    if (camera.position.distanceTo(goalPos.current) < 0.08) {
      intro.current = false;
    }
  });

  return null;
}

function SceneContent() {
  const rooms = usePlanStore((s) => s.rooms);
  const doors = usePlanStore((s) => s.doors);
  const furniture = usePlanStore((s) => s.furniture);
  const windows = usePlanStore((s) => s.windows);
  const activeFloor = usePlanStore((s) => s.activeFloor);
  const hoveredRoomId = usePlanStore((s) => s.hoveredRoomId);
  const focusedRoomId = usePlanStore((s) => s.focusedRoomId);
  const generationKey = usePlanStore((s) => s.generationKey);
  const setHoveredRoom = usePlanStore((s) => s.setHoveredRoom);
  const setFocusedRoom = usePlanStore((s) => s.setFocusedRoom);

  const visibleRooms = useMemo(() => {
    if (activeFloor === "all") return rooms;
    return rooms.filter((r) => (r.floor ?? 0) === activeFloor);
  }, [rooms, activeFloor]);

  const visibleIds = useMemo(() => new Set(visibleRooms.map((r) => r.id)), [visibleRooms]);

  const span = useMemo(() => {
    if (!visibleRooms.length) return 12;
    const xs = visibleRooms.flatMap((r) => [r.x - r.width / 2, r.x + r.width / 2]);
    const zs = visibleRooms.flatMap((r) => [r.z - r.length / 2, r.z + r.length / 2]);
    return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs), 8);
  }, [visibleRooms]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[18, 14, 18]} fov={40} near={0.1} far={200} />
      <CinematicCamera span={span} focusedRoomId={focusedRoomId} generationKey={generationKey} />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.07}
        minDistance={3}
        maxDistance={60}
        maxPolarAngle={Math.PI / 2.08}
        target={[0, 0.4, 0]}
      />

      <ambientLight intensity={0.28} color="#E8EEF9" />
      <directionalLight
        castShadow
        position={[14, 20, 10]}
        intensity={1.25}
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
      <directionalLight position={[-12, 8, -8]} intensity={0.32} color="#93C5FD" />
      <hemisphereLight args={["#243044", "#0A0A0A", 0.4]} />
      <Environment preset="apartment" environmentIntensity={0.35} />

      <Floor size={Math.max(28, span + 10)} />

      {visibleRooms.map((room) => (
        <Room
          key={room.id}
          room={room}
          doors={doors.filter((d) => visibleIds.has(d.from) || visibleIds.has(d.to))}
          windows={windows.filter((w) => visibleIds.has(w.room_id))}
          furniture={furniture.filter((f) => visibleIds.has(f.room_id))}
          highlighted={hoveredRoomId === room.id || focusedRoomId === room.id}
          onHover={setHoveredRoom}
          onClick={setFocusedRoom}
        />
      ))}

      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.5}
        scale={Math.max(24, span + 12)}
        blur={2.8}
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
        <fog attach="fog" args={["#0A0A0A", 24, 56]} />
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
            <div className="glass-panel rounded-2xl px-6 py-5 text-center">
              <p className="text-sm font-medium text-white/90">Your floor plan will appear here</p>
              <p className="mt-1 text-xs font-light text-apple-muted">
                Describe a home or try a sample prompt
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
          >
            <div className="glass-panel w-[min(92vw,280px)] space-y-3 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-[#3B82F6]" />
                <span className="text-sm font-light text-white/90">Designing layout…</span>
              </div>
              <div className="space-y-2">
                <div className="h-2 animate-pulse rounded-full bg-white/10" />
                <div className="h-2 w-4/5 animate-pulse rounded-full bg-white/[0.07]" />
                <div className="h-2 w-3/5 animate-pulse rounded-full bg-white/[0.05]" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute right-6 top-24 hidden lg:block">
        <p className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-light tracking-wide text-apple-muted backdrop-blur-xl">
          Hover to highlight · Click to focus · Drag to orbit
        </p>
      </div>
    </div>
  );
}
