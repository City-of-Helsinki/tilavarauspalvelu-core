import nextJest from "next/jest.js";

/** @type {import('next/jest')} */
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.mjs"],
  moduleDirectories: ["node_modules", "<rootDir>/"],
  testEnvironment: "jest-environment-jsdom",
}

/** @type {import('jest').Config} */
const jestConfig = async () => {
  const nextJestConfig = await createJestConfig(customJestConfig)();
  return {
    ...nextJestConfig,
    moduleNameMapper: {
      "@/(.*)": "<rootDir>/src/$1",
      ...nextJestConfig.moduleNameMapper,
    },
  };
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default jestConfig();
