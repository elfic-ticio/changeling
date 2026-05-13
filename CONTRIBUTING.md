# Contributing to `@elfic/changeling`

Thanks for considering a contribution. This document covers what you need to know.

**Other languages:** [Español](./CONTRIBUTING.es.md)

## Before opening a PR

1. **Open an issue first for anything non-trivial.** A 5-minute discussion saves a 5-hour PR rewrite. Bug fixes and documentation typos can skip this.
2. **Check the [roadmap](./docs/ROADMAP.md).** Features outside the current phase will not be merged into the current phase — they will be triaged into the appropriate one.
3. **Read [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).** The module boundaries are intentional. Crossing them needs a reason.

## Development setup

```bash
git clone https://github.com/elfic-ticio/changeling.git
cd changeling
npm install
npm run typecheck
npm test
```

Requires Node.js 20 or later. Recommended: 24 LTS.

## Running the CLI locally

```bash
npm run build           # compile to dist/
node dist/index.js      # run the built binary
# or, during development:
npm run dev -- --dry-run
```

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/). The tool we are building consumes them, so we must produce them.

```
feat(parser): support breaking change footer
fix(git): handle empty repositories
docs: clarify --from flag behavior
refactor(formatter): split markdown rendering into smaller functions
```

Allowed types: `feat`, `fix`, `perf`, `refactor`, `docs`, `style`, `test`, `build`, `ci`, `chore`, `revert`.

For breaking changes, include `BREAKING CHANGE:` in the commit body or use `!` after the type/scope.

## Changesets

Every PR that changes user-visible behavior must include a changeset. Run:

```bash
npx changeset
```

Pick `patch`/`minor`/`major` and write a one-line description. Commit the generated file. The release workflow uses these to bump versions and update the project's own `CHANGELOG.md`.

Documentation-only PRs do not need a changeset. CI will not require one.

## Tests

- **Unit tests** live next to the code they test (`src/core/parser.test.ts`).
- **Integration tests** live under `test/` and may spawn `git` against fixture repos.
- Run all tests: `npm test`.
- Run with coverage: `npm run test:coverage`.
- New features require tests. Bug fixes require a test that reproduces the bug before being fixed.

Coverage goal: 80% on `src/core/` and `src/formatters/`. PRs that drop coverage below this in those directories will be asked to add tests.

## Code style

- TypeScript strict mode is on. No `any` without a comment explaining why.
- Prefer `async`/`await` over raw Promises in user-facing code.
- Errors thrown to the user must have actionable messages. No `Error: something went wrong`.
- Functions over classes unless state genuinely needs to be encapsulated.
- ESLint and Prettier run in CI. `npm run lint:fix` and `npm run format` handle most issues automatically.

## Pull request checklist

Before requesting review:

- [ ] Tests added or updated and passing
- [ ] Changeset added (or PR is docs-only)
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] Linked to the issue this PR addresses
- [ ] Behavior change reflected in `README.md` if user-facing

## Review process

- One maintainer approval is required to merge.
- Maintainers may request changes. Please don't take it personally — review comments are about the code, not the contributor.
- PRs sitting more than 7 days waiting on the contributor may be closed with a friendly note. Reopen anytime.

## Reporting bugs

Use the bug report template under [issues](https://github.com/elfic-ticio/changeling/issues/new/choose). Include:

- The version of `@elfic/changeling`
- Node.js version
- Operating system
- A minimal reproduction (a small repo or commands that reproduce it)
- What you expected to happen
- What actually happened

## Security issues

Do not file public issues for security vulnerabilities. See [`SECURITY.md`](./SECURITY.md) for the reporting process.

## License

By contributing, you agree that your contributions will be licensed under the MIT License (the same as the project).
