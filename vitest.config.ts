import { mergeConfig } from 'vite';
import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default defineConfig((configEnv) => {
  return mergeConfig(
    viteConfig(configEnv),
    defineConfig({
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './setupTests.ts',
        watch: false,
        clearMocks: true,
        mockReset: true,
        restoreMocks: true,
      },
    }),
  );
});
