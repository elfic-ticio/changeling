# Architecture

This document describes how `@elfic/changeling` is structured and why. It is the design intent behind the code, written so a new contributor can understand the shape of the project in fifteen minutes.

## Goals and non-goals

**Goals**

- Generate a `CHANGELOG.md` from a git commit range in under one second on a 1000-commit repo.
- Work with zero config on any Node.js + git project.
- Produce richer output when the project uses Next.js, Vite, Astro, or Prisma.
- Emit output in English or Spanish from the same code path.
- Be testable end-to-end without a real GitHub repository.

**Non-goals**

- Manage releases (versioning, tagging, publishing).
- Support every commit convention. Conventional Commits is the only first-class format.
- Run as a long-lived process. It is a CLI that starts, runs, exits.
- Provide a programmatic API as a first-class product. The library export exists for testing and advanced use but the public surface is the CLI.

## High-level flow

```
┌─────────────────────────────────────────────────────────────┐
│  CLI entry point (src/index.ts)                             │
│  - parse flags                                              │
│  - load config (.changelingrc.json) if present              │
│  - dispatch to command                                      │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Generate command (src/commands/generate.ts)                │
└─────────────────────────────┬───────────────────────────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  git reader  │      │ stack        │      │  file change │
│  (core/git)  │      │ detector     │      │  matcher     │
│              │      │ (detectors/) │      │  (core/diff) │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Commit parser (core/parser.ts)                             │
│  - Conventional Commits → structured records                │
│  - Group by type                                            │
│  - Attach detected stack annotations                        │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Formatter (formatters/markdown.ts)                         │
│  - Apply language pack (en/es)                              │
│  - Emit Keep a Changelog Markdown                           │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
                       CHANGELOG.md
```

## Module layout

```
src/
├── index.ts                   # CLI entry (shebang, flag parsing, dispatch)
├── commands/
│   ├── generate.ts            # default command: generate CHANGELOG.md
│   └── init.ts                # `changeling init` — write default config
├── core/
│   ├── git.ts                 # spawn `git log`, parse output
│   ├── parser.ts              # Conventional Commits parser
│   ├── range.ts               # resolve --from/--to to commit SHAs
│   └── config.ts              # load + validate .changelingrc.json
├── detectors/
│   ├── index.ts               # detect() returns active detectors
│   ├── nextjs.ts              # match changes under app/, pages/
│   ├── prisma.ts              # match changes to prisma/schema.prisma
│   ├── vite.ts                # match changes to vite.config.*
│   └── deps.ts                # diff package.json dependencies
├── formatters/
│   ├── markdown.ts            # render structured changelog → MD
│   └── lang/
│       ├── en.ts              # English strings
│       └── es.ts              # Spanish strings
├── utils/
│   ├── exec.ts                # thin wrapper around child_process
│   └── logger.ts              # consistent CLI output
└── types/
    └── index.ts               # shared TypeScript types
```

Every directory has a clear responsibility. Nothing reads `package.json` outside `detectors/deps.ts`. Nothing spawns `git` outside `core/git.ts`. This makes the boundaries testable and replaceable.

## Key types

```typescript
// src/types/index.ts

export type CommitType =
  | 'feat' | 'fix' | 'perf' | 'refactor'
  | 'docs' | 'style' | 'test' | 'build' | 'ci' | 'chore'
  | 'revert' | 'other';

export interface ParsedCommit {
  sha: string;
  shortSha: string;
  type: CommitType;
  scope: string | null;
  subject: string;
  body: string | null;
  breaking: boolean;
  prNumber: number | null;
  filesChanged: string[];
  date: string; // ISO 8601
  author: string;
}

export interface StackAnnotation {
  detector: 'nextjs' | 'prisma' | 'vite' | 'deps';
  label: string;          // localized label
  items: string[];        // human-readable bullets
}

export interface ChangelogVersion {
  version: string;        // e.g. "1.2.0" or "Unreleased"
  date: string | null;
  groups: Record<string, ParsedCommit[]>;
  stackAnnotations: StackAnnotation[];
}

export interface ChangelingConfig {
  lang: 'en' | 'es';
  groups: Record<CommitType, string>;
  skipTypes: CommitType[];
  stack: {
    detectNextJs: boolean;
    detectPrisma: boolean;
    detectVite: boolean;
    detectDeps: boolean;
  };
  output: string;         // default: "CHANGELOG.md"
}
```

