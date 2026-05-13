# Implementation Specification

This document is the source of truth for **what to build** in this repository. It is written to be consumed by a coding agent (or a human contributor) as the spec to implement the project from the documentation in this repo.

Read this **after** reading `README.md`, `ABOUT.md`, `docs/ARCHITECTURE.md`, and `docs/ROADMAP.md`. This document does not repeat their content — it specifies the concrete deliverables and the order to build them.

---

## Scope of this implementation

Build **Phase 1 (MVP)** as defined in `docs/ROADMAP.md`. That means:

- A working `@elfic/changeling` CLI installable via `npx`.
- Reads git log between the last tag and `HEAD` by default.
- Parses Conventional Commits.
- Groups by type, links to commits, links to PRs when detectable.
- Emits Markdown following Keep a Changelog format.
- English output only.
- No stack detection yet (Phase 2).
- No config file yet (Phase 3).

Phase 2, 3, 4 are out of scope for this implementation pass. They will be added in follow-up work.

---

## Constraints

- **Language:** TypeScript with strict mode.
- **Runtime:** Node.js, target `>=20.0.0`. Build for ES2022.
- **Runtime dependencies:** None beyond Node.js built-ins. This is non-negotiable. If a temptation to add a dependency arises, that is a signal to write the logic in-house or rescope.
- **Dev dependencies allowed:** `typescript`, `tsup` (build), `vitest` (test), `eslint` with `@typescript-eslint`, `prettier`, `@changesets/cli`.
- **Module system:** ESM. `"type": "module"` in `package.json`.
- **Output:** Single CLI binary registered as `changeling` in `package.json` `bin` field.

---

## Order of implementation

Build in this order. Each step should leave the repo in a state that passes `npm run lint`, `npm run typecheck`, and `npm test`.

### Step 1: Project configuration files

Create these files at the repo root:

- `package.json` — see "package.json spec" below.
- `tsconfig.json` — strict TypeScript, target ES2022, module ESNext, moduleResolution Bundler, outDir `dist`.
- `tsup.config.ts` — bundle `src/index.ts` to `dist/index.js` as ESM with a shebang banner.
- `.eslintrc.cjs` — TypeScript + Prettier integration. Disallow `any` without comment, disallow `console.log` in `src/` except in `utils/logger.ts`.
- `.prettierrc` — 2 spaces, single quotes, trailing comma `all`, print width 100.
- `vitest.config.ts` — Vitest with coverage via `@vitest/coverage-v8`.

### Step 2: Type definitions

Create `src/types/index.ts` exactly as defined in `docs/ARCHITECTURE.md` under "Key types". Export everything.

### Step 3: Utilities

- `src/utils/logger.ts` — a small logger with `info`, `warn`, `error`, `debug` methods. `debug` only outputs when `DEBUG` env var is set or `--debug` flag is on. Use ANSI colors only when stdout is a TTY (`process.stdout.isTTY`).
- `src/utils/exec.ts` — wraps `child_process.spawn` and returns `{ stdout, stderr, exitCode }`. Always uses array args, never shell strings. Rejects on non-zero exit unless `allowNonZero: true` is passed.

### Step 4: Git reader

`src/core/git.ts`:

- `readGitLog(range: string): Promise<RawCommit[]>` where `RawCommit` is the unparsed structured record.
- Use `git log <range> --pretty=format:'%H%x01%h%x01%aI%x01%an%x01%s%x01%b%x02' --name-only`.
- `\x01` separates fields within a commit. `\x02` separates commits. These bytes do not appear in git output.
- File names follow each commit block (one per line) until the next `\x02`.
- Handle: empty repository (no commits yet — return `[]` with a warning), invalid range (throw with actionable message).

`src/core/range.ts`:

- `resolveRange(from?: string, to?: string): Promise<string>` returns a git range string.
- Default `to` is `HEAD`.
- Default `from` is the most recent tag, found via `git describe --tags --abbrev=0`. If no tags, use the first commit (`git rev-list --max-parents=0 HEAD`).
- Validate that both refs exist before returning. Throw with a helpful message if either doesn't.

### Step 5: Conventional Commits parser

`src/core/parser.ts`:

- `parseCommit(raw: RawCommit): ParsedCommit` — parses a single commit per the Conventional Commits 1.0 spec.
- Subject regex: `^(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?: (?<subject>.+)$`
- If subject doesn't match the regex, set `type: 'other'`, leave `scope: null`, use the entire subject.
- Detect PR number from squash-merge pattern at end of subject: `(#\d+)`. Extract as `prNumber`.
- Detect breaking change from `!` after type or `BREAKING CHANGE:` in the body.
- Tests: `src/core/parser.test.ts` with at least 15 cases covering valid commits, missing scope, breaking changes, non-conformant commits, and edge cases like `Revert "feat: foo"`.

### Step 6: Markdown formatter

`src/formatters/markdown.ts`:

- `formatChangelog(version: ChangelogVersion, repoUrl: string, lang: 'en'): string`
- Repo URL detected from `git config --get remote.origin.url` and normalized:
  - `git@github.com:user/repo.git` → `https://github.com/user/repo`
  - `https://github.com/user/repo.git` → `https://github.com/user/repo`
