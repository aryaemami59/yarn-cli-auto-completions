import * as path from 'node:path'

export const ROOT_DIRECTORY = path.join(import.meta.dirname, '..')

export const OUTPUT_DIRECTORY = path.join(ROOT_DIRECTORY, 'dist')

export const BASH_FILE = path.join(
  OUTPUT_DIRECTORY,
  'completions-for-yarn.bash',
)
