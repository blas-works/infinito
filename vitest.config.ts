import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/main/',
        'src/preload/',
        '**/*.d.ts',
        '**/index.ts',
        'out/',
        'dist/',
        'resources/',
        'electron.vite.config.ts',
        'drizzle.config.ts',
        'vitest.config.ts',
        'vitest.setup.ts',
        '**/__tests__/**',
        'src/renderer/src/services/**'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  },
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, './src/renderer/src')
    }
  }
})
