import { processTemplateLoops } from '@extensions/template-loops';
import { ProcessingError } from '@errors';

describe('processTemplateLoops', () => {
  it('renders #each loops with primitive values', () => {
    const content = '{{#each items}}\n- {{this}}\n{{/each}}';
    const metadata = { items: ['Apple', 'Banana', 'Cherry'] };

    const result = processTemplateLoops(content, metadata, undefined, false);

    expect(result).toContain('- Apple');
    expect(result).toContain('- Banana');
    expect(result).toContain('- Cherry');
  });

  it('renders #each loops with object properties', () => {
    const content = '{{#each products}}\n- {{name}}\n{{/each}}';
    const metadata = { products: [{ name: 'Laptop' }, { name: 'Mouse' }] };

    const result = processTemplateLoops(content, metadata, undefined, false);

    expect(result).toContain('- Laptop');
    expect(result).toContain('- Mouse');
  });

  it('supports nested object paths with #each', () => {
    const content = '{{#each services.included}}\n- {{this}}\n{{/each}}';
    const metadata = {
      services: {
        included: ['Water', 'Electricity', 'Internet'],
      },
    };

    const result = processTemplateLoops(content, metadata, undefined, false);

    expect(result).toContain('- Water');
    expect(result).toContain('- Electricity');
    expect(result).toContain('- Internet');
  });

  it('handles missing arrays gracefully', () => {
    const content = '{{#each services.missing}}\n- {{this}}\n{{/each}}';
    const metadata = { services: { included: ['Water'] } };

    const result = processTemplateLoops(content, metadata, undefined, false);

    expect(result.trim()).toBe('');
  });

  it('renders conditionals with #if', () => {
    const content = '{{#if isActive}}Active{{else}}Inactive{{/if}}';

    expect(processTemplateLoops(content, { isActive: true }, undefined, false)).toContain('Active');
    expect(processTemplateLoops(content, { isActive: false }, undefined, false)).toContain(
      'Inactive'
    );
  });

  it('defers top-level variable resolution to Phase 3', () => {
    const content = 'Company: {{company}}';
    const result = processTemplateLoops(content, { company: 'Acme Corp' }, undefined, false);
    expect(result).toBe('Company: {{company}}');
  });

  it('resolves underscore-wrapped root variables (leaked emphasis normalization case)', () => {
    const content = 'Company: {{_company_}}';
    const result = processTemplateLoops(content, { _company_: 'Acme Corp' }, undefined, false);
    expect(result).toBe('Company: Acme Corp');
  });

  it('resolves asterisk-wrapped root variables via leaked emphasis normalization', () => {
    const content = 'Company: {{*company*}}';
    const result = processTemplateLoops(content, { _company_: 'Acme Corp' }, undefined, false);
    expect(result).toBe('Company: Acme Corp');
  });

  it('throws ProcessingError on legacy function-style helper syntax', () => {
    const content = 'Total: {{formatDollar(amount)}}';

    expect(() => processTemplateLoops(content, { amount: 100 }, undefined, false)).toThrow(
      ProcessingError
    );
  });

  it('throws ProcessingError on legacy mathematical expressions', () => {
    const content = 'Total: {{price * quantity}}';

    expect(() =>
      processTemplateLoops(content, { price: 100, quantity: 2 }, undefined, false)
    ).toThrow('Legacy template syntax detected');
  });

  it('throws ProcessingError on legacy string concatenation', () => {
    const content = 'Price: {{"$" + price}}';

    expect(() => processTemplateLoops(content, { price: 100 }, undefined, false)).toThrow(
      'Legacy template syntax detected'
    );
  });

  describe('field tracking for {{.}} / {{this}} in array loops', () => {
    it('wraps non-empty array items with imported-value span when tracking enabled', () => {
      const content = '{{#each requirements}}\n- {{.}}\n{{/each}}';
      const result = processTemplateLoops(
        content,
        { requirements: ['Item A', 'Item B'] },
        undefined,
        true
      );
      expect(result).toContain('class="legal-field imported-value"');
      expect(result).toContain('Item A');
      expect(result).toContain('Item B');
    });

    it('wraps empty array items with missing-value span when tracking enabled', () => {
      const content = '{{#each requirements}}\n- {{.}}\n{{/each}}';
      const result = processTemplateLoops(
        content,
        { requirements: ['', '', ''] },
        undefined,
        true
      );
      expect(result).toContain('class="legal-field missing-value"');
    });

    it('correctly tracks mixed empty and filled items', () => {
      const content = '{{#each items}}{{.}}{{/each}}';
      const result = processTemplateLoops(
        content,
        { items: ['', 'Workers compensation', ''] },
        undefined,
        true
      );
      expect(result).toContain('class="legal-field missing-value"');
      expect(result).toContain('class="legal-field imported-value"');
      expect(result).toContain('Workers compensation');
    });

    it('returns raw values without any span when tracking disabled', () => {
      const content = '{{#each items}}{{.}}{{/each}}';
      const result = processTemplateLoops(
        content,
        { items: ['Alpha', ''] },
        undefined,
        false
      );
      expect(result).not.toContain('<span');
      expect(result).not.toContain('legal-field');
      expect(result).toContain('Alpha');
    });

    it('shows qualified path placeholder [[items[N]]] when loop item is empty and tracking enabled', () => {
      const content = '{{#each items}}- {{.}}\n{{/each}}';
      const result = processTemplateLoops(
        content,
        { items: ['', '', ''] },
        undefined,
        true
      );
      expect(result).toContain('[[items[0]]]');
      expect(result).toContain('[[items[1]]]');
      expect(result).toContain('[[items[2]]]');
      expect(result).toContain('class="legal-field missing-value"');
    });

    it('displays escaped bracket value \\[value\\] as literal [value] in loop object property', () => {
      // Inside #each loops, __lmVar resolves values where this !== root.
      // Escaped bracket values like '\[Party Name\]' should show as '[Party Name]'.
      const content = '{{#each parties}}{{name}}{{/each}}';
      const result = processTemplateLoops(
        content,
        { parties: [{ name: '\\[Party Name\\]' }] },
        undefined,
        false
      );
      expect(result).toBe('[Party Name]');
      expect(result).not.toContain('\\[');
    });

    it('does not mark escaped bracket value \\[value\\] as missing in loop context', () => {
      const content = '{{#each parties}}{{name}}{{/each}}';
      const result = processTemplateLoops(
        content,
        { parties: [{ name: '\\[Party Name\\]' }] },
        undefined,
        true
      );
      expect(result).not.toContain('missing-value');
      expect(result).toContain('[Party Name]');
    });

    it('shows nested loop path [[parent.child[N]]] for dotted loop variable', () => {
      // Loop over a nested array like insurance.lessee_requirements
      const content = '{{#each insurance.lessee_requirements}}{{.}}{{/each}}';
      const result = processTemplateLoops(
        content,
        { insurance: { lessee_requirements: ['', 'Workers comp', ''] } },
        undefined,
        true
      );
      expect(result).toContain('[[insurance.lessee_requirements[0]]]');
      expect(result).toContain('Workers comp');
      expect(result).toContain('[[insurance.lessee_requirements[2]]]');
    });

    it('uses the current loop path for each loop scope and resets between sibling loops', () => {
      const content = '{{#each outer}}{{.}}{{/each}}|{{#each inner}}{{.}}{{/each}}';
      const result = processTemplateLoops(
        content,
        { outer: [''], inner: [''] },
        undefined,
        true
      );
      expect(result).toContain('[[outer[0]]]');
      expect(result).toContain('[[inner[0]]]');
    });

    it('uses innermost loop path for nested loop dot placeholders', () => {
      const content = '{{#each outer}}{{#each inner}}{{.}}{{/each}}{{/each}}';
      const result = processTemplateLoops(
        content,
        {
          outer: [
            { inner: ['', 'A'] },
            { inner: [''] },
          ],
        },
        undefined,
        true
      );
      expect(result).toContain('[[inner[0]]]');
      expect(result).not.toContain('[[outer[0]]]');
      expect(result).toContain('A');
    });
  });

  describe('AST-first tracking tokens', () => {
    it('emits lm-field tokens instead of spans when astFieldTracking is enabled', () => {
      const content = '{{upper name}}';
      const result = processTemplateLoops(content, { name: 'john doe' }, undefined, true, true);
      expect(result).toContain('<lm-field');
      expect(result).toContain('data-field="name"');
      expect(result).not.toContain('<span class="legal-field');
    });

    it('keeps top-level variable deferral unchanged in AST-first mode', () => {
      const content = 'Company: {{company}}';
      const result = processTemplateLoops(content, { company: 'Acme Corp' }, undefined, true, true);
      expect(result).toBe('Company: {{company}}');
    });

    it('emits winner-branch logic tokens when both tracking flags are enabled', () => {
      const content = '{{#if active}}Enabled{{else}}Disabled{{/if}}';
      const result = processTemplateLoops(
        content,
        { active: true },
        undefined,
        true,
        true,
        true
      );
      expect(result).toContain('<lm-logic-start');
      expect(result).toContain('data-field="logic.branch.');
      expect(result).toContain('data-logic-helper="if"');
      expect(result).toContain('data-logic-result="true"');
      expect(result).toContain('<lm-logic-end></lm-logic-end>');
    });

    it('does not emit logic tokens when ast tracking flag is off', () => {
      const content = '{{#if active}}Enabled{{else}}Disabled{{/if}}';
      const result = processTemplateLoops(
        content,
        { active: true },
        undefined,
        true,
        false,
        true
      );
      expect(result).not.toContain('<lm-logic-start');
      expect(result).toContain('Enabled');
    });

    it('preserves newline boundaries around winner branch tokens in standalone blocks', () => {
      const content = '{{#if cond}}\nA\n{{/if}}\n{{#if other}}\nB\n{{/if}}\nlll. Heading';
      const result = processTemplateLoops(
        content,
        { cond: true, other: false },
        undefined,
        true,
        true,
        true
      );

      expect(result).toContain('<lm-logic-end></lm-logic-end>\nlll. Heading');
      expect(result).not.toContain('<lm-logic-end></lm-logic-end>lll. Heading');
    });

    it('keeps loop item headings separated when first/last winner branches are highlighted', () => {
      const content = `
{{#each services}}
lll. {{ordinal (add @index 1)}} Service Engagement: {{name}}

{{description}}.
{{#if @first}}

This is the first service.
{{/if}}
{{#if @last}}

This is the last service.
{{/if}}
{{/each}}
`;

      const result = processTemplateLoops(
        content,
        {
          services: [
            { name: 'Alpha', description: 'Alpha description' },
            { name: 'Beta', description: 'Beta description' },
            { name: 'Gamma', description: 'Gamma description' },
          ],
        },
        undefined,
        true,
        true,
        true
      );

      const headingCount = (result.match(/\nlll\./g) || []).length;
      expect(headingCount).toBe(3);
      expect(result).toContain('first service.<lm-logic-end></lm-logic-end>\nlll.');
      expect(result).not.toContain('first service.<lm-logic-end></lm-logic-end>lll.');
      expect(result).toContain('last service.<lm-logic-end></lm-logic-end>');
    });

    it('keeps markdown structure when winner branch starts with heading and list', () => {
      const content = `{{#if loyaltyMember}}
## Customer Loyalty

- Member Points Earned: {{pointsEarned}}
- Current Balance: {{pointsBalance}}
{{/if}}`;

      const result = processTemplateLoops(
        content,
        { loyaltyMember: true, pointsEarned: 112, pointsBalance: 1523 },
        undefined,
        true,
        true,
        true
      );

      expect(result).toContain('## <lm-logic-start');
      expect(result).toContain('\n- <lm-logic-start');
      expect(result).not.toContain('<lm-logic-start data-field="logic.branch.1" data-logic-helper="if" data-logic-result="true"></lm-logic-start>## Customer Loyalty');
      expect(result).not.toContain('<lm-logic-start data-field="logic.branch.1" data-logic-helper="if" data-logic-result="true"></lm-logic-start>- Member Points Earned');
    });
  });
});
