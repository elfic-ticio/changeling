import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

import { resolveRange } from '../core/range.js';
import { readGitLog, getRepoUrl } from '../core/git.js';
import { exec } from '../utils/exec.js';
import { parseCommit } from '../core/parser.js';
import { formatChangelog } from '../formatters/markdown.js';
import { logger } from '../utils/logger.js';
import type { ChangelogVersion, ParsedCommit } from '../types/index.js';

export interface GenerateOptions {
  from?: string;
  to?: string;
  output?: string;
  dryRun?: boolean;
  cwd?: string;
}

const CHANGELOG_HEADER = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
`;

export async function generate(options: GenerateOptions = {}): Promise<void> {
  const { from, to, output = 'CHANGELOG.md', dryRun = false, cwd } = options;

  // Bail early on empty repos — resolveRange would throw on a missing HEAD.
  const headCheck = await exec('git', ['rev-parse', '--verify', 'HEAD'], {
    cwd,
    allowNonZero: true,
  });
  if (headCheck.exitCode !== 0) {
    logger.info('Repository has no commits yet — nothing to write.');
    return;
  }

  const range = await resolveRange(from, to, cwd);
  logger.debug(`Range: ${range}`);

  const rawCommits = await readGitLog(range, cwd);
  logger.debug(`Found ${rawCommits.length} commits`);

  if (rawCommits.length === 0) {
    logger.info('No commits found in range — nothing to write.');
    return;
  }

  const parsed = rawCommits.map(parseCommit);
  const version = buildVersion(parsed);
  const repoUrl = await getRepoUrl(cwd);
  logger.debug(`Repo URL: ${repoUrl || '(none detected)'}`);

  const block = formatChangelog(version, repoUrl, 'en');

  if (dryRun) {
    process.stdout.write(block + '\n');
    return;
  }

  const outputPath = resolve(cwd ?? process.cwd(), output);
  await writeChangelog(outputPath, block);
  logger.info(`Wrote ${output}`);
}

function buildVersion(commits: ParsedCommit[]): ChangelogVersion {
  const groups: Record<string, ParsedCommit[]> = {};
  for (const commit of commits) {
    if (!groups[commit.type]) groups[commit.type] = [];
    groups[commit.type]!.push(commit);
  }

  return {
    version: 'Unreleased',
    // Use the most-recent commit's date (git log is newest-first).
    date: commits[0]?.date ?? new Date().toISOString(),
    groups,
    stackAnnotations: [],
  };
}

async function writeChangelog(outputPath: string, block: string): Promise<void> {
  let existing: string | null = null;
  try {
    existing = await readFile(outputPath, 'utf8');
  } catch {
    // File does not exist — create from scratch.
  }

  const content =
    existing == null
      ? CHANGELOG_HEADER + '\n' + block + '\n'
      : insertBlock(existing, block);

  await writeFile(outputPath, content, 'utf8');
}

// Matches the [Unreleased] header line exactly (no version number after it).
const UNRELEASED_RE = /^## \[Unreleased\]\s*$/m;
// Matches the start of any versioned section header like ## [1.2.3] or ## [1.2.3] - date
const NEXT_VERSION_RE = /^## \[\d/m;

function insertBlock(existing: string, block: string): string {
  const unreleasedMatch = UNRELEASED_RE.exec(existing);

  if (!unreleasedMatch) {
    // No [Unreleased] section: prepend before the first ## section.
    const firstHeader = /^## /m.exec(existing);
    if (firstHeader) {
      return (
        existing.slice(0, firstHeader.index) + block + '\n\n' + existing.slice(firstHeader.index)
      );
    }
    return existing.trimEnd() + '\n\n' + block + '\n';
  }

  // Search for the next versioned section after [Unreleased].
  const afterUnreleased = unreleasedMatch.index + unreleasedMatch[0].length;
  const nextMatch = NEXT_VERSION_RE.exec(existing.slice(afterUnreleased));

  if (nextMatch) {
    const insertAt = afterUnreleased + nextMatch.index;
    return existing.slice(0, insertAt).trimEnd() + '\n\n' + block + '\n\n' + existing.slice(insertAt);
  }

  // No versioned section follows — append after all section content, before any
  // trailing reference-link lines (lines starting with "[").
  const trailingRefs = /\n(\[[^\]]+\]: .+\n*)+$/.exec(existing);
  if (trailingRefs) {
    return (
      existing.slice(0, trailingRefs.index).trimEnd() +
      '\n\n' +
      block +
      '\n\n' +
      existing.slice(trailingRefs.index).trimStart()
    );
  }

  return existing.trimEnd() + '\n\n' + block + '\n';
}
