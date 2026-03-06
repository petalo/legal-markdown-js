import { _asEnum } from '../../../src/config/schema';

describe('schema internals', () => {
  describe('asEnum', () => {
    const allowed = new Set(['A4', 'letter', 'legal'] as const);

    it('should return fallback for undefined value', () => {
      const errors: string[] = [];
      expect(_asEnum(undefined, allowed, 'A4', 'format', errors)).toBe('A4');
      expect(errors).toHaveLength(0);
    });

    it('should return valid enum value', () => {
      const errors: string[] = [];
      expect(_asEnum('letter', allowed, 'A4', 'format', errors)).toBe('letter');
      expect(errors).toHaveLength(0);
    });

    it('should push error and return fallback for invalid value', () => {
      const errors: string[] = [];
      expect(_asEnum('invalid', allowed, 'A4', 'format', errors)).toBe('A4');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('format must be one of');
    });

    it('should push error for non-string value', () => {
      const errors: string[] = [];
      expect(_asEnum(42, allowed, 'A4', 'format', errors)).toBe('A4');
      expect(errors).toHaveLength(1);
    });
  });
});
