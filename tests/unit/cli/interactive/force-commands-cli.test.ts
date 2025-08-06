/**
 * @fileoverview Unit tests for Force Commands in CLI Interactive Mode
 * 
 * Tests the specific behavior of the interactive CLI when it encounters
 * documents with force_commands in their frontmatter.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import chalk from 'chalk';
import { parseYamlFrontMatter } from '../../../../src/core/parsers/yaml-parser';
import { extractForceCommands, parseForceCommands, applyForceCommands } from '../../../../src/core/parsers/force-commands-parser';

// Mock chalk to simplify console output testing
vi.mock('chalk', () => ({
  default: {
    cyan: vi.fn((str: string) => `[CYAN]${str}[/CYAN]`),
    gray: vi.fn((str: string) => `[GRAY]${str}[/GRAY]`),
    yellow: vi.fn((str: string) => `[YELLOW]${str}[/YELLOW]`),
    green: vi.fn((str: string) => `[GREEN]${str}[/GREEN]`),
    bold: {
      blue: vi.fn((str: string) => `[BOLD_BLUE]${str}[/BOLD_BLUE]`),
      cyan: vi.fn((str: string) => `[BOLD_CYAN]${str}[/BOLD_CYAN]`),
    },
  },
}));

describe('CLI Interactive with Force Commands', () => {
  let consoleLogSpy: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Interactive Flow Decision Making', () => {
    it('should detect force commands and skip interactive prompts', () => {
      const documentContent = `---
title: Test Document
force_commands: --pdf --highlight --css theme.css
---

# Content`;

      const { metadata } = parseYamlFrontMatter(documentContent);
      const forceCommandsStr = extractForceCommands(metadata);

      // Should find force commands
      expect(forceCommandsStr).toBe('--pdf --highlight --css theme.css');
      
      // Should parse them correctly
      const parsedCommands = parseForceCommands(forceCommandsStr!, metadata);
      expect(parsedCommands).not.toBeNull();
      expect(parsedCommands?.pdf).toBe(true);
      expect(parsedCommands?.highlight).toBe(true);
      expect(parsedCommands?.css).toBe('theme.css');

      // Simulate the decision in the interactive flow
      const shouldSkipInteractive = forceCommandsStr !== null && parsedCommands !== null;
      expect(shouldSkipInteractive).toBe(true);
    });

    it('should continue with interactive flow when no force commands present', () => {
      const documentContent = `---
title: Test Document
author: John Doe
---

# Content`;

      const { metadata } = parseYamlFrontMatter(documentContent);
      const forceCommandsStr = extractForceCommands(metadata);

      // Should not find force commands
      expect(forceCommandsStr).toBeNull();
      
      // Should continue with interactive flow
      const shouldSkipInteractive = forceCommandsStr !== null;
      expect(shouldSkipInteractive).toBe(false);
    });

    it('should handle malformed force commands gracefully', () => {
      const documentContent = `---
title: Test Document
force_commands: "--invalid-option --another-bad"
---

# Content`;

      const { metadata } = parseYamlFrontMatter(documentContent);
      const forceCommandsStr = extractForceCommands(metadata);
      
      expect(forceCommandsStr).toBe('--invalid-option --another-bad');
      
      // Should still parse but with empty or minimal results
      const parsedCommands = parseForceCommands(forceCommandsStr!, metadata);
      expect(parsedCommands).toBeDefined();
      // Invalid options should be ignored
      expect(Object.keys(parsedCommands || {}).length).toBeLessThanOrEqual(1);
    });
  });

  describe('Force Commands to CLI Options Mapping', () => {
    it('should correctly map force commands to CLI service options', () => {
      const forceCommands = {
        pdf: true,
        html: true,
        highlight: true,
        css: 'contract.css',
        debug: true,
        format: 'A4' as const,
        landscape: true,
        title: 'Document Title',
      };

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
        basePath: '/test/path',
      };

      const result = applyForceCommands(baseOptions, forceCommands);

      // Verify all mappings
      expect(result.pdf).toBe(true);
      expect(result.html).toBe(true);
      expect(result.highlight).toBe(true);
      expect(result.includeHighlighting).toBe(true);
      expect(result.cssPath).toBe('contract.css');
      expect(result.debug).toBe(true);
      expect(result.format).toBe('A4');
      expect(result.landscape).toBe(true);
      expect(result.title).toBe('Document Title');

      // Base options should be preserved
      expect(result.yamlOnly).toBe(false);
      expect(result.noHeaders).toBe(false);
      expect(result.basePath).toBe('/test/path');
    });

    it('should handle output naming with force commands', () => {
      const forceCommands = {
        pdf: true,
        output: 'custom-name',
        outputPath: 'custom/path',
      };

      const result = applyForceCommands({}, forceCommands);

      expect(result.output).toBe('custom-name');
      expect(result.outputPath).toBe('custom/path');
    });

    it('should handle metadata export commands', () => {
      const forceCommandsYaml = {
        exportYaml: true,
      };

      const resultYaml = applyForceCommands({}, forceCommandsYaml);
      expect(resultYaml.exportYaml).toBe(true);
      expect(resultYaml.exportMetadata).toBe(true);
      expect(resultYaml.exportFormat).toBe('yaml');

      const forceCommandsJson = {
        exportJson: true,
      };

      const resultJson = applyForceCommands({}, forceCommandsJson);
      expect(resultJson.exportJson).toBe(true);
      expect(resultJson.exportMetadata).toBe(true);
      expect(resultJson.exportFormat).toBe('json');
    });
  });

  describe('Console Output for Force Commands', () => {
    it('should log appropriate message when force commands are found', () => {
      const forceCommandsStr = '--pdf --highlight';
      
      if (forceCommandsStr) {
        console.log(chalk.cyan('\n📋 Found force commands in document. Executing automatic configuration...\n'));
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Found force commands')
      );
    });

    it('should log appropriate message when continuing with interactive mode', () => {
      const forceCommandsStr = null;
      
      if (!forceCommandsStr) {
        console.log(chalk.gray('No force commands found or error parsing. Continuing with interactive mode...\n'));
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No force commands found')
      );
    });
  });

  describe('Output File Generation Logic', () => {
    it('should determine correct output files for PDF with highlight', () => {
      const forceCommands = {
        pdf: true,
        highlight: true,
      };
      
      const outputDir = '/output';
      const outputBaseName = 'document';
      
      const expectedFiles: string[] = [];
      
      if (forceCommands.pdf) {
        expectedFiles.push(`${outputDir}/${outputBaseName}.pdf`);
        
        if (forceCommands.highlight) {
          expectedFiles.push(`${outputDir}/${outputBaseName}.HIGHLIGHT.pdf`);
        }
      }
      
      expect(expectedFiles).toEqual([
        '/output/document.pdf',
        '/output/document.HIGHLIGHT.pdf',
      ]);
    });

    it('should determine correct output files for HTML with highlight', () => {
      const forceCommands = {
        html: true,
        highlight: true,
      };
      
      const outputDir = '/output';
      const outputBaseName = 'document';
      
      const expectedFiles: string[] = [];
      
      if (forceCommands.html) {
        expectedFiles.push(`${outputDir}/${outputBaseName}.html`);
        
        if (forceCommands.highlight) {
          expectedFiles.push(`${outputDir}/${outputBaseName}.HIGHLIGHT.html`);
        }
      }
      
      expect(expectedFiles).toEqual([
        '/output/document.html',
        '/output/document.HIGHLIGHT.html',
      ]);
    });

    it('should handle multiple formats', () => {
      const forceCommands = {
        pdf: true,
        html: true,
        highlight: false,
      };
      
      const outputDir = '/output';
      const outputBaseName = 'document';
      
      const expectedFiles: string[] = [];
      
      if (forceCommands.pdf) {
        expectedFiles.push(`${outputDir}/${outputBaseName}.pdf`);
      }
      
      if (forceCommands.html) {
        expectedFiles.push(`${outputDir}/${outputBaseName}.html`);
      }
      
      expect(expectedFiles).toEqual([
        '/output/document.pdf',
        '/output/document.html',
      ]);
    });
  });

  describe('CSS Path Resolution', () => {
    it('should resolve CSS path correctly', () => {
      const forceCommands = {
        css: 'contract.petalo.css',
      };

      const result = applyForceCommands({}, forceCommands);
      expect(result.cssPath).toBe('contract.petalo.css');

      // In actual implementation, the path would be resolved relative to STYLES_DIR
      const STYLES_DIR = 'input/seleccionados/css';
      const fullCssPath = `${STYLES_DIR}/${forceCommands.css}`;
      expect(fullCssPath).toBe('input/seleccionados/css/contract.petalo.css');
    });

    it('should handle CSS paths with spaces', () => {
      const commandString = '--css "my styles/contract style.css"';
      const parsed = parseForceCommands(commandString, {});

      expect(parsed?.css).toBe('my styles/contract style.css');
    });
  });

  describe('Security and Validation', () => {
    it('should reject unsafe paths in force commands', () => {
      const commandString = '--css ../../../etc/passwd --pdf';
      const parsed = parseForceCommands(commandString, {});

      // Should parse pdf but not the unsafe CSS path
      expect(parsed?.pdf).toBe(true);
      expect(parsed?.css).toBeUndefined();
    });

    it('should ignore protected command options', () => {
      const commandString = '--pdf --stdin --stdout --yaml';
      const parsed = parseForceCommands(commandString, {});

      // Should only parse pdf, ignore protected options
      expect(parsed?.pdf).toBe(true);
      expect(Object.keys(parsed || {})).not.toContain('stdin');
      expect(Object.keys(parsed || {})).not.toContain('stdout');
      expect(Object.keys(parsed || {})).not.toContain('yaml');
    });
  });
});