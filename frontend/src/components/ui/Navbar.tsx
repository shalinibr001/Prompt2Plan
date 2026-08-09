"use client";

import { motion } from "framer-motion";

const ease = [0.4, 0, 0.2, 1] as const;

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.3, ease }}
      className="icon-btn"
    >
      {children}
    </motion.button>
  );
}

interface NavbarProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export function Navbar({ onToggleSidebar, sidebarOpen }: NavbarProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      className="pointer-events-none absolute inset-x-0 top-0 z-40 h-16 border-b border-white/[0.08] bg-black/20 backdrop-blur-md"
    >
      <div className="pointer-events-auto mx-auto flex h-full max-w-shell items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile sidebar toggle */}
          <button
            type="button"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            onClick={onToggleSidebar}
            className="icon-btn md:hidden"
          >
            {sidebarOpen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            )}
          </button>

          <a href="/" className="text-small font-medium tracking-[0.2em] text-white transition-opacity hover:opacity-80">
            Prompt2Plan
          </a>
        </div>

        <div className="flex items-center gap-2">
          <IconButton label="Documentation">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" />
            </svg>
          </IconButton>
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="icon-btn"
            aria-label="API docs"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2" strokeLinecap="round" />
              <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1" strokeLinecap="round" />
            </svg>
          </a>
        </div>
      </div>
    </motion.header>
  );
}
