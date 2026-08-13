import eslint from "@eslint/js";

export default [
  eslint.configs.recommended,
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "off",
    },
  },
];
