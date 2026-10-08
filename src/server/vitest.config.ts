import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import repoTestConfig from './test-utils/repo-tests-config.json' with { type: 'json' };

export default defineConfig(({ mode }) => {
  const serverEnv = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, serverEnv);

  const currentRepo = serverEnv.REPOSITORY as 'msw' | 'postgres';

  const config = repoTestConfig[currentRepo];

  if (!config) {
    throw new Error('Failed to a find repository config');
  }

  return defineConfig({
    test: {
      globalSetup: config.setupFilePath ?? undefined,
      globals: true,
      environment: 'node',
      watch: false,
      clearMocks: true,
      mockReset: true,
      restoreMocks: true,
      include: [
        'src/server/__tests__/*.test.ts',
        `src/server/__repo-tests__/${currentRepo}.test.ts`,
      ],
      coverage: {
        provider: 'v8',
        exclude: ['__mocks__/**'],
      },
    },
  });
});
