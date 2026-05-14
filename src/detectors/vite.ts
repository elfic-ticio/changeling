import type { Detector, PackageJson, ParsedCommit, DetectContext, StackAnnotation } from '../types/index.js';

const VITE_CONFIG_RE = /^vite\.config\./;

function hasDep(pkg: PackageJson, name: string): boolean {
  return (
    pkg.dependencies?.[name] != null ||
    pkg.devDependencies?.[name] != null
  );
}

export const viteDetector: Detector = {
  name: 'vite',

  isActive(pkg: PackageJson): boolean {
    return hasDep(pkg, 'vite');
  },

  async run(commits: ParsedCommit[], _ctx: DetectContext): Promise<StackAnnotation | null> {
    const touched = new Set<string>();
    for (const commit of commits) {
      for (const file of commit.filesChanged) {
        if (VITE_CONFIG_RE.test(file)) touched.add(file);
      }
    }

    if (touched.size === 0) return null;

    return {
      detector: 'vite',
      label: 'Vite',
      items: [...touched].sort(),
    };
  },
};
