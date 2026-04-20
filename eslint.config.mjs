import {
  disabledRules,
  flatESLintConfig,
  globalIgnores,
  prettierConfig,
  tseslintConfigs,
  tseslintParser,
} from '@aryaemami59/eslint-config'
import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import packageJson from './package.json' with { type: 'json' }

const eslintConfig = defineConfig([
  globalIgnores,
  js.configs.recommended,
  {
    languageOptions: {
      parser: tseslintParser,
    },
  },

  { extends: [tseslintConfigs.recommended] },
  {
    files: ['**/*.(c|m)?[tj]sx?'],
    extends: [
      tseslintConfigs.strictTypeChecked,
      tseslintConfigs.stylisticTypeChecked,
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
