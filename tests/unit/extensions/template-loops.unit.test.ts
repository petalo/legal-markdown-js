/**
 * @fileoverview Tests for template loops functionality
 * 
 * This test suite covers the {{#array}}...{{/array}} template loop system:
 * - Basic array iteration with primitive values
 * - Object array iteration with property access
 * - Nested object paths using dot notation (e.g., services.included)
 * - Current item access using {{.}} syntax
 * - Error handling for missing or invalid data
 */

import { processTemplateLoops } from '@extensions/template-loops';

describe('processTemplateLoops', () => {
  describe('Basic Array Loops', () => {
    it('should iterate over simple array with dot syntax', () => {
      const content = '{{#items}}\n- {{.}}\n{{/items}}';
      const metadata = { items: ['Apple', 'Banana', 'Cherry'] };
      const result = processTemplateLoops(content, metadata, undefined, false);
      
      expect(result).toBe('<li>Apple</li>\n<li>Banana</li>\n<li>Cherry</li>');
    });

    it('should handle empty arrays gracefully', () => {
      const content = '{{#items}}\n- {{.}}\n{{/items}}';
      const metadata = { items: [] };
      const result = processTemplateLoops(content, metadata, undefined, false);
      
      expect(result).toBe('');
    });

    it('should handle object arrays with property access', () => {
      const content = '{{#products}}\n- {{name}}\n{{/products}}';
      const metadata = {
        products: [
          { name: 'Laptop' },
          { name: 'Mouse' }
        ]
      };
      const result = processTemplateLoops(content, metadata, undefined, false);
      
      expect(result).toBe('<li>Laptop</li>\n<li>Mouse</li>');
    });
  });

  describe('Nested Object Path Support (Dot Notation)', () => {
    it('should support dot notation for nested object arrays', () => {
      const content = '{{#services.included}}\n- {{.}}\n{{/services.included}}';
      const metadata = {
        services: {
          included: ['Water', 'Electricity', 'Internet']
        }
      };
      const result = processTemplateLoops(content, metadata, undefined, false);
      
      expect(result).toBe('<li>Water</li>\n<li>Electricity</li>\n<li>Internet</li>');
    });

    it('should support complex nested paths', () => {
      const content = '{{#contract.parties}}\n- {{name}}\n{{/contract.parties}}';
      const metadata = {
        contract: {
          parties: [
            { name: 'John Doe' },
            { name: 'Jane Smith' }
          ]
        }
      };
      const result = processTemplateLoops(content, metadata, undefined, false);
      
      expect(result).toBe('<li>John Doe</li>\n<li>Jane Smith</li>');
    });

    it('should handle deeply nested object paths', () => {
      const content = '{{#office.maintenance.lessor_obligations}}\n- {{.}}\n{{/office.maintenance.lessor_obligations}}';
      const metadata = {
        office: {
          maintenance: {
            lessor_obligations: ['Structural elements', 'Building envelope']
          }
        }
      };
      const result = processTemplateLoops(content, metadata, undefined, false);
      
      expect(result).toBe('<li>Structural elements</li>\n<li>Building envelope</li>');
    });

    it('should return empty string for non-existent nested paths', () => {
      const content = '{{#services.nonexistent}}\n- {{.}}\n{{/services.nonexistent}}';
      const metadata = {
        services: {
          included: ['Water']
        }
      };
      const result = processTemplateLoops(content, metadata, undefined, false);
      
      expect(result).toBe('');
    });
  });

  describe('Current Item Access with {{.}} Syntax', () => {
    it('should access current primitive value with dot syntax', () => {
      const content = '{{#colors}}\nColor: {{.}}\n{{/colors}}';
      const metadata = { colors: ['Red', 'Green', 'Blue'] };
      const result = processTemplateLoops(content, metadata, undefined, false);
      
      // The actual result doesn't include <li> tags for this format
      expect(result).toBe('\nColor: Red\n\n\nColor: Green\n\n\nColor: Blue\n');
    });

    it('should work with mixed property and dot access', () => {
      const content = '{{#items}}\n- {{name}}: {{value}}\n{{/items}}';
      const metadata = {
        items: [
          { name: 'Item1', value: 'A' },
          { name: 'Item2', value: 'B' }
        ]
      };
      const result = processTemplateLoops(content, metadata, undefined, false);
      
      expect(result).toContain('Item1: A');
      expect(result).toContain('Item2: B');
    });
  });

  describe('Real-world Legal Document Examples', () => {
    it('should handle office lease services template loop', () => {
      const content = '{{#services.included}}\n- {{.}}\n{{/services.included}}';
      const metadata = {
        services: {
          included: [
            'Water',
            'Electricity',
            'Internet',
            'Heating',
            'Air Conditioning'
          ]
        }
      };
      const result = processTemplateLoops(content, metadata, undefined, false);
      
      expect(result).toContain('<li>Water</li>');
      expect(result).toContain('<li>Electricity</li>');
      expect(result).toContain('<li>Internet</li>');
      expect(result).toContain('<li>Heating</li>');
      expect(result).toContain('<li>Air Conditioning</li>');
    });

    it('should handle maintenance obligations template loop', () => {
      const content = '{{#maintenance.lessor_obligations}}\n- {{.}}\n{{/maintenance.lessor_obligations}}';
      const metadata = {
        maintenance: {
          lessor_obligations: [
            'Structural elements',
            'Building envelope',
            'Common areas'
          ]
        }
      };
      const result = processTemplateLoops(content, metadata, undefined, false);
      
      expect(result).toBe('<li>Structural elements</li>\n<li>Building envelope</li>\n<li>Common areas</li>');
    });

    it('should handle default events with empty values', () => {
      const content = '{{#default.events}}\n- {{.}}\n{{/default.events}}';
      const metadata = {
        default: {
          events: [
            'Failure to pay rent within 5 days of due date',
            '', // Empty - should still be processed
            'Filing for bankruptcy or insolvency'
          ]
        }
      };
      const result = processTemplateLoops(content, metadata, undefined, false);
      
      expect(result).toContain('<li>Failure to pay rent within 5 days of due date</li>');
      expect(result).toContain('<li>Filing for bankruptcy or insolvency</li>');
      // The empty value generates newlines but not empty <li></li>
      expect(result).toContain('- \n');
    });
  });

  describe('Error Handling', () => {
    it('should return empty string for undefined variables', () => {
      const content = '{{#nonexistent}}\n- {{.}}\n{{/nonexistent}}';
      const metadata = {};
      const result = processTemplateLoops(content, metadata, undefined, false);
      
      expect(result).toBe('');
    });

    it('should handle null values gracefully', () => {
      const content = '{{#items}}\n- {{.}}\n{{/items}}';
      const metadata = { items: null };
      const result = processTemplateLoops(content, metadata, undefined, false);
      
      expect(result).toBe('');
    });

    it('should handle non-array values gracefully', () => {
      const content = '{{#items}}\n- {{.}}\n{{/items}}';
      const metadata = { items: 'not an array' };
      const result = processTemplateLoops(content, metadata, undefined, false);
      
      // Non-array values are treated as conditional and rendered if truthy
      expect(result).toContain('- {{.}}');
    });
  });

  describe('Conditional Blocks', () => {
    it('should render content for truthy values', () => {
      const content = '{{#isActive}}\nThis service is active.\n{{/isActive}}';
      const metadata = { isActive: true };
      const result = processTemplateLoops(content, metadata, undefined, false);
      
      expect(result).toContain('This service is active.');
    });

    it('should not render content for falsy values', () => {
      const content = '{{#isActive}}\nThis service is active.\n{{/isActive}}';
      const metadata = { isActive: false };
      const result = processTemplateLoops(content, metadata, undefined, false);
      
      expect(result).toBe('');
    });

    it('should handle undefined conditional variables', () => {
      const content = '{{#isActive}}\nThis service is active.\n{{/isActive}}';
      const metadata = {};
      const result = processTemplateLoops(content, metadata, undefined, false);
      
      expect(result).toBe('');
    });
  });
});