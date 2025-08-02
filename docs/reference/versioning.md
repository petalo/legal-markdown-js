# Versioning and Release Guide

## 📦 Quick Summary

**Yes, you can use the HTML without a server!** There are 2 options:

### 🚀 Option 1: Standalone (NO server)

- Download `legal-markdown-web-vX.X.X.zip`
- Open `standalone.html` directly in the browser
- ✅ **Works immediately** without installations

### 🌐 Option 2: With server (full functionality)

- Download `legal-markdown-web-vX.X.X.zip`
- Run `python3 -m http.server 8080 --directory web`
- Visit `http://localhost:8080`

## 🔄 How to Generate Versions

### Automatic System (Recommended)

The project uses **semantic-release** that generates versions automatically:

```bash
# 1. Make commit with specific format
git commit -m "feat: nueva funcionalidad"

# 2. Push to main
git push origin main

# 3. Version is automatically created!
```

### Commit Types → Version Types

| Commit                       | Version   | Example       |
| ---------------------------- | --------- | ------------- |
| `fix: corregir bug`          | **PATCH** | 1.0.0 → 1.0.1 |
| `feat: nueva funcionalidad`  | **MINOR** | 1.0.0 → 1.1.0 |
| `feat!: cambio incompatible` | **MAJOR** | 1.0.0 → 2.0.0 |

### Practical Examples

#### Bug Fix (PATCH)

```bash
git commit -m "fix: fix error in YAML parser"
git commit -m "fix: solve problem with headers"
git commit -m "perf: optimize processing speed"
```

**Result:** 1.0.0 → 1.0.1

#### New Functionality (MINOR)

```bash
git commit -m "feat: add PDF support"
git commit -m "feat: new export option"
git commit -m "feat: standalone web interface"
```

**Result:** 1.0.0 → 1.1.0

#### Incompatible Change (MAJOR)

```bash
git commit -m "feat!: completely change the API"
# or
git commit -m "feat: new functionality

BREAKING CHANGE: changed the behavior of X"
```

**Result:** 1.0.0 → 2.0.0

#### Commits that DO NOT generate version

```bash
git commit -m "docs: update README"
git commit -m "style: format code"
git commit -m "test: add tests"
git commit -m "chore: update dependencies"
```

**Result:** No version is created

## 🤖 Automatic Process

When you do `git push origin main`:

1. **GitHub Actions** analyzes your commits
2. **Determines** what type of version to create
3. **Generates** changelog automatically
4. **Creates** tag and release on GitHub
5. **Builds** the 3 types of ZIP packages:
   - `legal-markdown-web-vX.X.X.zip` (For end users)
   - `legal-markdown-cli-vX.X.X.zip` (For developers)
   - `legal-markdown-complete-vX.X.X.zip` (Complete package)
6. **Uploads** the ZIPs as release assets

## 📋 Complete Workflow

```bash
# 1. Develop new functionality
git checkout -b feature/nueva-funcionalidad
# ... make changes ...
git add .
git commit -m "feat: add new functionality"

# 2. Merge to main
git checkout main
git merge feature/nueva-funcionalidad

# 3. Push (this triggers automatic release!)
git push origin main

# 4. Wait ~2-5 minutes
# 5. New release appears on GitHub with the ZIPs!
```

## 🎯 For End Users

### Super Simple Download

1. Go to
   [GitHub Releases](https://github.com/tu-usuario/legal-markdown-js/releases)
2. Download `legal-markdown-web-vX.X.X.zip`
3. Extract the ZIP
4. Open `standalone.html` in the browser
5. **Ready!** Processor working with complete library

### Two Available Versions

#### Standalone (standalone.html) - **RECOMMENDED**

- ✅ Open directly in browser
- ✅ No installations
- ✅ **Complete library** of Legal Markdown
- ✅ YAML frontmatter, mixins, loops
- ✅ HTML export
- ❌ No PDF (browser limitation)

#### With Server (web/index.html)

- ✅ All functionalities
- ✅ PDF generation
- ✅ Advanced functions
- ⚠️ Requires `python3 -m http.server`

## 🔧 Manual Configuration

If you want to create releases manually:

```bash
# 1. Update version
npm version patch  # or minor, major

# 2. Build packages
npm run build:packages

# 3. Push with tags
git push origin main --tags

# 4. Create release on GitHub manually
# 5. Upload ZIPs from packages/ as assets
```

## 🚨 Troubleshooting

### Release was not created automatically

- Verify that the commit follows the correct format
- Review GitHub Actions logs
- Ensure there are changes since last release

### HTML doesn't work without server

- Use `standalone.html` instead of `web/index.html`
- The standalone version has basic processing

### Package build error

```bash
npm run clean
npm install
npm run build:packages
```

## 📊 Complete Commit Conventions

| Type       | Description             | Generates Release |
| ---------- | ----------------------- | ----------------- |
| `feat`     | New functionality       | ✅ MINOR          |
| `fix`      | Bug fix                 | ✅ PATCH          |
| `perf`     | Performance improvement | ✅ PATCH          |
| `feat!`    | Incompatible change     | ✅ MAJOR          |
| `docs`     | Documentation           | ❌                |
| `style`    | Code formatting         | ❌                |
| `refactor` | Refactoring             | ❌                |
| `test`     | Tests                   | ❌                |
| `chore`    | Maintenance tasks       | ❌                |
| `ci`       | CI configuration        | ❌                |

**Tip:** Use `git commit` with detailed description:

```bash
git commit -m "feat: add table support

- Implement markdown table parser
- Add tests for tables
- Update documentation

Closes #123"
```

## 🎉 Summary

1. **Commit with correct format** → **Push to main** → **Automatic release!**
2. **End users** can download ZIP and use `standalone.html`
3. **Developers** can use CLI or complete version
4. **Everything automated** with GitHub Actions and semantic-release
