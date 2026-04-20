import { getCli } from '@yarnpkg/cli'
import * as fs from 'node:fs/promises'
import { BASH_FILE, OUTPUT_DIRECTORY } from './constants.ts'
import { clean } from './utils/index.ts'

/**
 * The Yarn CLI instance, used to extract command definitions.
 */
const cli = await getCli()

/**
 * All command definitions exposed by the Yarn CLI, sorted alphabetically
 * by their full path (e.g. `"yarn add"`, `"yarn config get"`).
 */
const definitions = cli
  .definitions({ colored: false })
  .sort((a, b) => a.path.localeCompare(b.path))

/**
 * Metadata collected for a single node in the command tree.
 */
type CommandInfo = {
  /**
   * All flag names (e.g. `--json`, `-E`) accepted by this command or any of
   * its definitions. Duplicates are excluded.
   */
  flags: string[]

  /**
   * The immediate child command names that appear under this node
   * (e.g. `"get"` and `"set"` under `"config"`).
   */
  subcommands: Set<string>
}

/**
 * A map from a command path (without the leading `"yarn"` word) to its
 * aggregated {@linkcode CommandInfo}.
 *
 * @example
 *
 * ```ts
 * commandMap.get('config get') // { flags: ['--json', ...], subcommands: Set {} }
 * commandMap.get('config')     // { flags: [], subcommands: Set { 'get', 'set', ... } }
 * ```
 */
const commandMap = new Map<string, CommandInfo>()

definitions.forEach((definition) => {
  /**
   * Path segments with the leading `"yarn"` word removed.
   */
  const parts = definition.path.split(' ').slice(1)

  if (parts.length === 0) {
    return
  }

  /**
   * The map key for this definition, e.g. `"config get"`.
   */
  const key = parts.join(' ')

  /**
   * Deduplicated flag names for this definition.
   */
  const flags = [
    ...new Set(definition.options.flatMap(({ nameSet }) => nameSet)),
  ]

  // Ensure this command's entry exists and merge in any new flags.
  const existing = commandMap.get(key)

  if (existing) {
    flags.forEach((flag) => {
      if (!existing.flags.includes(flag)) {
        existing.flags.push(flag)
      }
    })
  } else {
    commandMap.set(key, { flags, subcommands: new Set() })
  }

  // Register each path segment as a subcommand of its parent so that
  // intermediate nodes (e.g. "config") are aware of their children.
  parts.slice(1).forEach((child, index) => {
    /**
     * The map key for the parent node at this depth.
     */
    const parentKey = parts.slice(0, index + 1).join(' ')

    if (!commandMap.has(parentKey)) {
      commandMap.set(parentKey, { flags: [], subcommands: new Set() })
    }

    const commandInfo = commandMap.get(parentKey)

    if (commandInfo) {
      commandInfo.subcommands.add(child)

      // if (definition.path === 'yarn set version' && child === 'version') {
      //   console.dir(
      //     { definition, child },
      //     { depth: 2, getters: false, sorted: true },
      //   )
      //   commandInfo.subcommands.add('latest')
      //   commandInfo.subcommands.add('berry')
      //   commandInfo.subcommands.add('stable')
      //   commandInfo.subcommands.add('canary')
      //   commandInfo.subcommands.add('classic')
      //   commandInfo.subcommands.add('self')
      // }
    }
  })
})

/**
 * The unique set of top-level Yarn subcommands (e.g. `"add"`, `"install"`),
 * derived from the first path segment of every definition.
 */
const topLevelCommands = [
  ...new Set(
    definitions
      .map((definition) => definition.path.split(' ')[1])
      .filter((cmd) => cmd != null),
  ),
]

/**
 * Converts a space-separated command path into a valid bash function name.
 *
 * @param path - The command path relative to `yarn`, e.g. `"config get"`.
 * @returns The bash function name, e.g. `"_yarn_config_get"`. When `path` is empty the root completion function `"_yarn"` is returned.
 *
 * @example
 * ```ts
 * toFuncName('config get') // '_yarn_config_get'
 * toFuncName('')           // '_yarn'
 * ```
 */
const toFuncName = (path: string) =>
  path ? `_yarn_${path.replaceAll(/ /g, '_')}` : '_yarn'

/**
 * Generates a bash array assignment string for use inside a bash function body.
 *
 * @param name - The bash variable name to assign to.
 * @param items - The items to populate the array with.
 * @returns A formatted bash array assignment with two-space indentation.
 *
 * @example
 *
 * ```ts
 * bashArray('flags', ['--json', '--exact'])
 * // '  flags=(\n    --json\n    --exact\n  )\n'
 * ```
 */
const bashArray = (name: string, items: string[]) =>
  `  ${name}=(\n    ${items.join('\n    ')}\n  )\n`

/**
 * Generates the `mapfile` line that populates `COMPREPLY` via `compgen`.
 *
 * @param varName - The bash array variable to draw completions from.
 * @param [indent='  '] - Leading whitespace. Defaults to two spaces.
 * @returns The formatted `mapfile`/`compgen` bash line.
 */
const compgenLine = (varName: string, indent = '  ') =>
  `${indent}mapfile -t COMPREPLY < <(compgen -W "\${${varName}[*]}" -- "\${cur}")`

