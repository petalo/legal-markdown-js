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
    
    // Timeout
    testTimeout: 45000,
    
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