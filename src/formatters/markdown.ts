import type { ChangelogVersion, ParsedCommit, CommitType } from '../types/index.js';
import { en } from './lang/en.js';

// Rendered in this order. Types not in this list (chore, ci, test, style, build) are skipped.
const GROUP_ORDER: ReadonlyArray<CommitType> = [
  'feat',
  'fix',
  'refactor',
  'perf',
  'docs',
  'revert',
  'other',
];

export function formatChangelog(
  version: ChangelogVersion,
  repoUrl: string,
  lang: 'en',
): string {
  void lang; // Phase 3 will use this to select the language pack

  const pack = en;

  const dateStr = version.date ? ` - ${version.date.slice(0, 10)}` : '';
  const header = `## [${version.version}]${dateStr}`;

  const sections: string[] = [header];

  for (const type of GROUP_ORDER) {
    const commits = version.groups[type];
    if (!commits || commits.length === 0) continue;

    const label = pack.groups[type as keyof typeof pack.groups];
    if (!label) continue;

    const lines = commits.map((c) => formatEntry(c, repoUrl));
    sections.push(`\n### ${label}\n${lines.join('\n')}`);
  }

  const activeAnnotations = version.stackAnnotations.filter((a) => a.items.length > 0);
  if (activeAnnotations.length > 0) {
    const annLines: string[] = ['\n### Stack Changes'];
    for (const ann of activeAnnotations) {
      annLines.push(`\n**${ann.label}**\n${ann.items.map((i) => `- ${i}`).join('\n')}`);
    }
    sections.push(annLines.join('\n'));
  }

  return sections.join('\n');
}

function formatEntry(commit: ParsedCommit, repoUrl: string): string {
  const scopePrefix = commit.scope ? `**${commit.scope}**: ` : '';
  const commitLink = `([${commit.shortSha}](${repoUrl}/commit/${commit.sha}))`;
  const prLink = commit.prNumber
    ? ` ([#${commit.prNumber}](${repoUrl}/pull/${commit.prNumber}))`
    : '';

  return `- ${scopePrefix}${commit.subject} ${commitLink}${prLink}`;
}
