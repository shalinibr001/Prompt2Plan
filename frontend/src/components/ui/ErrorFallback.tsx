"use client";

import { motion } from "framer-motion";

interface ErrorFallbackProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

/** Compact glass error panel for API / scene failures. */
export function ErrorFallback({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorFallbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel mx-auto max-w-sm rounded-2xl px-5 py-4 text-center"
    >
      <p className="text-sm font-medium text-white/90">{title}</p>
      <p className="mt-1.5 text-xs font-light leading-relaxed text-red-300/90">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-ghost mt-3 w-full py-2 text-small">
          Try again
        </button>
      )}
    </motion.div>
  );
}
