"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ErrorFallback } from "@/components/ui/ErrorFallback";
import { usePlanStore } from "@/store/planStore";

const SceneCanvas = dynamic(
  () => import("@/components/3d/SceneCanvas").then((m) => m.SceneCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#0A0A0A]">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#3B82F6]" />
      </div>
    ),
  },
);

/** Shared plan viewer — /plan/[id] */
export default function SharedPlanPage() {
  const params = useParams<{ id: string }>();
  const loadSharedPlan = usePlanStore((s) => s.loadSharedPlan);
  const loading = usePlanStore((s) => s.loading);
  const error = usePlanStore((s) => s.error);
  const lastPrompt = usePlanStore((s) => s.lastPrompt);
  const rooms = usePlanStore((s) => s.rooms);

  useEffect(() => {
    if (params?.id) void loadSharedPlan(params.id);
  }, [params?.id, loadSharedPlan]);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#0A0A0A]">
      <div className="absolute inset-0">
        <SceneCanvas />
      </div>

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4">
        <Link href="/" className="text-sm font-medium tracking-[0.18em] text-white/90">
          Prompt2Plan
        </Link>
        <Link
          href="/workspace"
          className="rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] px-4 py-2 text-xs font-medium text-white"
        >
          Open workspace
        </Link>
      </div>

      <div className="absolute bottom-8 left-1/2 z-20 w-[min(92vw,420px)] -translate-x-1/2">
        {error ? (
          <ErrorFallback
            title="Could not load plan"
            message={error}
            onRetry={() => params?.id && void loadSharedPlan(params.id)}
          />
        ) : lastPrompt ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl px-4 py-3 text-center"
          >
            <p className="text-xs font-light uppercase tracking-wider text-[#71717A]">Shared plan</p>
            <p className="mt-1 text-sm font-light text-white/90">“{lastPrompt}”</p>
            <p className="mt-1 text-[11px] text-[#A1A1AA]">
              {loading ? "Loading…" : `${rooms.length} rooms`}
            </p>
          </motion.div>
        ) : loading ? (
          <div className="glass-panel flex items-center justify-center gap-3 rounded-2xl px-5 py-4">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-[#3B82F6]" />
            <span className="text-sm font-light text-white/80">Loading shared plan…</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
