/**
 * Unit tests for Phase 1: Processing Context Builder
 *
 * Tests the buildProcessingContext function that creates unified processing
 * contexts by parsing YAML, resolving force-commands, and merging options.
 *
 * @module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildProcessingContext,
  mergeMetadata,
  validateProcessingContext,
  type ProcessingContext,
  type ProcessingOptions,
} from '../../../../src/core/pipeline/context-builder';

// Mock the parsers
vi.mock('../../../../src/core/parsers/yaml-parser', () => ({
  parseYamlFrontMatter: vi.fn(),
}));

vi.mock('../../../../src/core/parsers/force-commands-parser', () => ({
  extractForceCommands: vi.fn(),
  parseForceCommands: vi.fn(),
  applyForceCommands: vi.fn(),
}));

import { parseYamlFrontMatter } from '../../../../src/core/parsers/yaml-parser';
import {
  extractForceCommands,
  parseForceCommands,
  applyForceCommands,
} from '../../../../src/core/parsers/force-commands-parser';

const mockedParseYamlFrontMatter = parseYamlFrontMatter as ReturnType<typeof vi.fn>;
const mockedExtractForceCommands = extractForceCommands as ReturnType<typeof vi.fn>;
const mockedParseForceCommands = parseForceCommands as ReturnType<typeof vi.fn>;
const mockedApplyForceCommands = applyForceCommands as ReturnType<typeof vi.fn>;

describe('Phase 1: Context Builder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildProcessingContext', () => {
    it('should build basic context without force-commands', async () => {
      const rawContent = `---
title: Test Document
author: John Doe
---
# Test Content`;

      mockedParseYamlFrontMatter.mockReturnValue({
        content: '# Test Content',
        metadata: { title: 'Test Document', author: 'John Doe' },
      });
      mockedExtractForceCommands.mockReturnValue(null);

      const context = await buildProcessingContext(rawContent, { debug: false }, '/test/path');

      expect(context).toMatchObject({
        content: '# Test Content',
        rawContent,
        metadata: { title: 'Test Document', author: 'John Doe' },
        basePath: '/test/path',
      });

      expect(context.options).toMatchObject({
        debug: false,
        basePath: '/test/path',
      });
    });

    it('should handle force-commands and merge options', async () => {
      const rawContent = `---
title: Test
force_commands: '--pdf --title="Custom Title"'
---
Content`;

      mockedParseYamlFrontMatter.mockReturnValue({
        content: 'Content',
        metadata: { title: 'Test', force_commands: '--pdf --title="Custom Title"' },
      });
      mockedExtractForceCommands.mockReturnValue('--pdf --title="Custom Title"');
      mockedParseForceCommands.mockReturnValue({ pdf: true, title: 'Custom Title' });
      mockedApplyForceCommands.mockReturnValue({ pdf: true, title: 'Custom Title' });

      const context = await buildProcessingContext(
        rawContent,
        { html: true, debug: false },
        '/test'
      );

      expect(mockedParseForceCommands).toHaveBeenCalledWith(
        '--pdf --title="Custom Title"',
        expect.any(Object),
        expect.any(Object)
      );
      expect(mockedApplyForceCommands).toHaveBeenCalled();
    });

    it('should enable field tracking when highlight is requested', async () => {
      mockedParseYamlFrontMatter.mockReturnValue({
        content: 'Test',
        metadata: {},
      });
      mockedExtractForceCommands.mockReturnValue(null);

      const context = await buildProcessingContext('Test', { highlight: true }, '/test');

      expect(context.options.enableFieldTracking).toBe(true);
      expect(context.options.highlight).toBe(true);
    });

    it('should merge additional metadata when provided', async () => {
      mockedParseYamlFrontMatter.mockReturnValue({
        content: 'Test',
        metadata: { title: 'Original' },
      });
      mockedExtractForceCommands.mockReturnValue(null);

      const context = await buildProcessingContext(
        'Test',
        { additionalMetadata: { author: 'Test Author' } },
        '/test'
      );

      expect(context.metadata).toMatchObject({
        title: 'Original',
        author: 'Test Author',
      });
    });

    it('should handle content without YAML frontmatter', async () => {
      mockedParseYamlFrontMatter.mockReturnValue({
        content: '# Plain Content',
        metadata: null,
      });
      mockedExtractForceCommands.mockReturnValue(null);

      const context = await buildProcessingContext('# Plain Content', {}, '/test');

      expect(context.content).toBe('# Plain Content');
      expect(context.metadata).toEqual({});
    });

    it('should preserve rawContent for archiving purposes', async () => {
      const rawContent = '---\ntitle: Test\n---\nContent';

      mockedParseYamlFrontMatter.mockReturnValue({
        content: 'Content',
        metadata: { title: 'Test' },
      });
      mockedExtractForceCommands.mockReturnValue(null);

      const context = await buildProcessingContext(rawContent, {}, '/test');

      expect(context.rawContent).toBe(rawContent);
      expect(context.content).toBe('Content');
    });
  });

  describe('mergeMetadata', () => {
    it('should merge simple metadata objects', () => {
      const target = { title: 'Original', version: '1.0' };
      const source = { author: 'Test', version: '2.0' };

      const result = mergeMetadata(target, source);

      expect(result).toEqual({
        title: 'Original',
        author: 'Test',
        version: '2.0',
      });
    });

    it('should recursively merge nested objects', () => {
      const target = {
        config: {
          display: 'block',
          font: 'Arial',
        },
      };
      const source = {
        config: {
          color: 'red',
          font: 'Helvetica',
        },
      };

      const result = mergeMetadata(target, source);

      expect(result).toEqual({
        config: {
          display: 'block',
          color: 'red',
          font: 'Helvetica',
        },
      });
    });

    it('should not merge arrays (direct override)', () => {
      const target = { tags: ['original'] };
      const source = { tags: ['new', 'tags'] };

      const result = mergeMetadata(target, source);

      expect(result.tags).toEqual(['new', 'tags']);
    });

    it('should handle empty objects', () => {
      const result1 = mergeMetadata({}, { key: 'value' });
      const result2 = mergeMetadata({ key: 'value' }, {});

      expect(result1).toEqual({ key: 'value' });
      expect(result2).toEqual({ key: 'value' });
    });
  });

  describe('validateProcessingContext', () => {
    it('should validate a correct processing context', () => {
      const validContext: ProcessingContext = {
        content: 'Test',
        rawContent: 'Test',
        metadata: {},
        options: {},
        basePath: '/test',
      };

      expect(() => validateProcessingContext(validContext)).not.toThrow();
    });

    it('should throw on null or undefined context', () => {
      expect(() => validateProcessingContext(null as any)).toThrow('null or undefined');
      expect(() => validateProcessingContext(undefined as any)).toThrow('null or undefined');
    });

    it('should throw on invalid content type', () => {
      const invalidContext: any = {
        content: 123, // Should be string
        rawContent: 'Test',
        metadata: {},
        options: {},
        basePath: '/test',
      };

      expect(() => validateProcessingContext(invalidContext)).toThrow('content must be a string');
    });

    it('should throw on invalid metadata type', () => {
      const invalidContext: any = {
        content: 'Test',
        rawContent: 'Test',
        metadata: 'not-an-object', // Should be object
        options: {},
        basePath: '/test',
      };

      expect(() => validateProcessingContext(invalidContext)).toThrow('metadata must be an object');
    });

    it('should throw on invalid options type', () => {
      const invalidContext: any = {
        content: 'Test',
        rawContent: 'Test',
        metadata: {},
        options: null, // Should be object
        basePath: '/test',
      };

      expect(() => validateProcessingContext(invalidContext)).toThrow('options must be an object');
    });

    it('should throw on invalid basePath type', () => {
      const invalidContext: any = {
        content: 'Test',
        rawContent: 'Test',
        metadata: {},
        options: {},
        basePath: 123, // Should be string
      };

      expect(() => validateProcessingContext(invalidContext)).toThrow('basePath must be a string');
    });
  });

  describe('Integration with force-commands', () => {
    it('should correctly apply force-commands precedence', async () => {
      const rawContent = `---
title: Test
force_commands: '--pdf'
---
Content`;

      mockedParseYamlFrontMatter.mockReturnValue({
        content: 'Content',
        metadata: { title: 'Test', force_commands: '--pdf' },
      });
      mockedExtractForceCommands.mockReturnValue('--pdf');
      mockedParseForceCommands.mockReturnValue({ pdf: true });
      mockedApplyForceCommands.mockImplementation((options, forceCommands) => ({
        ...options,
        ...forceCommands,
      }));

      const context = await buildProcessingContext(
        rawContent,
        { html: true, pdf: false }, // CLI says no PDF
        '/test'
      );

      expect(mockedApplyForceCommands).toHaveBeenCalledWith(
        expect.objectContaining({ pdf: false }),
        { pdf: true }
      );
    });
  });
});
