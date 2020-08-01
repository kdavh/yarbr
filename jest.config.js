module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  "setupFiles": ["./test-setup.js"],
  "testPathIgnorePatterns": [
    "__mocks__"
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
