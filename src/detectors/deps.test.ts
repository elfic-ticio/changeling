import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import process from 'node:process';

import { depsDetector, diffDeps, collectDeps } from './deps.js';
import type { ParsedCommit, DetectContext } from '../types/index.js';

// ── Pure function tests ───────────────────────────────────────────────────────

describe('collectDeps', () => {
  it('merges dependencies and devDependencies', () => {
    const result = collectDeps({
      dependencies: { react: '18.0.0' },
      devDependencies: { typescript: '5.0.0' },
    });
    expect(result).toEqual({ react: '18.0.0', typescript: '5.0.0' });
  });

  it('returns empty object when both are absent', () => {
    expect(collectDeps({})).toEqual({});
  });

  it('devDependencies values win on name collision', () => {
    const result = collectDeps({
      dependencies: { foo: '1.0.0' },
      devDependencies: { foo: '2.0.0' },
    });
    expect(result['foo']).toBe('2.0.0');
  });
});

describe('diffDeps', () => {
  it('detects added packages', () => {
    const { added } = diffDeps({}, { react: '18.0.0' });
    expect(added).toContain('react@18.0.0');
  });

  it('detects removed packages', () => {
    const { removed } = diffDeps({ webpack: '5.0.0' }, {});
    expect(removed).toContain('webpack@5.0.0');
  });

  it('detects updated packages', () => {
    const { updated } = diffDeps({ typescript: '5.0.0' }, { typescript: '6.0.0' });
    expect(updated).toContain('typescript 5.0.0 → 6.0.0');
  });

  it('returns empty arrays when deps are identical', () => {
    const deps = { react: '18.0.0', typescript: '5.0.0' };
    const result = diffDeps(deps, { ...deps });
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
    expect(result.updated).toHaveLength(0);
  });

  it('handles multiple changes at once', () => {
    const before = { a: '1.0.0', b: '2.0.0', c: '3.0.0' };
    const after = { a: '1.1.0', d: '4.0.0' };
    const { added, removed, updated } = diffDeps(before, after);
    expect(added).toContain('d@4.0.0');
    expect(removed).toContain('b@2.0.0');
    expect(removed).toContain('c@3.0.0');
    expect(updated).toContain('a 1.0.0 → 1.1.0');
  });

  it('sorts all result arrays alphabetically', () => {
    const { added } = diffDeps({}, { z: '1.0.0', a: '1.0.0', m: '1.0.0' });
    expect(added).toEqual([...added].sort());
  });
});

// ── Integration tests for run() ───────────────────────────────────────────────

const GIT_ENV: NodeJS.ProcessEnv = {
  ...process.env,
  GIT_AUTHOR_DATE: '2026-05-14T12:00:00+00:00',
  GIT_COMMITTER_DATE: '2026-05-14T12:00:00+00:00',
};

function git(cwd: string, ...args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'pipe', env: GIT_ENV });
}

async function initRepo(dir: string): Promise<void> {
  git(dir, 'init');
  git(dir, 'config', 'user.email', 'test@changeling.test');
  git(dir, 'config', 'user.name', 'Changeling Test');
}

function noopCommit(): ParsedCommit {
  return {
    sha: 'a'.repeat(40),
    shortSha: 'aaaaaaa',
    type: 'chore',
    scope: null,
    subject: 'irrelevant',
    body: null,
    breaking: false,
    prNumber: null,
    filesChanged: [],
    date: '2026-05-14T00:00:00Z',
    author: 'Test',
  };
}

describe('depsDetector.isActive', () => {
  it('always returns true', () => {
    expect(depsDetector.isActive({})).toBe(true);
    expect(depsDetector.isActive({ dependencies: { react: '18.0.0' } })).toBe(true);
  });
});

