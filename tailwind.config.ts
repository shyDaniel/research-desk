import type { Config } from "tailwindcss";

/**
 * Research Desk — Solarized Light + Claude coral palette.
 * FINAL_GOAL.md §5 mandates a light, warm, dignified aesthetic. Dark mode is
 * explicitly forbidden; pure white is forbidden. All tokens below encode that
 * constraint as design primitives.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Solarized Light neutrals — cream paper → parchment → deep slate text.
        // Numbered so lighter = lower number, matching Tailwind's convention,
        // but the overall scale stays in the warm "aged paper" register.
        solar: {
          // base3 — the canonical Solarized Light page background.
          50: "#FDF6E3",
          // base2 — raised surface (cards, side-sheets, panels).
          100: "#EEE8D5",
          // A slightly cooler divider between base2 and text.
          200: "#E4DDC8",
          // The quieter edge of the divider ramp.
          300: "#D4CEBD",
          // base1 — disabled / faint text.
          400: "#93A1A1",
          // base0 — secondary icons.
          500: "#839496",
          // base00 — secondary body text.
          600: "#657B83",
          // base01 — primary body text (the de-facto "foreground").
          700: "#586E75",
          // base02 — deep contrast for rare heavy headings.
          800: "#073642",
          // base03 — only used for sparing, high-drama emphasis.
          900: "#002B36",
        },
        // Claude coral — single sharp accent. CTAs, active tab, progress fill,
        // flashcard flip, due-count badge. Explicitly NOT blue or green.
        coral: {
          50: "#FBEDE5",
          100: "#F4D3C1",
          200: "#ECB79A",
          300: "#E49974",
          400: "#DE8560",
          // The canonical Claude coral-orange.
          500: "#D97757",
          600: "#C1603F",
          700: "#9B4B32",
          800: "#743826",
        },
        // Solarized semantic accents. Blue is reserved for inline code
        // identifiers; green is the success / done state.
        sol: {
          yellow: "#B58900",
          orange: "#CB4B16",
          red: "#DC322F",
          magenta: "#D33682",
          violet: "#6C71C4",
          blue: "#268BD2",
          cyan: "#2AA198",
          green: "#859900",
        },
      },
      fontFamily: {
        serif: [
          "var(--font-fraunces)",
          "Fraunces",
          "Newsreader",
          "ui-serif",
          "Georgia",
          "serif",
        ],
        sans: [
          "var(--font-geist-sans)",
          "Geist",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-geist-mono)",
          "Geist Mono",
          "JetBrains Mono",
          "ui-monospace",
          "monospace",
        ],
      },
      letterSpacing: {
        tightest: "-0.03em",
      },
      borderColor: {
        // Default hairline is the parchment divider, never black.
        DEFAULT: "#E4DDC8",
      },
      boxShadow: {
        // A quiet inset hairline that reads on cream without darkening it.
        "inset-hairline": "inset 0 0 0 1px rgba(88, 110, 117, 0.08)",
        // A soft lift for Dashboard cards — warm, not blue-gray.
        card: "0 1px 0 rgba(88, 110, 117, 0.04), 0 4px 16px -8px rgba(88, 110, 117, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
