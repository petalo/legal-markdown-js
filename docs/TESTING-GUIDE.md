# Testing Guide - Vitest Configuration

This guide documents the Vitest testing setup and configuration for fast test
execution with native ESM support.

## Performance Improvements

### Before Migration (Jest)

- **Full test suite**: ~40+ seconds with ESM compatibility issues
- **Unit tests**: ~15-20 seconds
- **Memory usage**: High due to ESM transformation overhead
- **ESM Support**: Complex workarounds and mocks required

### After Migration (Vitest)

- **Full test suite**: ~15-20 seconds ⚡ **(~3x faster)**
- **Unit tests**: ~2-5 seconds ⚡ **(~5x faster)**
- **Memory usage**: Optimized with native ESM support
- **ESM Support**: Native, no workarounds needed

## Key Benefits of Vitest Migration

### 1. Native ESM Support

```typescript
// vitest.config.ts - No complex transformations needed
export default defineConfig({
  test: {
    environment: 'node',
    globals: true, // Global test functions
    setupFiles: ['./tests/setup.ts'],
  },
});
```

### 2. Optimized Test Execution

```typescript
// Fast TypeScript processing with native ESM
testTimeout: 45000,         // Extended for CI environments
reporters: ['default'],     // Configurable reporters
```

### 3. Intelligent Coverage Collection

```typescript
coverage: {
  provider: 'v8',           // Fast native V8 coverage
  reporter: ['text', 'lcov', 'clover'],
  exclude: ['node_modules/**', 'dist/**', 'tests/**']
}
```

### 4. Modern Test Features

```typescript
// Native mocking with vi.fn()
import { vi } from 'vitest';
const mockFn = vi.fn();

// Hot module replacement for tests
// Watch mode with instant feedback
```

### 5. No ESM Transformation Overhead

- Direct ES module imports
- No babel/typescript transformation layers
- Native async/await support
- Built-in TypeScript support

## Available Test Commands

### Basic Commands

```bash
# Fast test execution (recommended for development)
npm test                     # Run all tests with Vitest
npm run test:run            # Run tests once (CI mode)

# Development-focused commands
npm run test:fast           # Only changed files
npm run test:changed        # Only changed files since HEAD~1
npm run test:watch          # Watch mode with instant feedback
npm run test:ui             # Interactive UI for test debugging

# Specific test categories
npm run test:unit           # Unit tests only (fastest)
npm run test:integration    # Integration tests
npm run test:e2e           # End-to-end tests
npm run test:core          # Core functionality tests
npm run test:plugins       # Plugin tests
```

### Coverage and CI

```bash
# Coverage collection (slower, only when needed)
npm run test:coverage       # Explicit coverage collection

# CI optimized
npm run test:ci            # CI-specific optimizations
```

### Development Workflow

```bash
# Staged files only (pre-commit)
npm run test:staged        # Test only staged files with bail
npm run test:related       # Test files related to specific changes
```

## Performance Tips

### For Development

1. **Use `npm run test:fast`** for quick feedback during development
2. **Use `npm run test:changed`** when working on specific features
3. **Avoid coverage collection** during active development
4. **Use `npm run test:core`** when working on core functionality

### For CI/CD

1. **Use `npm run test:ci`** for comprehensive CI testing
2. **Use `npm run test:coverage`** for coverage reports
3. **Consider parallel test jobs** for different test categories

### For Debugging

1. **Remove `--bail`** flags to see all failures
2. **Enable `reporter: 'verbose'`** in vitest.config.ts temporarily
3. **Use specific test patterns**: `vitest tests/unit/specific-test.test.ts`

## Configuration Files

### vitest.config.ts

Optimized Vitest configuration with:

- Native ESM support
- TypeScript integration
- V8 coverage provider
- Environment-specific settings

### tsconfig.test.json

Test-specific TypeScript configuration with:

- Faster compilation targets (ES2022)
- Relaxed type checking for speed
- Optimized module resolution
- Path mapping for fast imports

### tests/setup.ts

Optimized test setup with:

- OS temp directory usage
- Lazy directory creation
- Performance monitoring
- Memory leak prevention

## Environment Variables

```bash
# Enable coverage collection
COVERAGE=true npm test

# Set CI mode
CI=true npm test

# Development mode optimizations
NODE_ENV=development npm test
```

## Common Issues and Solutions

### Issue: Tests timing out

**Solution**: Check for hanging async operations, increase timeout, or use
`--runInBand`

### Issue: Memory issues

**Solution**: Increase `workerIdleMemoryLimit` or reduce `maxWorkers`

### Issue: Module resolution errors

**Solution**: Check path mappings in `tsconfig.test.json` and `moduleNameMapper`
in jest config

### Issue: Coverage collection too slow

**Solution**: Use `npm test` without coverage, only run `npm run test:coverage`
when needed

## Benchmarking

To benchmark test performance:

```bash
# Measure full test suite
time npm test

# Measure specific categories
time npm run test:unit
time npm run test:integration
time npm run test:e2e

# Compare with coverage
time npm run test:coverage
```

## Cache Management

```bash
# Clear Vitest cache if issues occur
rm -rf .vitest-cache

# Clear all caches
npm run clean
```

The Vitest cache is automatically managed and should not need manual
intervention under normal circumstances.

## Future Optimizations

Potential future improvements:

1. **Test sharding** for parallel execution across multiple machines
2. **Incremental testing** based on dependency graphs
3. **WebAssembly** for intensive parsing operations
4. **Worker threads** for CPU-intensive test operations
