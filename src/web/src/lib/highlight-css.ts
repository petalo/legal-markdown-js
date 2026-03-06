import highlightCSS from '../../../styles/highlight.css?raw';

/**
 * Ensure highlight styles are present whenever field tracking is enabled.
 * Users can edit CSS presets in the playground; this keeps tracked fields
 * visible even if highlight rules were accidentally removed.
 */
export function ensureHighlightCss(css: string, enableFieldTracking: boolean): string {
  if (!enableFieldTracking) {
    return css;
  }

  if (css.includes('.legal-field.highlight')) {
    return css;
  }

  return `${css}\n\n/* Field highlighting (auto-injected) */\n${highlightCSS}`;
}
