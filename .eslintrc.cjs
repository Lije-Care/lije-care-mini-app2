/** @type {import('eslint').Linter.Config} */
module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      plugins: ['@typescript-eslint', 'react'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        // Disable this because React 17+ doesn't need React in scope
        'react/react-in-jsx-scope': 'off',

        // Optional: allow unused vars that start with _ (e.g., _index)
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
          },
        ],

        // Customize as needed
        'react/prop-types': 'off', // recommended when using TypeScript
      },
    },
    {
      files: ['.eslintrc.{js,cjs}'],
      env: { node: true },
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
};
