#!/usr/bin/env node

/**
 * Automated test script for the Legal Markdown Playground
 * Tests all examples to ensure they load and process correctly
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.TEST_PORT || 8082;
const URL = `http://localhost:${PORT}`;
const USE_EXISTING_SERVER = process.env.USE_EXISTING_SERVER === 'true';

// List of all examples to test
const EXAMPLES = [
  'service-agreement',
  'demo-contract',
  'lease-contract',
  'purchase-ticket',
  'nda',
  'employment-contract',
  'features-demo'
];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

/**
 * Start the web server
 */
async function startServer() {
  return new Promise((resolve, reject) => {
    logInfo(`Starting web server on port ${PORT}...`);

    const server = spawn('npm', ['run', 'web:serve', '--', `--port=${PORT}`], {
      cwd: join(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let started = false;

    server.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Open your browser') && !started) {
        started = true;
        logSuccess('Web server started');
        resolve(server);
      }
    });

    server.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    server.on('error', (error) => {
      reject(error);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!started) {
        reject(new Error('Server failed to start within 10 seconds'));
      }
    }, 10000);
  });
}

/**
 * Wait for a condition to be true
 */
async function waitFor(condition, timeout = 5000, interval = 100) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error('Timeout waiting for condition');
}

/**
 * Test a single example
 */
async function testExample(page, exampleName) {
  try {
    logInfo(`Testing example: ${exampleName}`);

    // Select the example from dropdown
    await page.select('.example-select', exampleName);

    // Wait for content to load in the editor
    await page.waitForFunction(
      () => document.querySelector('.editor').value.length > 0,
      { timeout: 2000 }
    );

    // Click the process button
    await page.click('.process-btn');

    // Wait for processing to complete
    await page.waitForFunction(
      () => {
        const btn = document.querySelector('.process-btn');
        return btn && btn.textContent.includes('▶️');
      },
      { timeout: 5000 }
    );

    // Check if there's output in the preview
    const hasOutput = await page.evaluate(() => {
      const markdownPreview = document.querySelector('.markdown-preview .preview-content');
      const htmlPreview = document.querySelector('.html-preview .preview-content');

      const markdownHasContent = markdownPreview &&
        !markdownPreview.textContent.includes('Enter your Legal Markdown content');
      const htmlHasContent = htmlPreview &&
        !htmlPreview.textContent.includes('Enter your Legal Markdown content');

      return markdownHasContent && htmlHasContent;
    });

    if (!hasOutput) {
      throw new Error('No output generated');
    }

    // Check for errors in console
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Get processing stats
    const stats = await page.evaluate(() => {
      const messageArea = document.getElementById('messageArea');
      return messageArea ? messageArea.textContent : '';
    });

    logSuccess(`${exampleName}: Processed successfully`);
    if (stats) {
      log(`  → ${stats.replace(/\n/g, ' ')}`, 'blue');
    }

    return {
      success: true,
      example: exampleName,
      stats
    };

  } catch (error) {
    logError(`${exampleName}: ${error.message}`);

    // Capture screenshot on error
    const screenshotPath = join(__dirname, '..', `error-${exampleName}.png`);
    await page.screenshot({ path: screenshotPath });
    logWarning(`Screenshot saved to: error-${exampleName}.png`);

    return {
      success: false,
      example: exampleName,
      error: error.message
    };
  }
}

/**
 * Main test function
 */
async function runTests() {
  let server = null;
  let browser = null;

  try {
    log('\n🧪 Legal Markdown Playground Automated Tests\n', 'bright');

    // Start the server (unless using existing one)
    if (!USE_EXISTING_SERVER) {
      server = await startServer();
      // Wait a bit for server to be fully ready
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      logInfo(`Using existing server at ${URL}`);
    }

    // Launch browser
    logInfo('Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to playground
    logInfo(`Navigating to ${URL}...`);
    await page.goto(URL, { waitUntil: 'networkidle0' });

    // Wait for the library to load
    await page.waitForFunction(
      () => window.LegalMarkdown !== undefined,
      { timeout: 5000 }
    );

    logSuccess('Playground loaded successfully');

    // Test all examples
    const results = [];
    for (const example of EXAMPLES) {
      const result = await testExample(page, example);
      results.push(result);

      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Print summary
    log('\n📊 Test Summary\n', 'bright');
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    log(`Total examples: ${results.length}`, 'blue');
    logSuccess(`Passed: ${passed}`);
    if (failed > 0) {
      logError(`Failed: ${failed}`);
    }

    if (failed === 0) {
      log('\n🎉 All tests passed!\n', 'green');
    } else {
      log('\n⚠️  Some tests failed. Check the error screenshots.\n', 'yellow');
      process.exit(1);
    }

  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // Cleanup
    if (browser) {
      await browser.close();
      logInfo('Browser closed');
    }

    if (server) {
      server.kill();
      logInfo('Server stopped');
    }
  }
}

// Run tests
runTests();