## How git is read

`core/git.ts` spawns `git log` with a custom format that includes a separator unlikely to appear in commit messages:

```bash
git log <range> --pretty=format:'%H|%h|%ad|%an|%s|%b<RECORD_END>' --date=iso-strict --name-only
```

The output is split on `<RECORD_END>` and parsed into records. File names follow each commit's metadata block.

We do not shell out to `git log --json` or similar because git itself does not emit structured JSON. The delimiter approach is the documented technique used by every changelog tool in the ecosystem.

**Performance note:** On repos with 5000+ commits, we may need to stream rather than buffer. The current implementation buffers because the v1 target is <1000 commits.

## How stack detection works

A detector is a module that exports:

```typescript
export interface Detector {
  name: string;
  isActive(packageJson: PackageJson): boolean;
  annotate(commit: ParsedCommit, ctx: DetectContext): StackAnnotation | null;
}
```

`detect()` reads `package.json` once, asks each detector whether it is active, and collects the active ones. During formatting, each parsed commit is shown to every active detector. Detectors return either `null` or an annotation that gets attached to that commit's version block.

The `nextjs` detector, for example, returns an annotation when a commit's `filesChanged` contains paths under `app/` or `pages/`.

This design makes adding a new detector additive — no existing code changes when a `astro.ts` detector is added.

## Why TypeScript with no runtime dependencies

The dependency list is intentionally short:

- **Production dependencies:** none beyond Node.js built-ins. `child_process`, `fs/promises`, `path`, `node:util`. This keeps the install footprint minimal and avoids inheriting other packages' supply-chain risk.
- **Dev dependencies:** TypeScript, Vitest, ESLint, `@changesets/cli`, `tsup` for building.

Avoiding runtime deps was a deliberate choice. CLIs that pull 200 transitive packages take seconds to install via `npx`, and every dependency is a potential CVE.

## Testing strategy

Three layers:

1. **Unit tests** for pure functions: the Conventional Commits parser, the language packs, the formatter given a fixed structured input.
2. **Integration tests** that spawn a real `git` against a fixture repository created in a temp directory. These verify the git reader and range resolution.
3. **Snapshot tests** for the final Markdown output, run against a fixture repo with known commits.

We do not mock `git`. We use the real binary on fixture repos. This makes tests slightly slower but guarantees behavior on a real system.

Target: 80% line coverage on `src/core/` and `src/formatters/`. Detectors are exercised via integration tests rather than unit tests, because their behavior is more interesting in combination than in isolation.

## CI pipeline

- **On every PR:** lint, typecheck, test on Node 20/22/24, on Ubuntu/macOS/Windows.
- **On merge to main:** the above, plus a build of the published artifact, plus a check that the changelog was updated via `@changesets/cli`.
- **On a `changeset` PR being merged:** publish to npm with provenance enabled.

See `.github/workflows/` for the YAML.

## Release process

We use [`@changesets/cli`](https://github.com/changesets/changesets) for version management — yes, this means we use a competitor's tool to release ours. They solve different problems. `changeling` produces the human-readable changelog; `changesets` manages the version bumps and the npm publish. They compose.

Once `changeling` is stable enough to dogfood for its own release notes, we will switch the release-notes generation step to use `changeling` itself.

## Open architectural questions

These are explicit unknowns to be resolved before v1.0:

1. **How do we handle squash-merged PRs that contain dozens of commits?** Currently every commit becomes an entry. We may want to collapse by PR number when available.
2. **What is the right behavior when a commit doesn't follow Conventional Commits?** Today they go into "Other changes". Maybe they should be skipped by default, with a flag to include them.
3. **Should `--from`/`--to` accept dates as well as refs?** Probably yes, but the parsing surface grows.

These are tracked as `[architecture]` labeled issues in the repository.
