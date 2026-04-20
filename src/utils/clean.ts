import * as fs from 'node:fs/promises'
import { styleText } from 'node:util'
import { OUTPUT_DIRECTORY } from '../constants.ts'

export const clean = async (): Promise<void> => {
  console.info(
    `\ndeleting ${styleText(
      ['yellowBright', 'underline', 'bold'],
      OUTPUT_DIRECTORY,
    )}\n`,
  )

  await fs.rm(OUTPUT_DIRECTORY, {
    force: true,
    recursive: true,
  })
}
