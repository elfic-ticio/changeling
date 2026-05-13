export const en = {
  groups: {
    feat: 'Added',
    fix: 'Fixed',
    refactor: 'Changed',
    perf: 'Performance',
    docs: 'Documentation',
    revert: 'Reverted',
    other: 'Other',
  },
} as const;

export type LangPack = typeof en;
