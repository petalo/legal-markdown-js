#!/usr/bin/env node
/**
 * Post-installation script to ensure Puppeteer dependencies are properly configured
 * This helps resolve Chrome/Chromium dependency issues that users commonly face
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function log(message) {
  console.log(`[legal-markdown-js] ${message}`);
}

function detectPlatform() {
  const platform = os.platform();
  const arch = os.arch();
  
  log(`Detected platform: ${platform} (${arch})`);
  
  return { platform, arch };
}

function checkChromiumInstallation() {
  try {
    // Check multiple possible locations for Chromium
    const possiblePaths = [
      // Old Puppeteer location
      path.join(__dirname, '..', 'node_modules', 'puppeteer', '.local-chromium'),
      // New Puppeteer cache location (user's home)
      path.join(os.homedir(), '.cache', 'puppeteer'),
      // Alternative cache location
      path.join(os.homedir(), '.puppeteer-cache'),
      // Project-local cache
      path.join(__dirname, '..', '.cache', 'puppeteer')
    ];
    
    for (const chromiumPath of possiblePaths) {
      if (fs.existsSync(chromiumPath)) {
        const files = fs.readdirSync(chromiumPath);
        if (files.length > 0) {
          log(`Puppeteer Chromium found at: ${chromiumPath}`);
          return true;
        }
      }
    }
    
    log('Puppeteer Chromium not found in any expected location');
    return false;
  } catch (error) {
    log(`Error checking Chromium installation: ${error.message}`);
    return false;
  }
}

function installChromiumDependencies() {
  const { platform } = detectPlatform();
  
  try {
    if (platform === 'linux') {
      log('Installing Linux Chrome dependencies...');
      
      // Check if we're in a container or have apt
      try {
        execSync('which apt-get', { stdio: 'ignore' });
        log('Attempting to install Chrome dependencies via apt-get...');
        
        const dependencies = [
          'ca-certificates',
          'fonts-liberation',
          'libasound2',
          'libatk-bridge2.0-0',
          'libatk1.0-0',
          'libc6',
          'libcairo-gobject2',
          'libcairo2',
          'libcups2',
          'libdbus-1-3',
          'libexpat1',
          'libfontconfig1',
          'libgbm1',
          'libgcc1',
          'libglib2.0-0',
          'libgtk-3-0',
          'libnspr4',
          'libnss3',
          'libpango-1.0-0',
          'libpangocairo-1.0-0',
          'libstdc++6',
          'libx11-6',
          'libx11-xcb1',
          'libxcb1',
          'libxcomposite1',
          'libxcursor1',
          'libxdamage1',
          'libxext6',
          'libxfixes3',
          'libxi6',
          'libxrandr2',
          'libxrender1',
          'libxss1',
          'libxtst6',
          'lsb-release',
          'wget',
          'xdg-utils'
        ];
        
        execSync(`apt-get update && apt-get install -y ${dependencies.join(' ')}`, { 
          stdio: 'inherit',
          timeout: 120000 
        });
        
        log('Linux Chrome dependencies installed successfully');
      } catch (aptError) {
        log('Could not install via apt-get (might not have permissions or apt not available)');
        log('Please ensure Chrome dependencies are installed manually if PDF generation fails');
      }
      
    } else if (platform === 'darwin') {
      log('macOS detected - Checking Chrome installation...');
      
      // Check for common Chrome installations on macOS
      const chromePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '~/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '~/Applications/Chromium.app/Contents/MacOS/Chromium'
      ];
      
      let chromeFound = false;
      for (const chromePath of chromePaths) {
        const expandedPath = chromePath.replace('~', os.homedir());
        if (fs.existsSync(expandedPath)) {
          log(`Chrome/Chromium found at: ${expandedPath}`);
          chromeFound = true;
          break;
        }
      }
      
      if (!chromeFound) {
        log('Chrome/Chromium not found in standard locations');
        log('Puppeteer will download its own Chromium');
      }
      
    } else if (platform === 'win32') {
      log('Windows detected - Chrome should work out of the box');
      
    } else {
      log(`Unsupported platform: ${platform}`);
      log('PDF generation may not work properly');
    }
    
  } catch (error) {
    log(`Error installing Chrome dependencies: ${error.message}`);
    log('PDF generation may not work properly');
  }
}

function ensurePuppeteerInstallation() {
  try {
    log('Checking Puppeteer installation...');
    
    const { platform } = detectPlatform();
    const puppeteerPath = path.join(__dirname, '..', 'node_modules', 'puppeteer');
    
    if (fs.existsSync(puppeteerPath)) {
      const puppeteerPkg = require(path.join(puppeteerPath, 'package.json'));
      log(`Puppeteer version: ${puppeteerPkg.version}`);
      
      // Always force download on macOS to ensure compatibility
      if (platform === 'darwin' || !checkChromiumInstallation()) {
        log('Ensuring Chromium is properly installed for Puppeteer...');
        
        // Set environment variables for macOS
        if (platform === 'darwin') {
          process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'false';
          process.env.PUPPETEER_DOWNLOAD_BASE_URL = 'https://storage.googleapis.com/chromium-browser-snapshots';
        }
        
        try {
          // First, try the modern Puppeteer command which handles cache correctly
          log('Installing Chrome for Puppeteer...');
          log('This will download Chrome to the user cache directory');
          
          // Clear any conflicting environment variables
          const cleanEnv = { ...process.env };
          delete cleanEnv.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD;
          delete cleanEnv.PUPPETEER_SKIP_DOWNLOAD;
          
          try {
            // This is the recommended way for Puppeteer v21+
            execSync('npx puppeteer browsers install chrome', { 
              stdio: 'inherit',
              cwd: path.join(__dirname, '..'),
              timeout: 600000,
              env: cleanEnv
            });
            log('Chrome installed successfully via npx');
            log(`Chrome should now be available at: ${path.join(os.homedir(), '.cache', 'puppeteer')}`);
          } catch (npxError) {
            // Fallback to install script
            log('Trying alternative installation via install script...');
            execSync('node node_modules/puppeteer/install.mjs', { 
              stdio: 'inherit',
              cwd: path.join(__dirname, '..'),
              timeout: 600000,
              env: cleanEnv
            });
            log('Chrome installed successfully via install.mjs');
          }
        } catch (installError) {
          log(`\n⚠️  Could not automatically install Chrome: ${installError.message}`);
          log('\n🔧 MANUAL FIX REQUIRED:');
          log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          log('Please run ONE of these commands manually:');
          log('\n  1. npx puppeteer browsers install chrome');
          log('     (Recommended - installs Chrome to user cache)\n');
          log('  2. npm install -g puppeteer');
          log('     (Alternative - global installation)\n');
          log('  3. Download Google Chrome from:');
          log('     https://www.google.com/chrome/');
          log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          log('\nAfter running the command, PDF generation should work.');
        }
      }
    } else {
      log('Puppeteer not found in node_modules');
    }
    
  } catch (error) {
    log(`Error ensuring Puppeteer installation: ${error.message}`);
  }
}

function main() {
  log('Running post-installation setup...');
  
  detectPlatform();
  installChromiumDependencies();
  ensurePuppeteerInstallation();
  
  log('Post-installation setup complete');
  log('If PDF generation still fails, try running: npx puppeteer browsers install chrome');
}

// Only run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, detectPlatform, installChromiumDependencies, ensurePuppeteerInstallation };