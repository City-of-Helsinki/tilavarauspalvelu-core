// @ts-check
// NOTE don't move this file or use cjs / mjs extensions only .js works

/**
 * @type {import('next-i18next').UserConfig}
 */
module.exports = {
  debug: false, // process.env.NODE_ENV === "development",
  i18n: {
    defaultLocale: "fi",
    locales: ["fi", "en", "sv"],
    localeDetection: false,
  },
  localePath:
    typeof window === "undefined"
      ? require("node:path").resolve("./public/locales")
      : "/public/locales",
  reloadOnPrerender: process.env.NODE_ENV === "development",
};
