import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  // Global ignores
  { ignores: ["dist/", ".astro/", "node_modules/"] },

  // Astro recommended rules
  ...eslintPluginAstro.configs.recommended,

  // TypeScript rules for .ts files
  {
    files: ["**/*.ts"],
    plugins: {
      "@typescript-eslint": tseslint,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
    },
  },

  // Prettier (must be last to override formatting rules)
  eslintConfigPrettier,
];
