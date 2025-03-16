import globals from "globals";
import pluginJs from "@eslint/js";
import { globalIgnores } from "eslint/config";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  {
    rules: {
      "no-undef": "off",
    },
  },
  globalIgnores([".next/", "pages/index.js"]),
];
