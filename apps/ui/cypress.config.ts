import { defineConfig } from "cypress";
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

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
