# Development Guide

This document describes all the tools and processes configured to improve the
development experience in Legal Markdown JS.

## Table of Contents

- [Development Guide](#development-guide)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Quick Setup](#quick-setup)
  - [Development Workflow](#development-workflow)
    - [Daily Development Commands](#daily-development-commands)
    - [File Structure](#file-structure)
  - [Code Quality Tools](#code-quality-tools)
    - [TypeScript Configuration](#typescript-configuration)
    - [ESLint Setup](#eslint-setup)
    - [Prettier Formatting](#prettier-formatting)
    - [EditorConfig](#editorconfig)
  - [Testing Strategy](#testing-strategy)
    - [Test Organization](#test-organization)
    - [Testing Commands](#testing-commands)
    - [Test Configuration](#test-configuration)
  - [Git Workflow](#git-workflow)
    - [Conventional Commits](#conventional-commits)
    - [Commitizen Integration](#commitizen-integration)
    - [Pre-commit Hooks (Husky)](#pre-commit-hooks-husky)
    - [Branch Strategy](#branch-strategy)
  - [CI/CD Pipeline](#cicd-pipeline)
    - [GitHub Actions Workflows](#github-actions-workflows)
      - [CI Workflow (`.github/workflows/ci.yml`)](#ci-workflow-githubworkflowsciyml)
      - [Release Workflow (`.github/workflows/release.yml`)](#release-workflow-githubworkflowsreleaseyml)
    - [Quality Gates](#quality-gates)
  - [Release Process](#release-process)
    - [Automated Releases](#automated-releases)
    - [Manual Release Testing](#manual-release-testing)
  - [IDE Setup](#ide-setup)
    - [VS Code (Recommended)](#vs-code-recommended)
      - [1. Automatic Setup](#1-automatic-setup)
      - [2. Recommended Extensions](#2-recommended-extensions)
      - [3. IDE Features](#3-ide-features)
    - [Other IDEs](#other-ides)
  - [Path Aliases](#path-aliases)
  - [Monitoring and Analytics](#monitoring-and-analytics)
    - [1. Dependency Management](#1-dependency-management)
    - [2. Code Coverage](#2-code-coverage)
    - [3. Security Monitoring](#3-security-monitoring)
  - [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
      - [1. Pre-commit Hook Failures](#1-pre-commit-hook-failures)
      - [2. Test Failures](#2-test-failures)
      - [3. Build Issues](#3-build-issues)
      - [4. Import Resolution Issues](#4-import-resolution-issues)
    - [Getting Help](#getting-help)
  - [Best Practices](#best-practices)
    - [1. Development](#1-development)
    - [2. Code Style](#2-code-style)
    - [3. Testing](#3-testing)
    - [4. Git](#4-git)
  - [Additional Resources](#additional-resources)
  - [Keeping This Guide Updated](#keeping-this-guide-updated)

## Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm >= 7.0.0
- Git

### Quick Setup

```bash
# Clone and setup
git clone <repository-url>
cd legal-md-wizard
npm install

# Verify setup
npm run validate
```

## Development Workflow

### Daily Development Commands

```bash
# Start development with hot reload
npm run dev

# Run in watch mode during development
npm run build:watch    # TypeScript compilation
npm run test:watch     # Tests with file watching

# Quick validation before committing
npm run validate       # Runs typecheck + lint + test
```

### File Structure

```text
src/
├── cli/           # CLI interface and service layer
├── core/          # Core LegalMarkdown functionality
├── extensions/    # Additional features
├── lib/           # Shared utilities
├── constants/     # Global constants
├── errors/        # Custom error classes
└── types.ts       # Type definitions

examples/          # Example files and templates
docs/             # Project documentation
tests/            # Test files organized by type
```

## Code Quality Tools

### TypeScript Configuration

- **Strict mode** enabled for maximum type safety
- **Path aliases** configured for clean imports:

  ```typescript
  import { LegalMarkdownError } from '@errors';
  import { processHeaders } from '@core/processors/header-processor';
  ```

### ESLint Setup

**Configuration**: `.eslintrc.js`

```bash
# Lint all files
npm run lint

# Auto-fix issues
npm run lint:fix
```

**Rules configured**:

- TypeScript-specific rules
- No unused variables (with underscore exception)
- Explicit function return types (warning)
- Max line length: 100 characters
- Single quotes, semicolons required

### Prettier Formatting

**Configuration**: `.prettierrc`

```bash
# Check formatting
npm run format:check

# Auto-format all files
npm run format
```

**Settings**:

- 100 character line width
- Single quotes
- Semicolons required
- 2-space indentation
- Different rules for different file types

### EditorConfig

**File**: `.editorconfig`

- Consistent formatting across all editors
- UTF-8 encoding
- LF line endings
- Trim trailing whitespace

## Testing Strategy

### Test Organization

```text
tests/
├── unit/          # Unit tests for individual functions
├── integration/   # Integration tests for modules
├── e2e/          # End-to-end CLI tests
└── setup.ts      # Test configuration
```

### Testing Commands

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Test Configuration

- **Framework**: Jest with ts-jest
- **Coverage**: LCOV reports in `coverage/`
- **Path aliases** configured for imports
- **Timeout**: 10 seconds for long-running tests

## Git Workflow

### Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/) for
consistent commit messages.

**Format**: `type(scope): description`

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting
- `refactor`: Code refactoring
- `test`: Test additions/modifications
- `chore`: Maintenance tasks

### Commitizen Integration

```bash
# Interactive commit creation
npm run commit
```

This launches an interactive prompt that helps you create properly formatted
commits.

### Pre-commit Hooks (Husky)

**Automatically runs on every commit**:

- ESLint with auto-fix
- Prettier formatting
- Only on staged files (fast!)

**Automatically runs on commit message**:

- Validates conventional commit format

### Branch Strategy

```bash
# Feature development
git checkout -b feat/new-feature
git checkout -b fix/bug-description
git checkout -b docs/update-readme

# Hotfixes
git checkout -b hotfix/critical-fix
```

## CI/CD Pipeline

### GitHub Actions Workflows

#### CI Workflow (`.github/workflows/ci.yml`)

**Triggers**: Push to `main`/`develop`, Pull Requests

**Jobs**:

- **Multi-Node Testing**: Tests on Node 16, 18, 20
- **Quality Gates**: TypeScript, ESLint, Prettier, Build
- **Test Coverage**: Jest with coverage upload to Codecov
- **Security Audit**: npm audit + audit-ci

#### Release Workflow (`.github/workflows/release.yml`)

**Triggers**: Push to `main` branch

**Process**:

- Automated versioning with semantic-release
- Changelog generation
- NPM package publishing
- GitHub release creation

### Quality Gates

All PRs must pass:

- ✅ TypeScript compilation
- ✅ ESLint checks
- ✅ Prettier formatting
- ✅ All tests passing
- ✅ Build successful
- ✅ No high/critical security vulnerabilities

## Release Process

### Automated Releases

Releases are **fully automated** using semantic-release:

1. **Commit** with conventional format
2. **Push** to main branch
3. **CI** validates everything
4. **Semantic-release** analyzes commits:
   - `fix:` → Patch version (0.1.1)
   - `feat:` → Minor version (0.2.0)
   - `BREAKING CHANGE:` → Major version (1.0.0)
5. **Changelog** generated automatically
6. **NPM** package published
7. **GitHub** release created

### Manual Release Testing

```bash
# Test what the next release would be
npm run release:dry

# Pre-release validation
npm run prerelease
```

## IDE Setup

### VS Code (Recommended)

#### 1. Automatic Setup

The project includes VS Code configuration:

- **Settings**: `.vscode/settings.json`
- **Extensions**: `.vscode/extensions.json`

#### 2. Recommended Extensions

**Automatically suggested when opening the project**:

- Prettier - Code formatter
- ESLint - Linting
- TypeScript - Language support
- Jest - Test runner
- YAML - YAML file support
- Code Spell Checker - Spelling

#### 3. IDE Features

- **Format on Save**: Prettier runs automatically
- **Auto Fix**: ESLint fixes on save
- **Import Management**: Auto-import and organize
- **Type Checking**: Real-time TypeScript errors
- **Test Integration**: Run tests from editor

### Other IDEs

For other editors, ensure:

- TypeScript language server enabled
- ESLint and Prettier plugins installed
- EditorConfig support enabled

## Path Aliases

Configured in `tsconfig.json` and Jest:

```typescript
// Instead of relative imports
import { LegalMarkdownError } from '../../errors';

// Use clean aliases
import { LegalMarkdownError } from '@errors';
import { processHeaders } from '@core/processors/header-processor';
import { validateDocument } from '@extensions/validators';
```

**Available aliases**:

- `@core/*` → `src/core/*`
- `@types` → `src/types.ts`
- `@extensions/*` → `src/extensions/*`
- `@cli/*` → `src/cli/*`
- `@lib` → `src/lib/index.ts`
- `@constants` → `src/constants/index.ts`
- `@errors` → `src/errors/index.ts`

## Monitoring and Analytics

### 1. Dependency Management

**Dependabot** (`.github/dependabot.yml`):

- Weekly dependency updates
- Security vulnerability patches
- GitHub Actions updates
- Automatic PR creation

### 2. Code Coverage

- **Target**: Maintain > 80% coverage
- **Reports**: Available in `coverage/` after running tests
- **CI Integration**: Coverage uploaded to Codecov

### 3. Security Monitoring

- **npm audit**: Runs in CI
- **audit-ci**: Fails CI on high/critical vulnerabilities
- **Dependabot**: Security updates

## Troubleshooting

### Common Issues

#### 1. Pre-commit Hook Failures

```bash
# If hooks fail, check:
npm run lint:fix  # Fix linting issues
npm run format    # Fix formatting issues
npm run typecheck # Check TypeScript errors
```

#### 2. Test Failures

```bash
# Run specific tests
npm run test:unit -- --verbose
npm run test:integration -- --verbose

# Update snapshots if needed
npm test -- --updateSnapshot
```

#### 3. Build Issues

```bash
# Clean build
npm run clean
npm run build

# Check TypeScript errors
npm run typecheck
```

#### 4. Import Resolution Issues

- Verify path aliases in `tsconfig.json`
- Check Jest moduleNameMapping in `jest.config.js`
- Restart TypeScript language server in IDE

### Getting Help

1. **Check this documentation** first
2. **Run diagnostics**: `npm run validate`
3. **Check CI logs** for detailed error information
4. **Review test output** for specific failures

## Best Practices

### 1. Development

- Use `npm run dev` for development with hot reload
- Run `npm run validate` before committing
- Write tests for new features
- Use descriptive commit messages

### 2. Code Style

- Follow TypeScript strict mode
- Use path aliases for imports
- Write self-documenting code
- Add JSDoc for public APIs

### 3. Testing

- Write unit tests for utilities
- Write integration tests for processors
- Write e2e tests for CLI functionality
- Maintain good test coverage

### 4. Git

- Use conventional commit format
- Keep commits atomic and focused
- Use descriptive branch names
- Rebase feature branches before merging

## Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)

---

## Keeping This Guide Updated

This document should be updated when:

- New tools are added to the development stack
- Workflow processes change
- New scripts are added to package.json
- CI/CD pipeline is modified

Last updated: $(date)
