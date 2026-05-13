# @elfic/changeling

> The changelog generator for modern TypeScript projects.

[![npm version](https://img.shields.io/npm/v/@elfic/changeling.svg)](https://www.npmjs.com/package/@elfic/changeling)
[![CI](https://github.com/elfic-ticio/changeling/actions/workflows/ci.yml/badge.svg)](https://github.com/elfic-ticio/changeling/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

**Read this in other languages:** [Español](./README.es.md)

`changeling` reads your git history, groups commits by type, links each entry to its commit and pull request, and writes a `CHANGELOG.md` that follows [Keep a Changelog](https://keepachangelog.com/) and [Semantic Versioning](https://semver.org/).

It works with any Node.js project, and turns on extra detection when it sees Next.js, React, Vite, Astro, or Prisma in your `package.json` — annotating entries that touch routes, schemas, or new dependencies so reviewers can see what actually changed.

---

## Why another changelog tool?

There are excellent tools in this space — `conventional-changelog`, `changesets`, `release-please`. They are powerful and configurable. They are also opinionated about workflows, require setup files, and assume you have already decided on a release strategy.

`changeling` makes a different tradeoff: **zero config, one command, output you can read.** You run it, you get a `CHANGELOG.md`. If you want more, the flags are there. If you don't, the defaults are sane.

It also assumes you work in a modern TypeScript stack and uses that context to produce richer entries than a generic tool can.

## Installation

```bash
# As a one-off (recommended)
npx @elfic/changeling

# As a dev dependency
npm install --save-dev @elfic/changeling
# or
pnpm add -D @elfic/changeling
```

Requires **Node.js 20 or later**. Tested on 20, 22, and 24 LTS.

## Quick start

From the root of any git repository with a `package.json`:

```bash
npx @elfic/changeling
```

This generates a `CHANGELOG.md` with entries since the last git tag (or since the first commit if there are no tags).

To generate for a specific range:

```bash
npx @elfic/changeling --from v1.0.0 --to HEAD
```

To preview without writing the file:

```bash
npx @elfic/changeling --dry-run
```

## What it produces

Given a repository with Conventional Commits, output looks like this:

```markdown
## [1.2.0] - 2026-05-13

### Added
- **auth**: add OAuth provider for GitHub ([a1b2c3d](https://github.com/user/repo/commit/a1b2c3d)) ([#42](https://github.com/user/repo/pull/42))
- **api**: new `/users/me` endpoint ([e4f5g6h](https://github.com/user/repo/commit/e4f5g6h))

### Fixed
- **dashboard**: prevent crash on empty state ([i7j8k9l](https://github.com/user/repo/commit/i7j8k9l))

### Changed
- **deps**: bump `next` from 14.2.0 to 14.3.0

### 🔍 Stack changes (Next.js detected)
- New route: `app/api/users/me/route.ts`
- Database schema modified: `prisma/schema.prisma`
```

That last section only appears when `changeling` detects a relevant stack and finds matching file changes in the commit range.

## Commands

| Command | What it does |
|---------|--------------|
| `changeling` | Generate `CHANGELOG.md` from last tag to `HEAD` |
| `changeling --from <ref>` | Start from a specific tag, branch, or commit |
| `changeling --to <ref>` | End at a specific ref (default `HEAD`) |
| `changeling --dry-run` | Print to stdout without writing |
| `changeling --output <path>` | Write to a custom path |
| `changeling --no-stack` | Skip framework-specific detection |
| `changeling --lang <es\|en>` | Output language (default: `en`) |
| `changeling init` | Create a `.changelingrc.json` config file |

## Configuration

Zero config works for most cases. If you need to tweak behavior, create `.changelingrc.json`:

```json
{
  "lang": "en",
  "groups": {
    "feat": "Added",
    "fix": "Fixed",
    "perf": "Performance",
    "refactor": "Changed",
    "docs": "Documentation"
  },
  "stack": {
    "detectNextJs": true,
    "detectPrisma": true
  },
  "skipTypes": ["chore", "ci", "test"]
}
```

## How it works

1. **Read git history** between two refs using `git log` with a structured format.
2. **Parse Conventional Commits** (`feat:`, `fix:`, `feat(scope):` …) into structured records.
3. **Detect stack** by inspecting `package.json` dependencies.
4. **Match file changes** against stack-specific patterns (e.g. `app/**` for Next.js).
5. **Format** as Markdown grouped by type, with links to commits and PRs.

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the full design.

## Contributing

Contributions are welcome. Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) and [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) before opening a PR.

For security issues, see [`SECURITY.md`](./SECURITY.md).

## License

[MIT](./LICENSE) © [Omar Sanchez](https://github.com/elfic-ticio)
