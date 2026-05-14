import type { Detector, PackageJson, ParsedCommit, DetectContext, StackAnnotation } from '../types/index.js';

const SCHEMA_PATH = 'prisma/schema.prisma';

function hasDep(pkg: PackageJson, name: string): boolean {
  return (
    pkg.dependencies?.[name] != null ||
    pkg.devDependencies?.[name] != null
  );
}

export const prismaDetector: Detector = {
  name: 'prisma',

  isActive(pkg: PackageJson): boolean {
    return hasDep(pkg, 'prisma') || hasDep(pkg, '@prisma/client');
  },

  async run(commits: ParsedCommit[], _ctx: DetectContext): Promise<StackAnnotation | null> {
    const schemaCommits: string[] = [];
    for (const commit of commits) {
      if (commit.filesChanged.includes(SCHEMA_PATH)) {
        schemaCommits.push(commit.subject);
      }
    }

    if (schemaCommits.length === 0) return null;

    return {
      detector: 'prisma',
      label: 'Prisma',
      items: schemaCommits,
    };
  },
};
