module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  modulePathIgnorePatterns: [
    "dist"
  ],
  setupFiles: ["<rootDir>/__tests__/setup.js"],
  testPathIgnorePatterns: [
    "<rootDir>/__tests__/__mocks__",
    '<rootDir>/__tests__/setup.js'
  ],
  transform: {"\\.ts$": ['ts-jest']},
  "collectCoverageFrom": [
    "src/ts/**/*.{ts,tsx}"
  ],
  "coverageThreshold": {
    "global": {
      "statements": 18,
      "branches": 12,
      "lines": 18,
      "functions": 28
    }
  },
};
