/**
 * @fileoverview Integration tests for Interactive CLI
 */

import { expect, describe, it, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import { CLI_PATHS } from '../../utils/cli-paths.js';

describe('Interactive CLI Integration', () => {
  const testInputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'legal-md-test-input-'));
  const testOutputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'legal-md-test-output-'));
  const cliPath = CLI_PATHS.interactive;
  const activeProcesses: Set<any> = new Set();

  beforeAll(() => {
    // Test directories already created with mkdtempSync

    // Create test input file
    const testContent = `---
title: Integration Test Document
author: Test Suite
date: 2024-07-28
---

# {{title}}

By: {{author}}
Date: {{date}}

This is a test document for integration testing.`;

    fs.writeFileSync(path.join(testInputDir, 'integration-test.md'), testContent);
  });

  afterAll(async () => {
    // Kill any remaining processes
    for (const process of activeProcesses) {
      if (!process.killed) {
        process.kill('SIGKILL');
      }
    }
    activeProcesses.clear();

    // Clean up test files
    try {
      fs.rmSync(testInputDir, { recursive: true, force: true });
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }

    // Give processes time to cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  it('should display file selection prompt when started', async () => {
    const child = spawn('node', [cliPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        DEFAULT_INPUT_DIR: testInputDir,
        DEFAULT_OUTPUT_DIR: testOutputDir,
      },
    });
    
    activeProcesses.add(child);

    return new Promise((resolve, reject) => {
      let output = '';
      let foundExpectedOutput = false;

      child.stdout.on('data', (data) => {
        output += data.toString();
        
        // Check if we see the expected prompts (without emojis to avoid encoding issues)
        if (output.includes('Legal Markdown Interactive CLI') && 
            output.includes('Searching for files in:')) {
          foundExpectedOutput = true;
          child.kill('SIGTERM');
        }
      });

      child.on('exit', () => {
        activeProcesses.delete(child);
        clearTimeout(timeout);
        
        if (foundExpectedOutput) {
          expect(output).toContain('Legal Markdown Interactive CLI');
          expect(output).toContain('Searching for files in:');
          resolve(void 0);
        } else {
          reject(new Error('Expected output not found'));
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      // Shorter timeout to prevent hanging
      const timeout = setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGTERM');
        }
        if (!foundExpectedOutput) {
          reject(new Error('Test timed out'));
        }
      }, 30000);
    });
  }, 40000);

  it('should handle graceful exit when user cancels', async () => {
    const child = spawn('node', [cliPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        DEFAULT_INPUT_DIR: testInputDir,
        DEFAULT_OUTPUT_DIR: testOutputDir,
      },
    });
    
    activeProcesses.add(child);

    return new Promise((resolve, reject) => {
      let output = '';
      let cancelled = false;

      child.stdout.on('data', (data) => {
        output += data.toString();
        
        // Wait for the file selection prompt, then simulate cancellation
        if (output.includes('Select an input file:') && !cancelled) {
          cancelled = true;
          child.kill('SIGINT');
        }
      });

      child.on('exit', (code, signal) => {
        activeProcesses.delete(child);
        clearTimeout(timeout);
        
        if ((signal === 'SIGINT' || code === 0) && cancelled) {
          resolve(void 0);
        } else if (!cancelled) {
          reject(new Error('Process exited before cancellation could be tested'));
        } else {
          reject(new Error(`Unexpected exit: code=${code}, signal=${signal}`));
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      // Shorter timeout
      const timeout = setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGTERM');
        }
        reject(new Error('Test timed out'));
      }, 30000);
    });
  }, 40000);

  it('should handle empty input directory gracefully', async () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'legal-md-test-empty-'));

    const child = spawn('node', [cliPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        DEFAULT_INPUT_DIR: emptyDir,
        DEFAULT_OUTPUT_DIR: testOutputDir,
      },
    });
    
    activeProcesses.add(child);

    return new Promise((resolve, reject) => {
      let output = '';
      let foundWarning = false;

      child.stdout.on('data', (data) => {
        output += data.toString();
        
        // Should show warning about no files found
        if (output.includes('No supported files found')) {
          foundWarning = true;
          child.kill('SIGTERM');
        }
      });

      child.on('exit', () => {
        activeProcesses.delete(child);
        clearTimeout(timeout);
        
        // Clean up empty directory
        try {
          fs.rmSync(emptyDir, { recursive: true, force: true });
        } catch (error) {
          // Ignore cleanup errors
        }

        if (foundWarning) {
          expect(output).toContain('No supported files found');
          resolve(void 0);
        } else {
          reject(new Error('Expected warning message not found'));
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      // Shorter timeout
      const timeout = setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGTERM');
        }
        try {
          fs.rmSync(emptyDir, { recursive: true, force: true });
        } catch (error) {
          // Ignore cleanup errors
        }
        if (!foundWarning) {
          reject(new Error('Test timed out'));
        }
      }, 30000);
    });
  }, 40000);
});