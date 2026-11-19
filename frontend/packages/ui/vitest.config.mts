import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      reporter: ["clover", "json", "lcov", "text"],
      // Only code: istanbul tries to parse anything else, such as the screen reader checklists, as JavaScript.
      include: ["src/**/*.{ts,tsx,mjs,cjs}"],
      provider: "istanbul",
    },
  },
});
