import type { Detector, PackageJson, ParsedCommit, DetectContext, StackAnnotation } from '../types/index.js';
import { exec } from '../utils/exec.js';

type DepsMap = Record<string, string>;

interface DiffResult {
  added: string[];
  removed: string[];
  updated: string[];
}

function collectDeps(pkg: PackageJson): DepsMap {
  return {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };
}

function diffDeps(before: DepsMap, after: DepsMap): DiffResult {
  const added: string[] = [];
  const removed: string[] = [];
  const updated: string[] = [];

  for (const [name, version] of Object.entries(after)) {
    if (!(name in before)) {
      added.push(`${name}@${version}`);
    } else if (before[name] !== version) {
      updated.push(`${name} ${before[name]} → ${version}`);
    }
  }

  for (const name of Object.keys(before)) {
    if (!(name in after)) {
      removed.push(`${name}@${before[name]}`);
    }
  }

  return {
    added: added.sort(),
    removed: removed.sort(),
    updated: updated.sort(),
  };
}

async function readPkgAtRef(ref: string, cwd?: string): Promise<PackageJson | null> {
  const result = await exec('git', ['show', `${ref}:package.json`], {
    cwd,
    allowNonZero: true,
  });
  if (result.exitCode !== 0) return null;
  try {
    return JSON.parse(result.stdout) as PackageJson;
  } catch {
    return null;
  }
}

export const depsDetector: Detector = {
  name: 'deps',

  isActive(_pkg: PackageJson): boolean {
    return true;
  },

  async run(_commits: ParsedCommit[], ctx: DetectContext): Promise<StackAnnotation | null> {
    if (!ctx.from) return null;

    const [before, after] = await Promise.all([
      readPkgAtRef(ctx.from, ctx.cwd),
      readPkgAtRef(ctx.to || 'HEAD', ctx.cwd),
    ]);

    if (!before || !after) return null;

    const { added, removed, updated } = diffDeps(collectDeps(before), collectDeps(after));

    if (added.length === 0 && removed.length === 0 && updated.length === 0) return null;

    const items: string[] = [
      ...added.map((s) => `Added: ${s}`),
      ...removed.map((s) => `Removed: ${s}`),
      ...updated.map((s) => `Updated: ${s}`),
    ];

    return {
      detector: 'deps',
      label: 'Dependencies',
      items,
    };
  },
};

export { diffDeps, collectDeps };
