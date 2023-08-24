// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  setupFilesAfterEnv: ["<rootDir>/jest.setup.cjs"],
  moduleDirectories: ["node_modules", "<rootDir>/"],
  testEnvironment: 'jsdom',
};
