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
      exclude: ["src/instrumentation-client.ts", "src/middleware.ts", "src/pages/_app.tsx"],
      provider: "istanbul",
    },
  },
});
