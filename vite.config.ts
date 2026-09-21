import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const viteConfig = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    base: env.VITE_PROJECT_BASE,
    define: {
      'process.env': {},
      'process.config': {},
      'process.versions': {},
    },
  };
});

export default viteConfig;
