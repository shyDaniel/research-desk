import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark editorial palette — warm near-black + cream + amber accent.
        ink: {
          // Background layers, darkest → lighter surfaces.
          950: "#0f0e0c",
          900: "#151311",
          800: "#1c1a17",
          700: "#26231f",
          600: "#34302a",
          500: "#4a453d",
        },
        bone: {
          // Text / cream foreground.
          50: "#faf7f0",
          100: "#f4efe4",
          200: "#f1ece0",
          300: "#d9d2c2",
          400: "#b4ad9d",
          500: "#8a8578",
          600: "#5f5b52",
        },
        // Single sharp accent — amber (warm, editorial, not purple).
        amber: {
          400: "#f1b24a",
          500: "#e59a25",
          600: "#c77e10",
        },
        // A deep quiet red is available for destructive/due states.
        rust: {
          500: "#b8442c",
          600: "#973520",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Fraunces", "Newsreader", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-geist-sans)", "Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "Geist Mono", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.03em",
      },
      borderColor: {
        DEFAULT: "#26231f",
      },
      boxShadow: {
        "inset-hairline": "inset 0 0 0 1px rgba(241, 236, 224, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
