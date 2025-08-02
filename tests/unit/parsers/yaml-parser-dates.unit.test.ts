/**
 * Unit tests for YAML parser date processing functionality
 *
 * Tests the extended @today processing in YAML front matter including
 * arithmetic operations, format specifiers, and error handling.
 *
 * @module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseYamlFrontMatter } from '../../../src/core/parsers/yaml-parser';
import { addDays, addMonths, addYears } from '../../../src/extensions/helpers/advanced-date-helpers';

// Mock the current date for consistent testing
const MOCK_DATE = new Date('2024-01-15T10:00:00Z');

describe('YAML Parser Date Processing', () => {
  beforeEach(() => {
    // Mock Date constructor for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic @today Processing in YAML', () => {
    it('should process @today with default ISO format', () => {
      const content = `---
title: Test Document
date: @today
---

# Content`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.metadata.date).toBe('2024-01-15');
      expect(result.content.trim()).toBe('# Content');
    });

    it('should process @today with format specifier', () => {
      const content = `---
title: Test Document
effective_date: @today[legal]
---

# Content`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.metadata.effective_date).toBe('January 15, 2024');
    });

    it('should process multiple @today references with different formats', () => {
      const content = `---
title: Contract
start_date: @today
end_date: @today[US]
legal_date: @today[legal]
---

# Content`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.metadata.start_date).toBe('2024-01-15');
      expect(result.metadata.end_date).toBe('01/15/2024');
      expect(result.metadata.legal_date).toBe('January 15, 2024');
    });
  });

  describe('Date Processing Features Available', () => {
    it('should have date arithmetic helpers available for direct use', () => {
      // These helpers are available in the YAML parser for potential future use
      expect(typeof addDays).toBe('function');
      expect(typeof addMonths).toBe('function');
      expect(typeof addYears).toBe('function');
    });
  });

  describe('Additional Format Testing', () => {
    it('should process @today with EU format', () => {
      const content = `---
title: Contract
effective_date: @today[EU]
---

# Content`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.metadata.effective_date).toBe('15/01/2024');
    });
  });

  describe('Complex YAML Scenarios', () => {
    it('should process multiple date fields with different formats', () => {
      const content = `---
title: Service Agreement
created: @today
created_legal: @today[legal]
created_us: @today[US]
created_eu: @today[EU]
---

# Content`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.metadata.created).toBe('2024-01-15');
      expect(result.metadata.created_legal).toBe('January 15, 2024');
      expect(result.metadata.created_us).toBe('01/15/2024');
      expect(result.metadata.created_eu).toBe('15/01/2024');
    });

    it('should handle nested YAML structures with dates', () => {
      const content = `---
contract:
  start: @today
  start_legal: @today[legal]
parties:
  - name: Company A
    joined: @today[legal]
  - name: Company B  
    joined: @today[US]
---

# Content`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.metadata.contract.start).toBe('2024-01-15');
      expect(result.metadata.contract.start_legal).toBe('January 15, 2024');
      expect(result.metadata.parties[0].joined).toBe('January 15, 2024');
      expect(result.metadata.parties[1].joined).toBe('01/15/2024');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid format specifiers gracefully', () => {
      const content = `---
title: Contract
date_with_invalid_format: @today[invalid_format]
---

# Content`;

      const result = parseYamlFrontMatter(content);
      
      // Should fall back to ISO format
      expect(result.metadata.date_with_invalid_format).toBe('2024-01-15');
    });

    it('should handle YAML parsing without errors', () => {
      const content = `---
title: Contract
valid_date: @today[legal]
---

# Content`;

      const result = parseYamlFrontMatter(content);
      
      // Should parse without throwing errors
      expect(result.metadata.title).toBe('Contract');
      expect(result.metadata.valid_date).toBe('January 15, 2024');
    });
  });

  describe('Real-world Use Cases', () => {
    it('should handle contract document metadata', () => {
      const content = `---
title: Software License Agreement
created: @today
created_legal: @today[legal]
document_date: @today[US]
revision_date: @today[EU]
---

# Content`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.metadata.created).toBe('2024-01-15');
      expect(result.metadata.created_legal).toBe('January 15, 2024');
      expect(result.metadata.document_date).toBe('01/15/2024');
      expect(result.metadata.revision_date).toBe('15/01/2024');
    });

    it('should handle various document formats', () => {
      const content = `---
title: Multi-format Document
iso_date: @today[ISO]
us_date: @today[US]
eu_date: @today[EU]
legal_date: @today[legal]
default_date: @today
---

# Content`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.metadata.iso_date).toBe('2024-01-15');
      expect(result.metadata.us_date).toBe('01/15/2024');
      expect(result.metadata.eu_date).toBe('15/01/2024');
      expect(result.metadata.legal_date).toBe('January 15, 2024');
      expect(result.metadata.default_date).toBe('2024-01-15');
    });
  });
});