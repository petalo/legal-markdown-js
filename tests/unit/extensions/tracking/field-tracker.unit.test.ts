/**
 * Tests for FieldTracker class
 *
 * Tests the field tracker which monitors and highlights document fields:
 * - Field status tracking (filled, empty, logic-based)
 * - Content highlighting with CSS classes for different field states
 * - applyFieldTracking: wrapping field references with span tags
 * - Field reporting and statistics generation
 * - Logic-based field detection (mixins, conditional content)
 * - Escaped underscore handling in field names
 *
 * @module
 */

import { FieldTracker, FieldStatus } from '../../../../src/extensions/tracking/field-tracker';

vi.mock('../../../../src/extensions/tracking/field-span', () => ({
  fieldSpan: (name: string, value: string, kind: string) =>
    `<span data-field="${name}" class="${kind}">${value}</span>`,
}));

vi.mock('../../../../src/utils/logger', () => ({
  logger: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

describe('FieldTracker', () => {
  let tracker: FieldTracker;

  beforeEach(() => {
    tracker = new FieldTracker();
  });

  // ---------------------------------------------------------------
  // trackField - status detection
  // ---------------------------------------------------------------
  describe('trackField', () => {
    it('should set status FILLED for a string value', () => {
      tracker.trackField('name', { value: 'John Doe' });

      const field = tracker.getFields().get('name');
      expect(field).toBeDefined();
      expect(field!.status).toBe(FieldStatus.FILLED);
      expect(field!.value).toBe('John Doe');
      expect(field!.hasLogic).toBe(false);
    });

    it('should set status FILLED for a numeric value', () => {
      tracker.trackField('amount', { value: 42 });

      const field = tracker.getFields().get('amount');
      expect(field!.status).toBe(FieldStatus.FILLED);
      expect(field!.value).toBe(42);
    });

    it('should set status EMPTY when value is undefined', () => {
      tracker.trackField('missing', { value: undefined });
      expect(tracker.getFields().get('missing')!.status).toBe(FieldStatus.EMPTY);
    });

    it('should set status EMPTY when value is null', () => {
      tracker.trackField('missing', { value: null });
      expect(tracker.getFields().get('missing')!.status).toBe(FieldStatus.EMPTY);
    });

    it('should set status EMPTY when value is empty string', () => {
      tracker.trackField('missing', { value: '' });
      expect(tracker.getFields().get('missing')!.status).toBe(FieldStatus.EMPTY);
    });

    it('should set status LOGIC when hasLogic is true', () => {
      tracker.trackField('clause', { value: 'resolved text', hasLogic: true });
      expect(tracker.getFields().get('clause')!.status).toBe(FieldStatus.LOGIC);
    });

    it('should set status LOGIC when mixinUsed is conditional', () => {
      tracker.trackField('clause', { value: 'resolved text', mixinUsed: 'conditional' });
      expect(tracker.getFields().get('clause')!.status).toBe(FieldStatus.LOGIC);
    });

    it('should set status LOGIC when mixinUsed is helper', () => {
      tracker.trackField('clause', { value: 'text', mixinUsed: 'helper' });
      expect(tracker.getFields().get('clause')!.status).toBe(FieldStatus.LOGIC);
    });

    it('should set status LOGIC when mixinUsed is loop', () => {
      tracker.trackField('clause', { value: 'text', mixinUsed: 'loop' });
      expect(tracker.getFields().get('clause')!.status).toBe(FieldStatus.LOGIC);
    });

    it('should NOT set status LOGIC for an unknown mixinUsed value', () => {
      tracker.trackField('clause', { value: 'text', mixinUsed: 'simple-substitution' });
      expect(tracker.getFields().get('clause')!.status).toBe(FieldStatus.FILLED);
    });

    it('should increment totalOccurrences for each tracked field', () => {
      tracker.trackField('a', { value: '1' });
      tracker.trackField('b', { value: '2' });
      tracker.trackField('c', { value: '3' });
      expect(tracker.getTotalOccurrences()).toBe(3);
    });
  });

  // ---------------------------------------------------------------
  // applyFieldTracking
  // ---------------------------------------------------------------
  describe('applyFieldTracking', () => {
    describe('basic field replacement', () => {
      it('should replace {{name}} with a span when field is tracked with a value', () => {
        tracker.trackField('name', { value: 'Alice' });

        const result = tracker.applyFieldTracking('Hello {{name}}!');

        expect(result).toBe('Hello <span data-field="name" class="imported">Alice</span>!');
      });

      it('should replace multiple occurrences of the same field', () => {
        tracker.trackField('name', { value: 'Bob' });

        const result = tracker.applyFieldTracking('{{name}} and {{name}} again');

        expect(result).toBe(
          '<span data-field="name" class="imported">Bob</span> and <span data-field="name" class="imported">Bob</span> again'
        );
      });

      it('should handle fields with dots in names like {{client.name}}', () => {
        tracker.trackField('client.name', { value: 'Acme Corp' });

        const result = tracker.applyFieldTracking('Client: {{client.name}}');

        expect(result).toBe(
          'Client: <span data-field="client.name" class="imported">Acme Corp</span>'
        );
      });

      it('should handle whitespace inside braces like {{ name }}', () => {
        tracker.trackField('name', { value: 'Alice' });

        const result = tracker.applyFieldTracking('Hello {{ name }}!');

        expect(result).toBe('Hello <span data-field="name" class="imported">Alice</span>!');
      });
    });

    describe('empty/missing fields', () => {
      it('should wrap empty field pattern with missing span, keeping original pattern', () => {
        tracker.trackField('missing', { value: undefined });

        const result = tracker.applyFieldTracking('Value: {{missing}}');

        expect(result).toBe(
          'Value: <span data-field="missing" class="missing">{{missing}}</span>'
        );
      });

      it('should wrap null-value field with missing span', () => {
        tracker.trackField('empty', { value: null });

        const result = tracker.applyFieldTracking('{{empty}}');

        expect(result).toBe('<span data-field="empty" class="missing">{{empty}}</span>');
      });

      it('should wrap empty-string field with missing span', () => {
        tracker.trackField('blank', { value: '' });

        const result = tracker.applyFieldTracking('{{blank}}');

        expect(result).toBe('<span data-field="blank" class="missing">{{blank}}</span>');
      });
    });

    describe('already-wrapped content', () => {
      it('should not double-wrap fields already inside a span tag', () => {
        tracker.trackField('name', { value: 'Alice' });

        const content = '<span class="existing">{{name}}</span>';
        const result = tracker.applyFieldTracking(content);

        // The {{name}} is inside an unclosed span, so it should be left alone
        expect(result).toBe('<span class="existing">{{name}}</span>');
      });

      it('should wrap a field that appears after a closed span', () => {
        tracker.trackField('name', { value: 'Alice' });

        const content = '<span class="other">text</span> {{name}}';
        const result = tracker.applyFieldTracking(content);

        expect(result).toContain('<span data-field="name" class="imported">Alice</span>');
      });
    });

    describe('logic field highlighting', () => {
      it('should highlight resolved values of logic fields in text content', () => {
        tracker.trackField('clause', { value: 'Standard warranty', hasLogic: true });

        const content = 'The clause says: Standard warranty applies.';
        const result = tracker.applyFieldTracking(content);

        expect(result).toContain(
          '<span data-field="clause" class="highlight">Standard warranty</span>'
        );
      });

      it('should not highlight values inside HTML tag attributes', () => {
        tracker.trackField('clause', { value: 'active', hasLogic: true });

        const content = '<div class="active">Some active content</div>';
        const result = tracker.applyFieldTracking(content);

        // The "active" inside the class attribute should NOT be wrapped
        expect(result).toContain('class="active"');
        // But "active" in the text node should be wrapped
        expect(result).toContain(
          '<span data-field="clause" class="highlight">active</span>'
        );
      });
    });

    describe('cross-reference highlighting', () => {
      it('should highlight values when field name starts with crossref.', () => {
        tracker.trackField('crossref.section1', { value: 'Section 3.2' });

        const content = 'See Section 3.2 for details.';
        const result = tracker.applyFieldTracking(content);

        expect(result).toContain(
          '<span data-field="crossref.section1" class="imported">Section 3.2</span>'
        );
      });
    });

    describe('regular field values', () => {
      it('should NOT highlight regular field values in body text (only logic/crossref)', () => {
        tracker.trackField('company', { value: 'Acme Corp' });

        // The value "Acme Corp" appears in body text but the field is a regular FILLED field
        const content = 'Welcome to Acme Corp headquarters.';
        const result = tracker.applyFieldTracking(content);

        // Body text should remain unchanged - no value highlighting for regular fields
        expect(result).toBe('Welcome to Acme Corp headquarters.');
      });
    });

    describe('escaped underscores', () => {
      it('should match {{empty\\_field}} in content to tracked field empty_field', () => {
        tracker.trackField('empty_field', { value: 'resolved' });

        const content = 'Value: {{empty\\_field}}';
        const result = tracker.applyFieldTracking(content);

        expect(result).toBe(
          'Value: <span data-field="empty_field" class="imported">resolved</span>'
        );
      });

      it('should NOT match {{empty_field}} with bare underscore (regex requires escaped or no underscore)', () => {
        tracker.trackField('empty_field', { value: 'resolved' });

        const content = 'Value: {{empty_field}}';
        const result = tracker.applyFieldTracking(content);

        // The regex converts _ to \\_? meaning it expects backslash-underscore or nothing,
        // so a bare underscore does not match
        expect(result).toBe('Value: {{empty_field}}');
      });
    });

    describe('integration with trackField', () => {
      it('should process multiple tracked fields of different statuses', () => {
        tracker.trackField('name', { value: 'Alice' });
        tracker.trackField('email', { value: '' });
        tracker.trackField('clause', { value: 'Warranty text', hasLogic: true });

        const content = 'Name: {{name}}, Email: {{email}}, Clause: {{clause}}';
        const result = tracker.applyFieldTracking(content);

        expect(result).toContain(
          '<span data-field="name" class="imported">Alice</span>'
        );
        expect(result).toContain(
          '<span data-field="email" class="missing">{{email}}</span>'
        );
        expect(result).toContain(
          '<span data-field="clause" class="highlight">Warranty text</span>'
        );
      });
    });
  });

  // ---------------------------------------------------------------
  // generateReport
  // ---------------------------------------------------------------
  describe('generateReport', () => {
    it('should return correct counts for filled/empty/logic', () => {
      tracker.trackField('a', { value: 'filled' });
      tracker.trackField('b', { value: 'also filled' });
      tracker.trackField('c', { value: '' });
      tracker.trackField('d', { value: 'logic result', hasLogic: true });

      const report = tracker.generateReport();

      expect(report.total).toBe(4);
      expect(report.filled).toBe(2);
      expect(report.empty).toBe(1);
      expect(report.logic).toBe(1);
      expect(report.fields).toHaveLength(4);
    });

    it('should return zeros when no fields are tracked', () => {
      const report = tracker.generateReport();

      expect(report.total).toBe(0);
      expect(report.filled).toBe(0);
      expect(report.empty).toBe(0);
      expect(report.logic).toBe(0);
      expect(report.fields).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------
  // getFieldsByStatus
  // ---------------------------------------------------------------
  describe('getFieldsByStatus', () => {
    it('should filter fields by status correctly', () => {
      tracker.trackField('f1', { value: 'v1' });
      tracker.trackField('f2', { value: '' });
      tracker.trackField('f3', { value: 'v3', hasLogic: true });
      tracker.trackField('f4', { value: 'v4' });

      expect(tracker.getFieldsByStatus(FieldStatus.FILLED)).toHaveLength(2);
      expect(tracker.getFieldsByStatus(FieldStatus.EMPTY)).toHaveLength(1);
      expect(tracker.getFieldsByStatus(FieldStatus.LOGIC)).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------
  // clear
  // ---------------------------------------------------------------
  describe('clear', () => {
    it('should clear all tracked fields and reset occurrences', () => {
      tracker.trackField('f1', { value: 'v1' });
      tracker.trackField('f2', { value: 'v2' });

      expect(tracker.getFields().size).toBe(2);
      expect(tracker.getTotalOccurrences()).toBe(2);

      tracker.clear();

      expect(tracker.getFields().size).toBe(0);
      expect(tracker.getTotalOccurrences()).toBe(0);
    });
  });
});