const createLines = () => {
  /**
   * The lines that will be joined and written to the output bash script.
   * Pre-populated with the shebang and a blank line.
   */
  const lines: string[] = ['#!/bin/bash', '']

  // Generate one bash completion function per command-tree node.
  commandMap.forEach(({ flags, subcommands }, path) => {
    // Skip 'workspace' — handled by a custom dynamic completion function below.
    if (path === 'workspace' || path.startsWith('workspace ')) {
      return
    }

    const funcName = toFuncName(path)
    const uniqueFlags = [...new Set(flags)]

    // Special case: `yarn set version` — add extra subcommands that aren't defined
    if (funcName === '_yarn_set_version') {
      subcommands.add('latest')
      subcommands.add('berry')
      subcommands.add('stable')
      subcommands.add('canary')
      subcommands.add('classic')
      subcommands.add('self')
    }

    const hasSubcommands = subcommands.size > 0
    const hasFlags = uniqueFlags.length > 0

    lines.push(`${funcName}() {`)

    if (hasSubcommands && hasFlags) {
      // Command has both subcommands and flags: complete subcommands by default,
      // flags when the current word starts with "-".
      lines.push(`  local -a subcommands flags\n`)
      lines.push(bashArray('subcommands', [...subcommands]))
      lines.push(bashArray('flags', uniqueFlags))
      lines.push(`  if [[ \${cur} == -* ]]; then`)
      lines.push(compgenLine('flags', '    '))
      lines.push(`  else`)
      lines.push(compgenLine('subcommands', '    '))
      lines.push(`  fi`)
    } else if (hasSubcommands) {
      // Command only has subcommands.
      lines.push(`  local -a subcommands\n`)
      lines.push(bashArray('subcommands', [...subcommands]))
      lines.push(compgenLine('subcommands'))
    } else {
      // Leaf command: complete flags only.
      lines.push(`  local -a flags\n`)
      lines.push(bashArray('flags', uniqueFlags))
      lines.push(compgenLine('flags'))
    }

    lines.push(`}`)
    lines.push(``)
  })

  // Custom _yarn_workspace function: completes workspace names dynamically.
  // Uses `yarn workspaces list --json | json -ga` to parse workspace entries,
  // filtering out the root workspace (location === ".").
  lines.push(`_yarn_workspace() {`)
  lines.push(`  local json_output`)
  lines.push(`  local -a workspace_names`)
  lines.push(`  json_output=$(yarn workspaces list --json)`)
  lines.push(`  if [[ "\${cur}" == .* ]]; then`)
  lines.push(`    mapfile -t workspace_names < <(`)
  lines.push(
    `      echo "\${json_output}" | json -ga -c 'this.location !== "."' -e 'this.location="./"+this.location' location`,
  )
  lines.push(`    )`)
  lines.push(`  else`)
  lines.push(`    mapfile -t workspace_names < <(`)
  lines.push(
    `      echo "\${json_output}" | json -ga -c 'this.location !== "."' name`,
  )
  lines.push(`    )`)
  lines.push(`  fi`)
  lines.push(
    `  mapfile -t COMPREPLY < <(compgen -W "\${workspace_names[*]}" -- "\${cur}")`,
  )
  lines.push(`}`)
  lines.push(``)

  // Top-level _yarn function — completes the first argument after "yarn".
  lines.push(`_yarn() {`)
  lines.push(`  local -a commands\n`)
  lines.push(bashArray('commands', topLevelCommands))
  lines.push(compgenLine('commands'))
  // lines.push(
  //   bashArray(
  //     'flags',
  //     definitions.flatMap(({ options }) =>
  //       options.flatMap(({ nameSet }) => nameSet),
  //     ),
  //   ),
  // )
  lines.push(`}`)
  lines.push(``)

  // Dispatcher: walks $words (skipping flags) to build the target function name,
  // then calls it. Falls back to _yarn if no specific handler exists.
  //
  // Special case: `yarn workspace <name> <cmd...>` — words[2] is a dynamic
  // workspace name and must be skipped when routing the subsequent command.
  lines.push(`_yarn_completion() {`)
  lines.push(`  local cur prev`)
  lines.push(`  local -a words`)
  lines.push(`  local -i cword\n`)
  lines.push(`  _get_comp_words_by_ref -n : cur prev words cword || return 1`)
  lines.push(``)
  lines.push(`  local cmd="_yarn"`)
  lines.push(`  local -i i\n`)
  lines.push(
    `  if [[ "\${words[1]}" == "workspace" && \${cword} -gt 2 ]]; then`,
  )
  lines.push(
    `    # Skip words[2] (the workspace name) and dispatch on the rest.`,
  )
  lines.push(`    for ((i = 3; i < cword; i++)); do`)
  lines.push(`      if [[ "\${words[i]}" != -* ]]; then`)
  lines.push(`        cmd="\${cmd}_\${words[i]}"`)
  lines.push(`      fi`)
  lines.push(`    done`)
  lines.push(`  else`)
  lines.push(`    for ((i = 1; i < cword; i++)); do`)
  lines.push(`      if [[ "\${words[i]}" != -* ]]; then`)
  lines.push(`        cmd="\${cmd}_\${words[i]}"`)
  lines.push(`      fi`)
  lines.push(`    done`)
  lines.push(`  fi`)
  lines.push(``)
  lines.push(`  if declare -f "\${cmd}" >/dev/null 2>&1; then`)
  lines.push(`    "\${cmd}"`)
  lines.push(`  else`)
  lines.push(`    _yarn`)
  lines.push(`  fi`)
  lines.push(`}`)
  lines.push(``)
  lines.push(`if type complete &>/dev/null; then`)
  lines.push(`  complete -o default -F _yarn_completion yarn`)
  lines.push(`  complete -o default -F _yarn_completion y`)
  lines.push(`fi`)
  lines.push(``)

  return lines
}

/**
 * Cleans the output directory, recreates it, and writes the generated bash
 * completion script to {@linkcode BASH_FILE}.
 */
const main = async () => {
  await clean()

  await fs.mkdir(OUTPUT_DIRECTORY, { recursive: true })

  const lines = createLines()

  await fs.writeFile(BASH_FILE, lines.join('\n'))
}

void main()
