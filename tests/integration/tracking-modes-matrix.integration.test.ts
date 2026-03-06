import { describe, expect, it } from 'vitest';
import { processLegalMarkdown } from '../../src/extensions/remark/legal-markdown-processor';
import { htmlGenerator } from '../../src/extensions/generators/html-generator';

const MATRIX_INPUT = `---
title: Matrix Validation
provider:
  contact:
    name: eleanor voss
    email: EVOSS@MERIDIANCG.COM
  address: 123 Legal Ave
items:
  - Alpha
  - Beta
negative: -42
score: 85
threshold: 70
active: true
premium: false
---

Contact: {{titleCase provider.contact.name}}, {{provider.address}}, {{lower provider.contact.email}}

Abs: {{abs negative}} | Max: {{max 10 25}} | Min: {{min 10 25}}

{{#if (gt score threshold)}}
Score exceeds threshold.
{{/if}}

{{#if (and active (not premium))}}
Active and not premium.
{{/if}}

{{#each items}}
- {{.}}
{{/each}}
`;

const LOGIC_INPUT = `---
score: 85
threshold: 70
---
{{#if (gt score threshold)}}
Winner branch text
{{else}}
Loser branch text
{{/if}}
`;

type RenderMode = 'markdown' | 'html';

async function renderOutput(
  input: string,
  mode: RenderMode,
  options: {
    tracking: boolean;
    astFirst?: boolean;
    logicHighlighting: boolean;
  }
): Promise<string> {
  const processed = await processLegalMarkdown(input, {
    enableFieldTracking: options.tracking,
    ...(options.astFirst === undefined ? {} : { astFieldTracking: options.astFirst }),
    logicBranchHighlighting: options.logicHighlighting,
  });

  if (mode === 'markdown') {
    return processed.content;
  }

  return htmlGenerator.generateHtml(processed.content, {
    includeHighlighting: options.tracking,
    title: 'Matrix Validation',
  });
}

function normalizedText(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#{}`*_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('Phase2->Phase3 tracking matrix', () => {
  const modes: RenderMode[] = ['markdown', 'html'];
  const routes = [
    { name: 'legacy', astFirst: false },
    { name: 'ast-first', astFirst: true },
  ] as const;
  const trackingModes = [false, true] as const;

  for (const route of routes) {
    for (const mode of modes) {
      for (const tracking of trackingModes) {
        it(`${route.name} | ${mode} | tracking ${tracking ? 'ON' : 'OFF'} preserves functional text`, async () => {
          const output = await renderOutput(MATRIX_INPUT, mode, {
            tracking,
            astFirst: route.astFirst,
            logicHighlighting: false,
          });

          const text = normalizedText(output);
          expect(text).toContain('Eleanor Voss');
          expect(text).toContain('123 Legal Ave');
          expect(text).toContain('Abs: 42');
          expect(text).toContain('Max: 25');
          expect(text).toContain('Min: 10');
          expect(text).toContain('Score exceeds threshold.');
          expect(text).toContain('Active and not premium.');
          expect(text).toContain('Alpha');
          expect(text).toContain('Beta');
          expect(output).not.toContain('{{');

          if (tracking) {
            expect(output).toContain('<span class="legal-field');
          } else {
            expect(output).not.toContain('<span class="legal-field');
          }

          expect(output).not.toContain('<lm-field');
          expect(output).not.toContain('<lm-logic');
        });
      }
    }
  }
});

describe('Winner branch highlighting matrix', () => {
  const modes: RenderMode[] = ['markdown', 'html'];

  for (const mode of modes) {
    it(`ast-first route | ${mode} | logic highlighting OFF keeps content without logic markers`, async () => {
      const output = await renderOutput(LOGIC_INPUT, mode, {
        tracking: true,
        astFirst: true,
        logicHighlighting: false,
      });

      expect(output).toContain('Winner branch text');
      expect(output).not.toContain('Loser branch text');
      expect(output).not.toContain('data-logic-helper=');
      expect(output).not.toContain('data-logic-result=');
    });

    it(`ast-first route | ${mode} | logic highlighting ON annotates winner branch`, async () => {
      const output = await renderOutput(LOGIC_INPUT, mode, {
        tracking: true,
        astFirst: true,
        logicHighlighting: true,
      });

      expect(output).toContain('Winner branch text');
      expect(output).not.toContain('Loser branch text');
      expect(output).toContain('data-field="logic.branch.1"');
      expect(output).toContain('data-logic-helper="if"');
      expect(output).toContain('data-logic-result="true"');
      expect(output).not.toContain('<lm-logic');
    });
  }
});

describe('Tracking flag implication matrix', () => {
  const modes: RenderMode[] = ['markdown', 'html'];

  for (const mode of modes) {
    it(`auto route | ${mode} | logic highlighting ON implies AST route when tracking is ON`, async () => {
      const output = await renderOutput(LOGIC_INPUT, mode, {
        tracking: true,
        astFirst: undefined,
        logicHighlighting: true,
      });

      expect(output).toContain('Winner branch text');
      expect(output).not.toContain('Loser branch text');
      expect(output).toContain('data-field="logic.branch.1"');
      expect(output).toContain('data-logic-helper="if"');
      expect(output).toContain('data-logic-result="true"');
    });

    it(`legacy route | ${mode} | explicit astFirst=false prevents logic annotations`, async () => {
      const output = await renderOutput(LOGIC_INPUT, mode, {
        tracking: true,
        astFirst: false,
        logicHighlighting: true,
      });

      expect(output).toContain('Winner branch text');
      expect(output).not.toContain('Loser branch text');
      expect(output).not.toContain('data-logic-helper=');
      expect(output).not.toContain('data-logic-result=');
    });

    it(`auto route | ${mode} | logic highlighting alone does not annotate without field tracking`, async () => {
      const output = await renderOutput(LOGIC_INPUT, mode, {
        tracking: false,
        astFirst: undefined,
        logicHighlighting: true,
      });

      expect(output).toContain('Winner branch text');
      expect(output).not.toContain('Loser branch text');
      expect(output).not.toContain('data-logic-helper=');
      expect(output).not.toContain('data-logic-result=');
    });
  }
});
