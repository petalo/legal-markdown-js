/**
 * @fileoverview Tests for the optional clause processor
 * 
 * This test suite covers the conditional clause system that allows dynamic content inclusion:
 * - Square bracket notation [text]{condition} for conditional content
 * - Boolean condition evaluation and complex logical expressions
 * - Support for AND/OR operations and equality comparisons
 * - Nested object property access and error handling
 * - Edge cases like malformed conditions and multiline clauses
 */

import { processOptionalClauses } from '../../../src/core/processors/clause-processor';

describe('Optional Clauses', () => {
  describe('Parse square bracket notation [...] for optional text', () => {
    it('should parse basic optional clauses with true condition', () => {
      const content = `This is a contract [with warranty provisions]{include_warranty}.`;
      const metadata = { include_warranty: true };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('This is a contract with warranty provisions.');
    });

    it('should parse basic optional clauses with false condition', () => {
      const content = `This is a contract [with warranty provisions]{include_warranty}.`;
      const metadata = { include_warranty: false };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('This is a contract .');
    });

    it('should handle multiple optional clauses', () => {
      const content = `The contract [includes warranties]{warranty} and [provides support]{support}.`;
      const metadata = { warranty: true, support: false };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('The contract includes warranties and .');
    });

    it('should handle nested square brackets', () => {
      const content = `[This clause [with nested brackets] is conditional]{condition}.`;
      const metadata = { condition: true };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('This clause [with nested brackets] is conditional.');
    });
  });

  describe('Support condition syntax {condition_name}', () => {
    it('should evaluate simple condition names', () => {
      const content = `[Optional text]{my_condition}`;
      const metadata = { my_condition: true };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('Optional text');
    });

    it('should handle underscore and camelCase conditions', () => {
      const content = `[Text 1]{snake_case_condition} [Text 2]{camelCaseCondition}`;
      const metadata = { 
        snake_case_condition: true,
        camelCaseCondition: false
      };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('Text 1 ');
    });

    it('should handle undefined conditions as false', () => {
      const content = `[This should not appear]{undefined_condition}`;
      const metadata = {};

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('');
    });
  });

  describe('Support simple boolean conditions', () => {
    it('should handle true boolean values', () => {
      const content = `[Included text]{boolean_flag}`;
      const metadata = { boolean_flag: true };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('Included text');
    });

    it('should handle false boolean values', () => {
      const content = `[Excluded text]{boolean_flag}`;
      const metadata = { boolean_flag: false };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('');
    });

    it('should handle truthy values as true', () => {
      const content = `[Text 1]{string_value} [Text 2]{number_value} [Text 3]{array_value}`;
      const metadata = { 
        string_value: 'non-empty',
        number_value: 42,
        array_value: [1, 2, 3]
      };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('Text 1 Text 2 Text 3');
    });

    it('should handle falsy values as false', () => {
      const content = `[Text 1]{empty_string} [Text 2]{zero} [Text 3]{null_value}`;
      const metadata = { 
        empty_string: '',
        zero: 0,
        null_value: null
      };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('  ');
    });
  });

  describe('Support AND logical operations', () => {
    it('should handle AND operations with true conditions', () => {
      const content = `[Both conditions must be true]{condition1 AND condition2}`;
      const metadata = { condition1: true, condition2: true };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('Both conditions must be true');
    });

    it('should handle AND operations with false conditions', () => {
      const content = `[This should not appear]{condition1 AND condition2}`;
      const metadata = { condition1: true, condition2: false };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('');
    });

    it('should handle multiple AND operations', () => {
      const content = `[All three must be true]{cond1 AND cond2 AND cond3}`;
      const metadata = { cond1: true, cond2: true, cond3: true };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('All three must be true');
    });

    it('should handle AND with mixed results', () => {
      const content = `[Test 1]{a AND b} [Test 2]{c AND d}`;
      const metadata = { a: true, b: true, c: true, d: false };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('Test 1 ');
    });
  });

  describe('Support OR logical operations', () => {
    it('should handle OR operations with true conditions', () => {
      const content = `[Either condition can be true]{condition1 OR condition2}`;
      const metadata = { condition1: true, condition2: false };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('Either condition can be true');
    });

    it('should handle OR operations with false conditions', () => {
      const content = `[This should not appear]{condition1 OR condition2}`;
      const metadata = { condition1: false, condition2: false };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('');
    });

    it('should handle multiple OR operations', () => {
      const content = `[At least one must be true]{cond1 OR cond2 OR cond3}`;
      const metadata = { cond1: false, cond2: false, cond3: true };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('At least one must be true');
    });

    it('should handle OR with mixed results', () => {
      const content = `[Test 1]{a OR b} [Test 2]{c OR d}`;
      const metadata = { a: false, b: true, c: false, d: false };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('Test 1 ');
    });
  });

  describe('Support equality conditions {field = "value"}', () => {
    it('should handle string equality', () => {
      const content = `[Premium client]{client_type = "premium"}`;
      const metadata = { client_type: 'premium' };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('Premium client');
    });

    it('should handle string inequality', () => {
      const content = `[Not premium client]{client_type = "premium"}`;
      const metadata = { client_type: 'standard' };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('');
    });

    it('should handle numeric equality', () => {
      const content = `[Bulk discount]{quantity = 100}`;
      const metadata = { quantity: 100 };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('Bulk discount');
    });

    it('should handle boolean equality', () => {
      const content = `[Enabled feature]{feature_enabled = true}`;
      const metadata = { feature_enabled: true };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('Enabled feature');
    });

    it('should handle not equal conditions', () => {
      const content = `[Not standard client]{client_type != "standard"}`;
      const metadata = { client_type: 'premium' };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('Not standard client');
    });

    it('should handle nested object equality', () => {
      const content = `[California specific]{location.state = "CA"}`;
      const metadata = { location: { state: 'CA', city: 'San Francisco' } };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('California specific');
    });
  });

  describe('Complex condition combinations', () => {
    it('should handle AND and OR combinations', () => {
      const content = `[Complex condition]{premium AND active}`;
      const metadata = { premium: true, enterprise: false, active: true };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('Complex condition');
    });

    it('should handle equality with logical operators', () => {
      const content = `[Special offer]{client_type = "premium" AND quantity = 100}`;
      const metadata = { client_type: 'premium', quantity: 100 };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('Special offer');
    });

    it('should handle multiple conditions with mixed operators', () => {
      const content = `[Clause 1]{a = "x" OR b = "y"} [Clause 2]{c AND d = "z"}`;
      const metadata = { a: 'x', b: 'other', c: true, d: 'z' };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('Clause 1 Clause 2');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle empty conditions', () => {
      const content = `[Empty condition]{}`;
      const metadata = {};

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('Empty condition');
    });

    it('should handle malformed conditions gracefully', () => {
      const content = `[Malformed]{invalid = } [Valid]{valid_condition}`;
      const metadata = { valid_condition: true };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe(' Valid');
    });

    it('should handle content without optional clauses', () => {
      const content = `This is regular content without any optional clauses.`;
      const metadata = {};

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe(content);
    });

    it('should handle empty content', () => {
      const result = processOptionalClauses('', {});
      
      expect(result).toBe('');
    });

    it('should handle special characters in conditions', () => {
      const content = `[Special chars]{weird@field#name}`;
      const metadata = { 'weird@field#name': true };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe('Special chars');
    });

    it('should handle multiline optional clauses', () => {
      const content = `[This is a multiline
optional clause that spans
multiple lines]{condition}`;
      const metadata = { condition: true };

      const result = processOptionalClauses(content, metadata);
      
      expect(result).toBe(`This is a multiline
optional clause that spans
multiple lines`);
    });
  });
});