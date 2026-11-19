import type { Config } from "tailwindcss";

/**
 * Editorial White — design tokens are declared once in `globals.css`
 * (`:root`) and referenced here, so a token change never needs a code sweep.
 * Full rationale: docs/BRAND_DESIGN_SYSTEM.md
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--gdu-paper)",
        porcelain: "var(--gdu-porcelain)",
        ink: "var(--gdu-ink)",
        graphite: "var(--gdu-graphite)",
        muted: "var(--gdu-muted)",
        line: "var(--gdu-line)",
        brass: "var(--gdu-brass)",
        "brass-soft": "var(--gdu-brass-soft)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Editorial scale — display sizes are fluid, body sizes are fixed.
        "display-xl": ["clamp(2.5rem, 6vw, 5.75rem)", { lineHeight: "1.14", letterSpacing: "-0.03em" }],
        "display-l": ["clamp(2.25rem, 5.2vw, 4.5rem)", { lineHeight: "1.16", letterSpacing: "-0.025em" }],
        "display-m": ["clamp(1.75rem, 3.4vw, 2.75rem)", { lineHeight: "1.22", letterSpacing: "-0.02em" }],
        "display-s": ["clamp(1.375rem, 2.2vw, 1.875rem)", { lineHeight: "1.32", letterSpacing: "-0.015em" }],
        eyebrow: ["0.6875rem", { lineHeight: "1.2", letterSpacing: "0.18em" }],
        body: ["1rem", { lineHeight: "1.75" }],
        "body-sm": ["0.875rem", { lineHeight: "1.65" }],
      },
      letterSpacing: {
        label: "0.18em",
        wide: "0.06em",
      },
      spacing: {
        section: "var(--gdu-section-y)",
        gutter: "var(--gdu-gutter)",
      },
      maxWidth: {
        shell: "1280px",
        measure: "62ch",
        "measure-tight": "48ch",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "rise-in": "rise-in 900ms cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
