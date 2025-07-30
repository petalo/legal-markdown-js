/**
 * Unit tests for number formatting utility functions
 *
 * Tests the getRomanNumeral and getAlphaLabel functions to ensure proper conversion
 * of numbers to various formats (Roman numerals, alphabetic labels).
 *
 * @module
 */

import { getRomanNumeral, getAlphaLabel } from '@utils/number-utilities';

describe('getRomanNumeral', () => {
  describe('lowercase roman numerals', () => {
    it('should convert basic numbers to lowercase roman numerals', () => {
      expect(getRomanNumeral(1, true)).toBe('i');
      expect(getRomanNumeral(2, true)).toBe('ii');
      expect(getRomanNumeral(3, true)).toBe('iii');
      expect(getRomanNumeral(4, true)).toBe('iv');
      expect(getRomanNumeral(5, true)).toBe('v');
      expect(getRomanNumeral(6, true)).toBe('vi');
      expect(getRomanNumeral(7, true)).toBe('vii');
      expect(getRomanNumeral(8, true)).toBe('viii');
      expect(getRomanNumeral(9, true)).toBe('ix');
      expect(getRomanNumeral(10, true)).toBe('x');
    });

    it('should convert teens to lowercase roman numerals', () => {
      expect(getRomanNumeral(11, true)).toBe('xi');
      expect(getRomanNumeral(14, true)).toBe('xiv');
      expect(getRomanNumeral(15, true)).toBe('xv');
      expect(getRomanNumeral(19, true)).toBe('xix');
      expect(getRomanNumeral(20, true)).toBe('xx');
    });

    it('should convert larger numbers to lowercase roman numerals', () => {
      expect(getRomanNumeral(40, true)).toBe('xl');
      expect(getRomanNumeral(50, true)).toBe('l');
      expect(getRomanNumeral(90, true)).toBe('xc');
      expect(getRomanNumeral(100, true)).toBe('c');
      expect(getRomanNumeral(400, true)).toBe('cd');
      expect(getRomanNumeral(500, true)).toBe('d');
      expect(getRomanNumeral(900, true)).toBe('cm');
      expect(getRomanNumeral(1000, true)).toBe('m');
    });

    it('should convert complex numbers to lowercase roman numerals', () => {
      expect(getRomanNumeral(27, true)).toBe('xxvii');
      expect(getRomanNumeral(48, true)).toBe('xlviii');
      expect(getRomanNumeral(59, true)).toBe('lix');
      expect(getRomanNumeral(93, true)).toBe('xciii');
      expect(getRomanNumeral(141, true)).toBe('cxli');
      expect(getRomanNumeral(163, true)).toBe('clxiii');
      expect(getRomanNumeral(402, true)).toBe('cdii');
      expect(getRomanNumeral(575, true)).toBe('dlxxv');
      expect(getRomanNumeral(911, true)).toBe('cmxi');
      expect(getRomanNumeral(1024, true)).toBe('mxxiv');
    });
  });

  describe('uppercase roman numerals', () => {
    it('should convert basic numbers to uppercase roman numerals', () => {
      expect(getRomanNumeral(1, false)).toBe('I');
      expect(getRomanNumeral(2, false)).toBe('II');
      expect(getRomanNumeral(3, false)).toBe('III');
      expect(getRomanNumeral(4, false)).toBe('IV');
      expect(getRomanNumeral(5, false)).toBe('V');
      expect(getRomanNumeral(6, false)).toBe('VI');
      expect(getRomanNumeral(7, false)).toBe('VII');
      expect(getRomanNumeral(8, false)).toBe('VIII');
      expect(getRomanNumeral(9, false)).toBe('IX');
      expect(getRomanNumeral(10, false)).toBe('X');
    });

    it('should convert teens to uppercase roman numerals', () => {
      expect(getRomanNumeral(11, false)).toBe('XI');
      expect(getRomanNumeral(14, false)).toBe('XIV');
      expect(getRomanNumeral(15, false)).toBe('XV');
      expect(getRomanNumeral(19, false)).toBe('XIX');
      expect(getRomanNumeral(20, false)).toBe('XX');
    });

    it('should convert larger numbers to uppercase roman numerals', () => {
      expect(getRomanNumeral(40, false)).toBe('XL');
      expect(getRomanNumeral(50, false)).toBe('L');
      expect(getRomanNumeral(90, false)).toBe('XC');
      expect(getRomanNumeral(100, false)).toBe('C');
      expect(getRomanNumeral(400, false)).toBe('CD');
      expect(getRomanNumeral(500, false)).toBe('D');
      expect(getRomanNumeral(900, false)).toBe('CM');
      expect(getRomanNumeral(1000, false)).toBe('M');
    });

    it('should convert complex numbers to uppercase roman numerals', () => {
      expect(getRomanNumeral(27, false)).toBe('XXVII');
      expect(getRomanNumeral(48, false)).toBe('XLVIII');
      expect(getRomanNumeral(59, false)).toBe('LIX');
      expect(getRomanNumeral(93, false)).toBe('XCIII');
      expect(getRomanNumeral(141, false)).toBe('CXLI');
      expect(getRomanNumeral(163, false)).toBe('CLXIII');
      expect(getRomanNumeral(402, false)).toBe('CDII');
      expect(getRomanNumeral(575, false)).toBe('DLXXV');
      expect(getRomanNumeral(911, false)).toBe('CMXI');
      expect(getRomanNumeral(1024, false)).toBe('MXXIV');
    });
  });

  describe('default parameter behavior', () => {
    it('should default to uppercase when lowercase parameter is not provided', () => {
      expect(getRomanNumeral(1)).toBe('I');
      expect(getRomanNumeral(5)).toBe('V');
      expect(getRomanNumeral(10)).toBe('X');
      expect(getRomanNumeral(50)).toBe('L');
      expect(getRomanNumeral(100)).toBe('C');
      expect(getRomanNumeral(500)).toBe('D');
      expect(getRomanNumeral(1000)).toBe('M');
    });
  });

  describe('edge cases', () => {
    it('should handle zero and negative numbers gracefully', () => {
      expect(getRomanNumeral(0, true)).toBe('');
      expect(getRomanNumeral(-1, true)).toBe('');
      expect(getRomanNumeral(-5, false)).toBe('');
    });

    it('should handle large numbers correctly', () => {
      expect(getRomanNumeral(3999, true)).toBe('mmmcmxcix');
      expect(getRomanNumeral(3999, false)).toBe('MMMCMXCIX');
    });
  });

  describe('legal document context', () => {
    it('should work correctly for typical legal document annexes (lowercase)', () => {
      // Common annex numbering in legal documents
      expect(getRomanNumeral(1, true)).toBe('i'); // Anexo i
      expect(getRomanNumeral(2, true)).toBe('ii'); // Anexo ii
      expect(getRomanNumeral(3, true)).toBe('iii'); // Anexo iii
      expect(getRomanNumeral(4, true)).toBe('iv'); // Anexo iv
      expect(getRomanNumeral(5, true)).toBe('v'); // Anexo v
    });

    it('should work correctly for formal legal document sections (uppercase)', () => {
      // Formal legal section numbering
      expect(getRomanNumeral(1, false)).toBe('I'); // Section I
      expect(getRomanNumeral(2, false)).toBe('II'); // Section II
      expect(getRomanNumeral(3, false)).toBe('III'); // Section III
      expect(getRomanNumeral(4, false)).toBe('IV'); // Section IV
      expect(getRomanNumeral(5, false)).toBe('V'); // Section V
    });
  });

  describe('placeholder context (%r vs %R)', () => {
    it('should work correctly when used with %r placeholder (lowercase)', () => {
      // When used with %r in formats like "Annex %r -"
      expect(getRomanNumeral(1, true)).toBe('i');
      expect(getRomanNumeral(2, true)).toBe('ii');
      expect(getRomanNumeral(3, true)).toBe('iii');
      expect(getRomanNumeral(6, true)).toBe('vi');
    });

    it('should work correctly when used with %R placeholder (uppercase)', () => {
      // When used with %R in formats like "Annex %R -"
      expect(getRomanNumeral(1, false)).toBe('I');
      expect(getRomanNumeral(2, false)).toBe('II');
      expect(getRomanNumeral(3, false)).toBe('III');
      expect(getRomanNumeral(6, false)).toBe('VI');
    });
  });
});

