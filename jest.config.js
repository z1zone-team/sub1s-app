module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          strict: false,
          ignoreDeprecations: "6.0",
          baseUrl: ".",
          paths: {
            "@/*": ["./src/*"],
            "@assets/*": ["./assets/*"],
          },
        },
      },
    ],
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "[.]svg$": "<rootDir>/jest.svg-mock.js",
    "^@assets/(.*)$": "<rootDir>/assets/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
