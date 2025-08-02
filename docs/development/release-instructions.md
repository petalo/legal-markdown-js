# Release Instructions

This document explains how to create and manage releases for the Legal Markdown
project.

## Package Types

Each release automatically generates 3 types of packages:

### 1. 🌐 Web Package (`legal-markdown-web-vX.X.X.zip`)

For end users without technical knowledge:

- Complete web interface
- No Node.js required
- Works directly in the browser
- Includes local Python server

### 2. ⚡ CLI Package (`legal-markdown-cli-vX.X.X.zip`)

For developers and automation:

- Command-line tool
- Requires Node.js
- Ideal for scripts and CI/CD
- No web interface

### 3. 📦 Complete Package (`legal-markdown-complete-vX.X.X.zip`)

For developers who want everything:

- CLI + Web + Examples + Documentation
- Compiled source code
- Complete use cases

## Release Process

### Automatic (Recommended)

The project uses semantic-release for automatic releases:

1. **Make commits following conventions**:

   ```bash
   git commit -m "feat: nueva funcionalidad"
   git commit -m "fix: corrección de bug"
   git commit -m "docs: actualizar documentación"
   ```

2. **Push to main**:

   ```bash
   git push origin main
   ```

3. **Semantic-release automatically**:
   - Analyzes commits
   - Determines version type (patch, minor, major)
   - Creates the tag
   - Generates the changelog
   - Creates the release on GitHub
   - Uploads packages as assets

### Manual

If you need to create a release manually:

1. **Update version**:

   ```bash
   npm version patch  # or minor, major
   ```

2. **Generate packages**:

   ```bash
   npm run build:packages
   ```

3. **Create tag and push**:

   ```bash
   git push origin main --tags
   ```

4. **Create release on GitHub**:
   - Go to GitHub → Releases → New Release
   - Select the created tag
   - Use the content from `packages/RELEASE-NOTES.md`
   - Upload the ZIPs from `packages/`

## Generated File Structure

After running `npm run build:packages`, this is created:

```text
packages/
├── web/                                    # Temporary folder for web package
├── cli/                                    # Temporary folder for CLI package
├── complete/                               # Temporary folder for complete package
├── legal-markdown-web-vX.X.X.zip          # Web package
├── legal-markdown-cli-vX.X.X.zip          # CLI package
├── legal-markdown-complete-vX.X.X.zip     # Complete package
├── release-info.json                       # Release information
└── RELEASE-NOTES.md                        # Release notes template
```

## GitHub Actions Configuration

The `.github/workflows/release.yml` file handles:

- **Job 1: release** - Runs semantic-release on push to main
- **Job 2: upload-packages** - Uploads packages when a tag is created

### Required Permissions

The workflow requires these permissions:

- `contents: write` - To create releases
- `issues: write` - For semantic-release
- `pull-requests: write` - For semantic-release
- `id-token: write` - For authentication

## Package Usage

### Web Package

```bash
# Download legal-markdown-web-vX.X.X.zip
unzip legal-markdown-web-vX.X.X.zip
cd legal-markdown-web-vX.X.X
python3 -m http.server 8080 --directory web
# Visit http://localhost:8080
```

### CLI Package

```bash
# Download legal-markdown-cli-vX.X.X.zip
unzip legal-markdown-cli-vX.X.X.zip
cd legal-markdown-cli-vX.X.X
npm install --production
node dist/cli/index.js --help
```

### Complete Package

```bash
# Download legal-markdown-complete-vX.X.X.zip
unzip legal-markdown-complete-vX.X.X.zip
cd legal-markdown-complete-vX.X.X
npm install --production

# Use CLI
node dist/cli/index.js input.md output.md

# Use Web
python3 -m http.server 8080 --directory dist/web
```

## Troubleshooting

### Package build error

```bash
# Clean and rebuild
npm run clean
npm install
npm run build:packages
```

### GitHub workflow error

- Verify that the GitHub token has sufficient permissions
- Verify that semantic-release is configured correctly
- Review logs in GitHub Actions

### ZIP not generated

- Verify that `zip` is installed on the system
- Verify that file paths are correct
- Verify write permissions in `packages/` directory

## Initial Configuration

To configure releases in a new repository:

1. **Install semantic-release**:

   ```bash
   npm install --save-dev semantic-release
   ```

2. **Configure .releaserc** (already included in the project)

3. **Configure GitHub token** in repository settings → Secrets

4. **Configure NPM token** if you plan to publish to npm

## Commit Conventions

For automatic releases, use:

- `feat:` - New functionality (minor version)
- `fix:` - Bug fix (patch version)
- `docs:` - Documentation (no release generated)
- `style:` - Code formatting (no release generated)
- `refactor:` - Refactoring (no release generated)
- `test:` - Tests (no release generated)
- `chore:` - Maintenance tasks (no release generated)

For **breaking changes** (major version):

```bash
git commit -m "feat!: change that breaks compatibility"
# or
git commit -m "feat: new functionality

BREAKING CHANGE: description of the change"
```
