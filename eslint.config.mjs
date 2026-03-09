import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import astroParser from 'astro-eslint-parser';
import astroPlugin from 'eslint-plugin-astro';
import globals from 'globals';

const tsRecommendedRules = tsPlugin.configs.recommended?.rules ?? {};
const astroRecommendedRules = astroPlugin.configs.recommended?.rules ?? {};

export default [
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.astro/**', '**/coverage/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2024,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsRecommendedRules,
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: astroParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.astro'],
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2024,
      },
    },
    plugins: {
      astro: astroPlugin,
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...astroRecommendedRules,
      ...tsRecommendedRules,
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
];
