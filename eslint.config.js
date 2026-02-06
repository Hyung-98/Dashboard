import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "node_modules",
      "storybook-static",
      "**/*.config.js",
      "**/*.config.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  // Storybook config files: no type-aware linting (not in tsconfig)
  {
    files: [".storybook/**/*.{ts,tsx}"],
    ...tseslint.configs.disableTypeChecked,
  },
  // Supabase Edge Functions (Deno): not in tsconfig; allow triple-slash refs
  {
    files: ["supabase/functions/**/*.{ts,d.ts}"],
    ...tseslint.configs.disableTypeChecked,
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
  // Story files: allow hooks in Storybook's render()
  {
    files: ["**/*.stories.tsx"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  }
);
