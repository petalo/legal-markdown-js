/**
 * Regression tests for cross-reference plugin interacting with markdown tables.
 *
 * Root cause: Without remark-gfm, tables are parsed as paragraphs with raw
 * pipe characters in text nodes. The cross-reference regex /\|([^|]+)\|/g
 * can then match table-cell content as if it were a |key| cross-reference,
 * resolving it against the metadata and producing [object Object] when the
 * metadata value is an array.
 *
 * Ref: Bug where {{pluralize "item" 5}} → "items" in a 2-row table was
 * resolved against the `items:` YAML array, producing [object Object],[object Object],[object Object].
 */

import { describe, it, expect } from 'vitest';
import { processLegalMarkdown } from '../../src/extensions/remark/legal-markdown-processor';

describe('Cross-references plugin - table pipe regression', () => {
  it('should not resolve table cell content as cross-reference when metadata has matching array key', async () => {
    // This is the exact scenario that was broken:
    // - YAML frontmatter has `items:` (an array of objects)
    // - A 2-row table contains {{pluralize "item" 5}} → "items"
    // - Without GFM table parsing, the pipe chars in the table row were
    //   processed by the cross-ref regex, matching |items| and resolving
    //   it to [object Object],[object Object],[object Object]
    const doc = `---
items:
  - name: Alpha
    value: 100
  - name: Beta
    value: 200
  - name: Gamma
    value: 300
---
| Helper | Output |
|--------|--------|
| pluralize(1) | {{pluralize "item" 1}} |
| pluralize(5) | {{pluralize "item" 5}} |
`;

    const result = await processLegalMarkdown(doc);

    expect(result.content).not.toContain('[object Object]');
    expect(result.content).toContain('items');
    expect(result.content).toContain('item');
  });

  it('should not corrupt a 2-row table when metadata key matches pluralized word', async () => {
    // A more general version: any metadata array key whose name matches
    // a word that appears in a table cell should not cause corruption.
    const doc = `---
products:
  - name: Widget
    price: 10
  - name: Gadget
    price: 20
---
| Count | Word |
|-------|------|
| one | {{pluralize "product" 1}} |
| many | {{pluralize "product" 5}} |
`;

    const result = await processLegalMarkdown(doc);

    expect(result.content).not.toContain('[object Object]');
    expect(result.content).toContain('product');
    expect(result.content).toContain('products');
  });

  it('should correctly resolve actual cross-references in body text (not regress)', async () => {
    // Verify that legitimate |key| cross-references still work after the fix
    const doc = `---
level-1: "Article %n."
---
# Payment Terms |payment|

See |payment| for details.
`;

    const result = await processLegalMarkdown(doc);

    expect(result.content).not.toContain('[object Object]');
    expect(result.content).toContain('Article 1.');
  });
});
