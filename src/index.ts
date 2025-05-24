import type * as yarnCliPackage from '@yarnpkg/cli'
import type { Definition } from 'clipanion'
import * as fs from 'node:fs/promises'
import { tsImport } from 'tsx/esm/api'

type YarnCliPackage = typeof yarnCliPackage

const { getCli }: YarnCliPackage = (
  await tsImport(`@yarnpkg/cli`, {
    parentURL: import.meta.url,
  })
).default

const cli = await getCli()

const definitions = cli
  .definitions()
  .sort((a, b) => a.path.localeCompare(b.path))

type DefObject = {
  flags: Set<string>
  subcommands: Set<string>
  command: string
  definition: Definition
  splitCommands: string[]
}

const definitionsMap = new Map<string, DefObject>()

const info = definitions.flatMap((definition) => {
  const splitCommands = definition.path.split(` `)
  const command = splitCommands[1]
  const definitionMap = definitionsMap.get(command)

  const flagsArray = definition.options.map(({ nameSet }) => nameSet)

  const splitCommandsArray = splitCommands.slice(2)

  if (definitionMap == null) {
    const flags = new Set(flagsArray.flat())
    const subcommands = new Set(splitCommandsArray)
    const inf = {
      flags,
      subcommands,
      command,
      definition,
      splitCommands,
    }

    return definitionsMap.set(command, inf)
  }

  flagsArray.forEach((nameSet) => {
    nameSet.forEach((e) => {
      definitionMap.flags.add(e)
    })
  })

  splitCommands.slice(2).forEach((e) => {
    definitionMap.subcommands.add(e)
  })

  return definitionsMap
})

const completions = definitionsMap
  .values()
  .toArray()
  .map(({ flags, subcommands, splitCommands }) => {
    if (subcommands.size) {
      return `\n_${splitCommands.join('_')}() {\n  local flags subcommands\n\n  subcommands=(\n    ${[...subcommands].join(`\n    `)}\n  )\n\n  flags=(\n    ${[...flags].join(`\n    `)}\n  )\n\n  mapfile -t COMPREPLY < <(compgen -W "\${subcommands[*]}" -- "$cur")\n}\n`
    }

    return `\n_${splitCommands.join('_')}() {\n  ${flags.size === 0 ? 'local flags=()\n' : `local flags\n\n  flags=(\n    ${[...flags].join('\n    ')}\n  )`}\n\n  mapfile -t COMPREPLY < <(compgen -W "\${flags[*]}" -- "$cur")\n}\n`
  })
  .concat(
    `\n\n_yarn() {\n  local commands\n\n  commands=(\n    ${definitionsMap.keys().toArray().join('\n    ')}\n  )\n\n  mapfile -t COMPREPLY < <(compgen -W "\${commands[*]}" -- "$cur")\n}\n
_yarn_completion() {
  local cur prev cword

  _get_comp_words_by_ref -n : cur prev words cword || return 1

  if [[ $cword -eq 1 ]]; then
    _yarn
    return 0
  fi

  case $prev in
  add) _yarn_add ;;
  bin) _yarn_bin ;;
  cache) _yarn_cache_clean ;;
  config) _yarn_config ;;
  constraints) _yarn_constraints ;;
  dedupe) _yarn_dedupe ;;
  dlx) _yarn_dlx ;;
  exec) _yarn_exec ;;
  explain) _yarn_explain ;;
  info) _yarn_info ;;
  init) _yarn_init ;;
  install) _yarn_install ;;
  link) _yarn_link ;;
  node) _yarn_node ;;
  npm) _yarn_npm_audit ;;
  pack) _yarn_pack ;;
  patch) _yarn_patch ;;
  patch-commit) _yarn_patch-commit ;;
  plugin) _yarn_plugin_check ;;
  rebuild) _yarn_rebuild ;;
  remove) _yarn_remove ;;
  run) _yarn_run ;;
  search) _yarn_search ;;
  set) _yarn_set_resolution ;;
  stage) _yarn_stage ;;
  unlink) _yarn_unlink ;;
  unplug) _yarn_unplug ;;
  up | upgrade-interactive) _yarn_up || return 1 ;;
  version) _yarn_version || return 1 ;;
  why) _yarn_why || return 1 ;;
  workspace | workspaces-focus)
    if [[ $cur == -* ]]; then
      mapfile -t COMPREPLY < <(compgen -W "--json --production -A --all --from -R --recursive -W --worktree -v --verbose -p --parallel -i --interlaced -j --jobs -t --topological --topological-dev --include --exclude --no-private --since -n --dry-run" -- "$cur")
    else
      mapfile -t COMPREPLY < <(compgen -W "focus foreach list" -- "$cur")
    fi
    return 0
    ;;
  esac

  return 0
}

complete -o default -F _yarn_completion yarn
`,
  )

await fs.mkdir('./dist', { recursive: true })

await fs.writeFile(
  './dist/completions-for-yarn.bash',
  `#!/bin/bash\n${completions.join('')}`,
)
