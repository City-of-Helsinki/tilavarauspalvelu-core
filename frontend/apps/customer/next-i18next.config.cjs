// @ts-check
// NOTE don't move this file or use .mjs / .ts extensions cjs (CommonJS) is fine
// but this requires env overrides

const reloadOnPrerender = process.env.NODE_ENV === "development";

/** @type {import('next-i18next').UserConfig} */
module.exports = {
  debug: false,
  i18n: {
    defaultLocale: "fi",
    locales: ["fi", "en", "sv"],
    localeDetection: false,
  },
  localePath:
    typeof window === "undefined"
      ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- next-i18next doesn't support ESM
        require("node:path").resolve("./public/locales")
      : "/public/locales",
  reloadOnPrerender,
};
