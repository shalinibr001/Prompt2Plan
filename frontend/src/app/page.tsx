"use client";

import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

/** Marketing landing — premium SaaS front door. App lives at /workspace. */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </main>
  );
}
