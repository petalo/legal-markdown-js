import { CoreFieldState, FieldStatus } from '../../../../src/core/tracking/field-state';

describe('CoreFieldState', () => {
  let fieldState: CoreFieldState;

  beforeEach(() => {
    fieldState = new CoreFieldState();
  });

  describe('trackField', () => {
    it('should track a filled field', () => {
      fieldState.trackField('client.name', {
        value: 'Acme Corporation',
        originalValue: '{{client.name}}',
      });

      const fields = fieldState.getFields();
      expect(fields.size).toBe(1);

      const field = fields.get('client.name');
      expect(field).toBeDefined();
      expect(field!.name).toBe('client.name');
      expect(field!.status).toBe(FieldStatus.FILLED);
      expect(field!.value).toBe('Acme Corporation');
      expect(field!.originalValue).toBe('{{client.name}}');
      expect(field!.hasLogic).toBe(false);
      expect(field!.mixinUsed).toBeUndefined();
    });

    it('should track an empty field when value is empty string', () => {
      fieldState.trackField('client.address', {
        value: '',
        originalValue: '{{client.address}}',
      });

      const field = fieldState.getFields().get('client.address');
      expect(field).toBeDefined();
      expect(field!.status).toBe(FieldStatus.EMPTY);
      expect(field!.value).toBe('');
    });

    it('should track an empty field when value is undefined', () => {
      fieldState.trackField('client.phone', {});

      const field = fieldState.getFields().get('client.phone');
      expect(field).toBeDefined();
      expect(field!.status).toBe(FieldStatus.EMPTY);
      expect(field!.value).toBeUndefined();
    });

    it('should track an empty field when value is null', () => {
      fieldState.trackField('client.fax', { value: null });

      const field = fieldState.getFields().get('client.fax');
      expect(field).toBeDefined();
      expect(field!.status).toBe(FieldStatus.EMPTY);
      expect(field!.value).toBeNull();
    });

    it('should track a field with logic via hasLogic flag', () => {
      fieldState.trackField('warranty.clause', {
        value: 'Standard warranty applies',
        originalValue: '{{#if warranty.enabled}}{{warranty.text}}{{/if}}',
        hasLogic: true,
      });

      const field = fieldState.getFields().get('warranty.clause');
      expect(field).toBeDefined();
      expect(field!.status).toBe(FieldStatus.LOGIC);
      expect(field!.hasLogic).toBe(true);
    });

    it('should track a field with logic via mixinUsed', () => {
      fieldState.trackField('terms.section', {
        value: 'Some terms',
        mixinUsed: 'terms-mixin',
      });

      const field = fieldState.getFields().get('terms.section');
      expect(field).toBeDefined();
      expect(field!.status).toBe(FieldStatus.LOGIC);
      expect(field!.mixinUsed).toBe('terms-mixin');
    });

    it('should update a duplicate field with new values', () => {
      fieldState.trackField('client.name', {
        value: '',
        originalValue: '{{client.name}}',
      });
      expect(fieldState.getFields().get('client.name')!.status).toBe(FieldStatus.EMPTY);

      fieldState.trackField('client.name', {
        value: 'Updated Corp',
        originalValue: '{{client.name}}',
      });

      const fields = fieldState.getFields();
      expect(fields.size).toBe(1);
      const field = fields.get('client.name');
      expect(field!.status).toBe(FieldStatus.FILLED);
      expect(field!.value).toBe('Updated Corp');
    });
  });

  describe('getFields', () => {
    it('should return a copy of the fields map', () => {
      fieldState.trackField('a', { value: '1' });
      const copy = fieldState.getFields();
      copy.delete('a');
      expect(fieldState.getFields().size).toBe(1);
    });
  });

  describe('getFieldsByStatus', () => {
    it('should filter fields by status', () => {
      fieldState.trackField('filled1', { value: 'v1' });
      fieldState.trackField('filled2', { value: 'v2' });
      fieldState.trackField('empty1', { value: '' });
      fieldState.trackField('logic1', { value: 'x', hasLogic: true });

      expect(fieldState.getFieldsByStatus(FieldStatus.FILLED)).toHaveLength(2);
      expect(fieldState.getFieldsByStatus(FieldStatus.EMPTY)).toHaveLength(1);
      expect(fieldState.getFieldsByStatus(FieldStatus.LOGIC)).toHaveLength(1);
    });
  });

  describe('clear', () => {
    it('should remove all tracked fields', () => {
      fieldState.trackField('a', { value: '1' });
      fieldState.trackField('b', { value: '2' });
      expect(fieldState.getFields().size).toBe(2);

      fieldState.clear();
      expect(fieldState.getFields().size).toBe(0);
    });
  });

  describe('generateReport', () => {
    it('should return correct counts for mixed fields', () => {
      fieldState.trackField('filled', { value: 'hello' });
      fieldState.trackField('empty', { value: '' });
      fieldState.trackField('logic', { value: 'x', hasLogic: true });
      fieldState.trackField('mixin', { value: 'y', mixinUsed: 'some-mixin' });

      const report = fieldState.generateReport();
      expect(report.total).toBe(4);
      expect(report.filled).toBe(1);
      expect(report.empty).toBe(1);
      expect(report.logic).toBe(2);
      expect(report.fields).toHaveLength(4);
    });

    it('should return an empty report when no fields are tracked', () => {
      const report = fieldState.generateReport();
      expect(report.total).toBe(0);
      expect(report.filled).toBe(0);
      expect(report.empty).toBe(0);
      expect(report.logic).toBe(0);
      expect(report.fields).toHaveLength(0);
    });

    it('should include all tracked field objects in the fields array', () => {
      fieldState.trackField('client.name', { value: 'Acme' });
      fieldState.trackField('client.email', { value: '' });

      const report = fieldState.generateReport();
      const names = report.fields.map(f => f.name);
      expect(names).toContain('client.name');
      expect(names).toContain('client.email');
    });
  });
});
