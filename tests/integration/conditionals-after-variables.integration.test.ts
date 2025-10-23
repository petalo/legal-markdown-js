/**
 * Test for Issue #120: Conditionals should evaluate AFTER variables are expanded
 *
 * CRITICAL BUG: In the old architecture, processTemplateLoops ran BEFORE remarkTemplateFields,
 * causing conditionals to evaluate against unexpanded variable names instead of values.
 *
 * Example:
 * - Metadata: { contrato: { jurisdiccion: "madrid" } }
 * - Conditional: {{#if contrato.jurisdiccion == "madrid"}}
 *
 * OLD BEHAVIOR (BUG):
 * 1. processTemplateLoops evaluates: "contrato.jurisdiccion" == "madrid" → false
 * 2. remarkTemplateFields expands: {{contrato.jurisdiccion}} → "madrid" (too late)
 * 3. Result: FAIL rendered
 *
 * NEW BEHAVIOR (FIXED):
 * 1. Phase 2 (VARIABLE_EXPANSION): remarkTemplateFields expands to "madrid"
 * 2. Phase 3 (CONDITIONAL_EVAL): processTemplateLoops evaluates: "madrid" == "madrid" → true
 * 3. Result: SUCCESS rendered
 */

import { describe, it, expect } from 'vitest';
import { processLegalMarkdownWithRemark } from '../../src/extensions/remark/legal-markdown-processor';

describe('Issue #120: Conditionals should evaluate AFTER variables', () => {
  it('should expand variables before evaluating conditionals', async () => {
    const input = `---
contrato:
  jurisdiccion: "madrid"
---

{{#if contrato.jurisdiccion == "madrid"}}
SUCCESS
{{else}}
FAIL
{{/if}}`;

    const result = await processLegalMarkdownWithRemark(input, {
      enableFieldTracking: false,
      noImports: true,
    });

    // The conditional should evaluate correctly after variable expansion
    expect(result.content).toContain('SUCCESS');
    expect(result.content).not.toContain('FAIL');
  });

  it('should handle nested object access in conditionals', async () => {
    const input = `---
user:
  status: "active"
  role: "admin"
---

{{#if user.status == "active"}}
User is active
{{/if}}

{{#if user.role == "admin"}}
User is admin
{{/if}}`;

    const result = await processLegalMarkdownWithRemark(input, {
      enableFieldTracking: false,
      noImports: true,
    });

    expect(result.content).toContain('User is active');
    expect(result.content).toContain('User is admin');
  });

  it('should handle multiple conditionals with variables', async () => {
    const input = `---
contract:
  type: "service"
  jurisdiction: "spain"
  amount: 10000
---

{{#if contract.type == "service"}}
Service Agreement
{{/if}}

{{#if contract.jurisdiction == "spain"}}
Spanish Law Applies
{{/if}}

{{#if contract.amount >= 10000}}
High Value Contract
{{/if}}`;

    const result = await processLegalMarkdownWithRemark(input, {
      enableFieldTracking: false,
      noImports: true,
    });

    expect(result.content).toContain('Service Agreement');
    expect(result.content).toContain('Spanish Law Applies');
    expect(result.content).toContain('High Value Contract');
  });

  it('should handle else branches correctly when condition is false', async () => {
    const input = `---
contract:
  type: "employment"
---

{{#if contract.type == "service"}}
WRONG
{{else}}
CORRECT: Employment Contract
{{/if}}`;

    const result = await processLegalMarkdownWithRemark(input, {
      enableFieldTracking: false,
      noImports: true,
    });

    expect(result.content).not.toContain('WRONG');
    expect(result.content).toContain('CORRECT: Employment Contract');
  });

  it('should handle unless conditionals with variables', async () => {
    const input = `---
contract:
  cancelled: false
---

{{#unless contract.cancelled}}
Contract is active
{{/unless}}`;

    const result = await processLegalMarkdownWithRemark(input, {
      enableFieldTracking: false,
      noImports: true,
    });

    expect(result.content).toContain('Contract is active');
  });

  it('should handle complex boolean expressions with variables', async () => {
    const input = `---
contract:
  jurisdiction: "madrid"
  type: "service"
---

{{#if contract.jurisdiction == "madrid" && contract.type == "service"}}
Madrid Service Contract
{{/if}}`;

    const result = await processLegalMarkdownWithRemark(input, {
      enableFieldTracking: false,
      noImports: true,
    });

    expect(result.content).toContain('Madrid Service Contract');
  });

  it('should handle array iteration with expanded variables', async () => {
    const input = `---
parties:
  - name: "Party A"
    role: "client"
  - name: "Party B"
    role: "contractor"
---

{{#parties}}
- Name: {{name}}
{{#if role == "client"}}
  (Client)
{{else}}
  (Contractor)
{{/if}}
{{/parties}}`;

    const result = await processLegalMarkdownWithRemark(input, {
      enableFieldTracking: false,
      noImports: true,
    });

    expect(result.content).toContain('Party A');
    expect(result.content).toContain('(Client)');
    expect(result.content).toContain('Party B');
    expect(result.content).toContain('(Contractor)');
  });
});
