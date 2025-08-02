# Release Process

This document describes the complete release process for Legal Markdown JS,
including versioning, changelog generation, and deployment procedures.

## Table of Contents

- [Overview](#overview)
- [Conventional Commits](#conventional-commits)
- [Semantic Versioning](#semantic-versioning)
- [Automatic Versioning](#automatic-versioning)
- [Release Workflow](#release-workflow)
- [Branch Strategy](#branch-strategy)
- [Release Commands](#release-commands)
- [Quality Gates](#quality-gates)
- [Manual Release Override](#manual-release-override)
- [Configuration](#configuration)
- [GitHub Repository Setup](#github-repository-setup)
- [Troubleshooting](#troubleshooting)

## Overview

Legal Markdown JS uses **Conventional Commits** and **semantic-release** to
automate version generation and changelog creation. This ensures consistent,
predictable releases with minimal manual intervention.

### Key Features

- **Automated versioning** based on commit types
- **Changelog generation** from commit messages
- **NPM package publishing** with CI/CD integration
- **GitHub releases** with detailed release notes
- **Quality gates** to ensure release stability

## Conventional Commits

### Valid Commit Types

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code formatting (whitespace, semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or modifying tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Maintenance tasks
- `revert`: Reverting previous commits

### Message Structure

```msg
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

### Examples

```bash
feat: add new header numbering system
fix: resolve import path resolution issue
docs: update API documentation
feat(cli)!: change default output format to JSON

# Breaking change
feat!: remove deprecated YAML export API

BREAKING CHANGE: The old YAML export method has been removed.
Use the new exportMetadata() function instead.
```

## Semantic Versioning

The project uses [semantic-versioning](https://semver.org/) with format
`MAJOR.MINOR.PATCH`:

| Commit Type                    | Version Increment     | Example          | Triggers When            |
| ------------------------------ | --------------------- | ---------------- | ------------------------ |
| `fix:`                         | PATCH (1.0.0 → 1.0.1) | Bug fixes        | Any fix commit           |
| `feat:`                        | MINOR (1.0.0 → 1.1.0) | New features     | Any feat commit          |
| `feat!:` or `BREAKING CHANGE:` | MAJOR (1.0.0 → 2.0.0) | Breaking changes | Breaking change detected |

## Automatic Versioning

When code is pushed to `main`, semantic-release follows these steps:

### 1. Analyze Commits

```bash
# semantic-release scans all commits since last release
# Example commits since v1.2.0:
git log v1.2.0..HEAD --oneline
# feat: add new export format
# fix: resolve import path issue
# docs: update README
# fix: handle edge case in parser
```

### 2. Determine Version Bump

```bash
# semantic-release analyzes commit types:
# - feat: triggers MINOR bump
# - fix: triggers PATCH bump
# - No breaking changes: keeps MAJOR same
# Result: 1.2.0 → 1.3.0 (MINOR bump due to feat)
```

### 3. Generate Release Notes

```markdown
# Release notes are auto-generated from commits:

## [1.3.0](v1.2.0...v1.3.0) (2024-01-15)

### Features

- add new export format ([abc123](commit-link))

### Bug Fixes

- resolve import path issue ([def456](commit-link))
- handle edge case in parser ([ghi789](commit-link))
```

### 4. Create Release Artifacts

```bash
# semantic-release automatically:
1. Updates package.json version: "1.3.0"
2. Updates CHANGELOG.md with new section
3. Creates git tag: v1.3.0
4. Publishes to NPM registry
5. Creates GitHub release with notes
6. Commits changes back to repo
```

## Release Workflow

### Step-by-step Process

#### 1. Create Feature Branch

```bash
# From main branch
git checkout main
git pull origin main
git checkout -b feature/new-header-system

# Make your changes with conventional commits
git commit -m "feat: add new header numbering system"
git commit -m "test: add tests for header processor"
git commit -m "docs: update header documentation"
```

#### 2. Push and Create Pull Request

```bash
# Push feature branch
git push origin feature/new-header-system

# Create PR via GitHub UI or CLI
gh pr create --title "feat: add new header numbering system" --body "Description of changes"
```

#### 3. Code Review and Merge

- Reviewers check the code
- CI/CD runs automatically (tests, linting, build)
- Once approved, merge to `main`

#### 4. Automatic Release

When code is merged to `main`, GitHub Actions automatically:

- Analyzes conventional commits since last release
- Determines new version number (patch/minor/major)
- Generates release notes from commit messages
- Updates CHANGELOG.md
- Creates Git tag
- Publishes to NPM
- Creates GitHub release

### Merge Strategies

#### Squash Merge (Recommended)

```bash
# This is done via GitHub UI
# All feature commits become one commit on main
# Final commit message should follow conventional format
```

#### Regular Merge

```bash
# Preserves individual commits
# Each commit should follow conventional format
# Release notes include all commits
```

### Hotfix Workflow

```bash
# For urgent production fixes
git checkout main
git checkout -b hotfix/critical-bug-fix
git commit -m "fix: resolve critical parsing issue"
git push origin hotfix/critical-bug-fix

# Create PR, review, and merge immediately
# This triggers automatic patch release
```

## Branch Strategy

- `main`: Production-ready code, protected branch
- `develop`: Integration branch (optional)
- `feature/*`: Feature development branches
- `hotfix/*`: Emergency fixes

## Release Commands

### Testing Releases

```bash
# Test what next release would be (dry run)
npm run release:dry

# Manual release preparation
npm run prerelease

# Validate commit message
echo "feat: new feature" | npx commitlint
```

### Manual Commands

```bash
# Make commit with interactive help
npm run commit

# Manual version bumping (if needed)
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm version major   # 0.1.0 → 1.0.0
```

## Quality Gates

All PRs must pass:

- ✅ TypeScript compilation
- ✅ ESLint checks
- ✅ Prettier formatting
- ✅ All tests passing
- ✅ Build successful
- ✅ No high/critical security vulnerabilities

## Manual Release Override

You can force specific version bumps:

```bash
# Force MINOR release (even with only fixes)
git commit -m "fix: critical security issue

Release-As: minor"

# Force MAJOR release
git commit -m "feat: new feature

Release-As: major"
```

## Configuration

### Commitlint Configuration

`.commitlintrc.json`:

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "subject-max-length": [2, "always", 100],
    "header-max-length": [2, "always", 100],
    "body-max-line-length": [2, "always", 200]
  }
}
```

### Semantic Release Configuration

`.releaserc.json`:

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/github",
    "@semantic-release/git"
  ]
}
```

## GitHub Repository Setup

### Branch Protection Rules

Configure in **Settings > Branches**:

1. **Protect `main` branch**:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
     - ✅ `Test (Node 16)`
     - ✅ `Test (Node 18)`
     - ✅ `Test (Node 20)`
     - ✅ `Security Audit`
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators
   - ✅ Allow squash merging (recommended)

### Secrets Configuration

Configure in **Settings > Secrets and Variables > Actions**:

1. **Required secrets**:
   - `NPM_TOKEN`: NPM token for publishing packages
   - `GITHUB_TOKEN`: Created automatically by GitHub

### GitHub Actions Triggers

Our workflows trigger on:

- **CI Pipeline** (`.github/workflows/ci.yml`):
  - Push to `main` or `develop`
  - Pull requests to `main` or `develop`
- **Release Pipeline** (`.github/workflows/release.yml`):
  - Push to `main` branch only
  - Skipped if commit message contains `[skip ci]`

## Troubleshooting

### Common Issues

#### No Release Generated

**Problem**: Code merged to main but no release was created.

**Solutions**:

- Check if commits follow conventional format
- Verify only `docs`, `style`, `refactor`, `test`, `chore` commits (these don't
  trigger releases)
- Check GitHub Actions logs for errors

#### Version Calculation Wrong

**Problem**: Expected different version bump.

**Solutions**:

- Review commit messages for breaking changes
- Check for `!` in commit type (indicates breaking change)
- Verify `BREAKING CHANGE:` footer format

#### Release Failed

**Problem**: Release process started but failed.

**Solutions**:

- Check NPM_TOKEN is valid
- Verify all quality gates passed
- Review GitHub Actions logs

### Debug Commands

```bash
# Test release locally
npm run release:dry

# Check what would be released
npx semantic-release --dry-run

# Validate commits
npx commitlint --from HEAD~1 --to HEAD
```

### Emergency Procedures

#### Rollback Release

```bash
# Revert the release commit
git revert HEAD

# Delete the git tag
git tag -d v1.2.3
git push origin :refs/tags/v1.2.3

# Unpublish from NPM (within 24 hours)
npm unpublish legal-markdown-js@1.2.3
```

#### Skip Release

```bash
# Add [skip ci] to commit message
git commit -m "docs: update README [skip ci]"
```

## Versioning Examples

### Example 1: Multiple Changes

```bash
# Commits since last release (v2.1.0):
git commit -m "feat: add YAML validation"
git commit -m "feat: improve error messages"
git commit -m "fix: memory leak in parser"
git commit -m "docs: update examples"

# Result: v2.1.0 → v2.2.0 (MINOR)
# Reason: feat commits present, no breaking changes
```

### Example 2: Breaking Change

```bash
# Commits since last release (v2.2.0):
git commit -m "feat!: change default export format to JSON

BREAKING CHANGE: Default export format changed from YAML to JSON.
Use --format=yaml flag to maintain old behavior."

# Result: v2.2.0 → v3.0.0 (MAJOR)
# Reason: Breaking change detected
```

### Example 3: Only Fixes

```bash
# Commits since last release (v3.0.0):
git commit -m "fix: handle null values in metadata"
git commit -m "fix: improve error handling"
git commit -m "chore: update dependencies"

# Result: v3.0.0 → v3.0.1 (PATCH)
# Reason: Only fixes, chore doesn't trigger release
```

## Changelog Generation

The changelog is automatically generated based on commits:

- **Features**: Listed under "### Added"
- **Fixes**: Listed under "### Fixed"
- **Breaking Changes**: Listed under "### BREAKING CHANGES"
- **Performance**: Listed under "### Performance"

## Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Release](https://semantic-release.gitbook.io/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
