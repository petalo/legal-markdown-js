import { describe, it, expect } from 'vitest';
import {
  fieldSpan,
  missingFieldSpan,
  type FieldKind,
} from '../../../../src/extensions/tracking/field-span';

describe('fieldSpan', () => {
  it('renders imported field span with escaped content/attributes', () => {
    expect(fieldSpan('name', 'John')).toBe(
      '<span class="legal-field imported-value" data-field="name">John</span>'
    );
  });

  it('escapes attribute XSS payloads', () => {
    expect(fieldSpan('x" onmouseover="alert(1)', 'val')).toBe(
      '<span class="legal-field imported-value" data-field="x&quot; onmouseover=&quot;alert(1)">val</span>'
    );
  });

  it('escapes content XSS payloads', () => {
    expect(fieldSpan('name', '<script>alert(1)</script>')).toBe(
      '<span class="legal-field imported-value" data-field="name">&lt;script&gt;alert(1)&lt;/script&gt;</span>'
    );
  });

  it('renders missing field helper with [[field]] token', () => {
    expect(missingFieldSpan('amount')).toBe(
      '<span class="legal-field missing-value" data-field="amount">[[amount]]</span>'
    );
  });

  it('uses highlight class for crossref kind', () => {
    expect(fieldSpan('name', 'val', 'crossref')).toBe(
      '<span class="legal-field highlight" data-field="name">val</span>'
    );
  });

  it('maps all FieldKind values to expected classes', () => {
    const expected: Record<FieldKind, string> = {
      imported: 'legal-field imported-value',
      missing: 'legal-field missing-value',
      highlight: 'legal-field highlight',
      crossref: 'legal-field highlight',
    };

    (Object.keys(expected) as FieldKind[]).forEach(kind => {
      const output = fieldSpan('f', 'v', kind);
      expect(output).toContain(`class="${expected[kind]}"`);
    });
  });
});
