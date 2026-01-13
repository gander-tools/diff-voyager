import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'tests/e2e/**'],
      include: ['tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      setupFiles: ['./tests/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'text-summary', 'json', 'json-summary', 'html'],
        include: ['src/**/*.{ts,vue}'],
        exclude: ['src/**/*.d.ts', 'src/main.ts'],
        reportsDirectory: './coverage',
      },
    },
  }),
);
