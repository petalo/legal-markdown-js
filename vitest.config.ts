import { defineConfig } from 'vitest/config';
import path from 'path';
import os from 'os';

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
      reporter: ['text', 'lcov', 'clover'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.test.ts',
        'scripts/**',
      ],
    },
    
    // Test patterns
    include: ['tests/**/*.test.ts'],
    
    // Timeout - Reduced for faster test execution
    testTimeout: 15000,
    
    // Parallelization - Use threads for better performance, single worker for E2E
    pool: process.env.E2E_TESTS ? 'forks' : 'threads',
    poolOptions: {
      threads: {
        maxThreads: Math.min(4, os.cpus().length),
        minThreads: 2
      },
      forks: {
        maxForks: process.env.E2E_TESTS ? 1 : undefined
      }
    },
    
    // Reporter
    reporters: process.env.CI ? ['default', 'json'] : ['default'],
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