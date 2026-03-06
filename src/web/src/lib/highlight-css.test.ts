import { describe, it, expect } from 'vitest';
import { ensureHighlightCss } from './highlight-css';

describe('ensureHighlightCss', () => {
  it('returns original css when tracking is disabled', () => {
    const css = 'body { color: black; }';
    expect(ensureHighlightCss(css, false)).toBe(css);
  });

  it('injects highlight css when tracking is enabled and css lacks highlight rules', () => {
    const css = 'body { color: black; }';
    const result = ensureHighlightCss(css, true);
    expect(result).toContain('body { color: black; }');
    expect(result).toContain('Field highlighting (auto-injected)');
    expect(result).not.toBe(css);
  });

  it('does not inject duplicate highlight css when rule already exists', () => {
    const css = 'body { color: black; }\n.legal-field.highlight { background: yellow; }';
    const result = ensureHighlightCss(css, true);
    expect(result).toBe(css);
  });
});
