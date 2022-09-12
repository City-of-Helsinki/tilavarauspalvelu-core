module.exports = {
  setupFilesAfterEnv: ["./setupTests.ts"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "\\.css$": "identity-obj-proxy",
  },
};
