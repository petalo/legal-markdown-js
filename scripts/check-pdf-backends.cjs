#!/usr/bin/env node
/**
 * Verify required PDF backends for strict E2E/CI coverage.
 *
 * Required:
 * - Puppeteer + launchable Chrome/Chromium
 * - WeasyPrint executable in PATH
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

if (!process.env.PUPPETEER_CACHE_DIR) {
  process.env.PUPPETEER_CACHE_DIR = path.join(os.homedir(), '.cache', 'puppeteer-global');
}

function checkWeasyPrint() {
  const result = spawnSync('weasyprint', ['--version'], { encoding: 'utf8' });
  if (result.status !== 0) {
    return {
      ok: false,
      message:
        'weasyprint not available. Install it (e.g. `brew install weasyprint` or `apt-get install weasyprint`).',
    };
  }

  return {
    ok: true,
    message: (result.stdout || result.stderr || 'weasyprint detected').trim(),
  };
}

async function checkPuppeteer() {
  function detectChromeExecutable() {
    if (process.platform === 'darwin') {
      const macCandidates = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        '/Applications/Arc.app/Contents/MacOS/Arc',
      ];
      return macCandidates.find(candidate => fs.existsSync(candidate)) || null;
    }

    if (process.platform === 'linux') {
      const linuxCandidates = [
        'google-chrome',
        'chromium',
        'chromium-browser',
        'microsoft-edge',
        'brave-browser',
      ];
      for (const executable of linuxCandidates) {
        const result = spawnSync('which', [executable], { encoding: 'utf8' });
        if (result.status === 0) {
          const resolved = (result.stdout || '').trim();
          if (resolved) return resolved;
        }
      }
      return null;
    }

    if (process.platform === 'win32') {
      const programFiles = process.env.PROGRAMFILES;
      const programFilesX86 = process.env['PROGRAMFILES(X86)'];
      const localAppData = process.env.LOCALAPPDATA;
      const windowsCandidates = [
        programFiles && path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        programFilesX86 &&
          path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        programFiles && path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        programFilesX86 &&
          path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        localAppData && path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      ].filter(Boolean);
      return windowsCandidates.find(candidate => fs.existsSync(candidate)) || null;
    }

    return null;
  }

  async function launchWithOptions(puppeteer, executablePath) {
    return puppeteer.launch({
      headless: true,
      executablePath: executablePath || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (error) {
    return {
      ok: false,
      message: `puppeteer package missing: ${error && error.message ? error.message : String(error)}`,
    };
  }

  let browser = null;
  try {
    try {
      browser = await launchWithOptions(puppeteer, null);
    } catch {
      const systemChrome = detectChromeExecutable();
      if (!systemChrome) {
        throw new Error('No system Chrome/Chromium executable found and bundled browser is missing.');
      }
      browser = await launchWithOptions(puppeteer, systemChrome);
    }
    const version = await browser.version();
    return { ok: true, message: `Puppeteer launch OK (${version})` };
  } catch (error) {
    return {
      ok: false,
      message: `Puppeteer cannot launch Chrome/Chromium: ${
        error && error.message ? error.message : String(error)
      }`,
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}

async function main() {
  console.log('Checking required PDF backends...');

  const weasy = checkWeasyPrint();
  const puppeteer = await checkPuppeteer();

  console.log(`- weasyprint: ${weasy.ok ? 'OK' : 'FAIL'} ${weasy.message}`);
  console.log(`- puppeteer: ${puppeteer.ok ? 'OK' : 'FAIL'} ${puppeteer.message}`);

  if (!weasy.ok || !puppeteer.ok) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unexpected error while checking PDF backends:', error);
  process.exit(1);
});
