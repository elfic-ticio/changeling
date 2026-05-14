import { describe, it, expect } from 'vitest';
import { nextjsDetector } from './nextjs.js';
import type { ParsedCommit, DetectContext } from '../types/index.js';

const CTX: DetectContext = { from: 'v1.0.0', to: 'HEAD' };

function makeCommit(filesChanged: string[]): ParsedCommit {
  return {
    sha: 'a'.repeat(40),
    shortSha: 'aaaaaaa',
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

describe('nextjsDetector.isActive', () => {
  it('true when next in dependencies', () => {
    expect(nextjsDetector.isActive({ dependencies: { next: '14.0.0' } })).toBe(true);
  });

  it('true when next in devDependencies', () => {
    expect(nextjsDetector.isActive({ devDependencies: { next: '14.0.0' } })).toBe(true);
  });

  it('false when next is absent', () => {
    expect(nextjsDetector.isActive({})).toBe(false);
    expect(nextjsDetector.isActive({ dependencies: { react: '18.0.0' } })).toBe(false);
  });
});

describe('nextjsDetector.run', () => {
  it('returns null when no commits touch nextjs paths', async () => {
    const commits = [makeCommit(['src/utils/foo.ts', 'README.md'])];
    expect(await nextjsDetector.run(commits, CTX)).toBeNull();
  });

  it('returns null for empty commit list', async () => {
    expect(await nextjsDetector.run([], CTX)).toBeNull();
  });

  it('detects files under app/', async () => {
    const commits = [makeCommit(['app/page.tsx', 'app/dashboard/layout.tsx'])];
    const result = await nextjsDetector.run(commits, CTX);
    expect(result).not.toBeNull();
    expect(result!.detector).toBe('nextjs');
    expect(result!.items).toContain('app/page.tsx');
    expect(result!.items).toContain('app/dashboard/layout.tsx');
  });

  it('detects files under pages/', async () => {
    const commits = [makeCommit(['pages/index.tsx', 'pages/api/users.ts'])];
    const result = await nextjsDetector.run(commits, CTX);
    expect(result).not.toBeNull();
    expect(result!.items).toContain('pages/index.tsx');
    expect(result!.items).toContain('pages/api/users.ts');
  });

  it('detects middleware.ts', async () => {
    const commits = [makeCommit(['middleware.ts'])];
    const result = await nextjsDetector.run(commits, CTX);
    expect(result).not.toBeNull();
    expect(result!.items).toContain('middleware.ts');
  });

  it('deduplicates files touched in multiple commits', async () => {
    const commits = [
      makeCommit(['app/page.tsx']),
      makeCommit(['app/page.tsx', 'app/layout.tsx']),
    ];
    const result = await nextjsDetector.run(commits, CTX);
    expect(result!.items.filter((f) => f === 'app/page.tsx')).toHaveLength(1);
  });

  it('does not include non-nextjs files in items', async () => {
    const commits = [makeCommit(['app/page.tsx', 'src/utils/helper.ts'])];
    const result = await nextjsDetector.run(commits, CTX);
    expect(result!.items).not.toContain('src/utils/helper.ts');
  });

  it('items are sorted alphabetically', async () => {
    const commits = [makeCommit(['pages/z.tsx', 'app/a.tsx', 'middleware.ts'])];
    const result = await nextjsDetector.run(commits, CTX);
    const items = result!.items;
    expect(items).toEqual([...items].sort());
  });
});
