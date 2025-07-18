/**
 * @fileoverview End-to-end tests for CLI interface
 * 
 * Comprehensive tests for the command-line interface covering:
 * - Basic input/output file processing
 * - All CLI flags and options
 * - Flag combinations and complex scenarios
 * - Error handling and edge cases
 * - Metadata export functionality
 * - Processing options (yaml-only, headers-only, etc.)
 * 
 * These tests spawn actual CLI processes to verify real-world usage
 */

import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

/** Promisified exec for async/await usage */
const execAsync = promisify(exec);

describe('CLI Interface', () => {
  /** Temporary directory for test files */
  const testDir = path.join(__dirname, 'temp');
  
  /** Path to compiled CLI executable */
  const cliPath = path.resolve(__dirname, '..', '..', 'dist', 'cli', 'index.js');

  /**
   * Setup test directory before each test
   */
  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  /**
   * Clean up test directory after each test
   */
  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Basic command legal2md [input] [output]', () => {
    it('should process basic input and output files', async () => {
      const inputContent = `---
title: CLI Test Document
---

l. First Section
ll. Subsection

This is test content.`;

      const inputPath = path.join(testDir, 'input.md');
      const outputPath = path.join(testDir, 'output.md');

      fs.writeFileSync(inputPath, inputContent);

      try {
        const { stdout } = await execAsync(`node "${cliPath}" "${inputPath}" "${outputPath}"`);

        expect(fs.existsSync(outputPath)).toBe(true);

        const outputContent = fs.readFileSync(outputPath, 'utf8');
        expect(outputContent).toContain('Article 1. First Section');
        expect(outputContent).toContain('  Section 1. Subsection');
        expect(outputContent).toContain('This is test content.');
        expect(stdout).toContain('Successfully processed');
      } catch (error: any) {
        console.error('CLI Error:', error.stderr);
        throw new Error(`CLI command failed: ${error.message}`);
      }
    });

    it('should handle output to stdout when no output file specified', async () => {
      const inputContent = `---
title: Stdout Test
---

l. Test Header

Content for stdout.`;

      const inputPath = path.join(testDir, 'stdout-input.md');
      fs.writeFileSync(inputPath, inputContent);

      const { stdout } = await execAsync(`node ${cliPath} "${inputPath}"`);

      expect(stdout).toContain('Article 1. Test Header');
      expect(stdout).toContain('Content for stdout.');
    });

    it('should handle file not found error', async () => {
      const nonexistentPath = path.join(testDir, 'nonexistent.md');

      try {
        await execAsync(`node ${cliPath} "${nonexistentPath}"`);
        throw new Error('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(1);
        expect(error.stderr).toContain('Input file not found');
      }
    });
  });

  describe('--debug flag for debugging information', () => {
    it('should show metadata when debug flag is used', async () => {
      const inputContent = `---
title: Debug Test
author: Test Author
debug_field: debug_value
---

l. Debug Section

Debug content.`;

      const inputPath = path.join(testDir, 'debug-input.md');
      const outputPath = path.join(testDir, 'debug-output.md');

      fs.writeFileSync(inputPath, inputContent);

      const { stdout } = await execAsync(`node ${cliPath} --debug "${inputPath}" "${outputPath}"`);

      expect(stdout).toContain('Metadata:');
      expect(stdout).toContain('"title": "Debug Test"');
      expect(stdout).toContain('"author": "Test Author"');
      expect(stdout).toContain('"debug_field": "debug_value"');
    });

    it('should show exported files in debug mode', async () => {
      const inputContent = `---
title: Export Debug Test
meta-json-output: debug-metadata.json
---

Content with metadata export.`;

      const inputPath = path.join(testDir, 'export-debug.md');
      const outputPath = path.join(testDir, 'export-output.md');

      fs.writeFileSync(inputPath, inputContent);

      const { stdout } = await execAsync(
        `node ${cliPath} --debug --export-json --output-path "${testDir}" "${inputPath}" "${outputPath}"`
      );

      expect(stdout).toContain('Exported files:');
      expect(stdout).toContain('debug-metadata.json');
    });
  });

  describe('--yaml flag to process only YAML front matter', () => {
    it('should process only YAML when yaml flag is used', async () => {
      const inputContent = `---
title: YAML Only Test
author: YAML Author
---

l. This header should not be processed
ll. This subheader should not be processed

Regular content should remain unchanged.`;

      const inputPath = path.join(testDir, 'yaml-only.md');
      const outputPath = path.join(testDir, 'yaml-output.md');

      fs.writeFileSync(inputPath, inputContent);

      await execAsync(`node ${cliPath} --yaml "${inputPath}" "${outputPath}"`);

      const outputContent = fs.readFileSync(outputPath, 'utf8');
      expect(outputContent).toContain('l. This header should not be processed');
      expect(outputContent).toContain('ll. This subheader should not be processed');
      expect(outputContent).not.toContain('Article 1.');
      expect(outputContent).not.toContain('Section 1.');
    });
  });

  describe('--headers flag to process only headers', () => {
    it('should process only headers when headers flag is used', async () => {
      const inputContent = `---
title: Headers Only Test
---

l. This header should be processed
ll. This subheader should be processed

[Optional clause]{condition} should not be processed.
|reference| should not be processed.`;

      const inputPath = path.join(testDir, 'headers-only.md');
      const outputPath = path.join(testDir, 'headers-output.md');

      fs.writeFileSync(inputPath, inputContent);

      await execAsync(`node ${cliPath} --headers --no-mixins "${inputPath}" "${outputPath}"`);

      const outputContent = fs.readFileSync(outputPath, 'utf8');
      expect(outputContent).toContain('Article 1. This header should be processed');
      expect(outputContent).toContain('  Section 1. This subheader should be processed');
      expect(outputContent).toContain('[Optional clause]{condition}');
      expect(outputContent).toContain('|reference|');
    });
  });

  describe('--no-headers flag to skip header processing', () => {
    it('should skip header processing when no-headers flag is used', async () => {
      const inputContent = `---
title: No Headers Test
client_name: Test Client
---

l. This header should not be processed
ll. This subheader should not be processed

Cross reference: |client_name|`;

      const inputPath = path.join(testDir, 'no-headers.md');
      const outputPath = path.join(testDir, 'no-headers-output.md');

      fs.writeFileSync(inputPath, inputContent);

      await execAsync(`node ${cliPath} --no-headers --no-mixins --no-references "${inputPath}" "${outputPath}"`);

      const outputContent = fs.readFileSync(outputPath, 'utf8');
      expect(outputContent).toContain('l. This header should not be processed');
      expect(outputContent).toContain('Cross reference: |client_name|');
    });
  });

  describe('--export-yaml and --export-json output options', () => {
    it('should export metadata as YAML when export-yaml flag is used', async () => {
      const inputContent = `---
title: YAML Export CLI Test
author: CLI Author
export_data: true
---

Content for YAML export test.`;

      const inputPath = path.join(testDir, 'yaml-export.md');
      const outputPath = path.join(testDir, 'yaml-export-output.md');

      fs.writeFileSync(inputPath, inputContent);

      await execAsync(
        `node ${cliPath} --export-yaml --output-path "${testDir}" "${inputPath}" "${outputPath}"`
      );

      const metadataPath = path.join(testDir, 'metadata.yaml');
      expect(fs.existsSync(metadataPath)).toBe(true);

      const metadataContent = fs.readFileSync(metadataPath, 'utf8');
      expect(metadataContent).toContain('title: YAML Export CLI Test');
      expect(metadataContent).toContain('author: CLI Author');
      expect(metadataContent).toContain('export_data: true');
    });

    it('should export metadata as JSON when export-json flag is used', async () => {
      const inputContent = `---
title: JSON Export CLI Test
author: JSON Author
version: 1.0
---

Content for JSON export test.`;

      const inputPath = path.join(testDir, 'json-export.md');
      const outputPath = path.join(testDir, 'json-export-output.md');

      fs.writeFileSync(inputPath, inputContent);

      await execAsync(
        `node ${cliPath} --export-json --output-path "${testDir}" "${inputPath}" "${outputPath}"`
      );

      const metadataPath = path.join(testDir, 'metadata.json');
      expect(fs.existsSync(metadataPath)).toBe(true);

      const metadataContent = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      expect(metadataContent.title).toBe('JSON Export CLI Test');
      expect(metadataContent.author).toBe('JSON Author');
      expect(metadataContent.version).toBe(1.0);
    });

    it('should use custom output path for metadata export', async () => {
      const customPath = path.join(testDir, 'custom-metadata');
      fs.mkdirSync(customPath, { recursive: true });

      const inputContent = `---
title: Custom Path Test
---

Content.`;

      const inputPath = path.join(testDir, 'custom-path.md');

      fs.writeFileSync(inputPath, inputContent);

      await execAsync(`node ${cliPath} --export-json --output-path "${customPath}" "${inputPath}"`);

      const metadataPath = path.join(customPath, 'metadata.json');
      expect(fs.existsSync(metadataPath)).toBe(true);
    });
  });

  describe('--version flag to display version information', () => {
    it('should display version when version flag is used', async () => {
      const { stdout } = await execAsync(`node ${cliPath} --version`);

      expect(stdout).toContain('0.1.0');
    });
  });

  describe('Flag combinations and complex scenarios', () => {
    it('should handle multiple flags together', async () => {
      const inputContent = `---
title: Complex CLI Test
author: Complex Author
condition: true
reference_value: "test value"
---

l. Main Section
[Optional content]{condition}
Reference: |reference_value|`;

      const inputPath = path.join(testDir, 'complex.md');
      const outputPath = path.join(testDir, 'complex-output.md');

      fs.writeFileSync(inputPath, inputContent);

      const { stdout } = await execAsync(
        `node ${cliPath} --debug --export-json --output-path "${testDir}" "${inputPath}" "${outputPath}"`
      );

      expect(fs.existsSync(outputPath)).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'metadata.json'))).toBe(true);
      expect(stdout).toContain('Metadata:');
      expect(stdout).toContain('Exported files:');

      const outputContent = fs.readFileSync(outputPath, 'utf8');
      expect(outputContent).toContain('Article 1. Main Section');
      expect(outputContent).toContain('Optional content');
      expect(outputContent).toContain('Reference: test value');
    });

    it('should handle no-flags with all processing enabled', async () => {
      const importContent = 'Imported clause content.';
      const importPath = path.join(testDir, 'clause.md');
      fs.writeFileSync(importPath, importContent);

      const inputContent = `---
title: Full Processing Test
client: "ACME Corp"
include_warranty: true
---

l. Agreement
This agreement is between {{client}}.

@import clause.md

[Warranty provisions are included]{include_warranty}.`;

      const inputPath = path.join(testDir, 'full-processing.md');
      const outputPath = path.join(testDir, 'full-output.md');

      fs.writeFileSync(inputPath, inputContent);

      await execAsync(`node ${cliPath} "${inputPath}" "${outputPath}"`);

      const outputContent = fs.readFileSync(outputPath, 'utf8');
      expect(outputContent).toContain('Article 1. Agreement');
      expect(outputContent).toContain('This agreement is between ACME Corp.');
      expect(outputContent).toContain('Imported clause content.');
      expect(outputContent).toContain('Warranty provisions are included.');
    });

    it('should handle skip flags correctly', async () => {
      const inputContent = `---
title: Skip Processing Test
client: "Skip Corp"
include_clause: true
---

l. Header to skip
Cross reference: |client|
[Optional clause]{include_clause}`;

      // Use unique temporary directory for this test
      const tempDir = path.join(__dirname, 'temp-skip-test');
      fs.mkdirSync(tempDir, { recursive: true });
      
      const inputPath = path.join(tempDir, 'skip-test.md');
      const outputPath = path.join(tempDir, 'skip-output.md');

      fs.writeFileSync(inputPath, inputContent);
      
      // Verify file was created
      expect(fs.existsSync(inputPath)).toBe(true);

      await execAsync(
        `node ${cliPath} --no-headers --no-clauses --no-references --no-mixins "${inputPath}" "${outputPath}"`
      );

      const outputContent = fs.readFileSync(outputPath, 'utf8');
      expect(outputContent).toContain('l. Header to skip');
      expect(outputContent).toContain('Cross reference: |client|');
      expect(outputContent).toContain('[Optional clause]{include_clause}');
      
      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });

  describe('Error handling', () => {
    it('should handle missing input file argument', async () => {
      try {
        await execAsync(`node ${cliPath}`);
        throw new Error('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(1);
        expect(error.stderr).toContain('Input file is required');
      }
    });

    it('should handle invalid file paths gracefully', async () => {
      const invalidPath = '/invalid/path/that/does/not/exist.md';

      try {
        await execAsync(`node ${cliPath} "${invalidPath}"`);
        throw new Error('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(1);
        expect(error.stderr).toContain('Input file not found');
      }
    });

    it('should handle processing errors gracefully', async () => {
      const inputContent = `---
invalid: yaml: content: [
---

Content with invalid YAML.`;

      const inputPath = path.join(testDir, 'invalid-yaml.md');
      const outputPath = path.join(testDir, 'invalid-output.md');

      fs.writeFileSync(inputPath, inputContent);

      try {
        await execAsync(`node ${cliPath} --throwOnYamlError "${inputPath}" "${outputPath}"`);
        throw new Error('Should have thrown an error');
      } catch (error: any) {
        // Check if the command failed (error.code is the exit code)
        expect(error.code || error.exitCode).toBe(1);
        expect(error.stderr || error.message).toContain('Error');
      }
    });
  });
});