describe('depsDetector.run (integration)', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'changeling-deps-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('returns null when ctx.from is empty', async () => {
    const ctx: DetectContext = { from: '', to: 'HEAD', cwd: tmpDir };
    expect(await depsDetector.run([noopCommit()], ctx)).toBeNull();
  });

  it('returns null when from ref does not exist in repo', async () => {
    await initRepo(tmpDir);
    await writeFile(join(tmpDir, 'package.json'), JSON.stringify({ dependencies: {} }));
    git(tmpDir, 'add', 'package.json');
    git(tmpDir, 'commit', '-m', 'init');
    git(tmpDir, 'tag', 'v1.0.0');

    const ctx: DetectContext = { from: 'nonexistent-ref', to: 'HEAD', cwd: tmpDir };
    expect(await depsDetector.run([noopCommit()], ctx)).toBeNull();
  });

  it('returns null when package.json has no dep changes', async () => {
    await initRepo(tmpDir);
    const pkg = JSON.stringify({ dependencies: { react: '18.0.0' } }, null, 2);
    await writeFile(join(tmpDir, 'package.json'), pkg);
    git(tmpDir, 'add', 'package.json');
    git(tmpDir, 'commit', '-m', 'init');
    git(tmpDir, 'tag', 'v1.0.0');

    // Second commit with identical deps
    git(tmpDir, 'commit', '--allow-empty', '-m', 'chore: no dep change');

    const ctx: DetectContext = { from: 'v1.0.0', to: 'HEAD', cwd: tmpDir };
    expect(await depsDetector.run([noopCommit()], ctx)).toBeNull();
  });

  it('detects added dependency', async () => {
    await initRepo(tmpDir);
    const before = JSON.stringify({ dependencies: { react: '18.0.0' } }, null, 2);
    await writeFile(join(tmpDir, 'package.json'), before);
    git(tmpDir, 'add', 'package.json');
    git(tmpDir, 'commit', '-m', 'init');
    git(tmpDir, 'tag', 'v1.0.0');

    const after = JSON.stringify({ dependencies: { react: '18.0.0', axios: '1.0.0' } }, null, 2);
    await writeFile(join(tmpDir, 'package.json'), after);
    git(tmpDir, 'add', 'package.json');
    git(tmpDir, 'commit', '-m', 'feat: add axios');

    const ctx: DetectContext = { from: 'v1.0.0', to: 'HEAD', cwd: tmpDir };
    const result = await depsDetector.run([noopCommit()], ctx);
    expect(result).not.toBeNull();
    expect(result!.detector).toBe('deps');
    expect(result!.label).toBe('Dependencies');
    expect(result!.items).toContain('Added: axios@1.0.0');
  });

  it('detects removed dependency', async () => {
    await initRepo(tmpDir);
    const before = JSON.stringify({ dependencies: { react: '18.0.0', lodash: '4.0.0' } }, null, 2);
    await writeFile(join(tmpDir, 'package.json'), before);
    git(tmpDir, 'add', 'package.json');
    git(tmpDir, 'commit', '-m', 'init');
    git(tmpDir, 'tag', 'v1.0.0');

    const after = JSON.stringify({ dependencies: { react: '18.0.0' } }, null, 2);
    await writeFile(join(tmpDir, 'package.json'), after);
    git(tmpDir, 'add', 'package.json');
    git(tmpDir, 'commit', '-m', 'chore: remove lodash');

    const ctx: DetectContext = { from: 'v1.0.0', to: 'HEAD', cwd: tmpDir };
    const result = await depsDetector.run([noopCommit()], ctx);
    expect(result!.items).toContain('Removed: lodash@4.0.0');
  });

  it('detects updated dependency', async () => {
    await initRepo(tmpDir);
    const before = JSON.stringify({ dependencies: { typescript: '5.0.0' } }, null, 2);
    await writeFile(join(tmpDir, 'package.json'), before);
    git(tmpDir, 'add', 'package.json');
    git(tmpDir, 'commit', '-m', 'init');
    git(tmpDir, 'tag', 'v1.0.0');

    const after = JSON.stringify({ dependencies: { typescript: '6.0.0' } }, null, 2);
    await writeFile(join(tmpDir, 'package.json'), after);
    git(tmpDir, 'add', 'package.json');
    git(tmpDir, 'commit', '-m', 'chore: bump typescript');

    const ctx: DetectContext = { from: 'v1.0.0', to: 'HEAD', cwd: tmpDir };
    const result = await depsDetector.run([noopCommit()], ctx);
    expect(result!.items).toContain('Updated: typescript 5.0.0 → 6.0.0');
  });
});
