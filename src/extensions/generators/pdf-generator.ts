/**
 * PDF Generation Module for Legal Markdown Documents
 *
 * This module provides functionality to convert processed Legal Markdown content
 * into professional PDF documents using Puppeteer for HTML-to-PDF conversion.
 * It builds upon the HTML generator to create print-ready documents with
 * customizable formatting, page layouts, and styling options.
 *
 * Features:
 * - HTML-to-PDF conversion using Puppeteer
 * - Multiple page formats (A4, Letter, Legal)
 * - Customizable margins and page orientation
 * - Header and footer template support
 * - Field highlighting for document review
 * - Temporary file management and cleanup
 * - Error handling and logging
 * - Dual PDF generation (normal and highlighted versions)
 *
 * @example
 * ```typescript
 * import { pdfGenerator } from './pdf-generator';
 *
 * const pdf = await pdfGenerator.generatePdf(markdownContent, './output.pdf', {
 *   format: 'A4',
 *   landscape: false,
 *   includeHighlighting: true,
 *   margin: { top: '2cm', bottom: '2cm' }
 * });
 * ```
 */

import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';
import * as http from 'http';
import { spawn } from 'child_process';
import { logger } from '../../utils/logger';
import { getCurrentDir } from '../../utils/esm-utils.js';
import type { MarkdownString } from '../../types/content-formats';

// ESM/CJS compatible directory resolution
const currentDir = getCurrentDir();
import { htmlGenerator, HtmlGeneratorOptions } from './html-generator';
import { PdfTemplates } from './pdf-templates';
import { PDF_TEMPLATE_CONSTANTS, RESOLVED_PATHS } from '../../constants/index';

/**
 * Configuration options for PDF generation
 *
 * @interface PdfGeneratorOptions
 * @extends HtmlGeneratorOptions
 */
export interface PdfGeneratorOptions extends HtmlGeneratorOptions {
  /** Page format for the PDF */
  format?: 'A4' | 'Letter' | 'Legal';
  /** Whether to use landscape orientation */
  landscape?: boolean;
  /** Page margins configuration */
  margin?: {
    /** Top margin (e.g., '1cm', '0.5in') */
    top?: string;
    /** Right margin (e.g., '1cm', '0.5in') */
    right?: string;
    /** Bottom margin (e.g., '1cm', '0.5in') */
    bottom?: string;
    /** Left margin (e.g., '1cm', '0.5in') */
    left?: string;
  };
  /** Whether to display header and footer */
  displayHeaderFooter?: boolean;
  /** HTML template for page headers */
  headerTemplate?: string;
  /** HTML template for page footers */
  footerTemplate?: string;
  /** Whether to print background colors and images */
  printBackground?: boolean;
  /** Whether to prefer CSS page size over format option */
  preferCSSPageSize?: boolean;
  /** Path to CSS file for automatic logo detection */
  cssPath?: string;
}

/**
 * Detects logo filename from CSS file by parsing --logo-filename custom property
 *
 * Searches for CSS custom property `--logo-filename` and extracts the filename value.
 * Handles quoted and unquoted values, removing whitespace and quotes as needed.
 *
 * @param {string} cssPath - Path to the CSS file to parse
 * @returns {Promise<string | null>} Logo filename or null if not found
 * @example
 * ```typescript
 * // CSS contains: --logo-filename: logo.petalo.png;
 * const filename = await detectLogoFromCSS('./styles/contract.css');
 * // Returns: 'logo.petalo.png'
 * ```
 */
