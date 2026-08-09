"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { PromptInput } from "@/components/ui/PromptInput";
import { Sidebar } from "@/components/ui/Sidebar";

const ease = [0.4, 0, 0.2, 1] as const;

const SceneCanvas = dynamic(
  () => import("@/components/3d/SceneCanvas").then((m) => m.SceneCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-ds-bg">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, ease }}
          className="flex flex-col items-center gap-3"
        >
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#3B82F6]" />
          <span className="text-small text-ds-muted">Preparing scene…</span>
        </motion.div>
      </div>
    ),
  },
);

/**
 * Immersive shell aligned to the Prompt2Plan design system.
 * Mobile: sidebar collapses into a drawer. Desktop: always visible.
 */
export default function HomePage() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => {
      setIsDesktop(mq.matches);
      if (mq.matches) setMobileOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const sidebarVisible = isDesktop || mobileOpen;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.55, ease }}
      className="relative h-[100dvh] w-full overflow-hidden bg-ds-bg"
    >
      <div className="absolute inset-0 z-0">
        <SceneCanvas />
      </div>

      <div className="vignette pointer-events-none absolute inset-0 z-10" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-black/45 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-52 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

      <Navbar
        sidebarOpen={mobileOpen}
        onToggleSidebar={() => setMobileOpen((v) => !v)}
      />

      <AnimatePresence>
        {!isDesktop && mobileOpen && (
          <motion.button
            type="button"
            aria-label="Close sidebar overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="absolute inset-0 z-20 bg-black/45 backdrop-blur-[2px] md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute bottom-36 left-4 top-20 z-30 md:bottom-28 md:left-6 md:top-[88px]">
        <div className="pointer-events-auto h-full max-h-full">
          <Sidebar
            open={sidebarVisible}
            onClose={() => setMobileOpen(false)}
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease, delay: 0.15 }}
        className="absolute inset-x-0 bottom-6 z-40 md:bottom-8"
      >
        <PromptInput />
      </motion.div>
    </motion.div>
  );
}
