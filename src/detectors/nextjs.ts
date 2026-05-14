import type { Detector, PackageJson, ParsedCommit, DetectContext, StackAnnotation } from '../types/index.js';

const NEXTJS_PATTERNS = [/^app\//, /^pages\//, /^middleware\.ts$/];

function isNextjsFile(path: string): boolean {
  return NEXTJS_PATTERNS.some((re) => re.test(path));
}

function hasDep(pkg: PackageJson, name: string): boolean {
  return (
    pkg.dependencies?.[name] != null ||
    pkg.devDependencies?.[name] != null
  );
}

export const nextjsDetector: Detector = {
  name: 'nextjs',

  isActive(pkg: PackageJson): boolean {
    return hasDep(pkg, 'next');
  },

  async run(commits: ParsedCommit[], _ctx: DetectContext): Promise<StackAnnotation | null> {
    const touched = new Set<string>();
    for (const commit of commits) {
      for (const file of commit.filesChanged) {
        if (isNextjsFile(file)) touched.add(file);
      }
    }

    if (touched.size === 0) return null;

    return {
      detector: 'nextjs',
      label: 'Next.js',
      items: [...touched].sort(),
    };
  },
};
