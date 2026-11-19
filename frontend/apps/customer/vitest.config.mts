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
    coverage: {
      reporter: ["clover", "json", "lcov", "text"],
      include: ["src/**/*.{ts,tsx,mjs,cjs}"],
      exclude: ["src/instrumentation-client.ts", "src/middleware.ts", "src/pages/_app.tsx"],
      provider: "istanbul",
    },
  },
});
