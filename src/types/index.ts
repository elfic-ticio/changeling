export type CommitType =
  | 'feat'
  | 'fix'
  | 'perf'
  | 'refactor'
  | 'docs'
  | 'style'
  | 'test'
  | 'build'
  | 'ci'
  | 'chore'
  | 'revert'
  | 'other';

export interface ParsedCommit {
  sha: string;
  shortSha: string;
  type: CommitType;
  scope: string | null;
  subject: string;
  body: string | null;
  breaking: boolean;
  prNumber: number | null;
  filesChanged: string[];
  date: string; // ISO 8601
  author: string;
}

export interface StackAnnotation {
  detector: 'nextjs' | 'prisma' | 'vite' | 'deps';
  label: string;
  items: string[];
}

export interface ChangelogVersion {
  version: string;
  date: string | null;
  groups: Record<string, ParsedCommit[]>;
  stackAnnotations: StackAnnotation[];
}

export interface ChangelingConfig {
  lang: 'en' | 'es';
  groups: Record<CommitType, string>;
  skipTypes: CommitType[];
  stack: {
    detectNextJs: boolean;
    detectPrisma: boolean;
    detectVite: boolean;
    detectDeps: boolean;
  };
  output: string;
}
