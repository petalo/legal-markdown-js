import { spawn } from 'child_process';
import { PandocParser, PandocOptions } from '../pandoc-parser';

/**
 * Native pandoc implementation for Node.js
 */
export class PandocNative implements PandocParser {
  private options: PandocOptions;

  constructor(options: PandocOptions = {}) {
    this.options = {
      timeout: 10000, // 10 seconds default timeout
      verbose: false,
      ...options,
    };
  }

  /**
   * Convert content using native pandoc binary
   */
  async convert(content: string, from: 'rst' | 'latex', to: 'markdown'): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = ['-f', from, '-t', to, '--wrap=none'];

      // Add any additional arguments
      if (this.options.args) {
        args.push(...this.options.args);
      }

      if (this.options.verbose) {
        console.log(`Running pandoc with args: ${args.join(' ')}`);
      }

      const pandoc = spawn('pandoc', args);

      let output = '';
      let error = '';

      // Set up timeout
      const timeout = setTimeout(() => {
        pandoc.kill();
        reject(new Error(`Pandoc conversion timed out after ${this.options.timeout}ms`));
      }, this.options.timeout);

      pandoc.stdout.on('data', data => {
        output += data.toString();
      });

      pandoc.stderr.on('data', data => {
        error += data.toString();
      });

      pandoc.on('close', code => {
        clearTimeout(timeout);

        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Pandoc failed with code ${code}: ${error}`));
        }
      });

      pandoc.on('error', err => {
        clearTimeout(timeout);
        reject(new Error(`Failed to start pandoc: ${err.message}`));
      });

      // Write input and close stdin
      pandoc.stdin.write(content);
      pandoc.stdin.end();
    });
  }
}
