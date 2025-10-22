/**
 * Tests for Preprocessor Adapter Pattern
 *
 * Verifies the generic adapter pattern for wrapping string-based preprocessors
 * as remark plugins with AST → string → process → AST cycle.
 */

import { describe, it, expect, vi } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import type { PreprocessorAdapter } from '../../../../src/core/pipeline/preprocessor-adapter';
import { wrapPreprocessor } from '../../../../src/core/pipeline/preprocessor-adapter';

describe('Preprocessor Adapter Pattern', () => {
  describe('wrapPreprocessor', () => {
    it('should wrap a simple preprocessor', async () => {
      const adapter: PreprocessorAdapter = {
        name: 'testPreprocessor',
        execute: (content) => content.replace(/foo/g, 'bar'),
      };

      const plugin = wrapPreprocessor(adapter);
      const processor = unified().use(remarkParse).use(plugin).use(remarkStringify);

      const input = 'This is foo content';
      const result = await processor.process(input);

      expect(String(result)).toContain('bar');
      expect(String(result)).not.toContain('foo');
    });

    it('should preserve markdown structure', async () => {
      const adapter: PreprocessorAdapter = {
        name: 'identityPreprocessor',
        execute: (content) => content, // Identity - no changes
      };

      const plugin = wrapPreprocessor(adapter);
      const processor = unified().use(remarkParse).use(plugin).use(remarkStringify);

      const input = '# Heading\n\n**Bold** and *italic*';
      const result = await processor.process(input);

      expect(String(result)).toContain('# Heading');
      expect(String(result)).toContain('**Bold**');
      expect(String(result)).toContain('*italic*');
    });

    it('should pass metadata to preprocessor', async () => {
      const executeSpy = vi.fn((content, metadata) => {
        return content.replace('{{name}}', String(metadata.name));
      });

      const adapter: PreprocessorAdapter = {
        name: 'metadataPreprocessor',
        execute: executeSpy,
      };

      const plugin = wrapPreprocessor(adapter);
      const processor = unified()
        .use(remarkParse)
        .use(plugin, { metadata: { name: 'TestValue' } })
        .use(remarkStringify);

      const input = 'Hello {{name}}';
      const result = await processor.process(input);

      expect(executeSpy).toHaveBeenCalled();
      expect(executeSpy).toHaveBeenCalledWith(
        expect.any(String),
        { name: 'TestValue' },
        expect.any(Object)
      );
      expect(String(result)).toContain('TestValue');
    });

    it('should pass options to preprocessor', async () => {
      const executeSpy = vi.fn((content, metadata, options: any) => {
        return options.prefix ? `${options.prefix}: ${content}` : content;
      });

      const adapter: PreprocessorAdapter<{ prefix?: string }> = {
        name: 'optionsPreprocessor',
        execute: executeSpy,
      };

      const plugin = wrapPreprocessor(adapter);
      const processor = unified()
        .use(remarkParse)
        .use(plugin, { prefix: 'PREFIX', metadata: {} })
        .use(remarkStringify);

      const input = 'Content';
      await processor.process(input);

      expect(executeSpy).toHaveBeenCalledWith(
        expect.any(String),
        {},
        expect.objectContaining({ prefix: 'PREFIX' })
      );
    });

    it('should handle debug logging', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const adapter: PreprocessorAdapter = {
        name: 'debugPreprocessor',
        execute: (content) => content,
      };

      const plugin = wrapPreprocessor(adapter);
      const processor = unified()
        .use(remarkParse)
        .use(plugin, { debug: true, metadata: {} })
        .use(remarkStringify);

      await processor.process('Test content');

      expect(consoleSpy).toHaveBeenCalledWith('[debugPreprocessor] Running preprocessor');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[debugPreprocessor\] Input length: \d+ chars/)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[debugPreprocessor\] Output length: \d+ chars/)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[debugPreprocessor\] Tree replaced with \d+ children/)
      );

      consoleSpy.mockRestore();
    });

    it('should handle empty metadata', async () => {
      const executeSpy = vi.fn((content, metadata) => content);

      const adapter: PreprocessorAdapter = {
        name: 'emptyMetadataPreprocessor',
        execute: executeSpy,
      };

      const plugin = wrapPreprocessor(adapter);
      const processor = unified().use(remarkParse).use(plugin).use(remarkStringify);

      await processor.process('Content');

      expect(executeSpy).toHaveBeenCalledWith(expect.any(String), {}, expect.any(Object));
    });

    it('should handle complex AST transformations', async () => {
      const adapter: PreprocessorAdapter = {
        name: 'complexPreprocessor',
        execute: (content) => {
          // Replace specific markers
          return content.replace(/MARKER/g, 'REPLACED');
        },
      };

      const plugin = wrapPreprocessor(adapter);
      const processor = unified().use(remarkParse).use(plugin).use(remarkStringify);

      const input = '# MARKER Title\n\nContent with MARKER';
      const result = await processor.process(input);

      expect(String(result)).toContain('REPLACED');
      expect(String(result)).not.toContain('MARKER');
    });

    it('should preserve nested markdown structures', async () => {
      const adapter: PreprocessorAdapter = {
        name: 'nestedPreprocessor',
        execute: (content) => content, // Identity
      };

      const plugin = wrapPreprocessor(adapter);
      const processor = unified().use(remarkParse).use(plugin).use(remarkStringify);

      const input = '# Heading\n\n- Item 1\n  - Nested item\n\n> Quote with **bold**';

      const result = await processor.process(input);
      const output = String(result);

      // Should preserve basic structure (format may vary)
      expect(output).toContain('Heading');
      expect(output).toContain('Item 1');
      expect(output).toContain('Nested item');
      expect(output).toContain('Quote');
      expect(output).toContain('bold');
    });

    it('should handle preprocessor that adds content', async () => {
      const adapter: PreprocessorAdapter = {
        name: 'addContentPreprocessor',
        execute: (content) => `# Added Header\n\n${content}`,
      };

      const plugin = wrapPreprocessor(adapter);
      const processor = unified().use(remarkParse).use(plugin).use(remarkStringify);

      const input = 'Original content';
      const result = await processor.process(input);

      expect(String(result)).toContain('# Added Header');
      expect(String(result)).toContain('Original content');
    });

    it('should handle preprocessor that removes content', async () => {
      const adapter: PreprocessorAdapter = {
        name: 'removeContentPreprocessor',
        execute: (content) => content.replace(/REMOVE_THIS/g, ''),
      };

      const plugin = wrapPreprocessor(adapter);
      const processor = unified().use(remarkParse).use(plugin).use(remarkStringify);

      const input = 'Keep this REMOVE_THIS content';
      const result = await processor.process(input);

      expect(String(result)).toContain('Keep this');
      expect(String(result)).toContain('content');
      expect(String(result)).not.toContain('REMOVE_THIS');
    });

    it('should handle multi-line replacements', async () => {
      const adapter: PreprocessorAdapter = {
        name: 'multilinePreprocessor',
        execute: (content) => content.replace(/Para/g, 'Section'),
      };

      const plugin = wrapPreprocessor(adapter);
      const processor = unified().use(remarkParse).use(plugin).use(remarkStringify);

      const input = 'Para 1\n\nPara 2';
      const result = await processor.process(input);

      expect(String(result)).toContain('Section');
      expect(String(result)).not.toContain('Para');
    });

    it('should execute preprocessor in correct order', async () => {
      const executionOrder: string[] = [];

      const adapter1: PreprocessorAdapter = {
        name: 'first',
        execute: (content) => {
          executionOrder.push('first');
          return content.replace(/A/g, 'B');
        },
      };

      const adapter2: PreprocessorAdapter = {
        name: 'second',
        execute: (content) => {
          executionOrder.push('second');
          return content.replace(/B/g, 'C');
        },
      };

      const plugin1 = wrapPreprocessor(adapter1);
      const plugin2 = wrapPreprocessor(adapter2);

      const processor = unified()
        .use(remarkParse)
        .use(plugin1)
        .use(plugin2)
        .use(remarkStringify);

      const input = 'A';
      const result = await processor.process(input);

      expect(executionOrder).toEqual(['first', 'second']);
      expect(String(result)).toContain('C');
      expect(String(result)).not.toContain('A');
      expect(String(result)).not.toContain('B');
    });
  });

  describe('PreprocessorAdapter interface', () => {
    it('should require name and execute properties', () => {
      const adapter: PreprocessorAdapter = {
        name: 'test',
        execute: (content) => content,
      };

      expect(adapter.name).toBe('test');
      expect(typeof adapter.execute).toBe('function');
    });

    it('should support typed options', () => {
      interface CustomOptions {
        customOption: string;
      }

      const adapter: PreprocessorAdapter<CustomOptions> = {
        name: 'typedAdapter',
        execute: (content, metadata, options) => {
          return content + options.customOption;
        },
      };

      const result = adapter.execute('test', {}, { customOption: 'value' });
      expect(result).toBe('testvalue');
    });
  });
});
