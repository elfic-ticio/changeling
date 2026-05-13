import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import process from 'node:process';

import { generate } from '../../src/commands/generate.js';

// Fixed dates make git log output deterministic.
const GIT_ENV: NodeJS.ProcessEnv = {
  ...process.env,
  GIT_AUTHOR_DATE: '2026-05-13T12:00:00+00:00',
  GIT_COMMITTER_DATE: '2026-05-13T12:00:00+00:00',
};

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, stdio: 'pipe', env: GIT_ENV })
    .toString()
    .trim();
}

async function initRepo(dir: string): Promise<void> {
  git(dir, 'init');
  git(dir, 'config', 'user.email', 'test@changeling.test');
  git(dir, 'config', 'user.name', 'Changeling Test');
  // Fake remote so getRepoUrl() returns a usable base URL for link assertions.
  git(dir, 'remote', 'add', 'origin', 'https://github.com/test/repo.git');
}

function commit(cwd: string, message: string): void {
  git(cwd, 'commit', '--allow-empty', '-m', message);
}

function addTag(cwd: string, name: string): void {
  git(cwd, 'tag', name);
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('generate — integration', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'changeling-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // 1. Empty repo ──────────────────────────────────────────────────────────────
  it('1. empty repo: returns early without creating CHANGELOG.md', async () => {
    await initRepo(tmpDir);

    await expect(generate({ cwd: tmpDir })).resolves.toBeUndefined();
    await expect(readFile(join(tmpDir, 'CHANGELOG.md'), 'utf8')).rejects.toThrow();
  });

  // 2. Repo with no tags ───────────────────────────────────────────────────────
  it('2. no tags: all commits appear in output', async () => {
    await initRepo(tmpDir);
    commit(tmpDir, 'feat: first feature');
    commit(tmpDir, 'fix: first fix');

    await generate({ cwd: tmpDir });

    const content = await readFile(join(tmpDir, 'CHANGELOG.md'), 'utf8');
    expect(content).toContain('### Added');
    expect(content).toContain('first feature');
    expect(content).toContain('### Fixed');
    expect(content).toContain('first fix');
    // Commit links reference the fake remote origin
    expect(content).toContain('https://github.com/test/repo/commit/');
  });

  // 3. Repo with tags — only post-tag commits ──────────────────────────────────
  it('3. with tags: only commits since last tag appear', async () => {
    await initRepo(tmpDir);
    commit(tmpDir, 'feat: pre-release feature');
    addTag(tmpDir, 'v1.0.0');
    commit(tmpDir, 'feat: post-release feature');
    commit(tmpDir, 'fix: post-release fix');

    await generate({ cwd: tmpDir });

    const content = await readFile(join(tmpDir, 'CHANGELOG.md'), 'utf8');
    expect(content).toContain('post-release feature');
    expect(content).toContain('post-release fix');
    expect(content).not.toContain('pre-release feature');
  });

  // 4. Breaking changes ────────────────────────────────────────────────────────
  it('4. breaking change via ! is parsed and rendered', async () => {
    await initRepo(tmpDir);
    commit(tmpDir, 'feat!: remove deprecated config key');
    commit(tmpDir, 'fix(db): unrelated fix');

    await generate({ cwd: tmpDir });

    const content = await readFile(join(tmpDir, 'CHANGELOG.md'), 'utf8');
    expect(content).toContain('remove deprecated config key');
    // fix with scope renders as **db**: unrelated fix
    expect(content).toContain('**db**');
    expect(content).toContain('unrelated fix');
  });

  // 5. PR squash-merges ────────────────────────────────────────────────────────
  it('5. PR number extracted and linked from squash-merge subject', async () => {
    await initRepo(tmpDir);
    commit(tmpDir, 'feat(auth): add github oauth provider (#42)');

    await generate({ cwd: tmpDir });

    const content = await readFile(join(tmpDir, 'CHANGELOG.md'), 'utf8');
    expect(content).toContain('add github oauth provider');
    // PR reference stripped from subject text
    expect(content).not.toMatch(/add github oauth provider.*\(#42\)/);
    // PR link present
    expect(content).toContain('[#42](https://github.com/test/repo/pull/42)');
  });

  // 6. --dry-run ───────────────────────────────────────────────────────────────
  it('6. dry-run: stdout only — no CHANGELOG.md written', async () => {
    await initRepo(tmpDir);
    commit(tmpDir, 'feat: dry run feature');

    await generate({ cwd: tmpDir, dryRun: true });

    await expect(readFile(join(tmpDir, 'CHANGELOG.md'), 'utf8')).rejects.toThrow();
  });

  // 7. --from / --to flags ─────────────────────────────────────────────────────
  it('7. --from and --to limit the commit range', async () => {
    await initRepo(tmpDir);
    commit(tmpDir, 'feat: before range');
    addTag(tmpDir, 'v1.0.0');
    commit(tmpDir, 'feat: inside range');
    addTag(tmpDir, 'v1.1.0');
    commit(tmpDir, 'feat: after range');

    await generate({ cwd: tmpDir, from: 'v1.0.0', to: 'v1.1.0' });

    const content = await readFile(join(tmpDir, 'CHANGELOG.md'), 'utf8');
    expect(content).toContain('inside range');
    expect(content).not.toContain('before range');
    expect(content).not.toContain('after range');
  });

  // 8. Skipped types ───────────────────────────────────────────────────────────
  it('8. chore, ci, test, style, build commits are not rendered', async () => {
    await initRepo(tmpDir);
    commit(tmpDir, 'feat: the only visible entry');
    commit(tmpDir, 'chore: update lockfile');
    commit(tmpDir, 'ci: add matrix runner');
    commit(tmpDir, 'test: add unit tests');
    commit(tmpDir, 'style: fix whitespace');
    commit(tmpDir, 'build(deps): bump typescript');

    await generate({ cwd: tmpDir });

    const content = await readFile(join(tmpDir, 'CHANGELOG.md'), 'utf8');
    expect(content).toContain('the only visible entry');
    expect(content).not.toContain('update lockfile');
    expect(content).not.toContain('add matrix runner');
    expect(content).not.toContain('add unit tests');
    expect(content).not.toContain('fix whitespace');
    expect(content).not.toContain('bump typescript');
  });

  // 9. --output custom path ────────────────────────────────────────────────────
  it('9. --output writes to a custom file path', async () => {
    await initRepo(tmpDir);
    commit(tmpDir, 'docs: update readme');

    await generate({ cwd: tmpDir, output: 'NOTES.md' });

    // Custom file exists
    const content = await readFile(join(tmpDir, 'NOTES.md'), 'utf8');
    expect(content).toContain('update readme');
    // Default CHANGELOG.md was NOT created
    await expect(readFile(join(tmpDir, 'CHANGELOG.md'), 'utf8')).rejects.toThrow();
  });

  // 10. Non-conventional commits ───────────────────────────────────────────────
  it('10. non-conventional commits appear under Other', async () => {
    await initRepo(tmpDir);
    commit(tmpDir, 'Update something the old way');

    await generate({ cwd: tmpDir });

    const content = await readFile(join(tmpDir, 'CHANGELOG.md'), 'utf8');
    expect(content).toContain('### Other');
    expect(content).toContain('Update something the old way');
  });

  // 11. Insert after [Unreleased] in existing CHANGELOG ────────────────────────
  it('11. inserts new block after [Unreleased] in an existing CHANGELOG.md', async () => {
    await initRepo(tmpDir);
    commit(tmpDir, 'feat: new thing');

    // Pre-seed a CHANGELOG.md with the standard header
    const existing =
      '# Changelog\n\n## [Unreleased]\n\n### Added\n- Old unreleased entry.\n\n[Unreleased]: https://example.com\n';
    await (await import('node:fs/promises')).writeFile(join(tmpDir, 'CHANGELOG.md'), existing);

    await generate({ cwd: tmpDir });

    const content = await readFile(join(tmpDir, 'CHANGELOG.md'), 'utf8');
    // Original header preserved
    expect(content).toContain('# Changelog');
    expect(content).toContain('## [Unreleased]');
    expect(content).toContain('Old unreleased entry');
    // New block also present
    expect(content).toContain('new thing');
  });

  // 12. Scoped commits render scope prefix ─────────────────────────────────────
  it('12. scoped commits render **scope**: prefix', async () => {
    await initRepo(tmpDir);
    commit(tmpDir, 'fix(api): correct status code');
    commit(tmpDir, 'fix: scopeless fix');

    await generate({ cwd: tmpDir });

    const content = await readFile(join(tmpDir, 'CHANGELOG.md'), 'utf8');
    expect(content).toContain('**api**: correct status code');
    expect(content).not.toMatch(/\*\*[^*]+\*\*: scopeless fix/);
  });
});
