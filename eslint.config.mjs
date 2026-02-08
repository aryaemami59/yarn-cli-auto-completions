import {
  configs,
  disabledRules,
  flatESLintConfig,
  globalIgnores,
  parser,
  prettierConfig,
} from '@aryaemami59/eslint-config'
import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import packageJson from './package.json' with { type: 'json' }

const eslintConfig = defineConfig([
  globalIgnores,
  js.configs.recommended,
  {
    languageOptions: {
      parser,
    },
  },

  { extends: [configs.recommended] },
  {
    files: ['**/*.(c|m)?[tj]sx?'],
    extends: [
      configs.strictTypeChecked,
      configs.stylisticTypeChecked,
      flatESLintConfig,
    ],
    name: `${packageJson.name}/overrides`,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      ...disabledRules,
    },
  },
  prettierConfig,
])

export default eslintConfig
