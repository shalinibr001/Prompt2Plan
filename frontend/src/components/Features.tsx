"use client";

import { motion } from "framer-motion";

const ease = [0.4, 0, 0.2, 1] as const;

const features = [
  {
    title: "Prompt to Plan",
    description:
      "Describe a home in plain English. Prompt2Plan turns it into structured rooms with real dimensions.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 9h8M8 13h5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Interactive 3D",
    description:
      "Orbit, zoom, and explore your floor plan in a lit 3D scene — not a flat diagram.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3.3 7L12 12l8.7-5M12 22V12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "AI Precision",
    description:
      "Local Ollama intelligence with smart layout packing so rooms never overlap.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" strokeLinejoin="round" />
        <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function Features() {
  return (
    <section id="product" className="py-24 md:py-28">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Built for clarity
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#A1A1AA]">
            Everything you need to go from an idea to a spatial plan — without the clutter.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {features.map((feature, i) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease }}
              whileHover={{ y: -6 }}
              className="rounded-xl border border-[#222] bg-white/[0.03] p-6 transition-shadow duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-gradient-to-br from-[#3B82F6]/20 to-[#8B5CF6]/10 text-[#93C5FD]">
                {feature.icon}
              </div>
              <h3 className="text-lg font-medium tracking-tight text-white">{feature.title}</h3>
              <p className="mt-3 text-sm font-normal leading-relaxed text-[#A1A1AA]">
                {feature.description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
