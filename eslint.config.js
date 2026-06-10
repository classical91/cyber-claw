import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["apps/", "archive/", "seccheck/", "node_modules/"]
  },
  js.configs.recommended,
  {
    files: ["server.js", "src/intelFeeds.js"],
    languageOptions: {
      globals: { ...globals.node }
    }
  },
  {
    files: ["src/*.js"],
    ignores: ["src/intelFeeds.js"],
    languageOptions: {
      globals: { ...globals.browser }
    }
  },
  {
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off"
    }
  }
];
