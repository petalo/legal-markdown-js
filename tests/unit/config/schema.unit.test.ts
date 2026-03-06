import { DEFAULT_CONFIG, validateConfig } from '../../../src/config/schema';

describe('config schema', () => {
  describe('DEFAULT_CONFIG', () => {
    it('has expected default values', () => {
      expect(DEFAULT_CONFIG.pdf.connector).toBe('auto');
      expect(DEFAULT_CONFIG.pdf.format).toBe('A4');
      expect(DEFAULT_CONFIG.logging.level).toBe('error');
      expect(DEFAULT_CONFIG.logging.debug).toBe(false);
      expect(DEFAULT_CONFIG.processing.validationMode).toBe('auto');
      expect(DEFAULT_CONFIG.processing.astFieldTracking).toBe(false);
      expect(DEFAULT_CONFIG.processing.logicBranchHighlighting).toBe(false);
    });
  });

  describe('validateConfig', () => {
    it('returns defaults when given null/undefined', () => {
      const result = validateConfig(null);
      expect(result.pdf.connector).toBe('auto');
      expect(result.logging.level).toBe('error');
    });

    it('returns defaults when given empty object', () => {
      const result = validateConfig({});
      expect(result.paths.input).toBe(DEFAULT_CONFIG.paths.input);
      expect(result.paths.output).toBe(DEFAULT_CONFIG.paths.output);
    });

    it('accepts valid enum values', () => {
      const result = validateConfig({
        logging: { level: 'debug' },
        processing: { validationMode: 'strict' },
        pdf: { connector: 'puppeteer', format: 'Letter' },
      });
      expect(result.logging.level).toBe('debug');
      expect(result.processing.validationMode).toBe('strict');
      expect(result.pdf.connector).toBe('puppeteer');
      expect(result.pdf.format).toBe('Letter');
    });

    it('throws on invalid enum values', () => {
      expect(() =>
        validateConfig({ logging: { level: 'invalid' } })
      ).toThrow('Invalid legal-md configuration');
    });

    it('accepts valid boolean values', () => {
      const result = validateConfig({
        logging: { debug: true },
        processing: {
          highlight: true,
          enableFieldTracking: true,
          astFieldTracking: true,
          logicBranchHighlighting: true,
        },
      });
      expect(result.logging.debug).toBe(true);
      expect(result.processing.highlight).toBe(true);
      expect(result.processing.enableFieldTracking).toBe(true);
      expect(result.processing.astFieldTracking).toBe(true);
      expect(result.processing.logicBranchHighlighting).toBe(true);
    });

    it('accepts valid string path overrides', () => {
      const result = validateConfig({
        paths: { input: 'custom/input', output: 'custom/output' },
      });
      expect(result.paths.input).toBe('custom/input');
      expect(result.paths.output).toBe('custom/output');
    });

    it('falls back to defaults for empty strings', () => {
      const result = validateConfig({
        paths: { input: '', output: '  ' },
      });
      expect(result.paths.input).toBe(DEFAULT_CONFIG.paths.input);
      expect(result.paths.output).toBe(DEFAULT_CONFIG.paths.output);
    });

    it('accepts custom margin values', () => {
      const result = validateConfig({
        pdf: { margin: { top: '2in', bottom: '2in', left: '0.5in', right: '0.5in' } },
      });
      expect(result.pdf.margin.top).toBe('2in');
      expect(result.pdf.margin.left).toBe('0.5in');
    });

    it('collects multiple validation errors', () => {
      expect(() =>
        validateConfig({
          logging: { level: 'bad' },
          pdf: { connector: 'bad', format: 'bad' },
        })
      ).toThrow(/logging\.level.*pdf\.connector.*pdf\.format/s);
    });
  });
});
