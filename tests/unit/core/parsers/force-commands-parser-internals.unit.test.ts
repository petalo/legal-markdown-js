import { vi } from 'vitest';
import {
  _parseCommandArguments,
  _parseArgumentsToCommands,
  _validateAndFilterCommands,
} from '../../../../src/core/parsers/force-commands-parser';
import { logger } from '../../../../src/utils/logger';

vi.mock('../../../../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('force-commands-parser internals', () => {
  describe('parseCommandArguments', () => {
    it('should parse simple flags', () => {
      expect(_parseCommandArguments('--pdf --html')).toEqual(['--pdf', '--html']);
    });

    it('should handle double-quoted values', () => {
      expect(_parseCommandArguments('--css "my file.css" --pdf')).toEqual([
        '--css',
        'my file.css',
        '--pdf',
      ]);
    });

    it('should handle single-quoted values', () => {
      expect(_parseCommandArguments("--title 'My Document'")).toEqual([
        '--title',
        'My Document',
      ]);
    });

    it('should return empty array for empty string', () => {
      expect(_parseCommandArguments('')).toEqual([]);
    });

    it('should handle multiple spaces between args', () => {
      expect(_parseCommandArguments('--pdf    --html')).toEqual(['--pdf', '--html']);
    });
  });

  describe('parseArgumentsToCommands', () => {
    it('should parse --pdf flag', () => {
      const result = _parseArgumentsToCommands(['--pdf']);
      expect(result.pdf).toBe(true);
    });

    it('should parse --css with file path', () => {
      const result = _parseArgumentsToCommands(['--css', 'style.css']);
      expect(result.css).toBe('style.css');
    });

    it('should parse --format with valid value', () => {
      const result = _parseArgumentsToCommands(['--format', 'A4']);
      expect(result.format).toBe('A4');
    });

    it('should ignore --format with invalid value', () => {
      const result = _parseArgumentsToCommands(['--format', 'tabloid']);
      expect(result.format).toBeUndefined();
    });

    it('should skip non-option arguments', () => {
      const result = _parseArgumentsToCommands(['random', '--pdf']);
      expect(result.pdf).toBe(true);
    });

    it('should handle --output-name', () => {
      const result = _parseArgumentsToCommands(['--output-name', 'out.md']);
      expect(result.output).toBe('out.md');
    });

    it('should handle all boolean flags', () => {
      const result = _parseArgumentsToCommands([
        '--pdf',
        '--html',
        '--docx',
        '--highlight',
        '--landscape',
        '--export-yaml',
        '--export-json',
        '--debug',
      ]);
      expect(result.pdf).toBe(true);
      expect(result.html).toBe(true);
      expect(result.docx).toBe(true);
      expect(result.highlight).toBe(true);
      expect(result.landscape).toBe(true);
      expect(result.exportYaml).toBe(true);
      expect(result.exportJson).toBe(true);
      expect(result.debug).toBe(true);
    });
  });

  describe('validateAndFilterCommands', () => {
    it('should pass through safe commands', () => {
      const result = _validateAndFilterCommands({ pdf: true, css: 'style.css' });
      expect(result.pdf).toBe(true);
      expect(result.css).toBe('style.css');
    });

    it('should reject paths with ..', () => {
      const result = _validateAndFilterCommands({ css: '../../../etc/passwd' });
      expect(result.css).toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith('Potentially unsafe path in force_commands', {
        command: 'css',
        value: '../../../etc/passwd',
      });
    });

    it('should reject absolute paths', () => {
      const result = _validateAndFilterCommands({ css: '/etc/style.css' });
      expect(result.css).toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith('Potentially unsafe path in force_commands', {
        command: 'css',
        value: '/etc/style.css',
      });
    });
  });
});
