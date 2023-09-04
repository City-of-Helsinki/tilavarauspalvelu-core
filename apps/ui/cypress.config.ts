import { defineConfig } from "cypress";

export default defineConfig({
  chromeWebSecurity: false,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  video: false,
  e2e: {
    setupNodeEvents(on, config) {
      // eslint-disable-next-line import/extensions
      return require("./cypress/plugins/index.js")(on, config);
    },
  },
});
