/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  watchman: false,
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.(t|j)sx?$": ["ts-jest", { useESM: false }],
  },
}

module.exports = config
