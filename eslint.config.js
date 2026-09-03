import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // This config describes the browser-side website only. `backend/` is
  // CommonJS running on Node and `admin/` is a separate Vite app — each has
  // its own tooling, so linting them with these browser globals would report
  // hundreds of phantom `no-undef` errors for require/module/process.
  globalIgnores(['dist', 'backend', 'admin', 'node_modules']),
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
])
