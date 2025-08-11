const { defineConfig } = require("@vscode/test-cli");

module.exports = defineConfig({
  // The test files to run. This glob pattern will find all files
  // in the 'out/test' directory that end with '.test.js'.
  files: "out/test/**/*.test.js",

  // You can specify a specific version of VS Code to test against,
  // or use 'stable' for the latest stable version.
  version: "stable",

  // Optional: Add any launch arguments for the VS Code instance
  // that runs the tests. '--disable-extensions' is a good practice
  // to ensure a clean environment without other extensions interfering.
  launchArgs: ["--disable-extensions"],
});
