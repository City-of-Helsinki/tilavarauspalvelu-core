// NOTE don't move this file or use cjs / mjs extensions only .js works
module.exports = {
  i18n: {
    defaultLocale: "fi",
    locales: ["fi", "en", "sv"],
    localeDetection: false,
  },
  localePath:
    typeof window === "undefined"
      ? require("path").resolve("./public/locales")
      : "/public/locales",
};
