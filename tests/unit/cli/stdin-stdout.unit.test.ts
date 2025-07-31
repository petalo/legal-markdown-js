/**
 * @fileoverview Tests for CLI stdin/stdout functionality
 * 
 * Tests the command-line interface's ability to:
 * - Read from stdin and write to stdout
 * - Read from stdin and write to file
 * - Read from file and write to stdout
 * 
 * These tests spawn actual CLI processes to verify end-to-end functionality
 */

import { spawn } from 'child_process';
import * as path from 'path';
import type { TaskContext } from 'vitest';
import { getBestCliPath } from '../../utils/cli-paths.js';

/** Path to the compiled CLI executable */
const cliPath = getBestCliPath();

describe('CLI stdin/stdout functionality', () => {
  it('should read from stdin and write to stdout', () => {
    return new Promise<void>((resolve, reject) => {
      const child = spawn('node', [cliPath, '--stdin', '--stdout']);

      const input = `---
title: Test Document
---

l. First Section
This is test content.
`;

      let output = '';
      let errorOutput = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code !== 0) {
          console.log('CLI Error:', errorOutput);
          console.log('CLI Output:', output);
          console.log('CLI Path:', cliPath);
          reject(new Error(`CLI exited with code ${code}. Error: ${errorOutput}`));
          return;
        }
        
        try {
          expect(code).toBe(0);
          expect(output).toContain('Article 1. First Section');
          expect(output).toContain('This is test content.');
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to spawn CLI process: ${error.message}`));
      });

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('Test timed out'));
      }, 8000);

      child.on('close', () => {
        clearTimeout(timeout);
      });

      child.stdin.write(input);
      child.stdin.end();
    });
  }, 10000);

  it('should read from stdin and write to file', () => {
    return new Promise<void>((resolve, reject) => {
      const fs = require('fs');
      const outputPath = path.join(__dirname, 'temp-output.md');

      // Clean up any existing file
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }

      const child = spawn('node', [cliPath, '--stdin', outputPath]);

      const input = `---
title: Test Document
---

l. First Section
This is test content.
`;

      let errorOutput = '';
      
      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code !== 0) {
          console.log('CLI Error:', errorOutput);
          reject(new Error(`CLI exited with code ${code}. Error: ${errorOutput}`));
          return;
        }
        
        try {
          expect(code).toBe(0);
          expect(fs.existsSync(outputPath)).toBe(true);
          
          const output = fs.readFileSync(outputPath, 'utf8');
          expect(output).toContain('Article 1. First Section');
          expect(output).toContain('This is test content.');
          
          // Clean up
          fs.unlinkSync(outputPath);
          resolve();
        } catch (error) {
          // Clean up on error
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
          }
          reject(error);
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to spawn CLI process: ${error.message}`));
      });

      // Add timeout
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
        reject(new Error('Test timed out'));
      }, 8000);

      child.on('close', () => {
        clearTimeout(timeout);
      });

      child.stdin.write(input);
      child.stdin.end();
    });
  }, 10000);

  it('should process file and write to stdout', () => {
    return new Promise<void>((resolve, reject) => {
      const fs = require('fs');
      const inputPath = path.join(__dirname, 'temp-input.md');
      
      const inputContent = `---
title: Test Document
---

l. First Section
This is test content.
`;

      fs.writeFileSync(inputPath, inputContent);

      const child = spawn('node', [cliPath, inputPath, '--stdout']);

      let output = '';
      let errorOutput = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code !== 0) {
          console.log('CLI Error:', errorOutput);
          console.log('CLI Output:', output);
          reject(new Error(`CLI exited with code ${code}. Error: ${errorOutput}`));
          return;
        }
        
        try {
          expect(code).toBe(0);
          expect(output).toContain('Article 1. First Section');
          expect(output).toContain('This is test content.');
          
          // Clean up
          if (fs.existsSync(inputPath)) {
            fs.unlinkSync(inputPath);
          }
          resolve();
        } catch (error) {
          // Clean up on error
          if (fs.existsSync(inputPath)) {
            fs.unlinkSync(inputPath);
          }
          reject(error);
        }
      });

      child.on('error', (error) => {
        // Clean up on error
        if (fs.existsSync(inputPath)) {
          fs.unlinkSync(inputPath);
        }
        reject(new Error(`Failed to spawn CLI process: ${error.message}`));
      });

      // Add timeout
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        if (fs.existsSync(inputPath)) {
          fs.unlinkSync(inputPath);
        }
        reject(new Error('Test timed out'));
      }, 8000);

      child.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }, 10000);
});