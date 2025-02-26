// @ts-check
// NOTE don't move this file or use cjs / mjs extensions only .js works

// TODO this doesn't work, it is supposed to enable fast refresh for json translations
// but it doesn't hot reload nor does it seem to do anything even if doing a full page reload
const reloadOnPrerender = process.env.NODE_ENV === "development";

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
  reloadOnPrerender,
};
