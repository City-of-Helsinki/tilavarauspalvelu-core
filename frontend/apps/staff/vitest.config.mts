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
    reporters: ["verbose"],
    testTimeout: 10_000,
    coverage: {
      reporter: ["clover", "json", "lcov", "text"],
      include: ["src/**/*.{ts,tsx,mjs,cjs}"],
      exclude: [
        "src/instrumentation-client.ts",
        "src/middleware.ts",
        "src/pages/_app.tsx",
        "src/pages/**/*",
        "src/modules/apolloClient.ts",
      ],
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
