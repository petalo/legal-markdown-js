# Scripts Reference

Quick reference for all available npm scripts and development commands.

## Table of Contents

- [Development Scripts](#development-scripts)
  - [Core Development](#core-development)
  - [Building](#building)
- [Testing Scripts](#testing-scripts)
  - [Running Tests](#running-tests)
  - [Test Categories](#test-categories)
  - [Test with Specific Patterns](#test-with-specific-patterns)
- [Code Quality Scripts](#code-quality-scripts)
  - [Linting](#linting)
  - [Formatting](#formatting)
  - [Type Checking](#type-checking)
  - [Comprehensive Validation](#comprehensive-validation)
- [Git and Commit Scripts](#git-and-commit-scripts)
  - [Conventional Commits](#conventional-commits)
  - [Manual Conventional Commits](#manual-conventional-commits)
- [Release and Deployment](#release-and-deployment)
  - [Release Commands](#release-commands)
  - [Version Bumping (Manual)](#version-bumping-manual)
- [CLI Usage Examples](#cli-usage-examples)
  - [Running the CLI](#running-the-cli)
  - [CLI Options](#cli-options)
- [Development Utilities](#development-utilities)
  - [Package Management](#package-management)
  - [Web Development](#web-development)
  - [Debugging](#debugging)
  - [Performance](#performance)
- [Troubleshooting Commands](#troubleshooting-commands)
  - [Fix Common Issues](#fix-common-issues)
  - [Check Configuration](#check-configuration)
- [Monitoring and Analysis](#monitoring-and-analysis)
  - [Coverage Reports](#coverage-reports)
  - [Code Analysis](#code-analysis)
- [Workflow Combinations](#workflow-combinations)
  - [Pre-commit Workflow](#pre-commit-workflow)
  - [Development Workflow](#development-workflow)
  - [CI/CD Simulation](#cicd-simulation)
  - [Release Preparation](#release-preparation)
- [Quick Aliases](#quick-aliases)
- [External Tools](#external-tools)
  - [Useful Global Tools](#useful-global-tools)

## Development Scripts

### Core Development

```bash
# Start development server with hot reload
npm run dev

# Build TypeScript in watch mode
npm run build:watch

# Clean all build artifacts
npm run clean
```

### Building

```bash
# Standard build
npm run build

# Clean build (removes dist/ first)
npm run clean && npm run build

# Pre-release build (with validation)
npm run prerelease
```

## Testing Scripts

### Running Tests

```bash
# Run all tests
npm test
npm run test

# Run with coverage report
npm run test:coverage

# Run in watch mode (for development)
npm run test:watch
```

### Test Categories

```bash
# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only end-to-end tests
npm run test:e2e
```

### Test with Specific Patterns

```bash
# Run tests matching pattern
npm test -- --testNamePattern="header"
npm test -- --testPathPattern="parser"

# Run tests for specific file
npm test -- src/core/processors/header-processor.test.ts

# Update snapshots
npm test -- --updateSnapshot

# Run with verbose output
npm test -- --verbose
```

## Code Quality Scripts

### Linting

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix

# Lint specific files
npx eslint src/core/**/*.ts --fix
```

### Formatting

```bash
# Check if files are formatted correctly
npm run format:check

# Auto-format all files
npm run format

# Format specific files
npx prettier --write src/core/index.ts
```

### Type Checking

```bash
# Run TypeScript type checking
npm run typecheck

# Type check in watch mode
npx tsc --noEmit --watch
```

### Comprehensive Validation

```bash
# Run all quality checks (typecheck + lint + test)
npm run validate
```

## Git and Commit Scripts

### Conventional Commits

```bash
# Interactive commit with conventional format
npm run commit

# Or use commitizen directly
npx cz
```

### Manual Conventional Commits

```bash
# Feature
git commit -m "feat: add new header processing feature"

# Bug fix
git commit -m "fix: resolve import path resolution issue"

# Documentation
git commit -m "docs: update README with new examples"

# Refactor
git commit -m "refactor: extract utility functions to @lib"

# Breaking change
git commit -m "feat!: change API signature for processLegalMarkdown"
```

## Release and Deployment

### Release Commands

```bash
# Test what next release would be (dry run)
npm run release:dry

# Manual release preparation
npm run prerelease

# Manual npm publish (usually done by CI)
npm publish
```

### Version Bumping (Manual)

```bash
# Patch version (0.1.0 → 0.1.1)
npm version patch

# Minor version (0.1.0 → 0.2.0)
npm version minor

# Major version (0.1.0 → 1.0.0)
npm version major
```

## CLI Usage Examples

### Running the CLI

```bash
# Using npm script
npm run cli -- examples/example.md output.md

# Using ts-node directly
npx ts-node src/cli/index.ts examples/example.md

# After building
node dist/cli/index.js examples/example.md
```

### CLI Options

```bash
# Debug mode
npm run cli -- --debug examples/example.md

# YAML only processing
npm run cli -- --yaml examples/yaml-only.md

# Export metadata
npm run cli -- --export-yaml examples/example.md

# Process with external metadata
npm run cli -- examples/simple-contract.md output.md --metadata examples/agreement-metadata.json
```

## Development Utilities

### Package Management

```bash
# Install new dependency
npm install package-name

# Install dev dependency
npm install --save-dev package-name

# Update all dependencies
npm update

# Check for outdated packages
npm outdated

# Security audit
npm audit
npm audit fix
```

### Web Development

```bash
# Build and serve web version
npm run web

# Serve existing build (smart port detection)
npm run web:serve

# Serve on specific port
npm run web:serve -- --port=3000

# Serve custom directory
npm run web:serve -- --dir=examples

# Build UMD bundle for web
npm run build:umd

# Build standalone web bundle
npm run build:web
```

**Features of `web:serve`:**

- **Smart Port Detection**: Automatically finds available ports starting from
  8080
- **Multiple Server Support**: Tries Python 3, Python 2, and Node.js fallback
- **Graceful Shutdown**: Handles Ctrl+C properly
- **Custom Options**: Supports `--port=` and `--dir=` arguments
- **Informative Output**: Shows which port is being used and why

### Debugging

```bash
# Run with Node debugging
node --inspect-brk dist/cli/index.js examples/example.md

# Debug tests
npm test -- --inspect-brk --runInBand

# Memory usage profiling
node --prof dist/cli/index.js examples/example.md
```

### Performance

```bash
# Bundle analysis
npx ts-node --transpile-only scripts/analyze-bundle.ts

# Check package size
npm run build && npx bundlesize

# Memory profiling
node --prof --prof-process dist/cli/index.js
```

## Troubleshooting Commands

### Fix Common Issues

```bash
# Clear npm cache
npm cache clean --force

# Reinstall node_modules
rm -rf node_modules package-lock.json
npm install

# Reset TypeScript cache
rm -rf dist/
npx tsc --build --clean

# Clear Jest cache
npm test -- --clearCache
```

### Check Configuration

```bash
# Verify ESLint config
npx eslint --print-config src/index.ts

# Check Prettier config
npx prettier --check src/index.ts

# Verify TypeScript config
npx tsc --showConfig

# Check Jest config
npx jest --showConfig
```

## Monitoring and Analysis

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Open coverage report in browser
open coverage/lcov-report/index.html

# Coverage for specific files
npm test -- --coverage --collectCoverageFrom="src/core/**/*.ts"
```

### Code Analysis

```bash
# TypeScript compiler stats
npx tsc --listFiles

# Dependency analysis
npx madge --circular src/

# Bundle size analysis
npm run build && npx bundlesize
```

## Workflow Combinations

### Pre-commit Workflow

```bash
# Full validation before committing
npm run validate && npm run commit
```

### Development Workflow

```bash
# Start fresh development session
npm run clean && npm install && npm run dev
```

### CI/CD Simulation

```bash
# Simulate CI pipeline locally
npm run clean && \
npm run typecheck && \
npm run lint && \
npm run format:check && \
npm run build && \
npm run test:coverage
```

### Release Preparation

```bash
# Complete release preparation
npm run clean && \
npm run validate && \
npm run build && \
npm run release:dry
```

## Quick Aliases

Add these to your shell profile (`.bashrc`, `.zshrc`) for even faster
development:

```bash
# Quick aliases
alias nrd="npm run dev"
alias nrt="npm run test"
alias nrb="npm run build"
alias nrl="npm run lint:fix"
alias nrf="npm run format"
alias nrv="npm run validate"
alias nrc="npm run commit"

# Legal-MD specific
alias lmd="npm run cli --"
alias lmd-debug="npm run cli -- --debug"
alias lmd-web="npm run web:serve"
```

## External Tools

### Useful Global Tools

```bash
# Install useful global tools
npm install -g typescript ts-node nodemon

# TypeScript compiler globally
tsc --watch

# Run without building
ts-node src/cli/index.ts

# Auto-restart on changes
nodemon --exec ts-node src/cli/index.ts
```

---

💡 **Tip**: Use `npm run` to see all available scripts defined in package.json!
