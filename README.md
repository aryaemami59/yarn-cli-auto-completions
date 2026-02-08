# yarn-cli-auto-completions

Bash auto-completion script for [**Yarn**](https://yarnpkg.com/) CLI commands.
This tool introspects the **`@yarnpkg/cli`** package to automatically generate a comprehensive bash completion script covering all Yarn commands, subcommands, and flags.

## Features

- Tab-completion for all Yarn CLI commands (`add`, `install`, `run`, `config`, etc.)
- Flag and option completions for each command
- Subcommand completions for nested commands (e.g., `yarn config get`, `yarn npm audit`)
- Automatically generated from the Yarn CLI source, so it stays up to date

## Prerequisites

- [**Node.js**](https://nodejs.org/) >= 22.0.0
- [**Corepack**](https://nodejs.org/api/corepack.html) enabled (**`corepack enable`**)
- A Bash shell with [**`bash-completion`**](https://github.com/scop/bash-completion) installed

## Installation

```bash
git clone https://github.com/aryaemami59/yarn-cli-auto-completions.git
cd yarn-cli-auto-completions
corepack enable
yarn install
```

## Usage

### Enable completions

Source the script in your current shell session:

```bash
source ./dist/completions-for-yarn.bash
```

To enable completions permanently, add the source command to your shell profile (e.g., `~/.bashrc` or `~/.bash_profile`):

```bash
echo 'source /path/to/yarn-cli-auto-completions/dist/completions-for-yarn.bash' >> ~/.bashrc
```

Or copy the script to your system's bash-completion directory:

```bash
sudo cp ./dist/completions-for-yarn.bash /usr/share/bash-completion/completions/yarn
```

### Examples

```bash
yarn a<TAB>          # Completes to 'add'
yarn add --<TAB>     # Shows available flags: --json, --dev, --exact, etc.
yarn config <TAB>    # Shows subcommands: get, set, unset
```

## Supported Commands

Completions are provided for all Yarn Berry (v4) commands, including:

`add`, `bin`, `cache`, `config`, `constraints`, `dedupe`, `dlx`, `exec`, `explain`, `info`, `init`, `install`, `link`, `node`, `npm`, `pack`, `patch`, `patch-commit`, `plugin`, `rebuild`, `remove`, `run`, `search`, `set`, `stage`, `unlink`, `unplug`, `up`, `upgrade-interactive`, `version`, `why`, `workspace`, `workspaces`

## Scripts

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `yarn lint`         | Run ESLint                   |
| `yarn lint-fix`     | Run ESLint with auto-fix     |
| `yarn format`       | Format code with Prettier    |
| `yarn format-check` | Check code formatting        |
| `yarn typecheck`    | Run TypeScript type checking |

## How It Works

The source (`src/index.ts`) imports `@yarnpkg/cli` and calls its `definitions()` method to extract all registered commands, their options, and subcommand hierarchies. It then generates a bash script that uses the standard `bash-completion` protocol (`compgen`, `COMPREPLY`, `complete`) to provide context-aware tab completions.

## License

[MIT](./LICENSE)
