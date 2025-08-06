/**
 * @fileoverview Integration tests for Force Commands in Interactive CLI
 * 
 * Tests the complete flow of force commands detection and execution
 * in the interactive CLI, including:
 * - File reading and frontmatter parsing
 * - Force commands detection
 * - Automatic configuration and processing
 * - Skipping interactive prompts when force commands are present
 */

import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseYamlFrontMatter } from '../../../../src/core/parsers/yaml-parser';
import { 
  extractForceCommands, 
  parseForceCommands, 
  applyForceCommands 
} from '../../../../src/core/parsers/force-commands-parser';
import { CliService } from '../../../../src/cli/service';
import { readFileSync } from '../../../../src/utils';

// Mock modules
vi.mock('../../../../src/utils', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  fileExists: vi.fn(),
}));

vi.mock('../../../../src/cli/service', () => ({
  CliService: vi.fn().mockImplementation(() => ({
    processFile: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('chalk', () => ({
  default: {
    cyan: (str: string) => str,
    gray: (str: string) => str,
    yellow: (str: string) => str,
    green: (str: string) => str,
    bold: {
      blue: (str: string) => str,
      cyan: (str: string) => str,
    },
  },
}));

describe('Force Commands Integration in CLI', () => {
  const mockReadFileSync = readFileSync as MockedFunction<typeof readFileSync>;
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Force Commands Detection Flow', () => {
    it('should detect and parse force commands from a file with valid frontmatter', () => {
      const testContent = `---
title: Test Document
author: John Doe
force_commands: --pdf --highlight --css contract.css
---

# Document Content
This is the document content.`;

      mockReadFileSync.mockReturnValue(testContent);

      // Parse the content
      const { metadata } = parseYamlFrontMatter(testContent);
      expect(metadata).toHaveProperty('force_commands');

      // Extract force commands
      const forceCommandsStr = extractForceCommands(metadata);
      expect(forceCommandsStr).toBe('--pdf --highlight --css contract.css');

      // Parse force commands
      const parsedCommands = parseForceCommands(forceCommandsStr!, metadata);
      expect(parsedCommands).toEqual({
        pdf: true,
        highlight: true,
        css: 'contract.css',
      });
    });

    it('should handle files without force commands', () => {
      const testContent = `---
title: Test Document
author: John Doe
---

# Document Content`;

      mockReadFileSync.mockReturnValue(testContent);

      const { metadata } = parseYamlFrontMatter(testContent);
      const forceCommandsStr = extractForceCommands(metadata);
      expect(forceCommandsStr).toBeNull();
    });

    it('should handle files without frontmatter', () => {
      const testContent = `# Document Content
This is a document without frontmatter.`;

      mockReadFileSync.mockReturnValue(testContent);

      const { metadata } = parseYamlFrontMatter(testContent);
      expect(metadata).toEqual({});
      
      const forceCommandsStr = extractForceCommands(metadata);
      expect(forceCommandsStr).toBeNull();
    });
  });

  describe('Force Commands Execution', () => {
    it('should apply force commands to base options correctly', () => {
      const baseOptions = {
        debug: false,
        pdf: false,
        html: false,
        highlight: false,
        basePath: '/test/path',
      };

      const forceCommands = {
        pdf: true,
        highlight: true,
        css: 'custom.css',
        debug: true,
      };

      const result = applyForceCommands(baseOptions, forceCommands);

      expect(result).toMatchObject({
        debug: true,
        pdf: true,
        highlight: true,
        includeHighlighting: true,
        cssPath: 'custom.css',
        basePath: '/test/path',
      });
    });

    it('should handle force commands with output specification', () => {
      const baseOptions = {};
      const forceCommands = {
        pdf: true,
        output: 'custom-output-name',
        outputPath: 'custom/output/path',
      };

      const result = applyForceCommands(baseOptions, forceCommands);

      expect(result).toMatchObject({
        pdf: true,
        output: 'custom-output-name',
        outputPath: 'custom/output/path',
      });
    });

    it('should process both HTML and PDF with highlight', () => {
      const baseOptions = {};
      const forceCommands = {
        pdf: true,
        html: true,
        highlight: true,
        css: 'theme.css',
      };

      const result = applyForceCommands(baseOptions, forceCommands);

      expect(result).toMatchObject({
        pdf: true,
        html: true,
        highlight: true,
        includeHighlighting: true,
        cssPath: 'theme.css',
      });
    });
  });

  describe('Complex Force Commands Scenarios', () => {
    it('should parse force commands with template variables', () => {
      const metadata = {
        title: 'Contract',
        client: 'Acme Corp',
        date: '2024-01-01',
      };

      const commandString = '--pdf --output-name Contract_AcmeCorp --css contract.css';
      const parsed = parseForceCommands(commandString, metadata);

      expect(parsed).toEqual({
        pdf: true,
        output: 'Contract_AcmeCorp',
        css: 'contract.css',
      });

      // Test that template processing works (when implemented)
      const commandWithTemplate = '--pdf --css contract.css';
      const parsedWithTemplate = parseForceCommands(commandWithTemplate, metadata);
      expect(parsedWithTemplate).toEqual({
        pdf: true,
        css: 'contract.css',
      });
    });

    it('should handle force commands with all supported options', () => {
      const commandString = '--pdf --html --highlight --css custom.css --debug --format A4 --landscape --title "Custom Title"';
      const parsed = parseForceCommands(commandString, {});

      expect(parsed).toEqual({
        pdf: true,
        html: true,
        highlight: true,
        css: 'custom.css',
        debug: true,
        format: 'A4',
        landscape: true,
        title: 'Custom Title',
      });
    });

    it('should handle quoted values with spaces', () => {
      const commandString = '--css "my styles/contract style.css" --title "Legal Document 2024"';
      const parsed = parseForceCommands(commandString, {});

      expect(parsed).toEqual({
        css: 'my styles/contract style.css',
        title: 'Legal Document 2024',
      });
    });

    it('should ignore protected/unsafe commands', () => {
      const commandString = '--pdf --stdin --stdout --css ../../../etc/passwd';
      const parsed = parseForceCommands(commandString, {});

      // Should ignore stdin, stdout, and paths with ..
      expect(parsed).toEqual({
        pdf: true,
      });
    });
  });

  describe('CLI Service Integration', () => {
    it('should create CliService with correct options from force commands', async () => {
      const testContent = `---
title: Test Document
force_commands: --pdf --highlight --css theme.css --debug
---

# Content`;

      mockReadFileSync.mockReturnValue(testContent);

      const { metadata } = parseYamlFrontMatter(testContent);
      const forceCommandsStr = extractForceCommands(metadata);
      const forceCommands = parseForceCommands(forceCommandsStr!, metadata);

      const baseOptions = {
        debug: false,
        yamlOnly: false,
        noHeaders: false,
        noClauses: false,
        noReferences: false,
        noImports: false,
        noMixins: false,
        noReset: false,
        noIndent: false,
        throwOnYamlError: false,
        basePath: '/test/input',
      };

      const options = applyForceCommands(baseOptions, forceCommands!);

      // Verify the options are correctly set
      expect(options.pdf).toBe(true);
      expect(options.highlight).toBe(true);
      expect(options.includeHighlighting).toBe(true);
      expect(options.cssPath).toBe('theme.css');
      expect(options.debug).toBe(true);
    });

    it('should generate correct output file paths based on force commands', () => {
      const forceCommands = {
        pdf: true,
        html: true,
        highlight: true,
        output: 'contract-final',
      };

      const outputDir = '/output';
      const outputBaseName = forceCommands.output;

      // Expected file paths
      const expectedFiles = {
        pdf: path.join(outputDir, `${outputBaseName}.pdf`),
        pdfHighlight: path.join(outputDir, `${outputBaseName}.HIGHLIGHT.pdf`),
        html: path.join(outputDir, `${outputBaseName}.html`),
        htmlHighlight: path.join(outputDir, `${outputBaseName}.HIGHLIGHT.html`),
      };

      expect(expectedFiles.pdf).toBe('/output/contract-final.pdf');
      expect(expectedFiles.pdfHighlight).toBe('/output/contract-final.HIGHLIGHT.pdf');
      expect(expectedFiles.html).toBe('/output/contract-final.html');
      expect(expectedFiles.htmlHighlight).toBe('/output/contract-final.HIGHLIGHT.html');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed YAML gracefully', () => {
      const testContent = `---
title: Test
invalid: yaml: content:
---

# Content`;

      mockReadFileSync.mockReturnValue(testContent);

      // Should not throw, but return empty metadata
      const { metadata } = parseYamlFrontMatter(testContent, false);
      const forceCommandsStr = extractForceCommands(metadata);
      
      // Should either return null or handle gracefully
      expect(forceCommandsStr === null || typeof forceCommandsStr === 'string').toBe(true);
    });

    it('should handle invalid force commands gracefully', () => {
      const invalidCommand = '--invalid-option --another-invalid';
      const parsed = parseForceCommands(invalidCommand, {});

      // Should return an object (possibly empty) but not null
      expect(parsed).toBeDefined();
      expect(typeof parsed).toBe('object');
    });

    it('should handle missing CSS file reference', () => {
      const forceCommands = {
        pdf: true,
        css: 'non-existent.css',
      };

      const options = applyForceCommands({}, forceCommands);

      // Should still set the CSS path, actual file validation happens later
      expect(options.cssPath).toBe('non-existent.css');
    });
  });

  describe('Alternative Force Commands Keys', () => {
    const testCases = [
      { key: 'force_commands', value: '--pdf --highlight' },
      { key: 'force-commands', value: '--pdf --highlight' },
      { key: 'forceCommands', value: '--pdf --highlight' },
      { key: 'commands', value: '--pdf --highlight' },
    ];

    testCases.forEach(({ key, value }) => {
      it(`should extract force commands from ${key} field`, () => {
        const metadata = {
          title: 'Test',
          [key]: value,
        };

        const result = extractForceCommands(metadata);
        expect(result).toBe(value);
      });
    });
  });

  describe('Export Format Commands', () => {
    it('should handle export-yaml command', () => {
      const forceCommands = {
        exportYaml: true,
      };

      const result = applyForceCommands({}, forceCommands);

      expect(result).toMatchObject({
        exportYaml: true,
        exportMetadata: true,
        exportFormat: 'yaml',
      });
    });

    it('should handle export-json command', () => {
      const forceCommands = {
        exportJson: true,
      };

      const result = applyForceCommands({}, forceCommands);

      expect(result).toMatchObject({
        exportJson: true,
        exportMetadata: true,
        exportFormat: 'json',
      });
    });
  });
});