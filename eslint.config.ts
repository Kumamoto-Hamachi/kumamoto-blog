import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import type { Linter } from "eslint";

export default tseslint.config(
  // Global ignores
  { ignores: ["dist/", ".astro/", "node_modules/"] },

  // Astro recommended rules
  ...(eslintPluginAstro.configs.recommended as Linter.Config[]),

  // TypeScript recommended rules (scoped to .ts/.tsx files)
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: tseslint.configs.recommended,
  },

  // Prettier (must be last to override formatting rules)
  eslintConfigPrettier as Linter.Config,
);
