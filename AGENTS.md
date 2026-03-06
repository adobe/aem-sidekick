# Agent guidelines for AEM Sidekick

This file defines how AI agents should work in this repository. Treat it as the default ground rules for any task unless the user says otherwise.

## Preparation

- **Code of conduct and contributing**
  Respect [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) and [CONTRIBUTING.md](CONTRIBUTING.md). Follow the project's contribution process (e.g. CLA, PR template, commit-then-review).

- **Git state**
  Unless instructed otherwise, start on `main` and run `git pull` so you're on the latest code before making changes.

- **Branch naming**
  - When implementing an **existing GitHub issue** (by number or URL), create a branch from `HEAD` named `issue-{num}` (e.g. `issue-42`).
  - If there is **no GitHub issue** yet, ask the user for a branch name before getting started.

- **New files**
  Use copyright year **2026** in the header of new code files (both under `src/` and `test/`).

## Coding style

- **Consistency**
  Match existing style and conventions in the file and codebase (naming, structure, patterns).

- **Returns**
  No single line return statements, e.g. `if (x) return y;`.

- **Chaining**
  Chaining commands should ideally use a new line for each new chained command.

- **JSDoc**
  Add JSDoc for functions (and other public APIs where appropriate).

- **Comments**
  Use inline comments sparingly where the code doesn't speak for itself. Prefer lowercase for inline comments.

- **Lint**
  The linter must always pass. The project uses **@adobe/helix** (via `@adobe/eslint-config-helix` in `.eslintrc.cjs`). Run `npm run lint` and fix any issues before completing each sub task; use `npx eslint . --fix` for auto-fix where applicable.

- **Type checker**
  The project's type checker (e.g. TypeScript/JS checking, if configured) must always pass. Run it and fix any reported errors before considering the task done.

- **Refactoring**
  When refactoring, always double-check what else was modified earlier in the branch. Remove any code that becomes unused (dead code, unused imports, obsolete helpers).

## Localization and internationalization

- Always **localize** UI strings by adding a message to the [English dictionary](/src/extension/_locales/en/messages.json) using `appStore.i18n('message_key')` instead of using hardcoded strings. Check for existing or similar strings in the dictionary before adding new ones. If dynamic values are needed inside a string, use numbered `$` markers in the message and `String.replace('$1', value1).replace('$2', value2)` in the output. If a string is not self-explanatory by itself and additional context needs to be provided for a human translator, add an optional `description` property (e.g. if the string simply says `Save`, the description could be `Save button text for foo bar`).

- Always **internationalize** UI strings by adding the same message to all other dictionaries and proposing initial translations. Insert messages in alphabetical order. `description` properties are only needed in the English dictionary, omit them in the other languages.

## Testing

- **Framework**
  Tests use **@web/test-runner** (Web Test Runner). Test files live under `test/` and are named `*.test.js` (e.g. `test/actions.test.js` for `src/extension/actions.js`).

- **Test files**
  For new behavior or bug fixes, find the corresponding `*.test.js` (or create one) and add one or more test cases. Mirror the style of existing tests in that file (or adjacent files) and reuse existing helpers, utils, mocks, and fixtures (e.g. in `test/mocks/`, `test/fixtures/`, `test/test-utils.js`).

- **Coverage**
  **Diff coverage** must be 4×100%: statements, branches, functions, and lines for the changed code. Ensure new or modified code is covered so the diff coverage report meets this bar.

- **When to run tests**
  - During implementation you may run only the relevant test file to save time (e.g. `npx wtr "./test/path/to/file.test.js"` or the project's equivalent single-file command).
  - Before finishing an autonomous subtask, run the **full test suite** (`npm run test`). Then summarize the changes and, if appropriate, ask the user for a review or input.

## Commits

- **When to commit/push**
  Only commit or push when the user explicitly asks you to.

- **Commit messages**
  Always use **semantic-release**-style commit messages (e.g. `feat:`, `fix:`, `docs:`, `chore:`). When unsure about the prefix or the message, ask the user. Use the git CLI for commits (e.g. `git commit -m "feat: ..."`).
