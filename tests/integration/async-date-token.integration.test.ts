import { describe, it, expect } from 'vitest';
import { processLegalMarkdown } from '../../src/index';

describe('processLegalMarkdown date token parity', () => {
  it('keeps bare @today unchanged through async pipeline', async () => {
    const content = 'Document date: @today';

    const result = await processLegalMarkdown(content);

    expect(result.content).toContain('Document date: @today');
  });

  it('uses ISO default for wrapped {{@today}} in async pipeline', async () => {
    const content = `---
date-format: US
---

Date: {{@today}}`;

    const result = await processLegalMarkdown(content);

    expect(result.content).not.toContain('@today');
    expect(result.content).toMatch(/Date: \d{4}-\d{2}-\d{2}/);
  });
});
