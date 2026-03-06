import { processLegalMarkdown } from '../../src/index';

describe('Core Legal Markdown (without RST/LaTeX)', () => {
  it('should process basic legal markdown', async () => {
    const content = `---
title: Test Agreement
party1: John Doe
party2: Jane Smith
---

# {{title}}

This agreement is between {{party1}} and {{party2}}.

## Terms

The following terms apply:

1. First term
2. Second term
`;

    const result = await processLegalMarkdown(content);
    expect(result.content).toContain('Test Agreement');
    expect(result.content).toContain('John Doe');
    expect(result.content).toContain('Jane Smith');
    expect(result.metadata).toMatchObject({
      title: 'Test Agreement',
      party1: 'John Doe',
      party2: 'Jane Smith',
    });
    expect(result.metadata._field_mappings).toBeInstanceOf(Map);
  });

  it('should process optional clauses', async () => {
    const content = `---
include_warranty: false
---

# Agreement

This is a standard agreement.

{{#include_warranty}}
## Warranty

This section includes warranty information.
{{/include_warranty}}

## Final Terms

These are the final terms.
`;

    const result = await processLegalMarkdown(content);
    expect(result.content).not.toContain('Warranty');
    expect(result.content).toContain('Final Terms');
  });

  it('should process cross-references', async () => {
    const content = `---
title: Test Agreement
level-one: "Article %n."
level-two: "Section %n."
level-three: "(%n)"
---

# {{title}}

## Section A {#section-a}

This is section A.

## Section B

This section references {{section-a}}.
`;

    const result = await processLegalMarkdown(content);
    expect(result.content).toContain('Section A');
  });

  it('should process headers with numbering', async () => {
    const content = `---
title: Test Agreement
level-one: "Article %n."
level-two: "Section %n."
level-three: "(%n)"
---

# {{title}}

l. First Level
ll. Second Level
lll. Third Level
`;

    const result = await processLegalMarkdown(content);
    expect(result.content).toContain('Article 1. First Level');
    expect(result.content).toContain('Section 1. Second Level');
    expect(result.content).toContain('(1) Third Level');
  });

  it('should track fields when enabled', async () => {
    const content = `---
title: Test Agreement
party1: John Doe
---

# {{title}}

This agreement is for {{party1}}.
`;

    const result = await processLegalMarkdown(content, {
      enableFieldTracking: true,
    });

    expect(result.fieldReport).toBeDefined();
    expect(result.fieldReport?.fields).toBeInstanceOf(Map);
    expect(result.fieldReport?.fields.has('title')).toBe(true);
    expect(result.fieldReport?.fields.has('party1')).toBe(true);
  });

  it('should work without pandoc dependencies', async () => {
    // Mock pandoc as unavailable by testing regular markdown
    const content = `---
title: Test Agreement
---

# {{title}}

This is regular markdown content.
`;

    const result = await processLegalMarkdown(content);
    expect(result.content).toContain('Test Agreement');
    expect(result.metadata?.title).toBe('Test Agreement');
  });

  it('should handle empty content gracefully', async () => {
    const result = await processLegalMarkdown('');
    expect(result.content).toBe('');
    expect(result.metadata).toMatchObject({});
    expect(result.metadata._field_mappings).toBeInstanceOf(Map);
  });

  it('should handle content without YAML frontmatter', async () => {
    const content = `
# Simple Document

This is a simple document without YAML frontmatter.
`;

    const result = await processLegalMarkdown(content);
    expect(result.content).toContain('Simple Document');
    expect(result.metadata).toMatchObject({});
    expect(result.metadata._field_mappings).toBeInstanceOf(Map);
  });

  it('should handle malformed YAML frontmatter gracefully', async () => {
    const content = `---
title: Test Agreement
invalid_yaml: [unclosed bracket
---

# Document

Content here.
`;

    const result = await processLegalMarkdown(content, {
      throwOnYamlError: false,
    });
    expect(result.content).toContain('Document');
    // Should handle the error gracefully
  });
});
