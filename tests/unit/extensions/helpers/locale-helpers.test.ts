import { clearConfigCache } from '../../../../src/config';
import { formatDate } from '../../../../src/extensions/helpers/advanced-date-helpers';
import { formatCurrency, ordinal } from '../../../../src/extensions/helpers/number-helpers';
import { compileHandlebarsTemplate } from '../../../../src/extensions/handlebars-engine';

describe('Locale-aware helpers', () => {
  describe('ordinal', () => {
    it('supports locale-specific ordinals', () => {
      expect(ordinal(1, 'en')).toBe('1st');
      expect(ordinal(1, 'es')).toBe('1.º');
      expect(ordinal(1, 'fr')).toBe('1er');
      expect(ordinal(2, 'fr')).toBe('2e');
      expect(ordinal(1, 'de')).toBe('1.');
      expect(ordinal(1, 'it')).toBe('1°');
      expect(ordinal(1, 'pt')).toBe('1.º');
    });

    it('falls back to english defaults', () => {
      clearConfigCache();
      expect(ordinal(15)).toBe('15th');
      expect(ordinal(15, 'unknown-locale')).toBe('15th');
    });
  });

  describe('formatDate', () => {
    it('supports locale month names', () => {
      expect(formatDate('2025-06-15', 'MMMM DD, YYYY', 'es').toLowerCase()).toContain('junio');
      expect(formatDate('2025-06-15', 'MMMM DD, YYYY', 'fr').toLowerCase()).toContain('juin');
      expect(formatDate('2025-06-15', 'MMMM DD, YYYY', 'de')).toContain('Juni');
    });

    it('keeps english as default locale', () => {
      clearConfigCache();
      expect(formatDate('2025-01-15', 'MMMM DD, YYYY')).toBe('January 15, 2025');
    });
  });

  describe('formatCurrency', () => {
    it('formats currency with locale-aware output', () => {
      const germanEur = formatCurrency(1234.56, 'EUR', 2, 'de');
      expect(germanEur).toContain('1.234,56');
      expect(germanEur).toContain('€');

      expect(formatCurrency(1234.56, 'USD', 2, 'en')).toBe('$1,234.56');

      const spanishEur = formatCurrency(1234.56, 'EUR', 2, 'es');
      expect(spanishEur).toMatch(/(?:1\.234|1234),56/);
      expect(spanishEur).toContain('€');
    });
  });

  describe('Handlebars locale resolution', () => {
    it('uses locale from root data when no inline locale is provided', () => {
      expect(compileHandlebarsTemplate('{{ordinal day}}', { day: 15, locale: 'es' })).toBe('15.º');
    });

    it('supports inline locale override per helper call', () => {
      expect(compileHandlebarsTemplate('{{ordinal day "fr"}}', { day: 15, locale: 'en' })).toBe(
        '15e'
      );
      expect(
        compileHandlebarsTemplate('{{formatDate date "MMMM DD, YYYY" "es"}}', {
          date: '2025-06-15',
        })
      ).toContain('junio');
    });
  });
});
