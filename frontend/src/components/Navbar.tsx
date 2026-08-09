"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const links = [
  { href: "#product", label: "Product" },
  { href: "#pricing", label: "Pricing" },
  { href: "#docs", label: "Docs" },
  { href: "/workspace", label: "Login" },
];

const ease = [0.4, 0, 0.2, 1] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/[0.08] bg-black/55 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:px-8">
        <Link href="/" className="text-[15px] font-medium tracking-[0.18em] text-white">
          Prompt2Plan
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-normal text-[#A1A1AA] transition-colors duration-300 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/workspace"
            className="rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] px-4 py-2 text-sm font-medium text-white shadow-[0_0_20px_rgba(59,130,246,0.25)] transition-transform duration-300 hover:scale-105 active:scale-[0.97]"
          >
            Get Started
          </Link>
        </nav>

        <button
          type="button"
          aria-label="Toggle menu"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.05] text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/[0.08] bg-black/80 px-5 py-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2 text-sm text-[#A1A1AA] hover:bg-white/[0.05] hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/workspace"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] px-4 py-2.5 text-center text-sm font-medium text-white"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </motion.header>
  );
}
