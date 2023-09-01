const config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: "(/test/.*\\.spec\\.ts)$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: [
    "src/**/*.(t|j)s",
    "src/**/*.(t|j)sx",
    "!**/*.module.ts",
    "!**/node_modules/**",
  ],
  coverageDirectory: "./coverage",
  testEnvironment: "node",
  // moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}),
};

module.exports = config;
