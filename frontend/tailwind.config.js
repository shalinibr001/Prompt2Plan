/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: "#0A0A0A",
          surface: "rgba(255,255,255,0.05)",
          text: "#FFFFFF",
          muted: "#A1A1AA",
          accent: "#3B82F6",
          border: "rgba(255,255,255,0.10)",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 8px 32px rgba(0,0,0,0.45)",
        panel: "0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)",
        glow: "0 0 28px rgba(59,130,246,0.28)",
        "glow-sm": "0 0 16px rgba(59,130,246,0.18)",
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.25, 0.1, 0.25, 1)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
