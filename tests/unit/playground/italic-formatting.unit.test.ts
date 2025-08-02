/**
 * Test for italic formatting in playground - verifies that both _ and __ syntax work correctly
 */

import { describe, it, expect } from 'vitest';
import { processLegalMarkdownWithRemark } from '../../../src/extensions/remark/legal-markdown-processor';

describe('Playground Italic Formatting', () => {
  it('should convert _ to italics correctly', async () => {
    const content = `---
title: Test Document
---

# {{title}}

This is _italic text_ and this is normal text.
`;

    const result = await processLegalMarkdownWithRemark(content, {
      debug: false,
      enableFieldTracking: false,
      noIndent: true,
      additionalMetadata: {
        'level-1': 'Article %n.',
        'level-2': 'Section %n.'
      }
    });

    expect(result.content).toContain('This is *italic text* and this is normal text.');
  });

  it('should convert __ to bold correctly', async () => {
    const content = `---
title: Test Document
---

# {{title}}

This is __bold text__ and this is normal text.
`;

    const result = await processLegalMarkdownWithRemark(content, {
      debug: false,
      enableFieldTracking: false,
      noIndent: true,
      additionalMetadata: {
        'level-1': 'Article %n.',
        'level-2': 'Section %n.'
      }
    });

    expect(result.content).toContain('This is **bold text** and this is normal text.');
  });

  it('should handle mixed _ and * formatting', async () => {
    const content = `---
title: Test Document
---

# {{title}}

Mix of _italic_ and *also italic*.
Mix of __bold__ and **also bold**.
`;

    const result = await processLegalMarkdownWithRemark(content, {
      debug: false,
      enableFieldTracking: false,
      noIndent: true,
      additionalMetadata: {
        'level-1': 'Article %n.',
        'level-2': 'Section %n.'
      }
    });

    expect(result.content).toContain('Mix of *italic* and *also italic*.');
    expect(result.content).toContain('Mix of **bold** and **also bold**.');
  });

  it('should handle complex formatting combinations', async () => {
    const content = `---
title: Legal Document
client: Acme Corp
---

# {{title}}

Cliente: {{client}}

## Section with Mixed Formatting

This contains _italic text_, __bold text__, *also italic*, and **also bold**.

l. Main Section
ll. _Subsection_ with __emphasis__
ll. *Another subsection* with **strong emphasis**
`;

    const result = await processLegalMarkdownWithRemark(content, {
      debug: false,
      enableFieldTracking: false,
      noIndent: true,
      additionalMetadata: {
        'level-1': 'Article %n.',
        'level-2': 'Section %n.'
      }
    });

    // Check that underscores are normalized to asterisks
    expect(result.content).toContain('This contains *italic text*, **bold text**, *also italic*, and **also bold**.');
    expect(result.content).toContain('Section 1. *Subsection* with **emphasis**');
    expect(result.content).toContain('Section 2. *Another subsection* with **strong emphasis**');
  });
});