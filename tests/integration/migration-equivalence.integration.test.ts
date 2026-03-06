import { describe, it, expect } from 'vitest';
import { processLegalMarkdown } from '../../src/index';

describe('Legacy Migration Enforcement', () => {
  it('rejects function-style helper syntax and accepts Handlebars equivalent', async () => {
    const legacy = `---
date: 2025-01-15
---
{{formatDate(date, "US")}}`;

    const handlebars = `---
date: 2025-01-15
---
{{formatDate date "US"}}`;

    await expect(processLegalMarkdown(legacy)).rejects.toThrow('Legacy template syntax detected');
    await expect(processLegalMarkdown(handlebars)).resolves.toMatchObject({
      content: expect.stringContaining('US'),
    });
  });

  it('rejects legacy mathematical expressions', async () => {
    const legacy = `---
price: 100
quantity: 5
---
{{price * quantity}}`;

    await expect(processLegalMarkdown(legacy)).rejects.toThrow('Legacy template syntax detected');
  });

  it('rejects legacy string concatenation', async () => {
    const legacy = `---
price: 100
---
{{"$" + price}}`;

    await expect(processLegalMarkdown(legacy)).rejects.toThrow('Legacy template syntax detected');
  });
});
