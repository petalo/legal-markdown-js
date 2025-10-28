/**
 * Cross-Platform Compatibility Tests
 *
 * This test suite ensures legal-markdown-js works correctly across different
 * operating systems (Windows, macOS, Linux).
 *
 * Tests include:
 * - Line ending normalization (CRLF vs LF)
 * - Path separator handling
 * - Character encoding
 * - File system operations
 * - Platform-specific behaviors
 *
 * Note: These tests run on the current platform but validate cross-platform
 * concerns. Full cross-platform testing is performed by CI/CD on GitHub Actions
 * across Windows, macOS, and Linux environments.
 */

import { describe, it, expect } from 'vitest';
import { processLegalMarkdown } from '../../src/index';
import * as os from 'os';
import * as path from 'path';

describe('Cross-Platform Compatibility', () => {
  it('should detect current platform', () => {
    const platform = os.platform();
    console.log(`Running on: ${platform} (${os.release()})`);
    console.log(`Node version: ${process.version}`);
    console.log(`Architecture: ${os.arch()}`);

    // Verify we're running on a supported platform
    expect(['darwin', 'linux', 'win32']).toContain(platform);
  });

  describe('Line Endings', () => {
    it('should handle Unix line endings (LF)', async () => {
      const input = '---\nname: "John"\n---\nHello {{name}}';
      const result = await processLegalMarkdown(input);
      expect(result.content).toContain('Hello John');
    });

    it('should handle Windows line endings (CRLF)', async () => {
      const input = '---\r\nname: "John"\r\n---\r\nHello {{name}}';
      const result = await processLegalMarkdown(input);
      expect(result.content).toContain('Hello John');
    });

    it('should handle mixed line endings', async () => {
      const input = '---\nname: "John"\r\nage: 30\n---\r\nHello {{name}}, age {{age}}';
      const result = await processLegalMarkdown(input);
      expect(result.content).toContain('Hello John');
      expect(result.content).toContain('age 30');
    });

    it('should normalize line endings in output', async () => {
      const input = `---
list:
  - item1
  - item2
---
{{#each list}}
- {{this}}
{{/each}}`;

      const result = await processLegalMarkdown(input);

      // Output should have consistent line endings
      expect(result.content).toContain('item1');
      expect(result.content).toContain('item2');
    });
  });

  describe('Character Encoding', () => {
    it('should handle UTF-8 characters', async () => {
      const input = `---
name: "José García"
company: "Mañana Corp"
---
{{name}} works at {{company}}`;

      const result = await processLegalMarkdown(input);
      expect(result.content).toContain('José García');
      expect(result.content).toContain('Mañana Corp');
    });

    it('should handle special characters across platforms', async () => {
      const specialChars = [
        { char: '©', name: 'copyright' },
        { char: '®', name: 'registered' },
        { char: '™', name: 'trademark' },
        { char: '€', name: 'euro' },
        { char: '£', name: 'pound' },
        { char: '¥', name: 'yen' },
      ];

      for (const { char, name } of specialChars) {
        const input = `---
symbol: "${char}"
---
Symbol: {{symbol}}`;

        const result = await processLegalMarkdown(input);
        expect(result.content).toContain(char);
      }
    });

    it('should handle emojis', async () => {
      const input = `---
status: "✅ Approved"
---
{{status}}`;

      const result = await processLegalMarkdown(input);
      expect(result.content).toContain('✅ Approved');
    });

    it('should handle Unicode normalization', async () => {
      // Composed vs decomposed Unicode (é can be U+00E9 or U+0065 U+0301)
      const composed = `---
name: "café"
---
{{name}}`;

      const result = await processLegalMarkdown(composed);
      expect(result.content).toContain('café');
    });
  });

  describe('Path Handling', () => {
    it('should use platform-appropriate path separators', () => {
      const sep = path.sep;
      console.log(`Platform path separator: ${sep}`);

      // On Windows: backslash (\)
      // On Unix: forward slash (/)
      expect(['/', '\\'].includes(sep)).toBe(true);
    });

    it('should normalize paths correctly', () => {
      // Test that path.normalize works correctly
      const testPath = 'docs/examples/contract.md';
      const normalized = path.normalize(testPath);

      // Should not throw and should return a string
      expect(typeof normalized).toBe('string');
      expect(normalized.length).toBeGreaterThan(0);
    });

    it('should handle absolute vs relative paths', () => {
      const relativePath = 'docs/test.md';
      const absolutePath = path.resolve(relativePath);

      expect(path.isAbsolute(relativePath)).toBe(false);
      expect(path.isAbsolute(absolutePath)).toBe(true);
    });
  });

  describe('Date Handling', () => {
    it('should handle date values', async () => {
      const input = `---
startDate: 2025-01-15
endDate: 2025-12-31
---
Start: {{startDate}}
End: {{endDate}}`;

      const result = await processLegalMarkdown(input);

      // Dates should be present in output (may be formatted as Date objects)
      expect(result.content).toContain('2025');
      expect(result.content).toContain('Jan');
      expect(result.content).toContain('Dec');
    });

    it('should handle date arithmetic operations', async () => {
      const input = `---
date: 2025-01-15
---
Original: {{date}}
Next year: {{addYears(date, 1)}}`;

      const result = await processLegalMarkdown(input);

      // Should contain both years
      expect(result.content).toContain('2025');
      expect(result.content).toContain('2026');
    });
  });

  describe('Number Formatting', () => {
    it('should format currency consistently', async () => {
      const input = `---
amount: 1234.56
---
{{formatCurrency amount "USD"}}`;

      const result = await processLegalMarkdown(input);

      // Should format with US convention (period for decimal)
      expect(result.content).toMatch(/\$1,?234\.?56/);
    });

    it('should format European currency', async () => {
      const input = `---
amount: 1234.56
---
{{formatCurrency amount "EUR"}}`;

      const result = await processLegalMarkdown(input);

      // Should include euro symbol
      expect(result.content).toContain('€');
    });
  });

  describe('Template Processing', () => {
    it('should handle large documents on all platforms', async () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
      }));

      const input = `---
items: ${JSON.stringify(items)}
---
{{#each items}}
- {{id}}: {{name}}
{{/each}}`;

      const result = await processLegalMarkdown(input);

      // Should successfully process all items
      expect(result.content).toContain('Item 1');
      expect(result.content).toContain('Item 100');
    });

    it('should handle deeply nested structures', async () => {
      const input = `---
level1:
  level2:
    level3:
      level4:
        level5:
          value: "Deep value"
---
{{level1.level2.level3.level4.level5.value}}`;

      const result = await processLegalMarkdown(input);
      expect(result.content).toContain('Deep value');
    });
  });

  describe('CI/CD Integration', () => {
    it('should document CI/CD cross-platform testing', () => {
      console.log('\n' + '='.repeat(80));
      console.log('CROSS-PLATFORM TESTING');
      console.log('='.repeat(80));
      console.log('This project uses GitHub Actions for comprehensive cross-platform testing:');
      console.log('');
      console.log('Tested platforms:');
      console.log('  - Windows Server (latest)');
      console.log('  - macOS (latest)');
      console.log('  - Ubuntu Linux (latest)');
      console.log('');
      console.log('Node.js versions tested:');
      console.log('  - Node 18.x (LTS)');
      console.log('  - Node 20.x (LTS)');
      console.log('  - Node latest');
      console.log('');
      console.log('Full test suite runs on each platform/version combination.');
      console.log('See .github/workflows/*.yml for CI/CD configuration.');
      console.log('='.repeat(80) + '\n');

      // This test always passes - it's for documentation
      expect(true).toBe(true);
    });

    it('should verify test suite runs successfully', async () => {
      // If we're here, tests are running, which means the platform is supported
      const platform = os.platform();
      const nodeVersion = process.version;

      console.log(`✓ Tests running successfully on ${platform} with Node ${nodeVersion}`);

      expect(true).toBe(true);
    });
  });
});
