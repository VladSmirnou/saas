import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const serverEnv = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, serverEnv);

  return defineConfig({
    test: {
      globals: true,
      environment: 'node',
      watch: false,
      clearMocks: true,
      mockReset: true,
      restoreMocks: true,
      include: ['src/server/__tests__/*.test.ts'],
      coverage: {
        provider: 'v8',
        exclude: ['__mocks__/**'],
      },
    },
  });
});
