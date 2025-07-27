/**
 * @fileoverview Tests for field tracking functionality
 * 
 * Tests the field tracker which monitors and highlights document fields:
 * - Field status tracking (filled, empty, logic-based)
 * - Content highlighting with CSS classes for different field states
 * - Field reporting and statistics generation
 * - Logic-based field detection (mixins, conditional content)
 * - Field value wrapping and visual indicators
 */

import { fieldTracker, FieldStatus } from '../../../../src/extensions/tracking/field-tracker';

describe('Field Tracker', () => {
  beforeEach(() => {
    fieldTracker.clear();
  });

  describe('trackField', () => {
    it('should track filled fields correctly', () => {
      fieldTracker.trackField('name', { value: 'John Doe' });
      
      const fields = fieldTracker.getFields();
      expect(fields.size).toBe(1);
      
      const field = fields.get('name');
      expect(field).toBeDefined();
      expect(field!.status).toBe(FieldStatus.FILLED);
      expect(field!.value).toBe('John Doe');
      expect(field!.hasLogic).toBe(false);
    });

    it('should track empty fields correctly', () => {
      fieldTracker.trackField('email', { value: '' });
      fieldTracker.trackField('phone', { value: null });
      fieldTracker.trackField('address', { value: undefined });
      
      const emptyFields = fieldTracker.getFieldsByStatus(FieldStatus.EMPTY);
      expect(emptyFields).toHaveLength(3);
      emptyFields.forEach(field => {
        expect(field.status).toBe(FieldStatus.EMPTY);
      });
    });

    it('should track fields with logic correctly', () => {
      fieldTracker.trackField('conditional', {
        value: 'result',
        hasLogic: true,
        mixinUsed: 'conditional'
      });
      
      const field = fieldTracker.getFields().get('conditional');
      expect(field).toBeDefined();
      expect(field!.status).toBe(FieldStatus.LOGIC);
      expect(field!.hasLogic).toBe(true);
      expect(field!.mixinUsed).toBe('conditional');
    });
  });

  describe('applyFieldTracking', () => {
    it('should wrap filled values with appropriate CSS class', () => {
      fieldTracker.trackField('name', { value: 'John Doe' });
      
      const content = 'Hello, John Doe!';
      const result = fieldTracker.applyFieldTracking(content);
      
      expect(result).toContain('<span class="imported-value" data-field="name">John Doe</span>');
    });

    it('should wrap empty field placeholders', () => {
      fieldTracker.trackField('email', { value: '' });
      
      const content = 'Email: {{email}}';
      const result = fieldTracker.applyFieldTracking(content);
      
      expect(result).toContain('<span class="missing-value" data-field="email">[email]</span>');
    });

    it('should not double-wrap already wrapped values', () => {
      fieldTracker.trackField('name', { value: 'John' });
      
      const content = '<span class="imported-value">John</span> and John';
      const result = fieldTracker.applyFieldTracking(content);
      
      // Should only wrap the unwrapped "John", avoiding double-wrapping
      const matches = (result.match(/<span class="imported-value"/g) || []).length;
      expect(matches).toBe(2); // Original + new wrap
    });

    it('should handle special regex characters in values', () => {
      fieldTracker.trackField('price', { value: '$100.00' });
      
      const content = 'The price is $100.00';
      const result = fieldTracker.applyFieldTracking(content);
      
      // Should properly escape regex special characters like $ and .
      expect(result).toContain('<span class="imported-value" data-field="price">$100.00</span>');
    });
  });

  describe('generateReport', () => {
    it('should generate accurate field report', () => {
      fieldTracker.trackField('name', { value: 'John' });
      fieldTracker.trackField('email', { value: '' });
      fieldTracker.trackField('conditional', { value: 'yes', hasLogic: true });
      
      const report = fieldTracker.generateReport();
      
      expect(report.total).toBe(3);
      expect(report.filled).toBe(1);
      expect(report.empty).toBe(1);
      expect(report.logic).toBe(1);
      expect(report.fields).toHaveLength(3);
    });
  });

  describe('getFieldsByStatus', () => {
    it('should filter fields by status correctly', () => {
      fieldTracker.trackField('field1', { value: 'value1' });
      fieldTracker.trackField('field2', { value: '' });
      fieldTracker.trackField('field3', { value: 'value3', hasLogic: true });
      fieldTracker.trackField('field4', { value: 'value4' });
      
      const filledFields = fieldTracker.getFieldsByStatus(FieldStatus.FILLED);
      const emptyFields = fieldTracker.getFieldsByStatus(FieldStatus.EMPTY);
      const logicFields = fieldTracker.getFieldsByStatus(FieldStatus.LOGIC);
      
      expect(filledFields).toHaveLength(2);
      expect(emptyFields).toHaveLength(1);
      expect(logicFields).toHaveLength(1);
    });
  });

  describe('clear', () => {
    it('should clear all tracked fields', () => {
      fieldTracker.trackField('field1', { value: 'value1' });
      fieldTracker.trackField('field2', { value: 'value2' });
      
      expect(fieldTracker.getFields().size).toBe(2);
      
      fieldTracker.clear();
      
      expect(fieldTracker.getFields().size).toBe(0);
    });
  });

  describe('Enhanced Field Tracking Features', () => {
    describe('Nested Field Paths', () => {
      it('should handle dot-notation field paths', () => {
        fieldTracker.trackField('client.name', { value: 'Acme Corp' });
        fieldTracker.trackField('client.address.street', { value: '123 Main St' });

        const fields = fieldTracker.getFields();
        expect(fields.get('client.name')?.value).toBe('Acme Corp');
        expect(fields.get('client.address.street')?.value).toBe('123 Main St');
      });

      it('should handle array index paths', () => {
        fieldTracker.trackField('parties[0].name', { value: 'Company A' });
        fieldTracker.trackField('items[1].price', { value: '100.00' });

        const fields = fieldTracker.getFields();
        expect(fields.get('parties[0].name')?.value).toBe('Company A');
        expect(fields.get('items[1].price')?.value).toBe('100.00');
      });
    });

    describe('Mixin Type Tracking', () => {
      it('should track variable mixin types', () => {
        fieldTracker.trackField('simple_var', {
          value: 'Simple Value',
          mixinUsed: 'variable'
        });

        const field = fieldTracker.getFields().get('simple_var');
        expect(field?.mixinUsed).toBe('variable');
        expect(field?.status).toBe(FieldStatus.FILLED);
      });

      it('should track helper function mixins', () => {
        fieldTracker.trackField('formatted_number', {
          value: '1,234.56',
          hasLogic: true,
          mixinUsed: 'helper'
        });

        const field = fieldTracker.getFields().get('formatted_number');
        expect(field?.mixinUsed).toBe('helper');
        expect(field?.status).toBe(FieldStatus.LOGIC);
      });

      it('should track conditional mixins', () => {
        fieldTracker.trackField('status_text', {
          value: 'Active',
          hasLogic: true,
          mixinUsed: 'conditional'
        });

        const field = fieldTracker.getFields().get('status_text');
        expect(field?.mixinUsed).toBe('conditional');
        expect(field?.status).toBe(FieldStatus.LOGIC);
      });
    });

    describe('Report Generation Enhancements', () => {
      it('should include mixin type information in reports', () => {
        fieldTracker.trackField('var_field', { 
          value: 'Variable Value',
          mixinUsed: 'variable'
        });
        fieldTracker.trackField('helper_field', { 
          value: 'Helper Result',
          hasLogic: true,
          mixinUsed: 'helper'
        });

        const report = fieldTracker.generateReport();
        
        expect(report.fields).toHaveLength(2);
        expect(report.fields.find(f => f.name === 'var_field')?.mixinUsed).toBe('variable');
        expect(report.fields.find(f => f.name === 'helper_field')?.mixinUsed).toBe('helper');
      });

      it('should generate empty report correctly', () => {
        const report = fieldTracker.generateReport();

        expect(report).toMatchObject({
          total: 0,
          filled: 0,
          empty: 0,
          logic: 0,
          fields: []
        });
      });
    });

    describe('Performance and Edge Cases', () => {
      it('should handle field name collisions by overwriting', () => {
        fieldTracker.trackField('duplicate', { value: 'First value' });
        fieldTracker.trackField('duplicate', { value: 'Second value' });

        const fields = fieldTracker.getFields();
        expect(fields.size).toBe(1);
        expect(fields.get('duplicate')?.value).toBe('Second value');
      });

      it('should handle special characters in field names', () => {
        fieldTracker.trackField('field-with-dashes', { value: 'test1' });
        fieldTracker.trackField('field_with_underscores', { value: 'test2' });
        fieldTracker.trackField('field.with.dots', { value: 'test3' });

        const fields = fieldTracker.getFields();
        expect(fields.size).toBe(3);
        expect(fields.get('field-with-dashes')?.value).toBe('test1');
        expect(fields.get('field_with_underscores')?.value).toBe('test2');
        expect(fields.get('field.with.dots')?.value).toBe('test3');
      });

      it('should handle very long field values', () => {
        const longValue = 'x'.repeat(1000);
        fieldTracker.trackField('long_field', { value: longValue });

        const field = fieldTracker.getFields().get('long_field');
        expect(field?.value).toBe(longValue);
        expect(field?.status).toBe(FieldStatus.FILLED);
      });

      it('should handle large numbers of fields efficiently', () => {
        const start = Date.now();
        
        // Track 100 fields for performance test
        for (let i = 0; i < 100; i++) {
          fieldTracker.trackField(`field_${i}`, { value: `value_${i}` });
        }

        const duration = Date.now() - start;
        expect(duration).toBeLessThan(100); // Should complete quickly

        const fields = fieldTracker.getFields();
        expect(fields.size).toBe(100);
      });
    });

    describe('Integration with AST Processing', () => {
      it('should handle bracket values as missing automatically', () => {
        // This simulates what AST processor would do with [BRACKET] values
        fieldTracker.trackField('client_name', { 
          value: undefined // AST processor detects [CLIENT NAME] and passes undefined
        });

        const field = fieldTracker.getFields().get('client_name');
        expect(field?.status).toBe(FieldStatus.EMPTY);
      });

      it('should track complex processing scenarios', () => {
        // Simulate a complex document with various mixin types
        fieldTracker.trackField('client.name', { value: 'Acme Corp', mixinUsed: 'variable' });
        fieldTracker.trackField('formatted_date', { 
          value: '2023-12-01',
          hasLogic: true,
          mixinUsed: 'helper'
        });
        fieldTracker.trackField('conditional_text', {
          value: 'Premium',
          hasLogic: true,
          mixinUsed: 'conditional'
        });
        fieldTracker.trackField('missing_field', { value: undefined, mixinUsed: 'variable' });

        const report = fieldTracker.generateReport();
        
        expect(report.total).toBe(4);
        expect(report.filled).toBe(1);
        expect(report.logic).toBe(2);
        expect(report.empty).toBe(1);
      });
    });

    describe('Backward Compatibility', () => {
      it('should handle missing mixin type gracefully', () => {
        fieldTracker.trackField('no_mixin_type', { 
          value: 'Some value'
          // No mixinUsed property
        });

        const field = fieldTracker.getFields().get('no_mixin_type');
        expect(field?.value).toBe('Some value');
        expect(field?.status).toBe(FieldStatus.FILLED);
      });

      it('should maintain compatibility with legacy tracking calls', () => {
        // Test that old-style calls still work
        fieldTracker.trackField('legacy_field', { value: 'Legacy Value' });

        const field = fieldTracker.getFields().get('legacy_field');
        expect(field?.value).toBe('Legacy Value');
        expect(field?.status).toBe(FieldStatus.FILLED);
      });
    });
  });
});