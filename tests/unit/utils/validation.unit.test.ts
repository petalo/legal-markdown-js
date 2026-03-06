import { isValidUrl, sanitizeFileName } from '@utils/validation';

describe('validation utilities', () => {
  describe('isValidUrl', () => {
    it('returns true for valid HTTP URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com/path?q=1')).toBe(true);
    });

    it('returns true for valid non-HTTP URLs', () => {
      expect(isValidUrl('ftp://files.example.com')).toBe(true);
    });

    it('returns false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('://missing-protocol')).toBe(false);
    });
  });

  describe('sanitizeFileName', () => {
    it('replaces special characters with underscores', () => {
      expect(sanitizeFileName('My Document!.pdf')).toBe('My_Document_.pdf');
    });

    it('keeps alphanumeric, dots, and hyphens', () => {
      expect(sanitizeFileName('file-name.2024.txt')).toBe('file-name.2024.txt');
    });

    it('replaces spaces with underscores', () => {
      expect(sanitizeFileName('hello world.md')).toBe('hello_world.md');
    });
  });
});
