/**
 * @fileoverview Tests for debug-ast remark plugin
 *
 * Tests for the debug utility plugin that inspects AST structure and
 * logs information about template field patterns.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { remarkDebugAST } from '../../../../src/plugins/remark/debug-ast';

describe('Debug AST Plugin', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console.log to capture debug output
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // ==========================================================================
  // BASIC FUNCTIONALITY
  // ==========================================================================

  describe('Basic functionality', () => {
    it('should run without errors', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDebugAST);

      const tree = processor.parse('# Test');
      await processor.run(tree);

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log AST debug header', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDebugAST);

      const tree = processor.parse('Test content');
      await processor.run(tree);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('=== AST DEBUG ==='));
    });

    it('should log total node count', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDebugAST);

      const tree = processor.parse('Test content');
      await processor.run(tree);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total nodes visited:'));
    });

    it('should log debug footer', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDebugAST);

      const tree = processor.parse('Test content');
      await processor.run(tree);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('=== END AST DEBUG ==='));
    });
  });

  // ==========================================================================
  // TEMPLATE FIELD DETECTION
  // ==========================================================================

  describe('Template field detection', () => {
    it('should detect opening loop patterns {{#', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDebugAST);

      const tree = processor.parse('{{#items}}content{{/items}}');
      await processor.run(tree);

      const calls = consoleSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('{{#');
    });

    it('should detect closing loop patterns {{/', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDebugAST);

      const tree = processor.parse('{{#items}}content{{/items}}');
      await processor.run(tree);

      const calls = consoleSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('{{/');
    });

    it('should log node details for template fields', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDebugAST);

      const tree = processor.parse('{{#items}}test{{/items}}');
      await processor.run(tree);

      // Should log node type
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/Node #\d+/));
    });

    it('should ignore simple template fields without # or /', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDebugAST);

      const tree = processor.parse('{{name}}');
      await processor.run(tree);

      // Should not log details for simple fields (no {{# or {{/)
      const calls = consoleSpy.mock.calls.flat();
      const hasNodeDetails = calls.some(call =>
        typeof call === 'string' && call.includes('Node #') && call.includes('{{name}}')
      );
      expect(hasNodeDetails).toBe(false);
    });
  });

  // ==========================================================================
  // NODE TYPE DETECTION
  // ==========================================================================

  describe('Node type detection', () => {
    it('should detect text nodes with template patterns', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDebugAST);

      const tree = processor.parse('{{#items}}text{{/items}}');
      await processor.run(tree);

      const calls = consoleSpy.mock.calls.flat().join(' ');
      expect(calls).toMatch(/\(text\)/);
    });

    it('should count all visited nodes', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDebugAST);

      const markdown = `
# Header
Paragraph with content.
- List item 1
- List item 2
`;

      const tree = processor.parse(markdown);
      await processor.run(tree);

      // Should have visited multiple nodes
      const calls = consoleSpy.mock.calls.flat();
      const nodeCountCall = calls.find(call =>
        typeof call === 'string' && call.includes('Total nodes visited:')
      );
      expect(nodeCountCall).toBeDefined();

      const count = parseInt(nodeCountCall!.match(/\d+/)?.[0] || '0');
      expect(count).toBeGreaterThan(1);
    });
  });

  // ==========================================================================
  // COMPLEX DOCUMENTS
  // ==========================================================================

  describe('Complex documents', () => {
    it('should handle documents with multiple loop patterns', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDebugAST);

      const markdown = `
{{#items}}
- Item
{{/items}}

{{#users}}
- User
{{/users}}
`;

      const tree = processor.parse(markdown);
      await processor.run(tree);

      expect(consoleSpy).toHaveBeenCalled();

      const calls = consoleSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('{{#');
      expect(calls).toContain('{{/');
    });

    it('should handle nested structures', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDebugAST);

      const markdown = `
{{#items}}
{{#nested}}
Content
{{/nested}}
{{/items}}
`;

      const tree = processor.parse(markdown);
      await processor.run(tree);

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle mixed content', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDebugAST);

      const markdown = `
# Header

Regular paragraph.

{{#items}}
- Template item
{{/items}}

Another paragraph with {{variable}}.
`;

      const tree = processor.parse(markdown);
      await processor.run(tree);

      const calls = consoleSpy.mock.calls.flat();
      const totalNodesCall = calls.find(call =>
        typeof call === 'string' && call.includes('Total nodes visited:')
      );
      expect(totalNodesCall).toBeDefined();
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge cases', () => {
    it('should handle empty document', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDebugAST);

      const tree = processor.parse('');
      await processor.run(tree);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('=== AST DEBUG ==='));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total nodes visited:'));
    });

    it('should handle document with only whitespace', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDebugAST);

      const tree = processor.parse('   \n\n   ');
      await processor.run(tree);

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle very long values', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDebugAST);

      const longContent = 'x'.repeat(1000);
      const tree = processor.parse(`{{#items}}${longContent}{{/items}}`);
      await processor.run(tree);

      expect(consoleSpy).toHaveBeenCalled();

      const calls = consoleSpy.mock.calls.flat();
      const lengthCall = calls.find(call =>
        typeof call === 'string' && call.includes('Full value length:')
      );
      expect(lengthCall).toBeDefined();
    });

    it('should handle special characters in template patterns', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDebugAST);

      const tree = processor.parse('{{#items}}Content with émojis 🎉{{/items}}');
      await processor.run(tree);

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // OUTPUT VERIFICATION
  // ==========================================================================

  describe('Output verification', () => {
    it.skip('should log parent type information', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDebugAST);

      const tree = processor.parse('{{#items}}test{{/items}}');
      await processor.run(tree);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Parent type:'));
    });

    it.skip('should log value in JSON format', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDebugAST);

      const tree = processor.parse('{{#items}}test{{/items}}');
      await processor.run(tree);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Value:'));
    });

    it.skip('should log full value length', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDebugAST);

      const tree = processor.parse('{{#items}}test{{/items}}');
      await processor.run(tree);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Full value length:'));
    });
  });
});
