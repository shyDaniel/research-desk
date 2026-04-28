import { defineConfig } from "vitest/config";
import path from "node:path";

// Vitest config for Research Desk.
// Node environment is enough for data/logic tests; swap to jsdom in a
// per-file `// @vitest-environment jsdom` pragma when component tests land.

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    passWithNoTests: false,
  },
});