- Output:
  ```
  ## [{version}] - {YYYY-MM-DD}

  ### {Group label}
  - **{scope}**: {subject} ([{shortSha}]({repoUrl}/commit/{sha}))[ ([#{pr}]({repoUrl}/pull/{pr}))]
  ```
- Group order: `Added` (feat), `Changed` (refactor), `Fixed` (fix), `Performance` (perf), `Documentation` (docs), `Other`.
- Skip groups: `chore`, `ci`, `test`, `style`, `build`.

`src/formatters/lang/en.ts`:

- Export an object with the labels above. Phase 3 will add `es.ts` with the same shape.

### Step 7: Generate command

`src/commands/generate.ts`:

- Orchestrates the flow:
  1. Resolve range via `core/range.ts`.
  2. Read git log via `core/git.ts`.
  3. Parse each commit via `core/parser.ts`.
  4. Group by type into `ChangelogVersion`.
  5. Detect repo URL.
  6. Format via `formatters/markdown.ts`.
  7. Either write to `CHANGELOG.md` (prepending under `## [Unreleased]`) or print to stdout (`--dry-run`).
- When writing: read existing `CHANGELOG.md` if present, parse the `[Unreleased]` section, insert new content after it. If the file doesn't exist, create one with the Keep a Changelog header.

### Step 8: CLI entry point

`src/index.ts`:

- Shebang: `#!/usr/bin/env node`
- Use Node's built-in `parseArgs` from `node:util`. No CLI framework deps.
- Supported flags: `--from`, `--to`, `--output`, `--dry-run`, `--debug`, `--help`, `--version`.
- `--help` prints usage and exits 0.
- `--version` reads version from `package.json` and exits 0.
- On unknown flag: print usage to stderr and exit 1.
- Top-level try/catch around the command dispatcher. On error: print the error message (not the stack) unless `--debug`, then exit 1.

### Step 9: Integration tests

`test/integration/generate.test.ts`:

- Use `vitest` and Node's `fs.mkdtemp` to create a temp dir per test.
- In each test, init a git repo with `git init`, make commits with controlled messages, then invoke the built CLI via `child_process.spawn`.
- Verify the generated `CHANGELOG.md` matches an inline expected string.
- At least 5 scenarios:
  1. Empty repo (no commits).
  2. Repo with no tags.
  3. Repo with tags, generating since last tag.
  4. Repo with breaking changes.
  5. Repo with PR squash-merges.

### Step 10: Build configuration verification

- `npm run build` produces `dist/index.js` with a working shebang.
- `node dist/index.js --help` prints usage.
- `node dist/index.js --version` prints the version from `package.json`.
- Manually: clone a different small repo, run `node /path/to/changeling/dist/index.js`, verify a sensible `CHANGELOG.md` is produced.

---

## package.json spec

```jsonc
{
  "name": "@elfic/changeling",
  "version": "0.1.0",
  "description": "The changelog generator for modern TypeScript projects.",
  "type": "module",
  "bin": {
    "changeling": "./dist/index.js"
  },
  "files": [
    "dist",
    "README.md",
    "README.es.md",
    "LICENSE"
  ],
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsx src/index.ts",
    "lint": "eslint src test --max-warnings 0",
    "lint:fix": "eslint src test --fix",
    "format": "prettier --write \"**/*.{ts,js,json,md}\"",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "release": "npm run build && changeset publish",
    "version": "changeset version"
  },
  "keywords": [
    "changelog",
    "conventional-commits",
    "cli",
    "typescript",
    "release-notes"
  ],
  "author": "Omar Sanchez",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/elfic-ticio/changeling.git"
  },
  "bugs": {
    "url": "https://github.com/elfic-ticio/changeling/issues"
  },
  "homepage": "https://github.com/elfic-ticio/changeling#readme",
  "publishConfig": {
    "access": "public",
    "provenance": true
  }
}
```

Dev dependencies to install (do not pin to old versions; use latest stable at install time):

```
typescript
tsup
tsx
vitest
@vitest/coverage-v8
eslint
@typescript-eslint/parser
@typescript-eslint/eslint-plugin
eslint-config-prettier
prettier
@changesets/cli
@types/node
```

---

## Done criteria for this implementation

When all of the following are true, this implementation pass is complete:

1. `npm install` succeeds on a fresh clone.
2. `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all succeed.
3. Test coverage for `src/core/` is at least 80% lines.
4. Running `node dist/index.js` on the `changeling` repo itself produces a `CHANGELOG.md` containing the scaffolding commit and any subsequent commits, grouped correctly.
5. The CI workflow passes on a PR.
6. A `changeset` has been added for `0.1.0` with the summary "Initial release: MVP changelog generator".

---

## What NOT to do in this pass

- Do not add stack detectors. That is Phase 2.
- Do not add Spanish output. That is Phase 3.
- Do not add a config file loader. That is Phase 3.
- Do not add the `init` command. That is Phase 3.
- Do not add monorepo support. That is post-v1.0.
- Do not pull in any runtime dependency. Use Node built-ins.
- Do not add abstractions for "future flexibility" that aren't needed for Phase 1. Add them when Phase 2/3 actually needs them.

If you find yourself wanting to do any of the above, stop and add an issue tagged with the appropriate phase instead.
