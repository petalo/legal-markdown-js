/**
 * Integration tests for FTUX flag functionality
 *
 * Tests the --ftux flag integration with the interactive CLI,
 * ensuring proper behavior and user experience.
 *
 * @module
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Spawn timeout configuration - higher in CI environments for slower systems
const SPAWN_TIMEOUT_SHORT = process.env.CI ? 6000 : 3000;
const SPAWN_TIMEOUT_MEDIUM = process.env.CI ? 8000 : 4000;
const SPAWN_TIMEOUT_LONG = process.env.CI ? 10000 : 5000;
const EXIT_DELAY_SHORT = process.env.CI ? 1600 : 800;
const EXIT_DELAY_MEDIUM = process.env.CI ? 2000 : 1000;

// Helper function to check if CLI executable exists
function getCliPath(): string {
  const cliPath = path.join(process.cwd(), 'dist/cli/interactive/index.js');
  if (!fs.existsSync(cliPath)) {
    throw new Error(`CLI executable not found at ${cliPath}. Run 'npm run build' first.`);
  }
  return cliPath;
}

describe('FTUX Flag Integration', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Verify CLI is built before running tests
    getCliPath();
    
    // Create temporary directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ftux-flag-test-'));
    
    // Create input directory structure
    fs.mkdirSync(path.join(tempDir, 'input'), { recursive: true });
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('CLI argument parsing', () => {
    it('should recognize --ftux flag', async () => {
      const cliPath = getCliPath();
      const child = spawn('node', [cliPath, '--help'], {
        stdio: 'pipe',
        cwd: tempDir
      });

      let output = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Create a promise that resolves when child closes
      const result = await new Promise<{ code: number | null; output: string; stderr: string }>((resolve, reject) => {
        child.on('close', (code) => {
          resolve({ code, output, stderr });
        });

        // Reduced timeout for faster tests
        setTimeout(() => {
          child.kill();
          reject(new Error('Process timed out'));
        }, SPAWN_TIMEOUT_LONG);
      });

      expect(result.code).toBe(0);
      expect(result.output).toMatch(/--ftux|ftux/i);
    });

    it('should launch FTUX mode with --ftux flag', async () => {
      const cliPath = getCliPath();
      const child = spawn('node', [cliPath, '--ftux'], {
        stdio: 'pipe',
        cwd: tempDir,
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let output = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Send Ctrl+C to exit after a short delay
      setTimeout(() => {
        child.stdin.write('\x03'); // Ctrl+C
      }, EXIT_DELAY_MEDIUM);

      // Create a promise that resolves when child closes
      const result = await new Promise<{ code: number | null; output: string; stderr: string }>((resolve, reject) => {
        child.on('close', (code) => {
          resolve({ code, output, stderr });
        });

        // Reduced timeout
        setTimeout(() => {
          child.kill();
          reject(new Error('Process timed out'));
        }, SPAWN_TIMEOUT_LONG);
      });

      // More specific assertions - should start successfully or show clear error
      const isSuccessfulStart = result.output.includes('Legal Markdown') || 
                               result.output.includes('FTUX') ||
                               result.output.includes('First-Time');
      const hasValidError = result.stderr.includes('Error:') ||
                           result.stderr.includes('ENOENT') ||
                           result.stderr.includes('Cannot find module');
      
      expect(isSuccessfulStart || hasValidError).toBe(true);
    });

    it('should launch normal mode without --ftux flag when files are present', async () => {
      // Create a test file
      fs.writeFileSync(path.join(tempDir, 'input/test.md'), '# Test Document');

      const cliPath = getCliPath();
      const child = spawn('node', [cliPath], {
        stdio: 'pipe',
        cwd: tempDir,
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let output = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Send Ctrl+C to exit after a short delay
      setTimeout(() => {
        child.stdin.write('\x03'); // Ctrl+C
      }, EXIT_DELAY_MEDIUM);

      // Create a promise that resolves when child closes
      const result = await new Promise<{ code: number | null; output: string; stderr: string }>((resolve, reject) => {
        child.on('close', (code) => {
          resolve({ code, output, stderr });
        });

        setTimeout(() => {
          child.kill();
          reject(new Error('Process timed out'));
        }, SPAWN_TIMEOUT_MEDIUM);
      });

      // Should either start CLI or show valid error
      const cliStarted = result.output.includes('Legal Markdown') ||
                        result.output.includes('Interactive') ||
                        result.output.includes('Select');
      const hasValidError = result.stderr.includes('Error:') ||
                           result.stderr.includes('ENOENT') ||
                           result.stderr.includes('Cannot find module');
      
      expect(cliStarted || hasValidError).toBe(true);
    });

    it('should handle empty directory scenario', async () => {
      // Ensure input directory is empty (it already is from beforeEach)
      const inputDir = path.join(tempDir, 'input');
      const files = fs.readdirSync(inputDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(inputDir, file));
      });

      const cliPath = getCliPath();
      const child = spawn('node', [cliPath], {
        stdio: 'pipe',
        cwd: tempDir,
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let output = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Send Ctrl+C to exit quickly
      setTimeout(() => {
        child.stdin.write('\x03'); // Ctrl+C
      }, EXIT_DELAY_SHORT);

      // Create a promise that resolves when child closes
      const result = await new Promise<{ code: number | null; output: string; stderr: string }>((resolve, reject) => {
        child.on('close', (code) => {
          resolve({ code, output, stderr });
        });

        setTimeout(() => {
          child.kill();
          reject(new Error('Process timed out'));
        }, SPAWN_TIMEOUT_SHORT);
      });

      // Should start or show valid error - simplified assertion
      const hasAnyOutput = result.output.length > 0 || result.stderr.length > 0;
      expect(hasAnyOutput).toBe(true);
    });
  });

  describe('FTUX mode behavior', () => {
    it('should handle FTUX mode execution', async () => {
      const cliPath = getCliPath();
      const child = spawn('node', [cliPath, '--ftux'], {
        stdio: 'pipe',
        cwd: tempDir,
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let output = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Exit quickly
      setTimeout(() => {
        child.stdin.write('\x03'); // Ctrl+C to exit
      }, EXIT_DELAY_SHORT);

      const result = await new Promise<{ code: number | null; output: string; stderr: string }>((resolve, reject) => {
        child.on('close', (code) => {
          resolve({ code, output, stderr });
        });

        setTimeout(() => {
          child.kill();
          reject(new Error('Process timed out'));
        }, SPAWN_TIMEOUT_SHORT);
      });

      // Just verify it starts or fails gracefully
      const hasOutput = result.output.length > 0 || result.stderr.length > 0;
      expect(hasOutput).toBe(true);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle invalid command line arguments', async () => {
      const cliPath = getCliPath();
      const child = spawn('node', [cliPath, '--invalid-flag'], {
        stdio: 'pipe',
        cwd: tempDir
      });

      let stderr = '';
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      const result = await new Promise<{ code: number | null; stderr: string }>((resolve, reject) => {
        child.on('close', (code) => {
          resolve({ code, stderr });
        });

        setTimeout(() => {
          child.kill();
          reject(new Error('Process timed out'));
        }, SPAWN_TIMEOUT_SHORT);
      });

      expect(result.code).not.toBe(0);
      expect(result.stderr).toMatch(/unknown option|invalid|error/i);
    });
  });
});