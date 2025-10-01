/**
 * Unit tests for remark signature lines plugin
 *
 * Tests the signature line detection and wrapping functionality including
 * various underscore lengths, CSS class application, and edge cases.
 *
 * @module
 */

import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkSignatureLines from '../../../../src/plugins/remark/signature-lines';

describe('remarkSignatureLines Plugin', () => {
  describe('Basic Signature Line Detection', () => {
    it('should wrap 10 consecutive underscores with CSS class', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines)
        .use(remarkStringify);

      const input = 'Signature: __________';
      const result = await processor.process(input);

      expect(result.toString().trim()).toBe(
        'Signature: <span class="signature-line">__________</span>'
      );
    });

    it('should wrap 20 consecutive underscores with CSS class', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines)
        .use(remarkStringify);

      const input = 'Signature: ____________________';
      const result = await processor.process(input);

      expect(result.toString().trim()).toBe(
        'Signature: <span class="signature-line">____________________</span>'
      );
    });

    it('should not wrap 9 consecutive underscores (below minimum)', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines)
        .use(remarkStringify);

      const input = 'Signature: _________';
      const result = await processor.process(input);

      expect(result.toString().trim()).toBe('Signature: \\_\\_\\_\\_\\_\\_\\_\\_\\_');
    });

    it('should handle multiple signature lines in same text', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines)
        .use(remarkStringify);

      const input = 'Client: __________ Date: __________';
      const result = await processor.process(input);

      expect(result.toString().trim()).toBe(
        'Client: <span class="signature-line">__________</span> Date: <span class="signature-line">__________</span>'
      );
    });
  });

  describe('Custom Configuration', () => {
    it('should respect custom minUnderscores threshold', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines, { minUnderscores: 15 })
        .use(remarkStringify);

      const input = 'Signature: _______________'; // 15 underscores
      const result = await processor.process(input);

      expect(result.toString().trim()).toBe(
        'Signature: <span class="signature-line">_______________</span>'
      );
    });

    it('should not wrap underscores below custom threshold', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines, { minUnderscores: 15 })
        .use(remarkStringify);

      const input = 'Signature: ______________'; // 14 underscores
      const result = await processor.process(input);

      expect(result.toString().trim()).toContain('Signature:');
      expect(result.toString().trim()).not.toContain('<span');
    });

    it('should use custom CSS class name', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines, { cssClassName: 'custom-sig-line' })
        .use(remarkStringify);

      const input = 'Signature: __________';
      const result = await processor.process(input);

      expect(result.toString().trim()).toBe(
        'Signature: <span class="custom-sig-line">__________</span>'
      );
    });

    it('should not add CSS class when disabled', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines, { addCssClass: false })
        .use(remarkStringify);

      const input = 'Signature: __________';
      const result = await processor.process(input);

      // When CSS class is disabled, remark-stringify will escape the underscores
      // The important thing is that no <span> tag is added
      expect(result.toString().trim()).not.toContain('<span');
      expect(result.toString().trim()).toContain('Signature:');
    });
  });

  describe('Real-world Document Scenarios', () => {
    it('should process signature blocks in legal documents', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines)
        .use(remarkStringify);

      const input = `# Agreement

**SIGNATURES**

**Client Representative**

Signature: __________________________

Date: ____________________

**Service Provider**

Signature: __________________________

Date: ____________________`;

      const result = await processor.process(input);
      const output = result.toString();

      // Should wrap all 4 signature lines
      const signatureSpans = (output.match(/<span class="signature-line">/g) || []).length;
      expect(signatureSpans).toBe(4);

      // Should preserve structure
      expect(output).toContain('# Agreement');
      expect(output).toContain('**SIGNATURES**');
      expect(output).toContain('**Client Representative**');
    });

    it('should handle signature lines in lists', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines)
        .use(remarkStringify);

      const input = `- Client Name: __________________________
- Client Signature: __________________________
- Date: ____________________`;

      const result = await processor.process(input);
      const output = result.toString();

      // Should wrap all 3 signature lines
      const signatureSpans = (output.match(/<span class="signature-line">/g) || []).length;
      expect(signatureSpans).toBe(3);
    });

    it('should handle signature lines in tables', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines)
        .use(remarkStringify);

      const input = `| Party | Signature | Date |
|-------|-----------|------|
| Client A | __________________________ | __________ |
| Client B | __________________________ | __________ |`;

      const result = await processor.process(input);
      const output = result.toString();

      // Should wrap all signature lines in the table
      const signatureSpans = (output.match(/<span class="signature-line">/g) || []).length;
      expect(signatureSpans).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines)
        .use(remarkStringify);

      const input = '';
      const result = await processor.process(input);

      expect(result.toString().trim()).toBe('');
    });

    it('should handle input with no underscores', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines)
        .use(remarkStringify);

      const input = 'This document has no signature lines.';
      const result = await processor.process(input);

      expect(result.toString().trim()).toBe('This document has no signature lines.');
    });

    it('should handle very long underscore sequences', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines)
        .use(remarkStringify);

      const longUnderscores = '_'.repeat(100);
      const input = `Signature: ${longUnderscores}`;
      const result = await processor.process(input);

      expect(result.toString()).toContain('<span class="signature-line">');
      expect(result.toString()).toContain('_'.repeat(100));
    });

    it('should handle underscores in code blocks (should not process)', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines)
        .use(remarkStringify);

      const input = '```\nlet signature = "__________";\n```';
      const result = await processor.process(input);

      // Code blocks should not be processed
      expect(result.toString()).not.toContain('<span class="signature-line">');
    });

    it('should handle underscores in inline code (should not process)', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines)
        .use(remarkStringify);

      const input = 'Use `__________` for signatures.';
      const result = await processor.process(input);

      // Inline code should not be processed
      expect(result.toString()).not.toContain('<span class="signature-line">');
    });

    it('should handle mixed content with signature lines', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines)
        .use(remarkStringify);

      const input = `This is a paragraph.

Signature: __________

This is another paragraph.`;

      const result = await processor.process(input);
      const output = result.toString();

      expect(output).toContain('<span class="signature-line">__________</span>');
      expect(output).toContain('This is a paragraph.');
      expect(output).toContain('This is another paragraph.');
    });
  });

  describe('Integration with Other Formatting', () => {
    it('should work with bold text', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines)
        .use(remarkStringify);

      const input = '**Signature:** __________';
      const result = await processor.process(input);

      expect(result.toString().trim()).toContain('**Signature:**');
      expect(result.toString().trim()).toContain('<span class="signature-line">__________</span>');
    });

    it('should work with italic text', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines)
        .use(remarkStringify);

      const input = '*Sign here:* __________';
      const result = await processor.process(input);

      expect(result.toString().trim()).toContain('*Sign here:*');
      expect(result.toString().trim()).toContain('<span class="signature-line">__________</span>');
    });

    it('should work with links', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines)
        .use(remarkStringify);

      const input = '[Print and sign](example.com): __________';
      const result = await processor.process(input);

      expect(result.toString().trim()).toContain('[Print and sign]');
      expect(result.toString().trim()).toContain('<span class="signature-line">__________</span>');
    });
  });

  describe('Debug Mode', () => {
    it('should not throw errors when debug is enabled', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines, { debug: true })
        .use(remarkStringify);

      const input = 'Signature: __________';

      // Should not throw
      await expect(processor.process(input)).resolves.toBeDefined();
    });
  });

  describe('Security - CSS Class Name Sanitization', () => {
    it('should sanitize invalid CSS class names with special characters', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines, { cssClassName: 'sig<script>alert("xss")</script>' })
        .use(remarkStringify);

      const input = 'Signature: __________';
      const result = await processor.process(input);

      // Should fall back to default class name
      expect(result.toString().trim()).toBe(
        'Signature: <span class="signature-line">__________</span>'
      );
      // Should not contain the malicious script
      expect(result.toString()).not.toContain('<script>');
    });

    it('should sanitize CSS class names starting with numbers', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines, { cssClassName: '123invalid' })
        .use(remarkStringify);

      const input = 'Signature: __________';
      const result = await processor.process(input);

      // Should fall back to default class name
      expect(result.toString().trim()).toBe(
        'Signature: <span class="signature-line">__________</span>'
      );
    });

    it('should allow valid CSS class names with hyphens and underscores', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines, { cssClassName: 'my-signature_line-2' })
        .use(remarkStringify);

      const input = 'Signature: __________';
      const result = await processor.process(input);

      // Should use the valid class name
      expect(result.toString().trim()).toBe(
        'Signature: <span class="my-signature_line-2">__________</span>'
      );
    });

    it('should sanitize empty CSS class names', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines, { cssClassName: '' })
        .use(remarkStringify);

      const input = 'Signature: __________';
      const result = await processor.process(input);

      // Should fall back to default class name
      expect(result.toString().trim()).toBe(
        'Signature: <span class="signature-line">__________</span>'
      );
    });

    it('should sanitize class names with spaces', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkSignatureLines, { cssClassName: 'sig line' })
        .use(remarkStringify);

      const input = 'Signature: __________';
      const result = await processor.process(input);

      // Should fall back to default class name
      expect(result.toString().trim()).toBe(
        'Signature: <span class="signature-line">__________</span>'
      );
    });
  });
});
