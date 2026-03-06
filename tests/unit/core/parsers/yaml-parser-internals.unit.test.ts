import {
  _getYamlDepth,
  _processDateReferencesInYaml,
  _formatDateForYaml,
} from '../../../../src/core/parsers/yaml-parser';

describe('yaml-parser internals', () => {
  describe('getYamlDepth', () => {
    it('should return 0 for primitives', () => {
      expect(_getYamlDepth(null)).toBe(0);
      expect(_getYamlDepth(undefined)).toBe(0);
      expect(_getYamlDepth('string')).toBe(0);
      expect(_getYamlDepth(42)).toBe(0);
    });

    it('should return 1 for flat object', () => {
      expect(_getYamlDepth({ a: 1, b: 2 })).toBe(1);
    });

    it('should return depth for nested objects', () => {
      expect(_getYamlDepth({ a: { b: { c: 1 } } })).toBe(3);
    });

    it('should return 1 for empty object', () => {
      expect(_getYamlDepth({})).toBe(1);
    });

    it('should return 1 for empty array', () => {
      expect(_getYamlDepth([])).toBe(1);
    });

    it('should handle arrays with nested objects', () => {
      expect(_getYamlDepth([{ a: 1 }, { b: { c: 2 } }])).toBe(3);
    });
  });

  describe('processDateReferencesInYaml', () => {
    it('should replace @today with quoted ISO date', () => {
      const result = _processDateReferencesInYaml('date: @today');
      expect(result).toMatch(/date: "\d{4}-\d{2}-\d{2}"/);
    });

    it('should replace @today[legal] with quoted legal date', () => {
      const result = _processDateReferencesInYaml('date: @today[legal]');
      expect(result).toMatch(/date: "\w+ \d+, \d{4}"/);
    });

    it('should handle multiple @today references', () => {
      const input = 'start: @today\nend: @today[us]';
      const result = _processDateReferencesInYaml(input);
      expect(result).not.toContain('@today');
    });

    it('should not modify content without @today', () => {
      const input = 'title: My Document';
      expect(_processDateReferencesInYaml(input)).toBe(input);
    });
  });

  describe('formatDateForYaml', () => {
    const testDate = new Date(2024, 0, 15); // Jan 15, 2024

    it('should format ISO/yyyy-mm-dd', () => {
      expect(_formatDateForYaml(testDate, 'iso')).toBe('2024-01-15');
      expect(_formatDateForYaml(testDate, 'YYYY-MM-DD')).toBe('2024-01-15');
    });

    it('should format US date', () => {
      expect(_formatDateForYaml(testDate, 'us')).toBe('01/15/2024');
      expect(_formatDateForYaml(testDate, 'MM/DD/YYYY')).toBe('01/15/2024');
    });

    it('should format EU date', () => {
      expect(_formatDateForYaml(testDate, 'eu')).toBe('15/01/2024');
    });

    it('should format legal date', () => {
      expect(_formatDateForYaml(testDate, 'legal')).toBe('January 15, 2024');
    });

    it('should format long date', () => {
      const result = _formatDateForYaml(testDate, 'long');
      expect(result).toContain('January');
      expect(result).toContain('2024');
    });

    it('should format medium date', () => {
      const result = _formatDateForYaml(testDate, 'medium');
      expect(result).toContain('Jan');
      expect(result).toContain('2024');
    });

    it('should default to ISO for unknown format', () => {
      expect(_formatDateForYaml(testDate, 'unknown-format')).toBe('2024-01-15');
    });
  });
});
