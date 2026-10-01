import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const viteConfig = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    base: env.VITE_PROJECT_BASE,
    server: {
      host: '127.0.0.1',
    },
  };
});

export default viteConfig;
