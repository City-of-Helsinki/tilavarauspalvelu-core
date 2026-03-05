import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
    reporters: ["verbose"],
    coverage: {
      reporter: ["clover", "json", "lcov", "text"],
      include: ["src/**/*"],
      provider: "istanbul",
    },
    onConsoleLog(log: string, type: "stdout" | "stderr"): boolean | void {
      const msg = "All radio buttons in a SelectionGroup are unchecked. One radio button should be checked by default.";
      if (log.includes(msg) && type === "stderr") {
        return false;
      }
      return true;
    },
  },
});
