module.exports = {
  root: true,
  extends: ["custom/next.cjs"],
  ignorePatterns: [
    "node_modules/",
    ".next/",
    "out/",
    "public/",
    "cypress/",
    "cypress.config.ts",
  ],
};
