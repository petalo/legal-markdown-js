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

/** Path to the compiled CLI executable */
const cliPath = path.resolve(__dirname, '..', '..', '..', 'dist', 'cli', 'index.js');

describe('CLI stdin/stdout functionality', () => {
  it('should read from stdin and write to stdout', (done) => {
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
      }
      expect(code).toBe(0);
      expect(output).toContain('First Section');
      expect(output).toContain('This is test content.');
      done();
    });

    child.stdin.write(input);
    child.stdin.end();
  });

  it('should read from stdin and write to file', (done) => {
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

    child.on('close', (code) => {
      expect(code).toBe(0);
      expect(fs.existsSync(outputPath)).toBe(true);
      
      const output = fs.readFileSync(outputPath, 'utf8');
      expect(output).toContain('First Section');
      expect(output).toContain('This is test content.');
      
      // Clean up
      fs.unlinkSync(outputPath);
      done();
    });

    child.stdin.write(input);
    child.stdin.end();
  });

  it('should process file and write to stdout', (done) => {
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
    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      expect(code).toBe(0);
      expect(output).toContain('First Section');
      expect(output).toContain('This is test content.');
      
      // Clean up
      if (fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
      }
      done();
    });
  });
});