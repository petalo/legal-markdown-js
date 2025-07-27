/**
 * @fileoverview Unit Tests for Pipeline System
 *
 * This test suite verifies the pipeline functionality including:
 * - Pipeline configuration creation
 * - Basic pipeline execution
 * - Error handling
 */

import { 
  createDefaultPipeline,
  createHtmlPipeline
} from '../../../src/extensions/pipeline/pipeline-config';

describe('Pipeline System', () => {
  describe('Pipeline Configuration', () => {
    it('should create default pipeline successfully', () => {
      const pipeline = createDefaultPipeline();
      
      expect(pipeline).toBeDefined();
      expect(typeof pipeline.execute).toBe('function');
    });

    it('should create HTML pipeline successfully', () => {
      const pipeline = createHtmlPipeline();
      
      expect(pipeline).toBeDefined();
      expect(typeof pipeline.execute).toBe('function');
    });

    it('should create HTML pipeline with options', () => {
      const pipeline = createHtmlPipeline({
        enableFieldTracking: true,
        includeHighlighting: true
      });
      
      expect(pipeline).toBeDefined();
      expect(typeof pipeline.execute).toBe('function');
    });
  });

  describe('Pipeline Execution', () => {
    it('should execute default pipeline with simple content', async () => {
      const pipeline = createDefaultPipeline();
      const content = 'Hello {{name}}!';
      const metadata = { name: 'World' };
      const options = {
        legalMarkdownOptions: {}
      };

      const result = await pipeline.execute(content, metadata, options);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(typeof result.content).toBe('string');
    });

    it('should execute HTML pipeline with simple content', async () => {
      const pipeline = createHtmlPipeline();
      const content = 'Hello {{name}}!';
      const metadata = { name: 'World' };
      const options = {
        legalMarkdownOptions: {}
      };

      const result = await pipeline.execute(content, metadata, options);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(typeof result.content).toBe('string');
    });

    it('should handle empty content', async () => {
      const pipeline = createDefaultPipeline();
      const content = '';
      const metadata = {};
      const options = {
        legalMarkdownOptions: {}
      };

      const result = await pipeline.execute(content, metadata, options);

      expect(result).toBeDefined();
      expect(result.content).toBe('');
    });

    it('should handle content without mixins', async () => {
      const pipeline = createDefaultPipeline();
      const content = 'This is plain text without any mixins.';
      const metadata = {};
      const options = {
        legalMarkdownOptions: {}
      };

      const result = await pipeline.execute(content, metadata, options);

      expect(result).toBeDefined();
      expect(result.content).toContain('plain text');
    });

    it('should provide success status', async () => {
      const pipeline = createDefaultPipeline();
      const content = 'Hello World!';
      const metadata = {};
      const options = {
        legalMarkdownOptions: {}
      };

      const result = await pipeline.execute(content, metadata, options);

      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed YAML gracefully', async () => {
      const pipeline = createDefaultPipeline();
      const content = `---
invalid: yaml: content
---
Content here`;
      const metadata = {};
      const options = {
        legalMarkdownOptions: {}
      };

      const result = await pipeline.execute(content, metadata, options);

      expect(result).toBeDefined();
      // Should not throw, even with malformed YAML
    });

    it('should handle null content gracefully', async () => {
      const pipeline = createDefaultPipeline();
      const content = null as any;
      const metadata = {};
      const options = {
        legalMarkdownOptions: {}
      };

      const result = await pipeline.execute(content, metadata, options);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
    });
  });
});