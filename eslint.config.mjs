import Codex from "eslint-config-codex";
import { plugin as TsPlugin, parser as TsParser } from 'typescript-eslint';

export default [
  ...Codex,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: TsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: './',
        sourceType: 'module',
      },
    },
    rules: {
        'n/no-missing-import': ['off'],
        'n/no-unsupported-features/node-builtins': ['off'],
        'jsdoc/require-returns-description': ['off'],
        '@typescript-eslint/no-duplicate-enum-values': ['off'], // Disabled due to version conflict
        "@typescript-eslint/naming-convention": [
          "error",
          {
            "selector": "variable",
            "format": ["camelCase"],
            "leadingUnderscore": "allow"
          },
        ]
        // Note: @typescript-eslint/ban-types was removed in typescript-eslint v6+
        // TypeScript's compiler now handles type checking for String, Number, etc.
    }
  },
  {
    ignores: ['dev/**', 'eslint.config.mjs', 'vite.config.js', 'postcss.config.js']
  }
];
