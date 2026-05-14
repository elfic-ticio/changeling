import { describe, it, expect } from 'vitest';
import { viteDetector } from './vite.js';
import type { ParsedCommit, DetectContext } from '../types/index.js';

const CTX: DetectContext = { from: 'v1.0.0', to: 'HEAD' };

function makeCommit(filesChanged: string[]): ParsedCommit {
  return {
    sha: 'c'.repeat(40),
    shortSha: 'ccccccc',
    type: 'feat',
    scope: null,
    subject: 'test commit',
    body: null,
    breaking: false,
    prNumber: null,
    filesChanged,
    date: '2026-05-14T00:00:00Z',
    author: 'Test',
  };
}

describe('viteDetector.isActive', () => {
  it('true when vite in devDependencies', () => {
    expect(viteDetector.isActive({ devDependencies: { vite: '5.0.0' } })).toBe(true);
  });

  it('true when vite in dependencies', () => {
    expect(viteDetector.isActive({ dependencies: { vite: '5.0.0' } })).toBe(true);
  });

  it('false when vite is absent', () => {
    expect(viteDetector.isActive({})).toBe(false);
    expect(viteDetector.isActive({ devDependencies: { vitest: '2.0.0' } })).toBe(false);
  });
});

describe('viteDetector.run', () => {
  it('returns null when no commits touch vite.config.*', async () => {
    const commits = [makeCommit(['src/main.ts', 'README.md'])];
    expect(await viteDetector.run(commits, CTX)).toBeNull();
  });

  it('returns null for empty commit list', async () => {
    expect(await viteDetector.run([], CTX)).toBeNull();
  });

  it('detects vite.config.ts', async () => {
    const commits = [makeCommit(['vite.config.ts'])];
    const result = await viteDetector.run(commits, CTX);
    expect(result).not.toBeNull();
    expect(result!.detector).toBe('vite');
    expect(result!.label).toBe('Vite');
    expect(result!.items).toContain('vite.config.ts');
  });

  it('detects vite.config.js', async () => {
    const commits = [makeCommit(['vite.config.js'])];
    const result = await viteDetector.run(commits, CTX);
    expect(result).not.toBeNull();
    expect(result!.items).toContain('vite.config.js');
  });

  it('detects vite.config.mts and other extensions', async () => {
    const commits = [makeCommit(['vite.config.mts'])];
    const result = await viteDetector.run(commits, CTX);
    expect(result).not.toBeNull();
    expect(result!.items).toContain('vite.config.mts');
  });

  it('deduplicates across commits', async () => {
    const commits = [makeCommit(['vite.config.ts']), makeCommit(['vite.config.ts'])];
    const result = await viteDetector.run(commits, CTX);
    expect(result!.items).toHaveLength(1);
  });

  it('does not include non-vite files', async () => {
    const commits = [makeCommit(['vite.config.ts', 'src/main.ts'])];
    const result = await viteDetector.run(commits, CTX);
    expect(result!.items).not.toContain('src/main.ts');
  });

  it('items are sorted alphabetically', async () => {
    const commits = [makeCommit(['vite.config.ts', 'vite.config.js'])];
    const result = await viteDetector.run(commits, CTX);
    const items = result!.items;
    expect(items).toEqual([...items].sort());
  });
});
