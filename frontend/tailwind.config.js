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
        ds: {
          bg: "#0A0A0A",
          surface: "rgba(255,255,255,0.05)",
          border: "rgba(255,255,255,0.08)",
          text: "#FFFFFF",
          secondary: "#A1A1AA",
          muted: "#71717A",
          accent: "#3B82F6",
          violet: "#8B5CF6",
        },
        // Keep apple.* aliases for existing classnames during transition
        apple: {
          bg: "#0A0A0A",
          surface: "rgba(255,255,255,0.05)",
          text: "#FFFFFF",
          muted: "#A1A1AA",
          accent: "#3B82F6",
          border: "rgba(255,255,255,0.08)",
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
      fontSize: {
        "heading-xl": ["32px", { lineHeight: "1.5", fontWeight: "600" }],
        "heading-l": ["24px", { lineHeight: "1.5", fontWeight: "500" }],
        body: ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        small: ["14px", { lineHeight: "1.6", fontWeight: "300" }],
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        6: "24px",
        8: "32px",
        12: "48px",
        16: "64px",
      },
      maxWidth: {
        shell: "1280px",
      },
      borderRadius: {
        card: "16px",
        panel: "20px",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.3)",
        panel: "0 10px 30px rgba(0,0,0,0.3)",
        glow: "0 0 20px rgba(59,130,246,0.4)",
        "glow-sm": "0 0 16px rgba(59,130,246,0.28)",
      },
      transitionDuration: {
        fast: "300ms",
        med: "450ms",
        slow: "600ms",
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #3B82F6, #8B5CF6)",
      },
    },
  },
  plugins: [],
};
