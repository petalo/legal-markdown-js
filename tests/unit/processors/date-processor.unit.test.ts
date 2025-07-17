/**
 * @fileoverview Tests for the date reference processor
 * 
 * This test suite verifies the @today date substitution system:
 * - Basic @today replacement with various format options
 * - Inline format overrides and metadata-driven formatting
 * - Locale and timezone support for internationalization
 * - Custom date format patterns and ordinal suffix handling
 * - Edge cases and error recovery for invalid formats
 */

import { processDateReferences } from '../../../src/core/processors/date-processor';

describe('Date Processor', () => {
  const mockDate = new Date('2024-03-15T10:30:00Z');
  
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('processDateReferences', () => {
    it('should replace @today with default ISO format', () => {
      const content = 'This contract is signed on @today.';
      const metadata = {};
      
      const result = processDateReferences(content, metadata);
      
      expect(result).toBe('This contract is signed on 2024-03-15.');
    });

    it('should handle multiple @today references', () => {
      const content = 'Start: @today, End: @today';
      const metadata = {};
      
      const result = processDateReferences(content, metadata);
      
      expect(result).toBe('Start: 2024-03-15, End: 2024-03-15');
    });

    it('should use date format from metadata', () => {
      const content = 'Contract date: @today';
      const metadata = { 'date-format': 'US' };
      
      const result = processDateReferences(content, metadata);
      
      expect(result).toBe('Contract date: 03/15/2024');
    });

    it('should use dateFormat from metadata (camelCase)', () => {
      const content = 'Contract date: @today';
      const metadata = { dateFormat: 'European' };
      
      const result = processDateReferences(content, metadata);
      
      expect(result).toBe('Contract date: 15/03/2024');
    });

    it('should handle inline format override', () => {
      const content = 'Today is @today[long] and tomorrow is @today[short].';
      const metadata = {};
      
      const result = processDateReferences(content, metadata);
      
      expect(result).toBe('Today is March 15, 2024 and tomorrow is Mar 15, 24.');
    });

    it('should prioritize inline format over metadata format', () => {
      const content = 'Date: @today[US]';
      const metadata = { 'date-format': 'European' };
      
      const result = processDateReferences(content, metadata);
      
      expect(result).toBe('Date: 03/15/2024');
    });

    it('should handle ISO format', () => {
      const content = 'ISO date: @today[ISO]';
      const metadata = {};
      
      const result = processDateReferences(content, metadata);
      
      expect(result).toBe('ISO date: 2024-03-15');
    });

    it('should handle legal format with ordinal suffix', () => {
      const content = 'Legal date: @today[legal]';
      const metadata = {};
      
      const result = processDateReferences(content, metadata);
      
      expect(result).toBe('Legal date: March 15th, 2024');
    });

    it('should handle medium format', () => {
      const content = 'Medium date: @today[medium]';
      const metadata = {};
      
      const result = processDateReferences(content, metadata);
      
      expect(result).toBe('Medium date: Mar 15, 2024');
    });

    it('should handle custom format patterns', () => {
      const content = 'Custom: @today[DD/MM/YYYY]';
      const metadata = {};
      
      const result = processDateReferences(content, metadata);
      
      expect(result).toBe('Custom: 15/03/2024');
    });

    it('should handle timezone from metadata', () => {
      const content = 'Date: @today';
      const metadata = { 
        'date-format': 'ISO',
        timezone: 'America/New_York' 
      };
      
      const result = processDateReferences(content, metadata);
      
      // Should still be same date as we're mocking the system time
      expect(result).toBe('Date: 2024-03-15');
    });

    it('should handle locale from metadata', () => {
      const content = 'Date: @today[long]';
      const metadata = { 
        locale: 'es-ES'
      };
      
      const result = processDateReferences(content, metadata);
      
      expect(result).toBe('Date: 15 de marzo de 2024');
    });

    it('should handle tz alias for timezone', () => {
      const content = 'Date: @today';
      const metadata = { 
        'date-format': 'ISO',
        tz: 'UTC' 
      };
      
      const result = processDateReferences(content, metadata);
      
      expect(result).toBe('Date: 2024-03-15');
    });

    it('should handle lang alias for locale', () => {
      const content = 'Date: @today[long]';
      const metadata = { 
        lang: 'fr-FR'
      };
      
      const result = processDateReferences(content, metadata);
      
      expect(result).toBe('Date: 15 mars 2024');
    });

    it('should fallback to ISO format on error', () => {
      const content = 'Date: @today[invalid-format]';
      const metadata = {};
      
      const result = processDateReferences(content, metadata);
      
      expect(result).toBe('Date: 2024-03-15');
    });

    it('should handle content without @today references', () => {
      const content = 'This is a normal document with no date references.';
      const metadata = {};
      
      const result = processDateReferences(content, metadata);
      
      expect(result).toBe('This is a normal document with no date references.');
    });

    it('should handle empty content', () => {
      const content = '';
      const metadata = {};
      
      const result = processDateReferences(content, metadata);
      
      expect(result).toBe('');
    });

    it('should handle nested @today in complex text', () => {
      const content = `
        AGREEMENT
        
        This Software License Agreement ("Agreement") is entered into on @today[legal]
        between the parties listed below.
        
        Effective Date: @today[ISO]
        Expiration Date: @today[US]
      `;
      const metadata = {};
      
      const result = processDateReferences(content, metadata);
      
      expect(result).toContain('March 15th, 2024');
      expect(result).toContain('2024-03-15');
      expect(result).toContain('03/15/2024');
    });

    describe('ordinal suffix handling', () => {
      /**
       * Tests ordinal suffix generation for legal date formatting
       * Critical for formal legal documents requiring precise date presentation
       */
      it('should handle 1st, 2nd, 3rd correctly', () => {
        const dates = [
          { date: '2024-03-01T10:30:00Z', expected: '1st' },
          { date: '2024-03-02T10:30:00Z', expected: '2nd' },
          { date: '2024-03-03T10:30:00Z', expected: '3rd' },
          { date: '2024-03-04T10:30:00Z', expected: '4th' },
        ];

        dates.forEach(({ date, expected }) => {
          jest.setSystemTime(new Date(date));
          const content = 'Date: @today[legal]';
          const result = processDateReferences(content, {});
          expect(result).toContain(expected);
        });
      });

      it('should handle 11th, 12th, 13th correctly', () => {
        const dates = [
          { date: '2024-03-11T10:30:00Z', expected: '11th' },
          { date: '2024-03-12T10:30:00Z', expected: '12th' },
          { date: '2024-03-13T10:30:00Z', expected: '13th' },
        ];

        dates.forEach(({ date, expected }) => {
          jest.setSystemTime(new Date(date));
          const content = 'Date: @today[legal]';
          const result = processDateReferences(content, {});
          expect(result).toContain(expected);
        });
      });

      it('should handle 21st, 22nd, 23rd correctly', () => {
        const dates = [
          { date: '2024-03-21T10:30:00Z', expected: '21st' },
          { date: '2024-03-22T10:30:00Z', expected: '22nd' },
          { date: '2024-03-23T10:30:00Z', expected: '23rd' },
        ];

        dates.forEach(({ date, expected }) => {
          jest.setSystemTime(new Date(date));
          const content = 'Date: @today[legal]';
          const result = processDateReferences(content, {});
          expect(result).toContain(expected);
        });
      });
    });

    describe('custom format parsing', () => {
      it('should handle YYYY token', () => {
        const content = 'Year: @today[YYYY]';
        const result = processDateReferences(content, {});
        expect(result).toBe('Year: 2024');
      });

      it('should handle YY token', () => {
        const content = 'Year: @today[YY]';
        const result = processDateReferences(content, {});
        expect(result).toBe('Year: 24');
      });

      it('should handle MMMM token', () => {
        const content = 'Month: @today[MMMM]';
        const result = processDateReferences(content, {});
        expect(result).toBe('Month: March');
      });

      it('should handle MMM token', () => {
        const content = 'Month: @today[MMM]';
        const result = processDateReferences(content, {});
        expect(result).toBe('Month: Mar');
      });

      it('should handle MM token', () => {
        const content = 'Month: @today[MM]';
        const result = processDateReferences(content, {});
        expect(result).toBe('Month: 03');
      });

      it('should handle M token', () => {
        const content = 'Month: @today[M]';
        const result = processDateReferences(content, {});
        expect(result).toBe('Month: 3');
      });

      it('should handle DD token', () => {
        const content = 'Day: @today[DD]';
        const result = processDateReferences(content, {});
        expect(result).toBe('Day: 15');
      });

      it('should handle D token', () => {
        const content = 'Day: @today[D]';
        const result = processDateReferences(content, {});
        expect(result).toBe('Day: 15');
      });

      it('should handle complex custom format', () => {
        const content = 'Date: @today[MMMM D, YYYY]';
        const result = processDateReferences(content, {});
        expect(result).toBe('Date: March 15, 2024');
      });
    });
  });
});