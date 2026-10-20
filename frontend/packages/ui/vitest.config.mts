import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      reporter: ["clover", "json", "lcov", "text"],
      // Only code: istanbul tries to parse anything else, such as the screen reader checklists, as JavaScript.
      include: ["src/**/*.{ts,tsx}"],
      provider: "istanbul",
    },
  },
});
