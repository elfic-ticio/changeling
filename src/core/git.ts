import { exec } from '../utils/exec.js';
import { logger } from '../utils/logger.js';

export interface RawCommit {
  sha: string;
  shortSha: string;
  date: string;
  author: string;
  subject: string;
  body: string | null;
  filesChanged: string[];
}

// %x01 and %x02 are git's hex-byte notation; they produce 0x01/0x02 in output.
// 0x01 separates fields within a commit, 0x02 terminates each commit's metadata.
const GIT_LOG_FORMAT = '%H%x01%h%x01%aI%x01%an%x01%s%x01%b%x02';

// A metadata line starts with the full 40-char SHA immediately followed by 0x01.
const META_LINE_RE = /^[0-9a-f]{40}\x01/;

export async function readGitLog(range: string, cwd?: string): Promise<RawCommit[]> {
  const result = await exec(
    'git',
    ['log', range, `--pretty=format:${GIT_LOG_FORMAT}`, '--name-only'],
    { cwd, allowNonZero: true },
  );

  if (result.exitCode !== 0) {
    const stderr = result.stderr.toLowerCase();
    if (
      stderr.includes('does not have any commits') ||
      stderr.includes("bad default revision 'head'") ||
      stderr.includes('unknown revision') ||
      stderr.includes('bad revision')
    ) {
      logger.warn(`No commits found for range "${range}".`);
      return [];
    }
    throw new Error(`git log failed for range "${range}": ${result.stderr.trim()}`);
  }

  const raw = result.stdout;
  if (!raw.trim()) return [];

  return parseGitOutput(raw);
}

function parseGitOutput(raw: string): RawCommit[] {
  const commits: RawCommit[] = [];

  // Splitting on 0x02 gives: [meta1, files1+meta2, files2+meta3, ..., filesN]
  // Each segment from index 1 onward contains files from the previous commit
  // followed by the metadata line for the current commit.
  const parts = raw.split('\x02');

  for (const part of parts) {
    const lines = part.split('\n');

    // Locate the metadata line: 40-char hex SHA + 0x01
    const metaIdx = lines.findIndex((l) => META_LINE_RE.test(l));

    if (metaIdx === -1) {
      // No metadata in this segment — all lines are files for the previous commit.
      if (commits.length > 0) {
        for (const line of lines) {
          const f = line.trim();
          if (f) commits[commits.length - 1].filesChanged.push(f);
        }
      }
      continue;
    }

    // Lines before the metadata line belong to the previous commit as file paths.
    if (commits.length > 0) {
      for (const line of lines.slice(0, metaIdx)) {
        const f = line.trim();
        if (f) commits[commits.length - 1].filesChanged.push(f);
      }
    }

    // Parse fields from the metadata line.
    const fields = lines[metaIdx].split('\x01');
    const sha = fields[0] ?? '';
    const shortSha = fields[1] ?? '';
    const date = fields[2] ?? '';
    const author = fields[3] ?? '';
    const subject = fields[4] ?? '';

    // Body: the value of %b starts after the 5th field separator.
    // It may span multiple lines (all lines after metaIdx in this segment).
    const bodyStart = fields.slice(5).join('\x01');
    const bodyTail = lines.slice(metaIdx + 1).join('\n').trim();
    const fullBody = [bodyStart, bodyTail].filter(Boolean).join('\n').trim();

    commits.push({
      sha,
      shortSha,
      date,
      author,
      subject,
      body: fullBody || null,
      filesChanged: [],
    });
  }

  return commits;
}

export async function getRepoUrl(cwd?: string): Promise<string> {
  const result = await exec('git', ['config', '--get', 'remote.origin.url'], {
    cwd,
    allowNonZero: true,
  });
  if (result.exitCode !== 0 || !result.stdout.trim()) return '';
  return normalizeGitUrl(result.stdout.trim());
}

function normalizeGitUrl(url: string): string {
  // SSH: git@github.com:user/repo.git -> https://github.com/user/repo
  const sshMatch = /^git@([^:]+):(.+?)(?:\.git)?$/.exec(url);
  if (sshMatch) return `https://${sshMatch[1]}/${sshMatch[2]}`;
  // HTTPS: strip trailing .git
  return url.replace(/\.git$/, '');
}
