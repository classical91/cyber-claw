import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/"]
  },
  js.configs.recommended,
  // Node.js: server, CLI tools, electron main, tests
  {
    files: [
      "server.js",
      "src/wiresharkAnalyzer.js",
      "src/wifiNoInstallAudit.js",
      "electron/**/*.js",
      "test/**/*.js"
    ],
    languageOptions: {
      globals: { ...globals.node }
    }
  },
  // Browser (Electron renderer): UI and app logic
  {
    files: [
      "src/nullvaultApp.js",
      "src/storage.js",
      "src/ui.js",
      "src/securityModel.js"
    ],
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
