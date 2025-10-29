import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
    onConsoleLog(log: string, type: "stdout" | "stderr"): boolean | void {
      const msg = "All radio buttons in a SelectionGroup are unchecked. One radio button should be checked by default.";
      if (log.includes(msg) && type === "stderr") {
        return false;
      }
      return true;
    },
  },
});
