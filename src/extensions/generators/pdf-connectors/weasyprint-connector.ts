import * as fsp from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { execFile, spawn } from 'child_process';
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

export class WeasyprintConnector implements PdfConnector {
  public readonly name = 'weasyprint';
  private executablePath: string | null = null;

  private async detectExecutablePath(): Promise<string | null> {
    if (this.executablePath) {
      return this.executablePath;
    }

    try {
      const { stdout } = await execFileAsync('which', ['weasyprint']);
      const resolved = stdout.trim();
      this.executablePath = resolved || null;
      return this.executablePath;
    } catch {
      this.executablePath = null;
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(await this.detectExecutablePath());
  }

  private buildPageCss(options: PdfOptions): string {
    const size = options.landscape ? `${options.format} landscape` : options.format;
    return `@page { size: ${size}; margin: ${options.margin.top} ${options.margin.right} ${options.margin.bottom} ${options.margin.left}; }`;
  }

  async generatePdf(html: string, outputPath: string, options: PdfOptions): Promise<void> {
    const executablePath = await this.detectExecutablePath();
    if (!executablePath) {
      throw new Error('weasyprint executable not found.');
    }

    await fsp.mkdir(path.dirname(outputPath), { recursive: true });

    const tempDir = path.join(os.tmpdir(), 'legal-md-weasyprint');
    await fsp.mkdir(tempDir, { recursive: true });
    const id = `${Date.now()}-${Math.random()}`;
    const tempHtmlPath = path.join(tempDir, `input-${id}.html`);
    const tempCssPath = path.join(tempDir, `print-${id}.css`);

    try {
      await fsp.writeFile(tempHtmlPath, html, 'utf8');
      await fsp.writeFile(tempCssPath, this.buildPageCss(options), 'utf8');

      const args = [
        '--media-type',
        'print',
        '--stylesheet',
        tempCssPath,
        tempHtmlPath,
        path.resolve(outputPath),
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
          reject(new Error(`weasyprint exited with code ${code ?? 'unknown'}`));
        });
      });
    } finally {
      await Promise.all([
        fsp.unlink(tempHtmlPath).catch(() => undefined),
        fsp.unlink(tempCssPath).catch(() => undefined),
      ]);
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
      const output = (stdout || stderr).trim();
      const versionMatch = output.match(/(\d+(?:\.\d+)+)/);

      return {
        name: this.name,
        version: versionMatch?.[1] ?? (output || 'unknown'),
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
