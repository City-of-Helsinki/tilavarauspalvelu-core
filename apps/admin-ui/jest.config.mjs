import nextJest from "next/jest.js";

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleDirectories: ["node_modules", "<rootDir>/"],
  testEnvironment: "jest-environment-jsdom",
};

const jestConfig = async () => {
  const nextJestConfig = await createJestConfig(customJestConfig)();
  return {
    ...nextJestConfig,
    moduleNameMapper: {
      // Mock svg imports so we don't have to transpile with svgr
      "\\.svg$": "<rootDir>/__mocks__/fileMock.js",
      "@/(.*)": "<rootDir>/src/$1",
      ...nextJestConfig.moduleNameMapper,
    },
  };
};

export default jestConfig();
