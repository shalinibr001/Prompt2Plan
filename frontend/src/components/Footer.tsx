"use client";

import { motion } from "framer-motion";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="border-t border-white/[0.06] py-10"
    >
      <div className="mx-auto max-w-[1200px] px-5 text-center md:px-8">
        <p className="text-sm font-light tracking-wide text-[#71717A]">
          © 2026 Prompt2Plan
        </p>
      </div>
    </motion.footer>
  );
}
