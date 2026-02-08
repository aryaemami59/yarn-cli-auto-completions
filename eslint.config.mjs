import { createESLintConfig, parser } from '@aryaemami59/eslint-config'

const eslintConfig = createESLintConfig([
  {
    languageOptions: {
      parser,
      parserOptions: {
        projectService: true,
      },
    },
  },
])

export default eslintConfig
