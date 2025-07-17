import { processLegalMarkdown } from '../../src/index';

describe('Core Legal Markdown (without RST/LaTeX)', () => {
  it('should process basic legal markdown', () => {
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

    const result = processLegalMarkdown(content);
    expect(result.content).toContain('Test Agreement');
    expect(result.content).toContain('John Doe');
    expect(result.content).toContain('Jane Smith');
    expect(result.metadata).toEqual({
      title: 'Test Agreement',
      party1: 'John Doe',
      party2: 'Jane Smith'
    });
  });

  it('should process optional clauses', () => {
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

    const result = processLegalMarkdown(content);
    expect(result.content).not.toContain('Warranty');
    expect(result.content).toContain('Final Terms');
  });

  it('should process cross-references', () => {
    const content = `---
title: Test Agreement
---

# {{title}}

## Section A {#section-a}

This is section A.

## Section B

This section references {{section-a}}.
`;

    const result = processLegalMarkdown(content);
    expect(result.content).toContain('Section A');
  });

  it('should process headers with numbering', () => {
    const content = `---
title: Test Agreement
---

# {{title}}

l. First Level
ll. Second Level
lll. Third Level
`;

    const result = processLegalMarkdown(content);
    expect(result.content).toContain('Article 1. First Level');
    expect(result.content).toContain('Section 1. Second Level');
    expect(result.content).toContain('(1) Third Level');
  });

  it('should track fields when enabled', () => {
    const content = `---
title: Test Agreement
party1: John Doe
---

# {{title}}

This agreement is for {{party1}}.
`;

    const result = processLegalMarkdown(content, {
      enableFieldTracking: true
    });

    expect(result.fieldReport).toBeDefined();
    expect(result.fieldReport?.fields).toHaveLength(2);
    expect(result.fieldReport?.fields.some(f => f.name === 'title')).toBe(true);
    expect(result.fieldReport?.fields.some(f => f.name === 'party1')).toBe(true);
  });

  it('should work without pandoc dependencies', () => {
    // Mock pandoc as unavailable by testing regular markdown
    const content = `---
title: Test Agreement
---

# {{title}}

This is regular markdown content.
`;

    const result = processLegalMarkdown(content);
    expect(result.content).toContain('Test Agreement');
    expect(result.metadata?.title).toBe('Test Agreement');
  });

  it('should handle empty content gracefully', () => {
    const result = processLegalMarkdown('');
    expect(result.content).toBe('');
    expect(result.metadata).toEqual({});
  });

  it('should handle content without YAML frontmatter', () => {
    const content = `
# Simple Document

This is a simple document without YAML frontmatter.
`;

    const result = processLegalMarkdown(content);
    expect(result.content).toContain('Simple Document');
    expect(result.metadata).toEqual({});
  });

  it('should handle malformed YAML frontmatter gracefully', () => {
    const content = `---
title: Test Agreement
invalid_yaml: [unclosed bracket
---

# Document

Content here.
`;

    const result = processLegalMarkdown(content, {
      throwOnYamlError: false
    });
    expect(result.content).toContain('Document');
    // Should handle the error gracefully
  });
});