import { describe, it, expect } from 'vitest';
import { prismaDetector } from './prisma.js';
import type { ParsedCommit, DetectContext } from '../types/index.js';

const CTX: DetectContext = { from: 'v1.0.0', to: 'HEAD' };

function makeCommit(subject: string, filesChanged: string[]): ParsedCommit {
  return {
    sha: 'b'.repeat(40),
    shortSha: 'bbbbbbb',
    type: 'feat',
    scope: null,
    subject,
    body: null,
    breaking: false,
    prNumber: null,
    filesChanged,
    date: '2026-05-14T00:00:00Z',
    author: 'Test',
  };
}

describe('prismaDetector.isActive', () => {
  it('true when prisma in devDependencies', () => {
    expect(prismaDetector.isActive({ devDependencies: { prisma: '5.0.0' } })).toBe(true);
  });

  it('true when @prisma/client in dependencies', () => {
    expect(prismaDetector.isActive({ dependencies: { '@prisma/client': '5.0.0' } })).toBe(true);
  });

  it('true when both prisma and @prisma/client present', () => {
    expect(
      prismaDetector.isActive({
        dependencies: { '@prisma/client': '5.0.0' },
        devDependencies: { prisma: '5.0.0' },
      })
    ).toBe(true);
  });

  it('false when neither is present', () => {
    expect(prismaDetector.isActive({})).toBe(false);
    expect(prismaDetector.isActive({ dependencies: { express: '4.0.0' } })).toBe(false);
  });
});

describe('prismaDetector.run', () => {
  it('returns null when no commits touch schema.prisma', async () => {
    const commits = [makeCommit('feat: add user route', ['src/routes/user.ts'])];
    expect(await prismaDetector.run(commits, CTX)).toBeNull();
  });

  it('returns null for empty commit list', async () => {
    expect(await prismaDetector.run([], CTX)).toBeNull();
  });

  it('detects commits that touch prisma/schema.prisma', async () => {
    const commits = [
      makeCommit('feat: add user model', ['prisma/schema.prisma', 'src/db.ts']),
    ];
    const result = await prismaDetector.run(commits, CTX);
    expect(result).not.toBeNull();
    expect(result!.detector).toBe('prisma');
    expect(result!.label).toBe('Prisma');
    expect(result!.items).toContain('feat: add user model');
  });

  it('lists each schema-touching commit subject', async () => {
    const commits = [
      makeCommit('feat: add user model', ['prisma/schema.prisma']),
      makeCommit('feat: add post model', ['prisma/schema.prisma']),
      makeCommit('fix: unrelated', ['src/foo.ts']),
    ];
    const result = await prismaDetector.run(commits, CTX);
    expect(result!.items).toHaveLength(2);
    expect(result!.items).toContain('feat: add user model');
    expect(result!.items).toContain('feat: add post model');
  });

  it('does not include commits that only touch other files', async () => {
    const commits = [
      makeCommit('chore: update deps', ['package.json']),
      makeCommit('fix: schema migration', ['prisma/schema.prisma']),
    ];
    const result = await prismaDetector.run(commits, CTX);
    expect(result!.items).toHaveLength(1);
    expect(result!.items[0]).toBe('fix: schema migration');
  });
});
