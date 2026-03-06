import defaultCSS from '../../../styles/default.css?raw';
import highlightCSS from '../../../styles/highlight.css?raw';

export interface CSSPreset {
  label: string;
  css: string;
}

function withHighlight(css: string): string {
  return `${css}\n\n/* Field highlighting */\n${highlightCSS}`;
}

export const CSS_PRESETS: Record<string, CSSPreset> = {
  default: {
    label: 'Default Legal Styles',
    css: withHighlight(defaultCSS),
  },
  classic: {
    label: 'Classic Legal',
    css: withHighlight(`/* Classic Legal Document */
.preview-container {
  font-family: 'Times New Roman', serif;
  line-height: 1.8;
  color: #000;
}

h1, .legal-header-level-1 {
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 2px;
  border-bottom: double 3px #000;
  padding-bottom: 15px;
}

h2, .legal-header-level-2 {
  font-variant: small-caps;
  border-bottom: 1px solid #666;
  margin-top: 2em;
}

h3, .legal-header-level-3 {
  font-variant: small-caps;
  border-bottom: 1px dotted #999;
  margin-top: 1.5em;
  font-size: 1.1em;
}

h4, .legal-header-level-4 {
  font-style: italic;
  margin-top: 1.2em;
  font-size: 1em;
}

p {
  text-align: justify;
  text-indent: 2em;
  margin-bottom: 1em;
}`),
  },
  minimal: {
    label: 'Minimal',
    css: withHighlight(`/* Minimal Style */
.preview-container {
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.7;
  color: #333;
  max-width: none;
}

h1, .legal-header-level-1 {
  font-size: 1.8em;
  font-weight: 600;
  color: #000;
  border: none;
  margin-bottom: 2em;
}

h2, .legal-header-level-2 {
  font-size: 1.3em;
  font-weight: 500;
  color: #555;
  border: none;
  margin-top: 2.5em;
  margin-bottom: 1em;
}

h3, .legal-header-level-3 {
  font-size: 1.1em;
  font-weight: 500;
  color: #666;
  border: none;
  margin-top: 2em;
  margin-bottom: 0.8em;
}

h4, .legal-header-level-4 {
  font-size: 1em;
  font-weight: 500;
  color: #777;
  border: none;
  margin-top: 1.5em;
  margin-bottom: 0.6em;
}

p {
  margin-bottom: 1.2em;
  text-align: left;
}`),
  },
};

export const DEFAULT_CSS_KEY = 'default';

export const CSS_PRESET_OPTIONS = Object.entries(CSS_PRESETS).map(([value, { label }]) => ({
  value,
  label,
}));
