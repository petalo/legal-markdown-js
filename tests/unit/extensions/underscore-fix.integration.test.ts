/**
 * Integration test for underscore escaping fix
 *
 * Tests that the fix for leading/trailing underscores works correctly
 * through the full processing pipeline.
 *
 * @module
 */

import { describe, it, expect } from 'vitest';
import { processLegalMarkdownWithRemark } from '../../../src/extensions/remark/legal-markdown-processor';

describe('Underscore Escaping Fix - Integration', () => {
  it('should correctly process variables with leading underscores', async () => {
    const content = `---
_field: "Value with leading underscore"
---

Result: {{_field}}`;

    const result = await processLegalMarkdownWithRemark(content);

    expect(result.content).toContain('Value with leading underscore');
    expect(result.content).not.toContain('{{*field}}'); // Should NOT have asterisk
    expect(result.content).not.toContain('{{_field}}'); // Should be resolved
  });

  it('should correctly process variables with trailing underscores', async () => {
    const content = `---
field_: "Value with trailing underscore"
---

Result: {{field_}}`;

    const result = await processLegalMarkdownWithRemark(content);

    expect(result.content).toContain('Value with trailing underscore');
    expect(result.content).not.toContain('{{field*}}'); // Should NOT have asterisk
    expect(result.content).not.toContain('{{field_}}'); // Should be resolved
  });

  it('should correctly process variables with both leading and trailing underscores', async () => {
    const content = `---
_both_: "Value with both"
---

Result: {{_both_}}`;

    const result = await processLegalMarkdownWithRemark(content);

    expect(result.content).toContain('Value with both');
    expect(result.content).not.toContain('{{*both*}}'); // Should NOT have asterisks
    expect(result.content).not.toContain('{{_both_}}'); // Should be resolved
  });

  it('should correctly process multiple variables with different underscore patterns', async () => {
    const content = `---
_leading: "Leading"
trailing_: "Trailing"
_both_: "Both"
normal_field: "Normal"
---

Leading: {{_leading}}
Trailing: {{trailing_}}
Both: {{_both_}}
Normal: {{normal_field}}`;

    const result = await processLegalMarkdownWithRemark(content);

    expect(result.content).toContain('Leading: Leading');
    expect(result.content).toContain('Trailing: Trailing');
    expect(result.content).toContain('Both: Both');
    expect(result.content).toContain('Normal: Normal');
    // Should not have any asterisks from underscore-to-italic conversion
    expect(result.content).not.toMatch(/{{[*]/);
  });

  it('should work with nested objects', async () => {
    const content = `---
client:
  _name: "Acme Corp"
  address_: "123 Main St"
---

Client: {{client._name}}
Address: {{client.address_}}`;

    const result = await processLegalMarkdownWithRemark(content);

    expect(result.content).toContain('Acme Corp');
    expect(result.content).toContain('123 Main St');
    expect(result.content).not.toMatch(/{{[*]/);
  });

  it('should preserve underscores in unresolved fields', async () => {
    const content = `No metadata defined

Missing: {{_missing_field}}`;

    const result = await processLegalMarkdownWithRemark(content);

    // Unresolved fields keep underscores, but they may be escaped (\_)
    // The important thing is they don't become asterisks
    // eslint-disable-next-line no-useless-escape
    expect(result.content).toMatch(/\{\{[_\\]*missing[_\\]*field\}\}/);
    // Should NOT be converted to asterisks
    expect(result.content).not.toContain('{{*missing_field}}');
    expect(result.content).not.toContain('{{missing_field*}}');
  });

  it('should work in bold text', async () => {
    const content = `---
_field: "Value"
---

**Client: {{_field}}**`;

    const result = await processLegalMarkdownWithRemark(content);

    expect(result.content).toContain('Value');
    expect(result.content).not.toContain('{{*field}}');
  });

  it('should work in italic text', async () => {
    const content = `---
field_: "Value"
---

*Important: {{field_}}*`;

    const result = await processLegalMarkdownWithRemark(content);

    expect(result.content).toContain('Value');
    expect(result.content).not.toContain('{{field*}}');
  });

  it('should work in lists', async () => {
    const content = `---
_item1: "First"
_item2: "Second"
---

- {{_item1}}
- {{_item2}}`;

    const result = await processLegalMarkdownWithRemark(content);

    expect(result.content).toContain('First');
    expect(result.content).toContain('Second');
    expect(result.content).not.toMatch(/{{[*]/);
  });

  it('should work in headers', async () => {
    const content = `---
_title: "Important Section"
---

## {{_title}}`;

    const result = await processLegalMarkdownWithRemark(content);

    expect(result.content).toContain('Important Section');
    expect(result.content).not.toContain('{{*title}}');
  });
});
