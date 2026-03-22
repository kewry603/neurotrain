import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'android/**', 'node_modules/**', '**/build/**']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    files: ['src/context/**/*.{js,jsx}', 'src/i18n/**/*.{js,jsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['src/context/ProgressContext.jsx'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  /** Game loops use effects to advance rounds / timers — intentional setState in effects. */
  {
    files: ['src/pages/NumbersGameScreen.jsx', 'src/pages/SpatialGameScreen.jsx'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
