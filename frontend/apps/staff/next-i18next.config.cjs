// @ts-check
// NOTE don't move this file or use cjs / mjs extensions only .js works

// NOTE this doesn't hot reload and the page has to be reloaded twice to get new translations
const reloadOnPrerender = process.env.NODE_ENV === "development";

/** @type {import('next-i18next').UserConfig} */
module.exports = {
  debug: false,
  i18n: {
    defaultLocale: "fi",
    locales: ["fi"],
    localeDetection: false,
  },
  localePath:
    typeof window === "undefined"
      ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- next-i18next doesn't support ESM
        require("node:path").resolve("./public/locales")
      : "/public/locales",
  reloadOnPrerender,
};
