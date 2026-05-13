import { describe, it, expect } from 'vitest';
import { parseCommit } from './parser.js';
import type { RawCommit } from './git.js';

function raw(overrides: Partial<RawCommit> = {}): RawCommit {
  return {
    sha: 'a'.repeat(40),
    shortSha: 'aaaaaaa',
    date: '2026-05-13T00:00:00+00:00',
    author: 'Test User',
    subject: 'chore: placeholder',
    body: null,
    filesChanged: [],
    ...overrides,
  };
}

describe('parseCommit', () => {
  // ── Valid conventional commits ──────────────────────────────────────────────

  it('parses feat with no scope', () => {
    const result = parseCommit(raw({ subject: 'feat: add oauth support' }));
    expect(result.type).toBe('feat');
    expect(result.scope).toBeNull();
    expect(result.subject).toBe('add oauth support');
    expect(result.breaking).toBe(false);
    expect(result.prNumber).toBeNull();
  });

  it('parses fix with scope', () => {
    const result = parseCommit(raw({ subject: 'fix(auth): prevent null pointer on logout' }));
    expect(result.type).toBe('fix');
    expect(result.scope).toBe('auth');
    expect(result.subject).toBe('prevent null pointer on logout');
  });

  it('parses refactor', () => {
    const result = parseCommit(raw({ subject: 'refactor: extract shared helper' }));
    expect(result.type).toBe('refactor');
    expect(result.scope).toBeNull();
  });

  it('parses perf', () => {
    const result = parseCommit(raw({ subject: 'perf(db): add index on users.email' }));
    expect(result.type).toBe('perf');
    expect(result.scope).toBe('db');
  });

  it('parses docs', () => {
    const result = parseCommit(raw({ subject: 'docs(readme): update installation steps' }));
    expect(result.type).toBe('docs');
    expect(result.scope).toBe('readme');
  });

  it('parses chore', () => {
    const result = parseCommit(raw({ subject: 'chore: bump eslint to v9' }));
    expect(result.type).toBe('chore');
  });

  it('parses build with scope', () => {
    const result = parseCommit(raw({ subject: 'build(deps): upgrade typescript to 5.4' }));
    expect(result.type).toBe('build');
    expect(result.scope).toBe('deps');
  });

  it('parses ci', () => {
    const result = parseCommit(raw({ subject: 'ci: add windows runner to matrix' }));
    expect(result.type).toBe('ci');
  });

  // ── Breaking changes ────────────────────────────────────────────────────────

  it('detects breaking change via ! after type', () => {
    const result = parseCommit(raw({ subject: 'feat!: remove deprecated endpoint' }));
    expect(result.type).toBe('feat');
    expect(result.breaking).toBe(true);
    expect(result.scope).toBeNull();
  });

  it('detects breaking change via ! after scope', () => {
    const result = parseCommit(
      raw({ subject: 'feat(api)!: rename /users to /accounts' }),
    );
    expect(result.type).toBe('feat');
    expect(result.scope).toBe('api');
    expect(result.breaking).toBe(true);
  });

  it('detects breaking change from BREAKING CHANGE: in body', () => {
    const result = parseCommit(
      raw({
        subject: 'refactor: restructure config module',
        body: 'BREAKING CHANGE: `config.load()` now returns a Promise.',
      }),
    );
    expect(result.breaking).toBe(true);
  });

  it('detects breaking change from BREAKING-CHANGE: in body (hyphenated form)', () => {
    const result = parseCommit(
      raw({
        subject: 'feat: new auth flow',
        body: 'BREAKING-CHANGE: token format changed.',
      }),
    );
    expect(result.breaking).toBe(true);
  });

  it('body breaking detection is case-insensitive', () => {
    const result = parseCommit(
      raw({ subject: 'fix: patch', body: 'breaking change: removes legacy option' }),
    );
    expect(result.breaking).toBe(true);
  });

  // ── PR number extraction ────────────────────────────────────────────────────

  it('extracts PR number from squash-merge subject', () => {
    const result = parseCommit(
      raw({ subject: 'feat(auth): add github oauth provider (#42)' }),
    );
    expect(result.prNumber).toBe(42);
    expect(result.subject).toBe('add github oauth provider');
  });

  it('strips PR reference and trims whitespace', () => {
    const result = parseCommit(raw({ subject: 'fix: correct off-by-one error (#123)' }));
    expect(result.prNumber).toBe(123);
    expect(result.subject).toBe('correct off-by-one error');
  });

  it('ignores PR-like pattern that is not at the end of the subject', () => {
    const result = parseCommit(
      raw({ subject: 'feat: reference issue (#10) in description text' }),
    );
    // (#10) is in the middle, not at the end — should not be extracted
    expect(result.prNumber).toBeNull();
    expect(result.subject).toBe('reference issue (#10) in description text');
  });

  // ── Non-conformant commits ──────────────────────────────────────────────────

  it('falls back to type=other for non-conventional subjects', () => {
    const result = parseCommit(raw({ subject: 'Add new thing' }));
    expect(result.type).toBe('other');
    expect(result.scope).toBeNull();
    expect(result.subject).toBe('Add new thing');
    expect(result.breaking).toBe(false);
  });

  it('falls back to type=other for Revert "..." (git auto-generated)', () => {
    const result = parseCommit(raw({ subject: 'Revert "feat: add something"' }));
    expect(result.type).toBe('other');
    expect(result.subject).toBe('Revert "feat: add something"');
  });

  it('maps unknown type string to other', () => {
    const result = parseCommit(raw({ subject: 'wip: half-finished feature' }));
    expect(result.type).toBe('other');
    expect(result.subject).toBe('half-finished feature');
  });

  // ── Field pass-through ──────────────────────────────────────────────────────

  it('passes through sha, shortSha, date, author, filesChanged, body', () => {
    const input = raw({
      subject: 'fix: something',
      sha: 'b'.repeat(40),
      shortSha: 'bbbbbbb',
      date: '2026-01-01T12:00:00Z',
      author: 'Jane Doe',
      body: 'Closes #99.',
      filesChanged: ['src/index.ts', 'src/core/git.ts'],
    });
    const result = parseCommit(input);
    expect(result.sha).toBe('b'.repeat(40));
    expect(result.shortSha).toBe('bbbbbbb');
    expect(result.date).toBe('2026-01-01T12:00:00Z');
    expect(result.author).toBe('Jane Doe');
    expect(result.body).toBe('Closes #99.');
    expect(result.filesChanged).toEqual(['src/index.ts', 'src/core/git.ts']);
  });
});
