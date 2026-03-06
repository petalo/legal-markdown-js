import {
  LegalMarkdownError,
  YamlParsingError,
  FileNotFoundError,
  ImportProcessingError,
  MetadataExportError,
  ValidationError,
  ProcessingError,
  PipelineError,
  ParseError,
  PdfDependencyError,
  ImportError,
} from '@errors/index';

describe('custom error classes', () => {
  describe('LegalMarkdownError', () => {
    it('stores code and context', () => {
      const err = new LegalMarkdownError('fail', 'TEST_ERROR', { key: 'val' });
      expect(err.message).toBe('fail');
      expect(err.code).toBe('TEST_ERROR');
      expect(err.context).toEqual({ key: 'val' });
      expect(err.name).toBe('LegalMarkdownError');
      expect(err).toBeInstanceOf(Error);
    });

    it('works without context', () => {
      const err = new LegalMarkdownError('fail', 'CODE');
      expect(err.context).toBeUndefined();
    });
  });

  describe('YamlParsingError', () => {
    it('has correct code and name', () => {
      const err = new YamlParsingError('bad yaml', { line: 5 });
      expect(err.code).toBe('YAML_PARSING_ERROR');
      expect(err.name).toBe('YamlParsingError');
      expect(err.context).toEqual({ line: 5 });
    });
  });

  describe('FileNotFoundError', () => {
    it('includes file path in message and context', () => {
      const err = new FileNotFoundError('/missing.md');
      expect(err.message).toContain('/missing.md');
      expect(err.code).toBe('FILE_NOT_FOUND');
      expect(err.context?.filePath).toBe('/missing.md');
    });
  });

  describe('ImportProcessingError', () => {
    it('stores filePath in context', () => {
      const err = new ImportProcessingError('circular', '/a.md');
      expect(err.code).toBe('IMPORT_PROCESSING_ERROR');
      expect(err.context?.filePath).toBe('/a.md');
    });
  });

  describe('MetadataExportError', () => {
    it('stores exportPath in context', () => {
      const err = new MetadataExportError('write failed', '/out.yaml');
      expect(err.code).toBe('METADATA_EXPORT_ERROR');
      expect(err.context?.exportPath).toBe('/out.yaml');
    });
  });

  describe('ValidationError', () => {
    it('stores field in context', () => {
      const err = new ValidationError('required', 'client.name');
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.context?.field).toBe('client.name');
    });
  });

  describe('ProcessingError', () => {
    it('stores processor in context', () => {
      const err = new ProcessingError('failed', 'field-processor');
      expect(err.code).toBe('PROCESSING_ERROR');
      expect(err.context?.processor).toBe('field-processor');
    });
  });

  describe('PipelineError', () => {
    it('has correct code', () => {
      const err = new PipelineError('ordering failed');
      expect(err.code).toBe('PIPELINE_ERROR');
      expect(err.name).toBe('PipelineError');
    });
  });

  describe('ParseError', () => {
    it('has correct code', () => {
      const err = new ParseError('bad token', { line: 12 });
      expect(err.code).toBe('PARSE_ERROR');
      expect(err.name).toBe('ParseError');
    });
  });

  describe('PdfDependencyError', () => {
    it('has default message', () => {
      const err = new PdfDependencyError();
      expect(err.message).toContain('Puppeteer');
      expect(err.name).toBe('PdfDependencyError');
      expect(err).toBeInstanceOf(PipelineError);
    });
  });

  describe('ImportError', () => {
    it('has correct code', () => {
      const err = new ImportError('circular', { chain: ['a.md', 'b.md'] });
      expect(err.code).toBe('IMPORT_ERROR');
      expect(err.name).toBe('ImportError');
    });
  });
});
