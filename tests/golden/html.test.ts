/**
 * @fileoverview Golden tests for HTML rendering
 *
 * These tests snapshot the exact HTML body structure produced by generateHtml
 * for markdown constructs that are sensitive to upgrades in marked, cheerio, or remark.
 *
 * Snapshots live in tests/golden/html-snapshots/ and are committed to the repo.
 * Regenerate with: UPDATE_GOLDEN=1 npx vitest run tests/golden/html.test.ts
 *
 * What these catch:
 * - Nested list rendering changes (marked v16 changed this)
 * - Table wrapper injection (cheerio DOM transforms)
 * - Blockquote nesting
 * - Code block syntax highlighting structure
 * - Blank line / paragraph separation
 */

import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { describe, it, expect } from 'vitest';
import { generateHtml } from '../../src/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const snapshotDir = path.join(__dirname, 'html-snapshots');

/**
 * Extract only the <body> content for stable snapshot comparisons.
 * Strips <head> / <style> so CSS changes don't invalidate structure snapshots.
 */
function extractBody(html: string): string {
  const $ = cheerio.load(html);
  return ($('body').html() ?? '').trim();
}

describe('HTML rendering golden tests', () => {
  it('nested lists', async () => {
    const md = [
      '- Item 1',
      '  - Nested 1.1',
      '  - Nested 1.2',
      '    - Deep 1.2.1',
      '- Item 2',
      '',
      '1. First',
      '2. Second',
      '   1. Second.1',
      '   2. Second.2',
    ].join('\n');

    const body = extractBody(await generateHtml(md, { title: 'Nested Lists' }));
    await expect(body).toMatchFileSnapshot(path.join(snapshotDir, 'nested-lists.html'));
  });

  it('tables', async () => {
    const md = [
      '| Col A | Col B | Col C |',
      '|-------|-------|-------|',
      '| 1     | 2     | 3     |',
      '| 4     | 5     | 6     |',
    ].join('\n');

    const body = extractBody(await generateHtml(md, { title: 'Table' }));
    await expect(body).toMatchFileSnapshot(path.join(snapshotDir, 'tables.html'));
  });

  it('blockquotes', async () => {
    const md = [
      '> Simple blockquote.',
      '',
      '> Multi-line',
      '> blockquote continues.',
    ].join('\n');

    const body = extractBody(await generateHtml(md, { title: 'Blockquotes' }));
    await expect(body).toMatchFileSnapshot(path.join(snapshotDir, 'blockquotes.html'));
  });

  it('code blocks', async () => {
    const md = [
      'Inline `code` here.',
      '',
      '```javascript',
      'const x = 42;',
      "const y = 'hello';",
      '```',
    ].join('\n');

    const body = extractBody(await generateHtml(md, { title: 'Code Blocks' }));
    await expect(body).toMatchFileSnapshot(path.join(snapshotDir, 'code-blocks.html'));
  });

  it('blank lines between paragraphs', async () => {
    const md = [
      'First paragraph.',
      '',
      'Second paragraph after blank line.',
      '',
      'Third paragraph.',
    ].join('\n');

    const body = extractBody(await generateHtml(md, { title: 'Paragraphs' }));
    await expect(body).toMatchFileSnapshot(path.join(snapshotDir, 'paragraphs.html'));
  });
});
