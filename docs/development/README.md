# Development Documentation

Comprehensive development documentation for Legal Markdown JS contributors,
maintainers, and developers.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Guides](#development-guides)
- [Testing](#testing)
- [Release Management](#release-management)
- [Development Workflow](#development-workflow)
- [Quick Reference](#quick-reference)

## Getting Started

### New Contributors

1. **Start Here**: [Contributing Guide](contributing.md) - Code of conduct,
   contribution process, and community guidelines
2. **Environment Setup**: [Development Guide](development-guide.md) - Complete
   development environment setup
3. **Code Standards**: [Development Guidelines](development-guidelines.md) -
   Coding standards, architecture patterns, and best practices

### Development Resources

| Document                                            | Purpose                                       | Audience         |
| --------------------------------------------------- | --------------------------------------------- | ---------------- |
| [Contributing Guide](contributing.md)               | Community guidelines and contribution process | All contributors |
| [Development Guide](development-guide.md)           | Environment setup and development workflow    | New developers   |
| [Development Guidelines](development-guidelines.md) | Code standards and architectural decisions    | All developers   |

## Development Guides

### Core Development

- **[Development Guide](development-guide.md)** - Complete development
  environment setup
  - Prerequisites and dependencies
  - Repository setup and configuration
  - IDE configuration and recommended extensions
  - Development server and hot reloading
  - Debugging setup and techniques

- **[Development Guidelines](development-guidelines.md)** - Code standards and
  best practices
  - TypeScript coding standards
  - Architecture patterns and decisions
  - Code review guidelines
  - Performance considerations
  - Security best practices

### Community and Contribution

- **[Contributing Guide](contributing.md)** - How to contribute to the project
  - Code of conduct
  - Issue reporting guidelines
  - Pull request process
  - Community communication channels
  - Recognition and attribution

## Testing

### Testing Documentation

- **[Testing Guide](testing-guide.md)** - Comprehensive testing documentation
  - Testing framework setup (Vitest)
  - Unit testing strategies
  - Integration testing patterns
  - End-to-end testing with Playwright
  - Performance testing and benchmarking
  - Test coverage requirements
  - Continuous integration testing

### Quick Testing Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- filename.test.ts

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

## Release Management

### Release Documentation

- **[Release Process](release-process.md)** - Complete release management
  process
  - Semantic versioning strategy
  - Release preparation checklist
  - Automated release pipeline
  - Changelog generation
  - Distribution and publishing

- **[Release Instructions](release-instructions.md)** - Step-by-step release
  execution
  - Pre-release verification
  - Release execution steps
  - Post-release validation
  - Rollback procedures
  - Hotfix releases

### Release Quick Reference

```bash
# Prepare release
npm run release:prepare

# Create release candidate
npm run release:rc

# Execute release
npm run release

# Post-release tasks
npm run release:post
```

## Development Workflow

### Standard Workflow

1. **Setup Environment**

   ```bash
   git clone https://github.com/your-org/legal-markdown-js.git
   cd legal-markdown-js
   npm install
   npm run dev
   ```

2. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Development Process**
   - Follow [Development Guidelines](development-guidelines.md)
   - Write tests for new functionality
   - Ensure code passes all checks
   - Document changes appropriately

4. **Quality Assurance**

   ```bash
   npm run lint          # Code linting
   npm run typecheck     # TypeScript checking
   npm test              # Run test suite
   npm run build         # Build verification
   ```

5. **Submit Changes**
   - Create pull request
   - Address review feedback
   - Ensure CI/CD passes
   - Merge when approved

### Branch Management

- **main** - Production-ready code
- **develop** - Integration branch for features
- **feature/\*** - Individual feature development
- **hotfix/\*** - Critical production fixes
- **release/\*** - Release preparation branches

## Quick Reference

### Scripts Reference

- **[Scripts Reference](scripts-reference.md)** - Complete build and utility
  scripts documentation
  - Build scripts and configurations
  - Development utilities
  - Testing automation
  - Release automation
  - Maintenance scripts

### Essential Commands

| Command             | Purpose                    |
| ------------------- | -------------------------- |
| `npm run dev`       | Start development server   |
| `npm run build`     | Build for production       |
| `npm test`          | Run test suite             |
| `npm run lint`      | Code linting               |
| `npm run typecheck` | TypeScript validation      |
| `npm run docs`      | Generate API documentation |

### Development Tools

- **TypeScript** - Type-safe JavaScript development
- **Vitest** - Fast unit testing framework
- **ESLint** - Code linting and style enforcement
- **Prettier** - Code formatting
- **Playwright** - End-to-end testing
- **TypeDoc** - API documentation generation

### Performance and Debugging

- **Performance Profiling**: Built-in performance monitoring
- **Memory Analysis**: Heap snapshots and leak detection
- **Debug Mode**: Comprehensive debugging with source maps
- **Benchmarking**: Automated performance regression testing

## Development Environment

### System Requirements

- **Node.js**: 18.x or higher
- **npm**: 8.x or higher
- **Git**: 2.x or higher
- **Operating System**: Windows 10+, macOS 10.15+, or Linux

### Recommended Tools

- **VS Code** with Legal Markdown JS extension pack
- **Git GUI** client (GitKraken, SourceTree, or GitHub Desktop)
- **Terminal** with good Unicode support
- **Browser** with developer tools (Chrome or Firefox)

### Environment Configuration

```bash
# Clone and setup
git clone https://github.com/your-org/legal-markdown-js.git
cd legal-markdown-js

# Install dependencies
npm install

# Setup development environment
npm run setup:dev

# Verify installation
npm run verify
```

## Getting Help

### Documentation Navigation

- [← Back to Main Documentation](../README.md)
- [← Processing Documentation](../processing/README.md)
- [Architecture Documentation →](../architecture/01_overview.md)

### Community Support

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Community questions and discussions
- **Contributing Guide** - Detailed contribution instructions
- **Code of Conduct** - Community guidelines and expectations

### Maintainer Contact

For project-specific questions or maintainer contact:

- Review [Contributing Guide](contributing.md) for communication channels
- Check [GitHub Issues](https://github.com/your-org/legal-markdown-js/issues)
  for existing discussions
- Follow issue templates for bug reports and feature requests

---

**Note**: This development documentation is actively maintained. Please refer to
the [Contributing Guide](contributing.md) for information about updating
documentation or reporting issues with these guides.
