#!/usr/bin/env node
/**
 * Test script to verify PDF generation setup
 * Run with: node scripts/test-pdf-setup.cjs
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const os = require('os');
const path = require('path');

async function testPdfSetup() {
  console.log('🔍 Testing PDF Generation Setup...\n');

  // 1. Check Node version
  console.log('📦 Node.js version:', process.version);
  const [major] = process.version.slice(1).split('.').map(Number);
  if (major < 18) {
    console.error('❌ Node.js 18 or higher is required');
    process.exit(1);
  }

  // 2. Check platform
  console.log('💻 Platform:', process.platform);
  console.log('🏗️  Architecture:', os.arch());

  // 3. Check Chrome installations
  console.log('\n🔍 Checking for Chrome/Chromium installations...');

  const chromePaths = {
    'System Chrome': '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'System Chromium': '/Applications/Chromium.app/Contents/MacOS/Chromium',
    'User Chrome': path.join(
      os.homedir(),
      'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    ),
    'Puppeteer Cache': path.join(os.homedir(), '.cache/puppeteer'),
    'Old Puppeteer': path.join(process.cwd(), 'node_modules/puppeteer/.local-chromium'),
  };

  let foundChrome = false;
  for (const [name, chromePath] of Object.entries(chromePaths)) {
    if (fs.existsSync(chromePath)) {
      console.log(`✅ ${name}: Found at ${chromePath}`);
      foundChrome = true;
    } else {
      console.log(`❌ ${name}: Not found`);
    }
  }

  // 4. Test Puppeteer launch
  console.log('\n🚀 Testing Puppeteer launch...');

  let browser = null;
  try {
    const options = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    };

    // Try with system Chrome first if on macOS
    if (process.platform === 'darwin') {
      const systemChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      if (fs.existsSync(systemChrome)) {
        console.log('   Using system Chrome...');
        options.executablePath = systemChrome;
      }
    }

    browser = await puppeteer.launch(options);
    const version = await browser.version();
    console.log('✅ Puppeteer launched successfully!');
    console.log(`   Browser: ${version}`);

    // Test page creation
    const page = await browser.newPage();
    await page.setContent('<h1>Test</h1>');
    const pdf = await page.pdf({ format: 'A4' });
    console.log(`✅ PDF generation test successful! (${pdf.length} bytes)`);
  } catch (error) {
    console.error('❌ Failed to launch Puppeteer:', error.message);
    console.log('\n🔧 SUGGESTED FIXES:');
    console.log('1. Run: npx puppeteer browsers install chrome');
    console.log('2. Install Google Chrome from: https://www.google.com/chrome/');
    if (process.platform === 'darwin' && os.arch() === 'arm64') {
      console.log('3. For M1/M2/M3 Mac: softwareupdate --install-rosetta');
    }
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log('\n✅ All tests passed! PDF generation should work correctly.');
  console.log('💡 Try generating a PDF with: npx legal-md your-file.md --pdf output.pdf');
}

// Run the test
testPdfSetup().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
