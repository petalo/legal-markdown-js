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

import { fieldTracker, FieldStatus } from '../../../src/tracking/field-tracker';

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
});