async function detectLogoFromCSS(cssPath: string): Promise<string | null> {
  try {
    logger.debug('Detecting logo from CSS file', { cssPath });

    const cssContent = await fs.readFile(cssPath, 'utf8');
    const match = cssContent.match(/--logo-filename:\s*([^;]+);/);

    if (!match) {
      logger.debug('No --logo-filename property found in CSS');
      return null;
    }

    const filename = match[1].trim().replace(/['"]/g, '');
    logger.debug('Logo filename detected from CSS', { filename });

    return filename;
  } catch (error) {
    logger.warn('Failed to read --logo-filename from CSS', {
      cssPath,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Loads and validates logo image file, converting to base64
 *
 * Performs comprehensive validation:
 * - File existence and readability
 * - File size limit (500KB max)
 * - PNG format validation using magic numbers
 * - Base64 encoding for embedding
 *
 * @param {string} logoPath - Absolute path to the logo image file
 * @returns {Promise<string>} Base64 encoded image string
 * @throws {Error} When file validation fails
 * @example
 * ```typescript
 * const base64Logo = await loadAndEncodeImage('./assets/images/logo.png');
 * // Returns: 'iVBORw0KGgoAAAANSUhEUgAAA...'
 * ```
 */
async function loadAndEncodeImage(logoPath: string): Promise<string> {
  try {
    logger.debug('Loading and validating logo file', { logoPath });

    // Check file existence and size
    const stats = await fs.stat(logoPath);
    if (stats.size > PDF_TEMPLATE_CONSTANTS.MAX_LOGO_SIZE) {
      throw new Error(
        `Logo file too large: ${stats.size} bytes (max ${PDF_TEMPLATE_CONSTANTS.MAX_LOGO_SIZE})`
      );
    }

    // Read file and validate PNG format
    const logoBuffer = await fs.readFile(logoPath);

    // Validate PNG magic numbers (0x89, 0x50, 0x4E, 0x47)
    if (
      logoBuffer.length < 8 ||
      logoBuffer[0] !== 0x89 ||
      logoBuffer[1] !== 0x50 ||
      logoBuffer[2] !== 0x4e ||
      logoBuffer[3] !== 0x47
    ) {
      throw new Error('Invalid logo file format: must be PNG');
    }

    // Convert to base64
    const base64Logo = logoBuffer.toString('base64');
    logger.debug('Logo file loaded and encoded successfully', {
      size: stats.size,
      base64Length: base64Logo.length,
    });

    return base64Logo;
  } catch (error) {
    logger.error('Failed to load logo file', {
      logoPath,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Downloads and validates logo image from external URL, converting to base64
 *
 * Performs comprehensive validation:
 * - URL accessibility and download
 * - File size limit (500KB max)
 * - PNG format validation using magic numbers
 * - Base64 encoding for embedding
 *
 * @param {string} logoUrl - URL to the logo image
 * @returns {Promise<string>} Base64 encoded image string
 * @throws {Error} When download or validation fails
 * @example
 * ```typescript
 * const base64Logo = await downloadAndEncodeImage('https://example.com/logo.png');
 * // Returns: 'iVBORw0KGgoAAAANSUhEUgAAA...'
 * ```
 */
async function downloadAndEncodeImage(logoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      logger.debug('Downloading logo from URL', { logoUrl });

      const protocol = logoUrl.startsWith('https://') ? https : http;

      const request = protocol.get(logoUrl, response => {
        // Check for redirect
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            logger.debug('Following redirect', { from: logoUrl, to: redirectUrl });
            downloadAndEncodeImage(redirectUrl).then(resolve).catch(reject);
            return;
          }
        }

        // Check for successful response
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download logo: HTTP ${response.statusCode}`));
          return;
        }

        // Check content length
        const contentLength = parseInt(response.headers['content-length'] || '0', 10);
        if (contentLength > PDF_TEMPLATE_CONSTANTS.MAX_LOGO_SIZE) {
          reject(
            new Error(
              `Logo file too large: ${contentLength} bytes ` +
                `(max ${PDF_TEMPLATE_CONSTANTS.MAX_LOGO_SIZE})`
            )
          );
          return;
        }

        const chunks: Buffer[] = [];
        let downloadedBytes = 0;

        response.on('data', (chunk: Buffer) => {
          downloadedBytes += chunk.length;

          // Check size limit during download
          if (downloadedBytes > PDF_TEMPLATE_CONSTANTS.MAX_LOGO_SIZE) {
            reject(
              new Error(
                `Logo file too large: ${downloadedBytes} bytes ` +
                  `(max ${PDF_TEMPLATE_CONSTANTS.MAX_LOGO_SIZE})`
              )
            );
            return;
          }

          chunks.push(chunk);
        });

        response.on('end', () => {
          try {
            const logoBuffer = Buffer.concat(chunks);

            // Validate PNG magic numbers (0x89, 0x50, 0x4E, 0x47)
            if (
              logoBuffer.length < 8 ||
              logoBuffer[0] !== 0x89 ||
              logoBuffer[1] !== 0x50 ||
              logoBuffer[2] !== 0x4e ||
              logoBuffer[3] !== 0x47
            ) {
              reject(new Error('Invalid logo file format: must be PNG'));
              return;
            }

            // Convert to base64
            const base64Logo = logoBuffer.toString('base64');
            logger.debug('Logo downloaded and encoded successfully', {
              url: logoUrl,
              size: logoBuffer.length,
              base64Length: base64Logo.length,
            });

            resolve(base64Logo);
          } catch (error) {
            reject(error);
          }
        });

        response.on('error', error => {
          reject(new Error(`Failed to download logo: ${error.message}`));
        });
      });

      request.on('error', error => {
        reject(new Error(`Failed to download logo: ${error.message}`));
      });

      // Set timeout for the request
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Logo download timeout (10 seconds)'));
      });
    } catch (error) {
      logger.error('Failed to download logo from URL', {
        logoUrl,
        error: error instanceof Error ? error.message : String(error),
      });
      reject(error);
    }
  });
}

/**
 * PDF Generator for Legal Markdown Documents
 *
 * Converts processed Legal Markdown content into PDF documents using Puppeteer
 * for HTML-to-PDF conversion. Provides comprehensive formatting options and
 * supports both normal and highlighted document versions.
 *
 * @class PdfGenerator
 * @example
 * ```typescript
 * const generator = new PdfGenerator();
 * const pdf = await generator.generatePdf(content, './output.pdf', {
 *   format: 'A4',
 *   includeHighlighting: true
 * });
 * ```
 */
export class PdfGenerator {
  private puppeteerOptions: puppeteer.LaunchOptions;

  /**
   * Creates a new PDF generator instance
   *
   */
  constructor() {
    // Initialize Puppeteer options with platform-specific settings
    this.puppeteerOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        // Additional args for macOS compatibility
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
      // Increase timeout for slower systems
      timeout: 60000,
      // Set cache directory for Puppeteer (prefer global cache)
      env: {
        ...process.env,
        PUPPETEER_CACHE_DIR: this.getAvailablePuppeteerCache(),
      },
    };

    // Try to use system Chrome or Puppeteer Chrome if available
    const chromeExecutable = this.getChromeExecutable();
    if (chromeExecutable) {
      this.puppeteerOptions.executablePath = chromeExecutable;
    }
  }

  /**
   * Attempts to find Chrome executable on different platforms
   * @private
   */
  private getChromeExecutable(): string | null {
    // First try system Chrome
    const systemChrome = this.getSystemChromeExecutable();
    if (systemChrome) {
      return systemChrome;
    }

    // Then try Puppeteer Chrome
    const puppeteerChrome = this.getPuppeteerChromeExecutable();
    if (puppeteerChrome) {
      return puppeteerChrome;
    }

    logger.debug("No Chrome executable found, will use Puppeteer's default");
    return null;
  }

  /**
   * Attempts to find system Chrome executable
   * @private
   */
  private getSystemChromeExecutable(): string | null {
    let possiblePaths: string[] = [];

    if (process.platform === 'darwin') {
      // macOS paths
      possiblePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        `${os.homedir()}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
        `${os.homedir()}/Applications/Chromium.app/Contents/MacOS/Chromium`,
      ];
    } else if (process.platform === 'linux') {
      // Linux paths
      possiblePaths = [
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/snap/bin/chromium',
        '/opt/google/chrome/chrome',
      ];
    } else if (process.platform === 'win32') {
      // Windows paths
      possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        `${os.homedir()}\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe`,
      ];
    }

    for (const chromePath of possiblePaths) {
      if (fsSync.existsSync(chromePath)) {
        logger.debug(`Using system Chrome at: ${chromePath}`);
        return chromePath;
      }
    }

    logger.debug(`System Chrome not found on ${process.platform}`);
    return null;
  }

  /**
   * Attempts to find Puppeteer Chrome executable from cache
   * @private
   */
  private getPuppeteerChromeExecutable(): string | null {
    const cacheDir = this.getAvailablePuppeteerCache();

    try {
      // Check if cache directory exists and has Chrome
      if (fsSync.existsSync(cacheDir)) {
        const chromeDirs = fsSync
          .readdirSync(cacheDir)
          .filter(dir => dir.includes('chrome') || dir.includes('chromium'));

        for (const chromeDir of chromeDirs) {
          const chromePath = path.join(cacheDir, chromeDir);

          if (fsSync.existsSync(chromePath)) {
            // Look for Chrome executable in the directory
            const versionDirs = fsSync
              .readdirSync(chromePath)
              .filter(
                dir => dir.startsWith('linux-') || dir.startsWith('mac-') || dir.startsWith('win')
              );

            for (const versionDir of versionDirs) {
              let executablePath: string;

              if (process.platform === 'linux') {
                executablePath = path.join(chromePath, versionDir, 'chrome-linux64', 'chrome');
              } else if (process.platform === 'darwin') {
                executablePath = path.join(
                  chromePath,
                  versionDir,
                  'chrome-mac-x64',
                  'Google Chrome for Testing.app',
                  'Contents',
                  'MacOS',
                  'Google Chrome for Testing'
                );
              } else if (process.platform === 'win32') {
                executablePath = path.join(chromePath, versionDir, 'chrome-win64', 'chrome.exe');
              } else {
                continue;
              }

              if (fsSync.existsSync(executablePath)) {
                logger.debug(`Using Puppeteer Chrome at: ${executablePath}`);
                return executablePath;
              }
            }
          }
        }
      }
    } catch (error) {
      logger.debug(
        `Error finding Puppeteer Chrome: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    logger.debug('Puppeteer Chrome not found in cache');
    return null;
  }

  /**
   * Ensures Chrome is available for Puppeteer, installing it if necessary
   * @private
   */
  private async ensureChrome(): Promise<void> {
    // Check if we already have Chrome available
    const systemChrome = this.getSystemChromeExecutable();
    const puppeteerChrome = this.getPuppeteerChromeExecutable();
    const hasCache = this.hasChromiumCache();

    logger.debug('Chrome availability check:', {
      systemChrome: systemChrome ? 'Found' : 'Not found',
      puppeteerChrome: puppeteerChrome ? 'Found' : 'Not found',
      puppeteerCache: hasCache ? 'Found' : 'Not found',
    });

    if (systemChrome || puppeteerChrome || hasCache) {
      logger.debug('Chrome is available, skipping installation');
      return;
    }

    logger.info('Chrome not found. For PDF generation to work, Chrome must be available.');
    logger.info('Trying to install Chrome in global cache (this may take a few minutes)...');

    try {
      // Use global cache directory to avoid multiple downloads
      const globalCacheDir = path.join(os.homedir(), '.cache', 'puppeteer-global');
      await fs.mkdir(globalCacheDir, { recursive: true });

      // Use spawn with explicit arguments to avoid command injection
      const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      const args = ['puppeteer', 'browsers', 'install', 'chrome'];

      const installSuccess = await new Promise<boolean>(resolve => {
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
          logger.error('Chrome installation timed out after 5 minutes');
          resolve(false);
        }, 300000); // 5 minutes

        childProcess.on('close', code => {
          clearTimeout(timeout);
          resolve(code === 0);
        });

        childProcess.on('error', () => {
          clearTimeout(timeout);
          resolve(false);
        });
      });

      if (installSuccess) {
        logger.info('✅ Chrome installed successfully!');
      } else {
        throw new Error('Chrome installation failed');
      }
    } catch (npxError) {
      logger.error('❌ Failed to automatically install Chrome.');
      logger.error('📋 Chrome Setup Status:');

      const { checkChromeStatus } = await import('../../utils/chrome-setup-helper');
      const status = checkChromeStatus();

      logger.error(`   System Chrome: ${status.hasSystemChrome ? '✅ Found' : '❌ Not found'}`);
      logger.error(`   Puppeteer Cache: ${status.hasPuppeteerCache ? '✅ Found' : '❌ Not found'}`);

      logger.error('🔧 To enable PDF generation, run ONE of these commands:');
      logger.error('   1. npx puppeteer browsers install chrome');
      logger.error('   2. Download Chrome from: https://www.google.com/chrome/');

      if (process.platform === 'darwin' && os.arch().includes('arm')) {
        logger.error('   3. For Apple Silicon Mac: softwareupdate --install-rosetta');
      }

      throw new Error(
        'Chrome installation failed. Please install Chrome manually to enable PDF generation.'
      );
    }
  }

  /**
   * Gets the first available Puppeteer cache directory
   * @private
   */
  private getAvailablePuppeteerCache(): string {
    const cachePaths = [
      path.join(os.homedir(), '.cache', 'puppeteer-global'), // Global cache (highest priority)
      path.join(os.homedir(), '.cache', 'puppeteer'),
      path.join(os.homedir(), '.puppeteer-cache'),
      path.join(process.cwd(), 'node_modules', 'puppeteer', '.local-chromium'),
      path.join(process.cwd(), 'node_modules', '.puppeteer-cache'),
    ];

    logger.debug('Checking cache paths');
    for (const cachePath of cachePaths) {
      try {
        if (fsSync.existsSync(cachePath)) {
          const files = fsSync.readdirSync(cachePath);
          logger.debug(`${cachePath}: ${files.length} files`);
          if (files.length > 0) {
            logger.debug(`Using cache: ${cachePath}`);
            return cachePath;
          }
        } else {
          logger.debug(`${cachePath}: does not exist`);
        }
      } catch (error) {
        logger.debug(
          `${cachePath}: error reading (${error instanceof Error ? error.message : String(error)})`
        );
      }
    }

    // Default to global cache if none found
    const defaultCache = path.join(os.homedir(), '.cache', 'puppeteer-global');
    logger.debug(`No cache found, defaulting to: ${defaultCache}`);
    return defaultCache;
  }

  /**
   * Checks if Puppeteer has a Chrome cache available
   * @private
   */
  private hasChromiumCache(): boolean {
    const cachePaths = [
      path.join(os.homedir(), '.cache', 'puppeteer-global'), // Global cache (highest priority)
      path.join(os.homedir(), '.cache', 'puppeteer'),
      path.join(os.homedir(), '.puppeteer-cache'),
      path.join(process.cwd(), 'node_modules', 'puppeteer', '.local-chromium'),
      path.join(process.cwd(), 'node_modules', '.puppeteer-cache'),
    ];

    return cachePaths.some(cachePath => {
      try {
        if (fsSync.existsSync(cachePath)) {
          const files = fsSync.readdirSync(cachePath);
          return files.length > 0;
        }
      } catch {
        // Ignore errors
      }
      return false;
    });
  }

  /**
   * Generates a PDF document from Legal Markdown content
   *
   * This method orchestrates the complete PDF generation process:
   * 1. Converts markdown to HTML using the HTML generator
   * 2. Creates a temporary HTML file for Puppeteer
   * 3. Launches a headless Chrome browser
   * 4. Loads the HTML and generates PDF with specified options
   * 5. Cleans up temporary files and browser resources
   *
   * @param {string} markdownContent - The processed Legal Markdown content
   * @param {string} outputPath - Path where the PDF will be saved
   * @param {PdfGeneratorOptions} [options={}] - Configuration options for PDF generation
   * @returns {Promise<Buffer>} A promise that resolves to the PDF buffer
   * @throws {Error} When PDF generation fails due to browser, file system, or processing errors
   * @example
   * ```typescript
   * const pdf = await generator.generatePdf(
   *   markdownContent,
   *   './contract.pdf',
   *   {
   *     format: 'A4',
   *     landscape: false,
   *     includeHighlighting: true,
   *     margin: { top: '2cm', bottom: '2cm' }
   *   }
   * );
   * ```
   */
  /**
   * Generates a PDF document from Legal Markdown content
   *
   * @param {MarkdownString} markdownContent - The processed Legal Markdown content (MUST be Markdown, NOT HTML)
   * @param {string} outputPath - Path where the PDF file will be saved
   * @param {PdfGeneratorOptions} [options={}] - Configuration options for PDF generation
   * @returns {Promise<Buffer>} A promise that resolves to the PDF buffer
   * @throws {Error} When PDF generation fails
   *
   * @example
   * ```typescript
   * import { asMarkdown } from '../../types/content-formats';
   *
   * // ✅ CORRECT - Pass Markdown
   * await pdfGenerator.generatePdf(
   *   asMarkdown('# Contract\n\nContent...'),
   *   './output/contract.pdf',
   *   { format: 'A4' }
   * );
   *
   * // ❌ INCORRECT - Don't pass HTML
   * await pdfGenerator.generatePdf(
   *   '<h1>Contract</h1>', // Wrong! This will produce incorrect output
   *   './output/contract.pdf',
   *   {}
   * );
   * ```
   */
  async generatePdf(
    markdownContent: MarkdownString,
    outputPath: string,
    options: PdfGeneratorOptions = {}
  ): Promise<Buffer> {
    let browser: puppeteer.Browser | null = null;
    let tempHtmlPath: string | null = null;

    try {
      logger.debug('Starting PDF generation', {
        outputPath,
        options,
      });

      // Generate HTML content first
      const htmlContent = await htmlGenerator.generateHtml(markdownContent, options);

      // Create temporary HTML file
      const tempDir = path.join(process.cwd(), '.temp');
      await fs.mkdir(tempDir, { recursive: true });
      tempHtmlPath = path.join(tempDir, `temp-${Date.now()}.html`);
      await fs.writeFile(tempHtmlPath, htmlContent, 'utf-8');

      // Ensure Chrome is available before launching
      await this.ensureChrome();

      // Launch browser with error handling
      logger.debug('Launching Puppeteer browser', {
        executablePath: this.puppeteerOptions.executablePath,
        platform: process.platform,
      });

      try {
        browser = await puppeteer.launch(this.puppeteerOptions);
      } catch (launchError: unknown) {
        // Provide helpful error message for macOS users
        if (process.platform === 'darwin') {
          const errorMessage = `
Failed to launch Chrome/Chromium for PDF generation.

Common solutions for macOS:
1. Run: npx puppeteer browsers install chrome
2. Install Google Chrome from: https://www.google.com/chrome/
3. If using M1/M2 Mac, ensure Rosetta 2 is installed: softwareupdate --install-rosetta
4. Try running with sudo if permission issues: sudo npm install

Original error: ${launchError instanceof Error ? launchError.message : String(launchError)}
`;
          throw new Error(errorMessage);
        }
        throw launchError;
      }

      const page = await browser.newPage();

      // Load the HTML file
      const fileUrl = `file://${path.resolve(tempHtmlPath)}`;
      await page.goto(fileUrl, {
        waitUntil: ['load', 'networkidle0'],
        timeout: 30000,
      });

      // Configure PDF options
      const pdfOptions: puppeteer.PDFOptions = {
        path: outputPath,
        format: options.format || 'A4',
        landscape: options.landscape || false,
        printBackground: options.printBackground !== false,
        displayHeaderFooter: false, // Will be set based on logo detection
        preferCSSPageSize: options.preferCSSPageSize || false,
        margin: options.margin || {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm',
        },
      };

      // Auto-detect logo and generate templates if cssPath provided
      let logoBase64: string | null = null;
      if (options.cssPath && !options.headerTemplate && !options.footerTemplate) {
        try {
          logger.debug('Auto-detecting logo from CSS', { cssPath: options.cssPath });

          const logoFilename = await detectLogoFromCSS(options.cssPath);
          if (logoFilename) {
            // Check if logoFilename is an external URL or local file
            if (logoFilename.startsWith('http://') || logoFilename.startsWith('https://')) {
              // Handle external URL
              logoBase64 = await downloadAndEncodeImage(logoFilename);
            } else {
              // Handle local file
              const logoPath = path.join(RESOLVED_PATHS.IMAGES_DIR, logoFilename);
              logoBase64 = await loadAndEncodeImage(logoPath);
            }

            logger.info('Logo detected and loaded successfully', {
              logoFilename,
              logoPath: logoFilename.startsWith('http')
                ? logoFilename
                : `${currentDir}/../assets/images/${logoFilename}`,
              cssPath: options.cssPath,
            });
          }
        } catch (error) {
          logger.warn('Logo detection failed, proceeding without logo', {
            cssPath: options.cssPath,
            error: error instanceof Error ? error.message : String(error),
          });
          // Continue without logo - graceful fallback
        }
      }

      // Generate header and footer templates
      let headerTemplate = options.headerTemplate;
      let footerTemplate = options.footerTemplate;

      if (!headerTemplate && !footerTemplate) {
        // Auto-generate templates based on logo detection
        headerTemplate = PdfTemplates.generateHeaderTemplate(logoBase64 || undefined);
        footerTemplate = PdfTemplates.generateFooterTemplate();
        pdfOptions.displayHeaderFooter = true;

        logger.debug('Auto-generated header/footer templates', {
          hasLogo: !!logoBase64,
          headerLength: headerTemplate.length,
          footerLength: footerTemplate.length,
        });
      } else {
        // Use manually provided templates
        pdfOptions.displayHeaderFooter = options.displayHeaderFooter || false;
      }

      // Set header and footer templates
      if (headerTemplate) {
        pdfOptions.headerTemplate = headerTemplate;
      }
      if (footerTemplate) {
        pdfOptions.footerTemplate = footerTemplate;
      }

      // Generate PDF
      logger.debug('Generating PDF with options', { pdfOptions });
      const pdfBuffer = await page.pdf(pdfOptions);

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Write PDF file
      await fs.writeFile(outputPath, pdfBuffer);

      logger.info('PDF generated successfully', {
        outputPath,
        size: pdfBuffer.length,
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      logger.error('Error generating PDF', { error });
      throw new Error(
        `Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      // Cleanup
      if (browser) {
        await browser.close();
      }
      if (tempHtmlPath) {
        try {
          await fs.unlink(tempHtmlPath);
        } catch (error) {
          logger.warn('Failed to delete temporary HTML file', { error });
        }
      }
    }
  }

  /**
   * Generate PDF from pre-generated HTML content
   *
   * This method accepts HTML that has already been generated by HtmlGenerator
   * and converts it directly to PDF, avoiding re-processing the markdown.
   * This is the preferred method for the 3-phase pipeline to avoid double conversion.
   *
   * @param {HtmlString} htmlContent - Pre-generated HTML content
   * @param {string} outputPath - Path where the PDF file will be saved
   * @param {PdfGeneratorOptions} [options={}] - Configuration options (note: CSS options are ignored since HTML is pre-generated)
   * @returns {Promise<Buffer>} A promise that resolves to the PDF buffer
   * @throws {Error} When PDF generation fails
   *
   * @example
   * ```typescript
   * import { htmlGenerator } from './html-generator';
   * import { asMarkdown } from '../../types/content-formats';
   *
   * // Generate HTML once
   * const html = await htmlGenerator.generateHtml(
   *   asMarkdown('# Contract\n\nContent...'),
   *   { cssPath: './styles.css', includeHighlighting: true }
   * );
   *
   * // Use the same HTML for PDF (no re-processing)
   * await pdfGenerator.generatePdfFromHtml(html, './contract.pdf', { format: 'A4' });
   * ```
   */
  async generatePdfFromHtml(
    htmlContent: string,
    outputPath: string,
    options: PdfGeneratorOptions = {}
  ): Promise<Buffer> {
    let browser: puppeteer.Browser | null = null;
    let tempHtmlPath: string | null = null;

    try {
      logger.debug('Starting PDF generation from HTML', {
        outputPath,
        htmlLength: htmlContent.length,
      });

      // Create temporary HTML file
      const tempDir = path.join(process.cwd(), '.temp');
      await fs.mkdir(tempDir, { recursive: true });
      tempHtmlPath = path.join(tempDir, `temp-${Date.now()}.html`);
      await fs.writeFile(tempHtmlPath, htmlContent, 'utf-8');

      // Ensure Chrome is available before launching
      await this.ensureChrome();

      // Launch browser with error handling
      logger.debug('Launching Puppeteer browser', {
        executablePath: this.puppeteerOptions.executablePath,
        platform: process.platform,
      });

      try {
        browser = await puppeteer.launch(this.puppeteerOptions);
      } catch (launchError: unknown) {
        // Provide helpful error message for macOS users
        if (process.platform === 'darwin') {
          const errorMessage = `
Failed to launch Chrome/Chromium for PDF generation.

Common solutions for macOS:
1. Run: npx puppeteer browsers install chrome
2. Install Google Chrome from: https://www.google.com/chrome/
3. If using M1/M2 Mac, ensure Rosetta 2 is installed: softwareupdate --install-rosetta
4. Try running with sudo if permission issues: sudo npm install

Original error: ${launchError instanceof Error ? launchError.message : String(launchError)}
`;
          throw new Error(errorMessage);
        }
        throw launchError;
      }

      const page = await browser.newPage();

      // Load the HTML file
      const fileUrl = `file://${path.resolve(tempHtmlPath)}`;
      await page.goto(fileUrl, {
        waitUntil: ['load', 'networkidle0'],
        timeout: 30000,
      });

      // Ensure output directory exists BEFORE generating PDF
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Configure PDF options
      const pdfOptions: puppeteer.PDFOptions = {
        path: outputPath,
        format: options.format || 'A4',
        landscape: options.landscape || false,
        printBackground: options.printBackground !== false,
        displayHeaderFooter: false,
        preferCSSPageSize: options.preferCSSPageSize || false,
        margin: options.margin || {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm',
        },
      };

      // Note: Logo detection from CSS is skipped here since HTML is pre-generated
      // If you need headers/footers, generate them when creating the HTML

      // Generate PDF (Puppeteer will write directly to outputPath)
      logger.debug('Generating PDF with options', { pdfOptions });
      const pdfBuffer = await page.pdf(pdfOptions);

      logger.info('PDF generated successfully from HTML', {
        outputPath,
        size: pdfBuffer.length,
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      logger.error('Error generating PDF from HTML', { error });
      throw new Error(
        `Failed to generate PDF from HTML: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      // Cleanup
      if (browser) {
        await browser.close();
      }
      if (tempHtmlPath) {
        try {
          await fs.unlink(tempHtmlPath);
        } catch (error) {
          logger.warn('Failed to delete temporary HTML file', { error });
        }
      }
    }
  }

  /**
   * Generate two PDF versions: one normal and one with highlighting
   *
   * This method creates two PDF versions of the same document:
   * 1. A normal version without field highlighting
   * 2. A highlighted version with field annotations
   *
   * This is useful for document review processes where both clean and
   * annotated versions are needed for different purposes.
   *
   * @param {string} markdownContent - The processed Legal Markdown content
   * @param {string} outputPath - Base path for PDF files (will be modified for each version)
   * @param {PdfGeneratorOptions} [options={}] - Configuration options for PDF generation
   * @returns {Promise<Object>} A promise that resolves to both PDF buffers
   * @returns {Buffer} returns.normal - The normal PDF without highlighting
   * @returns {Buffer} returns.highlighted - The highlighted PDF with field annotations
   * @throws {Error} When PDF generation fails for either version
   * @example
   * ```typescript
   * const { normal, highlighted } = await generator.generatePdfVersions(
   *   markdownContent,
   *   './contract.pdf',
   *   { format: 'A4' }
   * );
   * // Creates: contract.normal.pdf and contract.highlighted.pdf
   * ```
   */
  async generatePdfVersions(
    markdownContent: MarkdownString,
    outputPath: string,
    options: PdfGeneratorOptions = {}
  ): Promise<{
    normal: Buffer;
    highlighted: Buffer;
  }> {
    // Generate normal PDF
    const normalPath = outputPath.replace('.pdf', '.normal.pdf');
    const normalOptions = { ...options, includeHighlighting: false };
    const normalPdf = await this.generatePdf(markdownContent, normalPath, normalOptions);

    // Generate highlighted PDF
    const highlightedPath = outputPath.replace('.pdf', '.highlighted.pdf');
    const highlightedOptions = { ...options, includeHighlighting: true };
    const highlightedPdf = await this.generatePdf(
      markdownContent,
      highlightedPath,
      highlightedOptions
    );

    return {
      normal: normalPdf,
      highlighted: highlightedPdf,
    };
  }
}

/**
 * Singleton instance of PdfGenerator for convenient importing
 *
 * {PdfGenerator} pdfGenerator
 * @example
 * ```typescript
 * import { pdfGenerator } from './pdf-generator';
 * const pdf = await pdfGenerator.generatePdf(content, './output.pdf');
 * ```
 */
export const pdfGenerator = new PdfGenerator();
