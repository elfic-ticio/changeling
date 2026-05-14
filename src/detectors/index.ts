import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

import type { Detector, PackageJson } from '../types/index.js';
import { nextjsDetector } from './nextjs.js';
import { prismaDetector } from './prisma.js';
import { viteDetector } from './vite.js';
import { depsDetector } from './deps.js';

const ALL_DETECTORS: Detector[] = [nextjsDetector, prismaDetector, viteDetector, depsDetector];

export async function detect(cwd?: string): Promise<Detector[]> {
  const pkgPath = resolve(cwd ?? process.cwd(), 'package.json');

  let pkg: PackageJson;
  try {
    const raw = await readFile(pkgPath, 'utf8');
    pkg = JSON.parse(raw) as PackageJson;
  } catch {
    return [];
  }

  return ALL_DETECTORS.filter((d) => d.isActive(pkg));
}
