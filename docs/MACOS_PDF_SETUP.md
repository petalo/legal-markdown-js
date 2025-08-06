# macOS PDF Generation Setup Guide

## Problem

Users on macOS may encounter errors when trying to generate PDFs with legal-markdown-js
due to Chrome/Chromium not being properly configured for Puppeteer.

## Solution

### Automatic Setup (Recommended)

When you install or update legal-markdown-js, the package will automatically:

1. Check for Chrome/Chromium installation
2. Download Puppeteer's bundled Chromium if needed
3. Configure the PDF generator to use the correct executable

```bash
npm install legal-markdown-js
# or
npm update legal-markdown-js
```

### Manual Setup (If automatic setup fails)

If you still encounter issues, try these solutions in order:

#### Option 1: Force Puppeteer to download Chromium

```bash
npx puppeteer browsers install chrome
```

#### Option 2: Install Google Chrome

1. Download and install Google Chrome from <https://www.google.com/chrome/>
2. The package will automatically detect and use it

#### Option 3: For Apple Silicon Macs (M1/M2/M3)

If you're on an Apple Silicon Mac and still having issues:

```bash
# Install Rosetta 2 (if not already installed)
softwareupdate --install-rosetta

# Then reinstall Puppeteer
npm uninstall puppeteer
npm install puppeteer
```

#### Option 4: Manual Chromium installation

```bash
# Using the Puppeteer install script directly
node node_modules/puppeteer/install.mjs
```

#### Option 5: Force reinstall with environment variable

```bash
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false npm install puppeteer --force
```

## Troubleshooting

### Common Error Messages

**"Failed to launch the browser process!"**

- Solution: Run `npx puppeteer browsers install chrome`

**"No usable sandbox!"**

- Solution: The package already includes sandbox flags, but ensure you're not running as root

**"Could not find Chrome (ver. xxx)"**

- Solution: Chrome version mismatch. Update Puppeteer: `npm update puppeteer`

### Verify Installation

To check if Chrome/Chromium is properly installed:

```bash
# Check Puppeteer's bundled Chromium
ls node_modules/puppeteer/.local-chromium/

# Check system Chrome
ls /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome
```

### Debug Mode

If you're still having issues, run with debug logging:

```bash
DEBUG=puppeteer:* npx legal-md your-file.md --pdf output.pdf
```

## System Chrome vs Bundled Chromium

The package will try to use Chrome in this order:

1. System-installed Google Chrome (if found)
2. System-installed Chromium (if found)
3. Puppeteer's bundled Chromium

Using system Chrome often provides better performance and compatibility on macOS.

## Support

If none of these solutions work:

1. Check your Node.js version: `node --version` (should be >= 18.0.0)
2. Clear npm cache: `npm cache clean --force`
3. Delete node_modules and reinstall: `rm -rf node_modules && npm install`
4. File an issue at: <https://github.com/petalo/legal-markdown-js/issues>

Include:

- Your macOS version
- Node.js version
- The exact error message
- Output of `npx puppeteer browsers list`
