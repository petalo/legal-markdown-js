/**
 * Chrome Setup Helper
 *
 * Provides utilities to detect and help resolve Chrome/Chromium setup issues
 * for PDF generation when installed via npm.
 */

import * as fsSync from 'fs';
import * as path from 'path';
import * as os from 'os';

interface ChromeStatus {
  hasSystemChrome: boolean;
  hasPuppeteerCache: boolean;
  chromePaths: string[];
  suggestions: string[];
}

/**
 * Checks the current Chrome/Chromium setup status
 */
export function checkChromeStatus(): ChromeStatus {
  const status: ChromeStatus = {
    hasSystemChrome: false,
    hasPuppeteerCache: false,
    chromePaths: [],
    suggestions: [],
  };

  // Check for system Chrome installations
  const systemChromePaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    `${os.homedir()}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
    `${os.homedir()}/Applications/Chromium.app/Contents/MacOS/Chromium`,
    // Windows paths
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    // Linux paths
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];

  for (const chromePath of systemChromePaths) {
    if (fsSync.existsSync(chromePath)) {
      status.hasSystemChrome = true;
      status.chromePaths.push(chromePath);
    }
  }

  // Check Puppeteer cache (global cache has highest priority)
  const cachePaths = [
    path.join(os.homedir(), '.cache', 'puppeteer-global'), // Global cache for all installations
    path.join(os.homedir(), '.cache', 'puppeteer'),
    path.join(os.homedir(), '.puppeteer-cache'),
    path.join(process.cwd(), 'node_modules', 'puppeteer', '.local-chromium'),
    path.join(process.cwd(), 'node_modules', '.puppeteer-cache'),
  ];

  for (const cachePath of cachePaths) {
    try {
      if (fsSync.existsSync(cachePath)) {
        const files = fsSync.readdirSync(cachePath);
        if (files.length > 0) {
          status.hasPuppeteerCache = true;
          status.chromePaths.push(cachePath);
        }
      }
    } catch {
      // Ignore errors
    }
  }

  // Generate suggestions if Chrome is missing
  if (!status.hasSystemChrome && !status.hasPuppeteerCache) {
    status.suggestions.push('npx puppeteer browsers install chrome');

    if (process.platform === 'darwin') {
      status.suggestions.push('Download Chrome from: https://www.google.com/chrome/');
      if (os.arch().includes('arm')) {
        status.suggestions.push('For Apple Silicon: softwareupdate --install-rosetta');
      }
    } else if (process.platform === 'win32') {
      status.suggestions.push('Download Chrome from: https://www.google.com/chrome/');
    } else {
      status.suggestions.push('sudo apt-get install google-chrome-stable');
      status.suggestions.push('Or download from: https://www.google.com/chrome/');
    }
  }

  return status;
}
