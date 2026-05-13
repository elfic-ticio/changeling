import type { ParsedCommit, CommitType } from '../types/index.js';
import type { RawCommit } from './git.js';

// Conventional Commits 1.0 subject pattern.
const SUBJECT_RE =
  /^(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?: (?<subject>.+)$/;

// Squash-merge PR reference at the end of a subject line.
const PR_RE = /\(#(\d+)\)\s*$/;

const KNOWN_TYPES: ReadonlySet<CommitType> = new Set<CommitType>([
  'feat',
  'fix',
  'perf',
  'refactor',
  'docs',
  'style',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
]);

function toCommitType(raw: string): CommitType {
  return KNOWN_TYPES.has(raw as CommitType) ? (raw as CommitType) : 'other';
}

export function parseCommit(raw: RawCommit): ParsedCommit {
  const match = SUBJECT_RE.exec(raw.subject);

  let type: CommitType;
  let scope: string | null;
  let subject: string;
  let breaking: boolean;

  if (match?.groups) {
    type = toCommitType(match.groups['type'] ?? '');
    scope = match.groups['scope'] ?? null;
    breaking = match.groups['breaking'] === '!';
    subject = match.groups['subject'] ?? raw.subject;
  } else {
    type = 'other';
    scope = null;
    breaking = false;
    subject = raw.subject;
  }

  // Breaking change can also be signalled by "BREAKING CHANGE:" or
  // "BREAKING-CHANGE:" anywhere in the commit body (CC 1.0 §17).
  if (!breaking && raw.body != null && /BREAKING[- ]CHANGE:/i.test(raw.body)) {
    breaking = true;
  }

  // Strip trailing PR reference so the entry reads cleanly in the changelog.
  const prMatch = PR_RE.exec(subject);
  const prNumber = prMatch ? parseInt(prMatch[1]!, 10) : null;
  const cleanSubject = prMatch ? subject.slice(0, prMatch.index).trimEnd() : subject;

  return {
    sha: raw.sha,
    shortSha: raw.shortSha,
    type,
    scope,
    subject: cleanSubject,
    body: raw.body,
    breaking,
    prNumber,
    filesChanged: raw.filesChanged,
    date: raw.date,
    author: raw.author,
  };
}