describe('getAlphaLabel', () => {
  describe('basic alphabetic conversion', () => {
    it('should convert numbers 1-26 to single letters', () => {
      expect(getAlphaLabel(1)).toBe('a');
      expect(getAlphaLabel(2)).toBe('b');
      expect(getAlphaLabel(3)).toBe('c');
      expect(getAlphaLabel(25)).toBe('y');
      expect(getAlphaLabel(26)).toBe('z');
    });

    it('should convert numbers beyond 26 to double letters', () => {
      expect(getAlphaLabel(27)).toBe('aa');
      expect(getAlphaLabel(28)).toBe('ab');
      expect(getAlphaLabel(52)).toBe('az');
      expect(getAlphaLabel(53)).toBe('ba');
      expect(getAlphaLabel(54)).toBe('bb');
    });

    it('should convert larger numbers to multiple letters', () => {
      expect(getAlphaLabel(702)).toBe('zz');
      expect(getAlphaLabel(703)).toBe('aaa');
      expect(getAlphaLabel(704)).toBe('aab');
    });
  });

  describe('edge cases', () => {
    it('should handle zero and negative numbers', () => {
      expect(getAlphaLabel(0)).toBe('');
      expect(getAlphaLabel(-1)).toBe('');
      expect(getAlphaLabel(-10)).toBe('');
    });
  });

  describe('legal document context', () => {
    it('should work correctly for typical legal subsection numbering', () => {
      // Common subsection patterns like (a), (b), (c)
      expect(getAlphaLabel(1)).toBe('a'); // (a)
      expect(getAlphaLabel(2)).toBe('b'); // (b)
      expect(getAlphaLabel(3)).toBe('c'); // (c)
      expect(getAlphaLabel(4)).toBe('d'); // (d)
      expect(getAlphaLabel(5)).toBe('e'); // (e)
    });

    it('should handle extended subsection sequences', () => {
      // Extended sequences that might occur in complex legal documents
      expect(getAlphaLabel(26)).toBe('z'); // (z)
      expect(getAlphaLabel(27)).toBe('aa'); // (aa)
      expect(getAlphaLabel(28)).toBe('ab'); // (ab)
    });
  });
});
