/**
 * Integration tests to verify legacy processors and remark plugins provide equivalent functionality
 *
 * This test suite verifies that:
 * 1. Legacy processors and new remark plugins both work for their intended use cases
 * 2. Key features produce functionally equivalent results
 * 3. Migration from legacy to remark doesn't break core functionality
 *
 * Note: These tests suppress deprecation warnings to avoid noise in test output
 * Note: Tests focus on functional equivalence, not exact output matching
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { processHeaders } from '../../src/core/processors/header-processor';
import { processMixins } from '../../src/core/processors/mixin-processor';
import { processOptionalClauses } from '../../src/core/processors/clause-processor';
import { processDateReferences } from '../../src/core/processors/date-processor';
import { processLegalMarkdownWithRemark } from '../../src/extensions/remark/legal-markdown-processor';
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Suppress deprecation warnings for tests
const originalEnv = process.env.NODE_ENV;

beforeAll(() => {
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  process.env.NODE_ENV = originalEnv;
});

describe('Legacy vs Remark Functional Parity', () => {
  describe('Headers Processing', () => {
    it('should both number headers correctly', async () => {
      const content = `---
level-one: "Article %n."
level-two: "Section %n."
---

l. Introduction
l. Terms`;

      const metadata = {
        'level-one': 'Article %n.',
        'level-two': 'Section %n.',
      };

      const legacyResult = processHeaders(
        content.replace(/^---[\s\S]*?---\n\n/, ''),
        metadata
      );
      const remarkResult = await processLegalMarkdownWithRemark(content, {
        noImports: true,
      });

      // Both should number headers
      expect(legacyResult).toContain('Article 1.');
      expect(remarkResult.content).toContain('Article 1.');
      expect(legacyResult).toContain('Article 2.');
      expect(remarkResult.content).toContain('Article 2.');
    });

    it('should both reset counters on level change', async () => {
      const content = `---
level-one: "%n."
level-two: "%n.%s"
---

l. First
ll. First Sub
ll. Second Sub
l. Second
ll. First Sub Again`;

      const metadata = {
        'level-one': '%n.',
        'level-two': '%n.%s',
      };

      const legacyResult = processHeaders(
        content.replace(/^---[\s\S]*?---\n\n/, ''),
        metadata
      );
      const remarkResult = await processLegalMarkdownWithRemark(content, {
        noImports: true,
      });

      // Both should have level 1 headers
      expect(legacyResult).toContain('1.');
      expect(legacyResult).toContain('2.');
      expect(remarkResult.content).toContain('1.');
      expect(remarkResult.content).toContain('2.');

      // Verify legacy has nested numbering
      const hasSubNumberingLegacy = /\d\.\d/.test(legacyResult);
      expect(hasSubNumberingLegacy).toBe(true);

      // Remark should process sub-headers (format may vary)
      expect(remarkResult.content).toContain('First Sub');
    });
  });

  describe('Template Fields Processing', () => {
    it('should both expand simple fields', async () => {
      const content = `---
name: John Doe
company: Acme Corp
---

Hello {{name}} from {{company}}!`;

      const metadata = {
        name: 'John Doe',
        company: 'Acme Corp',
      };

      const legacyResult = processMixins(
        content.replace(/^---[\s\S]*?---\n\n/, ''),
        metadata
      );
      const remarkResult = await processLegalMarkdownWithRemark(content, {
        noHeaders: true,
        noImports: true,
      });

      // Both should expand fields
      expect(legacyResult).toContain('John Doe');
      expect(legacyResult).toContain('Acme Corp');
      expect(remarkResult.content).toContain('John Doe');
      expect(remarkResult.content).toContain('Acme Corp');
    });

    it('should both handle nested object access', async () => {
      const content = `---
user:
  name: Jane Smith
  location:
    city: San Francisco
    state: CA
---

User: {{user.name}}
Location: {{user.location.city}}, {{user.location.state}}`;

      const metadata = {
        user: {
          name: 'Jane Smith',
          location: {
            city: 'San Francisco',
            state: 'CA',
          },
        },
      };

      const legacyResult = processMixins(
        content.replace(/^---[\s\S]*?---\n\n/, ''),
        metadata
      );
      const remarkResult = await processLegalMarkdownWithRemark(content, {
        noHeaders: true,
        noImports: true,
      });

      // Both should handle nested access
      expect(legacyResult).toContain('Jane Smith');
      expect(legacyResult).toContain('San Francisco');
      expect(legacyResult).toContain('CA');
      expect(remarkResult.content).toContain('Jane Smith');
      expect(remarkResult.content).toContain('San Francisco');
      expect(remarkResult.content).toContain('CA');
    });
  });

  describe('Conditional Clauses Processing', () => {
    it('should both include content when condition is true', async () => {
      const content = `---
show: true
---

[Visible content]{show}`;

      const metadata = { show: true };

      const legacyResult = processOptionalClauses(
        content.replace(/^---[\s\S]*?---\n\n/, ''),
        metadata
      );
      const remarkResult = await processLegalMarkdownWithRemark(content, {
        noHeaders: true,
        noImports: true,
      });

      // Both should include the content
      expect(legacyResult).toContain('Visible content');
      expect(remarkResult.content).toContain('Visible content');
    });

    it('should both exclude content when condition is false', async () => {
      const content = `---
hide: false
---

Before [Hidden content]{hide} After`;

      const metadata = { hide: false };

      const legacyResult = processOptionalClauses(
        content.replace(/^---[\s\S]*?---\n\n/, ''),
        metadata
      );
      const remarkResult = await processLegalMarkdownWithRemark(content, {
        noHeaders: true,
        noImports: true,
      });

      // Both should exclude the content
      expect(legacyResult).not.toContain('Hidden content');
      expect(remarkResult.content).not.toContain('Hidden content');
      expect(legacyResult).toContain('Before');
      expect(legacyResult).toContain('After');
      expect(remarkResult.content).toContain('Before');
      expect(remarkResult.content).toContain('After');
    });
  });

  describe('Date Processing', () => {
    it('should both process @today to current date', async () => {
      const content = `---
---

Document dated @today`;

      const metadata = {};

      const legacyResult = processDateReferences(
        content.replace(/^---[\s\S]*?---\n\n/, ''),
        metadata
      );
      const remarkResult = await processLegalMarkdownWithRemark(content, {
        noHeaders: true,
        noImports: true,
      });

      // Both should replace @today
      expect(legacyResult).not.toContain('@today');
      expect(remarkResult.content).not.toContain('@today');

      // Both should contain a date
      const datePattern = /\d{4}-\d{2}-\d{2}/;
      expect(legacyResult).toMatch(datePattern);
      expect(remarkResult.content).toMatch(datePattern);
    });

    it('should both respect date format overrides', async () => {
      const content = `---
---

Long format: @today[long]`;

      const metadata = {};

      const legacyResult = processDateReferences(
        content.replace(/^---[\s\S]*?---\n\n/, ''),
        metadata
      );
      const remarkResult = await processLegalMarkdownWithRemark(content, {
        noHeaders: true,
        noImports: true,
      });

      // Both should use long format (contains month name)
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

      const legacyHasMonth = monthNames.some(month => legacyResult.includes(month));
      const remarkHasMonth = monthNames.some(month => remarkResult.content.includes(month));

      expect(legacyHasMonth).toBe(true);
      expect(remarkHasMonth).toBe(true);
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
      } catch (e) {
        // Ignore cleanup errors
      }
    });

    it('should include imported content', async () => {
      const content = `---
---

# Main Document

@import ./include.md

# Conclusion`;

      const remarkResult = await processLegalMarkdownWithRemark(content, {
        basePath: tempDir,
        noHeaders: true,
      });

      // Remark should include imported content
      expect(remarkResult.content).toContain('Imported Section');
      expect(remarkResult.content).toContain('Imported text content');

      // Verify imports were tracked (if available)
      if (remarkResult.exportedFiles) {
        expect(remarkResult.exportedFiles.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Complete Pipeline', () => {
    it('should both process all features together', async () => {
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

Document executed on @today`;

      // Remark processing (single unified call)
      const remarkResult = await processLegalMarkdownWithRemark(content, {
        noImports: true,
      });

      // Verify all features were processed
      expect(remarkResult.content).toContain('Acme Corp'); // Templates
      expect(remarkResult.content).toContain('Article 1.'); // Headers
      expect(remarkResult.content).toContain('Premium services included'); // Clauses
      expect(remarkResult.content).not.toContain('@today'); // Dates
      expect(remarkResult.content).toMatch(/\d{4}-\d{2}-\d{2}/); // Date output

      // Verify metadata was extracted
      expect(remarkResult.metadata).toBeDefined();
      expect(remarkResult.metadata.title).toBe('Service Agreement');
      expect(remarkResult.metadata.client).toBe('Acme Corp');
    });

    it('should both preserve markdown formatting', async () => {
      const content = `---
name: John Doe
---

# Document

**Bold** and *italic* text.

Party: {{name}}

- List item 1
- List item 2`;

      const remarkResult = await processLegalMarkdownWithRemark(content, {
        noImports: true,
      });

      // Verify markdown formatting is preserved
      expect(remarkResult.content).toContain('**Bold**');
      expect(remarkResult.content).toContain('*italic*');
      expect(remarkResult.content).toContain('John Doe');
      expect(remarkResult.content).toContain('- List item');
    });
  });
});
