import { exec } from '../utils/exec.js';

export async function resolveRange(from?: string, to?: string, cwd?: string): Promise<string> {
  const resolvedTo = to ?? 'HEAD';

  if (from) {
    await validateRef(from, cwd);
    await validateRef(resolvedTo, cwd);
    return `${from}..${resolvedTo}`;
  }

  // Auto-detect: try the most recent tag first.
  const latestTag = await getLatestTag(cwd);
  if (latestTag) {
    await validateRef(resolvedTo, cwd);
    return `${latestTag}..${resolvedTo}`;
  }

  // No tags: return the bare ref so git-log includes the root commit.
  // Using firstCommit..HEAD would silently exclude the very first commit.
  await validateRef(resolvedTo, cwd);
  return resolvedTo;
}

async function getLatestTag(cwd?: string): Promise<string | null> {
  const result = await exec('git', ['describe', '--tags', '--abbrev=0'], {
    cwd,
    allowNonZero: true,
  });
  if (result.exitCode === 0 && result.stdout.trim()) {
    return result.stdout.trim();
  }
  return null;
}

async function validateRef(ref: string, cwd?: string): Promise<void> {
  const result = await exec('git', ['rev-parse', '--verify', ref], {
    cwd,
    allowNonZero: true,
  });
  if (result.exitCode !== 0) {
    throw new Error(
      `Git ref "${ref}" does not exist. Check that the tag, branch, or commit SHA is correct.`,
    );
  }
}
