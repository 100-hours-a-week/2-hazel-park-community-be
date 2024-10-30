import globals from 'globals'
import pluginJs from '@eslint/js'
import prettier from 'eslint-config-prettier'
import airbnb from 'eslint-config-airbnb'

export default [
  {
    languageOptions: {
      globals: globals.browser,
      ecmaVersion: 2021,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
    },
    plugins: ['react', 'import', 'jsx-a11y', 'react-hooks', 'prettier'],
    extends: ['eslint:recommended', 'airbnb', 'plugin:prettier/recommended'],
    rules: {
      'no-console': 'off',
      indent: ['error', 4, { SwitchCase: 1 }],
      'prettier/prettier': 'error',
      'no-console': 'off',
      'no-underscore-dangle': 'off',
    },
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
    },
    env: {
      browser: true,
      node: true,
    },
    ignorePatterns: ['node_modules/'],
  },
  pluginJs.configs.recommended,
]
