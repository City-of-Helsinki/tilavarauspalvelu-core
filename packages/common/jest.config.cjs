// @ts-check
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
}
