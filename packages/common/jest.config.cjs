// @ts-check
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  // jsdom has broken stylesheet parsing
  testEnvironment: "@happy-dom/jest-environment",
}
