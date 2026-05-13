# Changesets

This folder is used by [`@changesets/cli`](https://github.com/changesets/changesets) to manage versioning and changelogs for `@elfic/changeling`.

## How to add a changeset

After making changes that affect users, run:

```bash
npx changeset
```

You will be asked:

1. **Which packages?** Select `@elfic/changeling`.
2. **What kind of change?** Pick `patch`, `minor`, or `major` per SemVer.
3. **Summary.** Write one line in the imperative mood: `add --output flag` not `Added the output flag`.

A markdown file will be created under `.changeset/`. Commit it with your PR.

## What happens on release

1. When PRs with changesets are merged to `main`, the release workflow opens a "Version Packages" PR that bumps the version and updates `CHANGELOG.md`.
2. When that PR is merged, the workflow publishes the new version to npm with provenance.

## When NOT to add a changeset

- Documentation-only PRs.
- Internal refactors with no user-visible effect.
- CI/build changes.

CI will not require a changeset on these.
