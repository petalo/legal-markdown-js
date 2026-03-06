import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { processLegalMarkdown } from '../../src/index';
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

describe('Consolidated remark pipeline parity coverage', () => {
  describe('Headers Processing', () => {
    it('numbers headers correctly', async () => {
      const content = `---
level-one: "Article %n."
level-two: "Section %n."
---

l. Introduction
l. Terms`;

      const result = await processLegalMarkdown(content, { noImports: true });

      expect(result.content).toContain('Article 1.');
      expect(result.content).toContain('Article 2.');
    });

    it('resets nested counters on level change', async () => {
      const content = `---
level-one: "%n."
level-two: "%n.%s"
---

l. First
ll. First Sub
ll. Second Sub
l. Second
ll. First Sub Again`;

      const result = await processLegalMarkdown(content, { noImports: true });

      expect(result.content).toContain('1.');
      expect(result.content).toContain('2.');
      expect(result.content).toContain('First Sub');
    });
  });

  describe('Template Fields Processing', () => {
    it('expands simple fields', async () => {
      const content = `---
name: John Doe
company: Acme Corp
---

Hello {{name}} from {{company}}!`;

      const result = await processLegalMarkdown(content, {
        noHeaders: true,
        noImports: true,
        noReferences: true,
      });

      expect(result.content).toContain('John Doe');
      expect(result.content).toContain('Acme Corp');
    });

    it('handles nested object access', async () => {
      const content = `---
user:
  name: Jane Smith
  location:
    city: San Francisco
    state: CA
---

User: {{user.name}}
Location: {{user.location.city}}, {{user.location.state}}`;

      const result = await processLegalMarkdown(content, {
        noHeaders: true,
        noImports: true,
        noReferences: true,
      });

      expect(result.content).toContain('Jane Smith');
      expect(result.content).toContain('San Francisco');
      expect(result.content).toContain('CA');
    });
  });

  describe('Conditional Clauses Processing', () => {
    it('includes content when condition is true', async () => {
      const content = `---
show: true
---

[Visible content]{show}`;

      const result = await processLegalMarkdown(content, {
        noHeaders: true,
        noImports: true,
        noReferences: true,
      });

      expect(result.content).toContain('Visible content');
    });

    it('excludes content when condition is false', async () => {
      const content = `---
hide: false
---

Before [Hidden content]{hide} After`;

      const result = await processLegalMarkdown(content, {
        noHeaders: true,
        noImports: true,
        noReferences: true,
      });

      expect(result.content).not.toContain('Hidden content');
      expect(result.content).toContain('Before');
      expect(result.content).toContain('After');
    });
  });

  describe('Date Processing', () => {
    it('keeps bare @today unchanged', async () => {
      const content = `---
---

Document dated @today`;

      const result = await processLegalMarkdown(content, {
        noHeaders: true,
        noImports: true,
        noReferences: true,
      });

      expect(result.content).toContain('Document dated @today');
    });

    it('respects date format overrides for wrapped {{@today}}', async () => {
      const content = `---
---

Long format: {{@today[long]}}`;

      const result = await processLegalMarkdown(content, {
        noHeaders: true,
        noImports: true,
        noReferences: true,
      });

      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];

      const hasMonth = monthNames.some(month => result.content.includes(month));
      expect(hasMonth).toBe(true);
    });
  });

  describe('Imports Processing', () => {
    const tempDir = join(process.cwd(), 'tests', 'fixtures', 'temp-parity-imports');
    const importFile = join(tempDir, 'include.md');

    beforeAll(() => {
      if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true });
      }
      writeFileSync(importFile, '# Imported Section\n\nImported text content.');
    });

    afterAll(() => {
      try {
        unlinkSync(importFile);
      } catch {}
    });

    it('includes imported content', async () => {
      const content = `---
---

# Main Document

@import ./include.md

# Conclusion`;

      const result = await processLegalMarkdown(content, {
        basePath: tempDir,
        noHeaders: true,
        noReferences: true,
      });

      expect(result.content).toContain('Imported Section');
      expect(result.content).toContain('Imported text content');
    });
  });

  describe('Complete Pipeline', () => {
    it('processes all core features together', async () => {
      const content = `---
title: Service Agreement
client: Acme Corp
premium: true
level-one: "Article %n."
level-two: "Section %n."
---

l. **Introduction**

This agreement is for {{client}}.

ll. Terms

[Premium services included]{premium}

Document executed on {{@today}}`;

      const result = await processLegalMarkdown(content, { noImports: true });

      expect(result.content).toContain('Acme Corp');
      expect(result.content).toContain('Article 1.');
      expect(result.content).toContain('Premium services included');
      expect(result.content).not.toContain('@today');
      expect(result.content).toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(result.metadata.title).toBe('Service Agreement');
      expect(result.metadata.client).toBe('Acme Corp');
    });

    it('preserves markdown formatting', async () => {
      const content = `---
name: John Doe
---

# Document

**Bold** and *italic* text.

Party: {{name}}

- List item 1
- List item 2`;

      const result = await processLegalMarkdown(content, { noImports: true });

      expect(result.content).toContain('**Bold**');
      expect(result.content).toContain('*italic*');
      expect(result.content).toContain('John Doe');
      expect(result.content).toContain('- List item');
    });
  });
});
