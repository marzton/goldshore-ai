module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:astro/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],

  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: "Literal[value=/^#(?:[0-9a-fA-F]{3,8})$/]",
        message: 'Use design tokens instead of hard-coded hex colors.',
      },
      {
        selector: "Literal[value=/^\\d+(?:\\.\\d+)?px$/]",
        message: 'Use spacing tokens instead of hard-coded pixel values.',
      },
    ],
  },
  overrides: [
    {
      files: ['*.astro'],
      parser: 'astro-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro'],
      },
    },
    {
        // Define the configuration for `.mjs` file.
        files: ['*.mjs'],
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
        },
        rules: {
          // You can add specific rules for .mjs files here
        },
    },
  ],
};
