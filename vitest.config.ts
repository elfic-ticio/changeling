import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // forks pool required: integration tests spawn real git processes and
    // conflict with each other in the default shared-thread pool.
    pool: 'forks',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/types/**', 'src/index.ts'],
    },
    passWithNoTests: true,
  },
});
