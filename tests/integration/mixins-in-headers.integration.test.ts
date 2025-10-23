/**
 * Test for Issue #139: Mixins should render correctly inside headers
 *
 * BUG REPORTED: Mixins inside headers with bold markdown render as ****
 * instead of expanding the variable value.
 *
 * Example:
 * Input: `ll. - Obligations of **{{counterparty.contract_name}}** |obligations|`
 * Expected: `## Clause II - Obligations of **THE CLIENT**`
 * Actual (bug): `## Clause II - Obligations of ****`
 *
 * Root cause hypothesis:
 * - remarkLegalHeadersParser (Phase 4) processes headers BEFORE remarkTemplateFields (Phase 2)
 * - OR escapeTemplateUnderscores() interferes with mixins expansion
 */

import { describe, it, expect } from 'vitest';
import { processLegalMarkdownWithRemark } from '../../src/extensions/remark/legal-markdown-processor';

describe('Issue #139: Mixins should render in headers', () => {
  it('should render mixins inside headers with bold markdown', async () => {
    const input = `---
counterparty:
  contract_name: "THE CLIENT"
level-two: "Clause %R"
---

ll. - Obligations of **{{counterparty.contract_name}}** |obligations|`;

    const result = await processLegalMarkdownWithRemark(input, {
      enableFieldTracking: false,
      noImports: true,
    });

    // The mixin should expand before header processing
    expect(result.content).toContain('THE CLIENT');
    expect(result.content).not.toContain('****');
    expect(result.content).not.toContain('{{counterparty.contract_name}}');
  });

  it('should render simple mixins in headers', async () => {
    const input = `---
section_title: "Confidentiality"
level-two: "Section %R"
---

ll. - {{section_title}} |conf|`;

    const result = await processLegalMarkdownWithRemark(input, {
      enableFieldTracking: false,
      noImports: true,
    });

    expect(result.content).toContain('Confidentiality');
    expect(result.content).not.toContain('{{section_title}}');
  });

  it('should render nested object mixins in headers', async () => {
    const input = `---
contract:
  party_name: "Acme Corp"
  role: "Service Provider"
level-two: "Clause %R"
---

ll. - Obligations of {{contract.party_name}} as {{contract.role}} |obligations|`;

    const result = await processLegalMarkdownWithRemark(input, {
      enableFieldTracking: false,
      noImports: true,
    });

    expect(result.content).toContain('Acme Corp');
    expect(result.content).toContain('Service Provider');
    expect(result.content).not.toContain('{{contract.party_name}}');
    expect(result.content).not.toContain('{{contract.role}}');
  });

  it('should render mixins with italic markdown in headers', async () => {
    const input = `---
term: "confidential information"
level-two: "Definition"
---

ll. - Definition of *{{term}}* |def|`;

    const result = await processLegalMarkdownWithRemark(input, {
      enableFieldTracking: false,
      noImports: true,
    });

    expect(result.content).toContain('confidential information');
  });

  it('should render mixins with underscores in field names', async () => {
    const input = `---
counterparty:
  legal_name: "NewCo Inc."
  contract_name: "THE CLIENT"
level-two: "Clause %R"
---

ll. - Party {{counterparty.legal_name}} ({{counterparty.contract_name}}) |party|`;

    const result = await processLegalMarkdownWithRemark(input, {
      enableFieldTracking: false,
      noImports: true,
    });

    expect(result.content).toContain('NewCo Inc.');
    expect(result.content).toContain('THE CLIENT');
    expect(result.content).not.toContain('{{counterparty.legal_name}}');
    expect(result.content).not.toContain('{{counterparty.contract_name}}');
  });

  it('should render multiple mixins in the same header', async () => {
    const input = `---
client: "Buyer Corp"
vendor: "Seller Inc"
date: "January 15, 2025"
level-two: "Agreement"
---

ll. - Agreement between {{client}} and {{vendor}} dated {{date}} |agreement|`;

    const result = await processLegalMarkdownWithRemark(input, {
      enableFieldTracking: false,
      noImports: true,
    });

    expect(result.content).toContain('Buyer Corp');
    expect(result.content).toContain('Seller Inc');
    expect(result.content).toContain('January 15, 2025');
  });

  it('should handle headers with mixins and cross-references together', async () => {
    const input = `---
section_name: "Confidentiality"
level-two: "Section %R"
---

ll. - {{section_name}} |conf|

Please see |conf| for details.`;

    const result = await processLegalMarkdownWithRemark(input, {
      enableFieldTracking: false,
      noImports: true,
    });

    // Mixin should expand
    expect(result.content).toContain('Confidentiality');

    // Cross-reference should resolve (will be "Section II" or similar)
    expect(result.content).toMatch(/Section (I{1,3}|II)/);
  });
});
