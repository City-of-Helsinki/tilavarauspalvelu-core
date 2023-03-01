import { defineConfig } from "cypress";

export default defineConfig({
  chromeWebSecurity: false,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      on("before:browser:launch", (browser, launchOptions) => {
        if (browser.name === "chrome") {
          launchOptions.args.push("--user-data-dir=/tmp/foo");
          launchOptions.args.push("--ignore-certificate-errors");
          return launchOptions;
        }
        return launchOptions;
      });
      // eslint-disable-next-line import/extensions
      return require("./cypress/plugins/index.js")(on, config);
    },
  },
});
