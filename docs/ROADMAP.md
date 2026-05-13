# Roadmap

This document describes the planned phases for building `@elfic/changeling`. Each phase has explicit "done" criteria — work moves to the next phase only when current criteria are met.

The roadmap is intentionally small. The goal is to ship v1.0 with a focused feature set, not to design v5.0 on day one.

---

## Phase 0 — Repository setup ✅ (this commit)

**Goal:** A repository that looks ready to receive contributions, with no code yet.

**Deliverables**

- [x] `README.md` (EN) and `README.es.md` (ES)
- [x] `ABOUT.md` (bilingual)
- [x] `docs/ARCHITECTURE.md`
- [x] `CONTRIBUTING.md` and `CONTRIBUTING.es.md`
- [x] `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1)
- [x] `SECURITY.md`
- [x] `LICENSE` (MIT)
- [x] `CHANGELOG.md` (empty, ready for first entry)
- [x] `.github/ISSUE_TEMPLATE/` and PR template
- [x] `.github/workflows/ci.yml` (lint + typecheck + test)
- [x] `.github/workflows/release.yml` (changesets → npm publish)
- [x] `package.json` with metadata and scripts
- [x] `tsconfig.json`, `.eslintrc`, `.prettierrc`
- [x] Folder skeleton under `src/`

**Done when:** The repo can be cloned, `npm install` succeeds, `npm run lint` and `npm run typecheck` pass on an empty codebase.

---

## Phase 1 — MVP: minimum viable changelog

**Goal:** `npx @elfic/changeling` works on a real repo and produces a useful `CHANGELOG.md`.

**Scope**

- Read git log between last tag and `HEAD` (auto-detect)
- Parse Conventional Commits: `feat`, `fix`, `refactor`, `perf`, `docs`, `chore`, `test`, `build`, `ci`, `style`, `revert`
- Group commits by type
- Link each entry to its commit SHA on GitHub
- Detect PR number from squash-merge subject (`(#42)`) and link it
- Emit Keep a Changelog Markdown in English
- Skip `chore`, `ci`, `test`, `style` by default
- `--dry-run` flag
- `--from` and `--to` flags
- `--output` flag

**Out of scope for Phase 1**

- Stack detection
- Spanish output
- Config file
- `init` command

**Done when:**
- `npx @elfic/changeling` on the `changeling` repo itself produces a changelog that a human would accept without edits.
- 80% line coverage on `src/core/`.
- The CI pipeline passes on Node 20, 22, 24 across Ubuntu/macOS/Windows.

**Published to npm as:** `0.1.0-alpha.1`

---

## Phase 2 — Stack detection

**Goal:** Add the differentiation. This is the feature that makes `changeling` distinct from `conventional-changelog`.

**Scope**

- Detector framework (`src/detectors/`)
- Next.js detector: annotate commits that change `app/**`, `pages/**`, `middleware.ts`
- Prisma detector: annotate commits that change `prisma/schema.prisma`
- Dependencies detector: diff `package.json` and list added/removed/updated deps
- Render stack annotations as a sub-section per version
- `--no-stack` flag to disable

**Done when:**
- Running `changeling` on a real Next.js project produces annotations that match what a code reviewer would manually highlight.
- Integration tests cover each detector against a fixture repo.

**Published to npm as:** `0.2.0`

---

## Phase 3 — Configuration and Spanish output

**Goal:** Make the tool customizable for projects with established conventions, and make it bilingual.

**Scope**

- `.changelingrc.json` config loading
- `changeling init` command — writes a default config
- Config schema validation with helpful errors
- `--lang es` flag and full Spanish language pack
- Configurable group labels (`groups` config)
- Configurable skipped types (`skipTypes` config)
- Vite detector
- Astro detector

**Done when:**
- A user can customize all visible labels via config without touching code.
- Spanish output passes the same snapshot tests as English (different strings, same structure).

**Published to npm as:** `0.3.0`

---

## Phase 4 — Polish and v1.0

**Goal:** A version we are willing to call stable.

**Scope**

- Error messages are actionable. No raw stack traces in normal CLI use.
- `--help` output is complete and accurate.
- `--version` reads from `package.json`.
- Performance budget verified: <1s on a 1000-commit repo.
- Documentation reviewed end to end.
- Public API surface (the programmatic export) is documented and stable.
- At least 3 external users have used it on real projects and given feedback.

**Done when:**
- No open `bug` issues older than 30 days.
- All `docs` issues closed.
- Maintainer signs off that the surface area is stable enough to commit to SemVer.

**Published to npm as:** `1.0.0`

---

## Beyond v1.0 — possible directions

Not promises. Just paths the project could take based on feedback.

- **Monorepo support.** Generate one changelog per workspace package.
- **GitHub Releases integration.** Optionally post the rendered changelog as a release note via `gh` CLI.
- **Custom detector plugins.** Allow projects to define their own detectors via a config field.
- **More languages.** Portuguese, French, German. Each addition is small.
- **Slack/Discord webhook output.** Post the changelog to a channel on release.

These are speculative. None are committed until v1.0 ships and we see how the tool gets used.

---

## How phases get sequenced

Each phase is a milestone in GitHub. Issues are labeled with the phase they belong to. The maintainer does not merge issues from a future phase into the current one — scope discipline is the main risk to this project, and a public roadmap is the main defense.

If a contributor wants to work on something from a later phase, that is welcome, but it will be reviewed and merged in the appropriate phase to keep the changelog coherent.
