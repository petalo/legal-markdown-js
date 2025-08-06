/**
 * Chrome Setup Helper
 *
 * Provides utilities to detect and help resolve Chrome/Chromium setup issues
 * for PDF generation when installed via npm.
 */

import * as fsSync from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';

export interface ChromeStatus {
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

/**
 * Attempts to automatically install Chrome for Puppeteer in global cache
 */
export async function autoInstallChrome(): Promise<boolean> {
  try {
    console.log('🔧 Auto-installing Chrome for PDF generation in global cache...');

    // Use global cache directory to avoid multiple downloads
    const globalCacheDir = path.join(os.homedir(), '.cache', 'puppeteer-global');

    // Ensure cache directory exists
    if (!fsSync.existsSync(globalCacheDir)) {
      fsSync.mkdirSync(globalCacheDir, { recursive: true });
    }

    // Use spawn with explicit arguments to avoid command injection
    const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const args = ['puppeteer', 'browsers', 'install', 'chrome'];

    return new Promise(resolve => {
      const childProcess = spawn(command, args, {
        stdio: 'inherit',
        env: {
          ...process.env,
          PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'false',
          PUPPETEER_CACHE_DIR: globalCacheDir,
        },
      });

      // Set timeout manually since spawn doesn't have built-in timeout
      const timeout = setTimeout(() => {
        childProcess.kill('SIGTERM');
        console.error('❌ Chrome installation timed out after 5 minutes');
        resolve(false);
      }, 300000); // 5 minutes

      childProcess.on('close', code => {
        clearTimeout(timeout);
        if (code === 0) {
          console.log(`✅ Chrome installed successfully in global cache: ${globalCacheDir}`);
          resolve(true);
        } else {
          console.error(`❌ Chrome installation failed with exit code: ${code}`);
          resolve(false);
        }
      });

      childProcess.on('error', error => {
        clearTimeout(timeout);
        console.error('❌ Failed to install Chrome automatically:', error.message);
        resolve(false);
      });
    });
  } catch (error) {
    console.error(
      '❌ Failed to install Chrome automatically:',
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

/**
 * Displays helpful Chrome setup information to the user
 */
export function displayChromeHelp(): void {
  const status = checkChromeStatus();

  console.log('\n📋 Chrome Setup Status:');
  console.log(`   System Chrome: ${status.hasSystemChrome ? '✅ Found' : '❌ Not found'}`);
  console.log(`   Puppeteer Cache: ${status.hasPuppeteerCache ? '✅ Found' : '❌ Not found'}`);

  if (status.chromePaths.length > 0) {
    console.log('   Chrome locations:');
    status.chromePaths.forEach(p => console.log(`     - ${p}`));
  }

  if (status.suggestions.length > 0) {
    console.log('\n🔧 To enable PDF generation, try:');
    status.suggestions.forEach((suggestion, i) => {
      console.log(`   ${i + 1}. ${suggestion}`);
    });
  }

  console.log(
    '\n💡 For more help, see: https://github.com/petalo/legal-markdown-js/blob/main/docs/MACOS_PDF_SETUP.md'
  );
}
