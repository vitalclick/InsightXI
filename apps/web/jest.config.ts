import type { Config } from "jest";

/**
 * ts-jest + jsdom for unit-testing pure logic and presentational components.
 * (Page-level integration is covered by the build/typecheck; these tests stay
 * fast and framework-light.)
 */
const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "\\.(css|scss)$": "<rootDir>/test/style-mock.ts",
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      { tsconfig: { jsx: "react-jsx", esModuleInterop: true } },
    ],
  },
};

export default config;
