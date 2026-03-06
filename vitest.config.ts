import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Global test APIs (no import needed)
    globals: true,

    // Setup files
    setupFiles: ['./tests/setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov'],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.test.ts',
        'scripts/**',
      ],
    },

    // Timeout - Higher for CI environments to handle slower systems
    testTimeout: process.env.VITEST_TEST_TIMEOUT
      ? parseInt(process.env.VITEST_TEST_TIMEOUT)
      : process.env.CI
        ? 30000
        : 15000,

    retry: 0,

    // File-level parallelism for faster test execution
    fileParallelism: true,

    // Reporter
    reporters: process.env.CI ? ['default', 'json'] : ['default'],

    projects: [
      {
        extends: true,
        test: {
          include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
          pool: 'threads',
        },
      },
      {
        extends: true,
        test: {
          include: ['tests/e2e/**/*.test.ts'],
          pool: 'forks',
          maxWorkers: 1,
        },
      },
      {
        extends: true,
        test: {
          include: ['tests/golden/**/*.test.ts'],
          pool: 'threads',
        },
      },
      {
        test: {
          name: 'web',
          include: ['src/web/src/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
          globals: true,
          setupFiles: ['src/web/src/test-setup.ts'],
        },
        resolve: {
          alias: { '@': new URL('src/web/src', import.meta.url).pathname },
        },
      },
    ],
  },

  // Path resolution (matches tsconfig paths)
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './src/core'),
      '@types': path.resolve(__dirname, './src/types.ts'),
      '@extensions': path.resolve(__dirname, './src/extensions'),
      '@cli': path.resolve(__dirname, './src/cli'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@errors': path.resolve(__dirname, './src/errors'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@plugins': path.resolve(__dirname, './src/plugins'),
    },
  },
});
