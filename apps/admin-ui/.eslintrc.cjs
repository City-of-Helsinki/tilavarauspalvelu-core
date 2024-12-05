module.exports = {
  root: true,
  extends: ["custom/next"],
  rules: {
    // interface names break
    "@typescript-eslint/naming-convention": 0,
  },
  ignorePatterns: [
    "node_modules/",
    ".next/",
    "out/",
    "public/",
    "jest.setup.ts",
  ],
};
