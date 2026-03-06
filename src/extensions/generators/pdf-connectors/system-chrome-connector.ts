import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as fsp from 'fs/promises';
import { execFile, spawn } from 'child_process';
import { pathToFileURL } from 'url';
import type { ConnectorInfo, PdfConnector, PdfOptions } from './types';

function execFileAsync(
  command: string,
  args: string[]
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(command, args, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

export class SystemChromeConnector implements PdfConnector {
  public readonly name = 'system-chrome';
  private detectedExecutablePath: string | null = null;

  constructor(private readonly runtimePlatform: NodeJS.Platform = process.platform) {}

  private async detectExecutablePath(): Promise<string | null> {
    if (this.detectedExecutablePath) {
      return this.detectedExecutablePath;
    }

    let candidate: string | null = null;

    if (this.runtimePlatform === 'darwin') {
      // Chromium-family browsers checked in preference order: Chrome first
      // (most common), then open-source Chromium, then Edge, Brave, and Arc.
      const macCandidates = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        '/Applications/Arc.app/Contents/MacOS/Arc',
      ];

      candidate = macCandidates.find(entry => fs.existsSync(entry)) ?? null;
    } else if (this.runtimePlatform === 'linux') {
      for (const executable of [
        'google-chrome',
        'chromium',
        'chromium-browser',
        'microsoft-edge',
        'brave-browser',
      ]) {
        try {
          const { stdout } = await execFileAsync('which', [executable]);
          const resolved = stdout.trim();
          if (resolved) {
            candidate = resolved;
            break;
          }
        } catch {
          continue;
        }
      }
    } else if (this.runtimePlatform === 'win32') {
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
      ].filter((entry): entry is string => Boolean(entry));

      candidate = windowsCandidates.find(entry => fs.existsSync(entry)) ?? null;
    }

    this.detectedExecutablePath = candidate;
    return candidate;
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(await this.detectExecutablePath());
  }

  private withPageCss(html: string, options: PdfOptions): string {
    const size = options.landscape ? `${options.format} landscape` : options.format;
    const pageCss = `@page { size: ${size}; margin: ${options.margin.top} ${options.margin.right} ${options.margin.bottom} ${options.margin.left}; }`;

    if (html.includes('</head>')) {
      return html.replace('</head>', `<style>${pageCss}</style></head>`);
    }

    return `<html><head><style>${pageCss}</style></head><body>${html}</body></html>`;
  }

  async generatePdf(html: string, outputPath: string, options: PdfOptions): Promise<void> {
    const executablePath = await this.detectExecutablePath();
    if (!executablePath) {
      throw new Error('No system Chrome/Chromium/Edge/Brave/Arc executable found.');
    }

    const outputDir = path.dirname(outputPath);
    await fsp.mkdir(outputDir, { recursive: true });

    const tempDir = path.join(os.tmpdir(), 'legal-md-system-chrome');
    await fsp.mkdir(tempDir, { recursive: true });
    // Combine timestamp + random suffix to avoid filename collisions when
    // multiple documents are rendered in rapid succession (e.g. batch mode).
    const tempHtmlPath = path.join(tempDir, `input-${Date.now()}-${Math.random()}.html`);

    try {
      await fsp.writeFile(tempHtmlPath, this.withPageCss(html, options), 'utf8');

      const fileUrl = pathToFileURL(path.resolve(tempHtmlPath)).toString();
      const args = [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--print-to-pdf-no-header',
        `--print-to-pdf=${path.resolve(outputPath)}`,
        fileUrl,
      ];

      await new Promise<void>((resolve, reject) => {
        const child = spawn(executablePath, args, {
          stdio: 'ignore',
        });

        child.on('error', error => {
          reject(error);
        });

        child.on('exit', code => {
          if (code === 0) {
            resolve();
            return;
          }
          reject(new Error(`System chrome print-to-pdf exited with code ${code ?? 'unknown'}`));
        });
      });
    } finally {
      await fsp.unlink(tempHtmlPath).catch(() => undefined);
    }
  }

  async getInfo(): Promise<ConnectorInfo> {
    const executablePath = await this.detectExecutablePath();
    if (!executablePath) {
      return {
        name: this.name,
        version: 'not-installed',
      };
    }

    try {
      const { stdout, stderr } = await execFileAsync(executablePath, ['--version']);
      const version = (stdout || stderr).trim() || 'unknown';
      return {
        name: this.name,
        version,
        executablePath,
      };
    } catch {
      return {
        name: this.name,
        version: 'unknown',
        executablePath,
      };
    }
  }
}
