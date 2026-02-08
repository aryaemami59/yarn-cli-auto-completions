# Contributing to yarn-cli-auto-completions

Thank you for your interest in contributing! This guide will help you get started.

## Prerequisites

- [**Node.js**](https://nodejs.org) >= 22.0.0
- [**Yarn**](https://yarnpkg.com) 4.x (via [**Corepack**](https://nodejs.org/api/corepack.html) )

## Getting Started

1. Fork the repository and clone your fork:

   ```bash
   git clone https://github.com/<your-username>/yarn-cli-auto-completions.git
   cd yarn-cli-auto-completions
   ```

2. Enable Corepack (if not already enabled):

   ```bash
   corepack enable
   ```

3. Install dependencies:

   ```bash
   yarn install
   ```

## Available Scripts

| Script                  | Description                  |
| ----------------------- | ---------------------------- |
| **`yarn lint`**         | Run ESLint                   |
| **`yarn lint-fix`**     | Run ESLint with auto-fix     |
| **`yarn format`**       | Format code with Prettier    |
| **`yarn format-check`** | Check code formatting        |
| **`yarn typecheck`**    | Run TypeScript type checking |

## Development Workflow

1. Create a new branch for your change:

   ```bash
   git checkout -b my-feature
   ```

2. Make your changes.

3. Verify your changes pass all checks:

   ```bash
   yarn typecheck
   yarn lint
   yarn format-check
   ```

4. Commit your changes and push to your fork.

5. Open a pull request against the `master` branch.

## Pull Requests

- Keep PRs focused on a single change.
- Fill out the [pull request template](PULL_REQUEST_TEMPLATE/pull_request_template.md) when submitting.
- Link any related issues (e.g. `Fixes #123`).
- Make sure all checks pass before requesting review.

## Reporting Bugs

Use the [bug report template](ISSUE_TEMPLATE/bug_report.md) to file an issue. Include clear reproduction steps and your environment details (OS, Node.js version, etc.).

## Requesting Features

Use the [feature request template](ISSUE_TEMPLATE/feature_request.md) to propose new functionality. Describe the problem you're trying to solve and your suggested solution.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](../LICENSE).
