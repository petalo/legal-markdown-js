import { exportMetadata, filterMetadataForExport } from '../../../src/core/exporters/metadata-exporter';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('Metadata Export', () => {
  const testDir = path.join(__dirname, 'temp');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Support meta: key in YAML front matter', () => {
    it('should export metadata with meta key', () => {
      const metadata = {
        title: 'Test Document',
        meta: {
          tags: ['contract', 'legal'],
          category: 'business',
          version: '1.0'
        }
      };

      const result = exportMetadata(metadata, 'json', testDir);
      
      expect(result.exportedFiles).toHaveLength(1);
      
      const exportedPath = result.exportedFiles[0];
      const exportedContent = JSON.parse(fs.readFileSync(exportedPath, 'utf8'));
      
      expect(exportedContent.title).toBe('Test Document');
      expect(exportedContent.meta.tags).toEqual(['contract', 'legal']);
      expect(exportedContent.meta.category).toBe('business');
    });

    it('should handle empty meta key', () => {
      const metadata = {
        title: 'Document',
        meta: {}
      };

      const result = exportMetadata(metadata, 'yaml', testDir);
      
      expect(result.exportedFiles).toHaveLength(1);
      
      const exportedPath = result.exportedFiles[0];
      const exportedContent = yaml.load(fs.readFileSync(exportedPath, 'utf8')) as any;
      
      expect(exportedContent.title).toBe('Document');
      expect(exportedContent.meta).toEqual({});
    });

    it('should handle metadata without meta key', () => {
      const metadata = {
        title: 'Simple Document',
        author: 'John Doe'
      };

      const result = exportMetadata(metadata, 'json', testDir);
      
      expect(result.exportedFiles).toHaveLength(1);
      
      const exportedPath = result.exportedFiles[0];
      const exportedContent = JSON.parse(fs.readFileSync(exportedPath, 'utf8'));
      
      expect(exportedContent.title).toBe('Simple Document');
      expect(exportedContent.author).toBe('John Doe');
    });
  });

  describe('Export to YAML with meta-yaml-output:', () => {
    it('should export to specified YAML file', () => {
      const metadata = {
        title: 'YAML Export Test',
        'meta-yaml-output': 'custom-metadata.yaml',
        author: 'Test Author'
      };

      const result = exportMetadata(metadata, undefined, testDir);
      
      expect(result.exportedFiles).toHaveLength(1);
      expect(result.exportedFiles[0]).toContain('custom-metadata.yaml');
      
      const yamlPath = path.join(testDir, 'custom-metadata.yaml');
      expect(fs.existsSync(yamlPath)).toBe(true);
      
      const exportedContent = yaml.load(fs.readFileSync(yamlPath, 'utf8')) as any;
      expect(exportedContent.title).toBe('YAML Export Test');
      expect(exportedContent.author).toBe('Test Author');
      expect(exportedContent['meta-yaml-output']).toBeUndefined();
    });

    it('should use default filename when format is yaml', () => {
      const metadata = {
        title: 'Default YAML',
        author: 'Default Author'
      };

      const result = exportMetadata(metadata, 'yaml', testDir);
      
      expect(result.exportedFiles).toHaveLength(1);
      expect(result.exportedFiles[0]).toContain('metadata.yaml');
      
      const yamlPath = path.join(testDir, 'metadata.yaml');
      expect(fs.existsSync(yamlPath)).toBe(true);
    });

    it('should handle nested YAML structures', () => {
      const metadata = {
        'meta-yaml-output': 'nested.yaml',
        document: {
          title: 'Nested Test',
          properties: {
            classification: 'confidential',
            priority: 'high'
          }
        },
        parties: [
          { name: 'Party A', role: 'buyer' },
          { name: 'Party B', role: 'seller' }
        ]
      };

      const result = exportMetadata(metadata, undefined, testDir);
      
      const yamlPath = path.join(testDir, 'nested.yaml');
      const exportedContent = yaml.load(fs.readFileSync(yamlPath, 'utf8')) as any;
      
      expect(exportedContent.document.title).toBe('Nested Test');
      expect(exportedContent.document.properties.classification).toBe('confidential');
      expect(exportedContent.parties).toHaveLength(2);
      expect(exportedContent.parties[0].name).toBe('Party A');
    });
  });

  describe('Export to JSON with meta-json-output:', () => {
    it('should export to specified JSON file', () => {
      const metadata = {
        title: 'JSON Export Test',
        'meta-json-output': 'custom-metadata.json',
        description: 'Test description'
      };

      const result = exportMetadata(metadata, undefined, testDir);
      
      expect(result.exportedFiles).toHaveLength(1);
      expect(result.exportedFiles[0]).toContain('custom-metadata.json');
      
      const jsonPath = path.join(testDir, 'custom-metadata.json');
      expect(fs.existsSync(jsonPath)).toBe(true);
      
      const exportedContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      expect(exportedContent.title).toBe('JSON Export Test');
      expect(exportedContent.description).toBe('Test description');
      expect(exportedContent['meta-json-output']).toBeUndefined();
    });

    it('should use default filename when format is json', () => {
      const metadata = {
        title: 'Default JSON',
        version: '1.0'
      };

      const result = exportMetadata(metadata, 'json', testDir);
      
      expect(result.exportedFiles).toHaveLength(1);
      expect(result.exportedFiles[0]).toContain('metadata.json');
      
      const jsonPath = path.join(testDir, 'metadata.json');
      expect(fs.existsSync(jsonPath)).toBe(true);
      
      const exportedContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      expect(exportedContent.title).toBe('Default JSON');
      expect(exportedContent.version).toBe('1.0');
    });

    it('should format JSON with proper indentation', () => {
      const metadata = {
        'meta-json-output': 'formatted.json',
        complex: {
          nested: {
            data: 'value'
          },
          array: [1, 2, 3]
        }
      };

      exportMetadata(metadata, undefined, testDir);
      
      const jsonPath = path.join(testDir, 'formatted.json');
      const rawContent = fs.readFileSync(jsonPath, 'utf8');
      
      expect(rawContent).toContain('  ');
      expect(rawContent).toContain('\n');
      
      const parsedContent = JSON.parse(rawContent);
      expect(parsedContent.complex.nested.data).toBe('value');
      expect(parsedContent.complex.array).toEqual([1, 2, 3]);
    });
  });

  describe('Support meta-output-path: configuration', () => {
    it('should export to specified output path', () => {
      const customPath = path.join(testDir, 'custom', 'output');
      const metadata = {
        title: 'Custom Path Test',
        'meta-output-path': customPath,
        'meta-json-output': 'test.json'
      };

      const result = exportMetadata(metadata);
      
      expect(result.exportedFiles).toHaveLength(1);
      expect(result.exportedFiles[0]).toContain(customPath);
      
      const jsonPath = path.join(customPath, 'test.json');
      expect(fs.existsSync(jsonPath)).toBe(true);
      
      const exportedContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      expect(exportedContent.title).toBe('Custom Path Test');
    });

    it('should create output directory if it does not exist', () => {
      const deepPath = path.join(testDir, 'very', 'deep', 'nested', 'path');
      const metadata = {
        title: 'Deep Path Test',
        'meta-output-path': deepPath,
        'meta-yaml-output': 'deep.yaml'
      };

      expect(fs.existsSync(deepPath)).toBe(false);
      
      const result = exportMetadata(metadata);
      
      expect(fs.existsSync(deepPath)).toBe(true);
      expect(result.exportedFiles).toHaveLength(1);
      
      const yamlPath = path.join(deepPath, 'deep.yaml');
      expect(fs.existsSync(yamlPath)).toBe(true);
    });

    it('should override parameter path with metadata path', () => {
      const parameterPath = path.join(testDir, 'parameter');
      const metadataPath = path.join(testDir, 'metadata');
      
      const metadata = {
        title: 'Path Override Test',
        'meta-output-path': metadataPath,
        'meta-json-output': 'override.json'
      };

      const result = exportMetadata(metadata, 'json', parameterPath);
      
      expect(result.exportedFiles[0]).toContain(metadataPath);
      expect(result.exportedFiles[0]).not.toContain(parameterPath);
      
      const jsonPath = path.join(metadataPath, 'override.json');
      expect(fs.existsSync(jsonPath)).toBe(true);
    });
  });

  describe('Support meta-include-original: option', () => {
    it('should include only meta when meta-include-original is false', () => {
      const metadata = {
        title: 'Original Title',
        author: 'Original Author',
        'meta-include-original': false,
        meta: {
          tags: ['test'],
          category: 'document'
        }
      };

      const filtered = filterMetadataForExport(metadata);
      
      expect(filtered).toEqual({
        meta: {
          tags: ['test'],
          category: 'document'
        }
      });
    });

    it('should include all fields when meta-include-original is true', () => {
      const metadata = {
        title: 'Full Title',
        author: 'Full Author',
        'meta-include-original': true,
        meta: {
          tags: ['test']
        }
      };

      const filtered = filterMetadataForExport(metadata);
      
      expect(filtered.title).toBe('Full Title');
      expect(filtered.author).toBe('Full Author');
      expect(filtered.meta.tags).toEqual(['test']);
      expect(filtered['meta-include-original']).toBeUndefined();
    });

    it('should include all fields when meta-include-original is undefined', () => {
      const metadata = {
        title: 'Default Title',
        author: 'Default Author',
        meta: {
          tags: ['default']
        }
      };

      const filtered = filterMetadataForExport(metadata);
      
      expect(filtered.title).toBe('Default Title');
      expect(filtered.author).toBe('Default Author');
      expect(filtered.meta.tags).toEqual(['default']);
    });

    it('should export filtered metadata correctly', () => {
      const metadata = {
        title: 'Filter Test',
        author: 'Filter Author',
        'meta-include-original': false,
        'meta-json-output': 'filtered.json',
        meta: {
          version: '2.0',
          status: 'final'
        }
      };

      const result = exportMetadata(metadata, undefined, testDir);
      
      const jsonPath = path.join(testDir, 'filtered.json');
      const exportedContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      
      expect(exportedContent).toEqual({
        meta: {
          version: '2.0',
          status: 'final'
        }
      });
      
      expect(exportedContent.title).toBeUndefined();
      expect(exportedContent.author).toBeUndefined();
    });
  });

  describe('Export both YAML and JSON', () => {
    it('should export to both formats when both are specified', () => {
      const metadata = {
        title: 'Dual Export Test',
        'meta-yaml-output': 'dual.yaml',
        'meta-json-output': 'dual.json',
        author: 'Dual Author'
      };

      const result = exportMetadata(metadata, undefined, testDir);
      
      expect(result.exportedFiles).toHaveLength(2);
      
      const yamlPath = path.join(testDir, 'dual.yaml');
      const jsonPath = path.join(testDir, 'dual.json');
      
      expect(fs.existsSync(yamlPath)).toBe(true);
      expect(fs.existsSync(jsonPath)).toBe(true);
      
      const yamlContent = yaml.load(fs.readFileSync(yamlPath, 'utf8')) as any;
      const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      
      expect(yamlContent.title).toBe('Dual Export Test');
      expect(jsonContent.title).toBe('Dual Export Test');
      expect(yamlContent.author).toBe('Dual Author');
      expect(jsonContent.author).toBe('Dual Author');
    });

    it('should handle complex data in both formats', () => {
      const metadata = {
        'meta-yaml-output': 'complex.yaml',
        'meta-json-output': 'complex.json',
        contract: {
          parties: [
            { name: 'Company A', type: 'Corporation' },
            { name: 'Individual B', type: 'Person' }
          ],
          terms: {
            duration: '12 months',
            value: 100000,
            currency: 'USD'
          }
        },
        dates: {
          created: '2024-01-01',
          effective: '2024-06-01',
          expires: '2025-06-01'
        }
      };

      const result = exportMetadata(metadata, undefined, testDir);
      
      expect(result.exportedFiles).toHaveLength(2);
      
      const yamlPath = path.join(testDir, 'complex.yaml');
      const jsonPath = path.join(testDir, 'complex.json');
      
      const yamlContent = yaml.load(fs.readFileSync(yamlPath, 'utf8')) as any;
      const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      
      expect(yamlContent.contract.parties).toHaveLength(2);
      expect(jsonContent.contract.parties).toHaveLength(2);
      expect(yamlContent.contract.terms.value).toBe(100000);
      expect(jsonContent.contract.terms.value).toBe(100000);
    });
  });

  describe('Error handling', () => {
    it('should handle empty metadata', () => {
      const result = exportMetadata({}, 'json', testDir);
      
      expect(result.exportedFiles).toHaveLength(1);
      
      const jsonPath = path.join(testDir, 'metadata.json');
      const content = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      
      expect(content).toEqual({});
    });

    it('should handle metadata with null values', () => {
      const metadata = {
        title: 'Null Test',
        optional_field: null,
        undefined_field: undefined
      };

      const result = exportMetadata(metadata, 'json', testDir);
      
      const jsonPath = path.join(testDir, 'metadata.json');
      const content = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      
      expect(content.title).toBe('Null Test');
      expect(content.optional_field).toBeNull();
      expect(content.undefined_field).toBeUndefined();
    });

    it('should handle export without output path', () => {
      const metadata = {
        title: 'No Path Test'
      };

      const result = exportMetadata(metadata, 'json');
      
      expect(result.exportedFiles).toHaveLength(1);
      expect(path.dirname(result.exportedFiles[0])).toBe(process.cwd());
    });
  });
});