/**
 * Legal Markdown CSS Examples
 * Pre-configured CSS styles for the web playground
 * Note: The 'default' style is injected during build from src/styles/default.css
 */

window.LegalMarkdownCSSExamples = {
  // DEFAULT_CSS_PLACEHOLDER - This will be replaced during build

  'modern': `/* Modern Clean Style */
.preview-container {
  font-family: 'Segoe UI', system-ui, sans-serif;
  line-height: 1.6;
  color: #2c3e50;
}

h1, .legal-header-level-1 {
  color: #2980b9;
  border-bottom: 3px solid #3498db;
  padding-bottom: 10px;
  font-weight: 300;
}

h2, .legal-header-level-2 {
  color: #34495e;
  border-left: 4px solid #3498db;
  padding-left: 16px;
  margin-top: 2em;
}

h3, .legal-header-level-3 {
  color: #27ae60;
  border-left: 3px solid #2ecc71;
  padding-left: 12px;
  margin-top: 1.5em;
}

h4, .legal-header-level-4 {
  color: #e67e22;
  border-left: 2px solid #f39c12;
  padding-left: 8px;
  margin-top: 1.2em;
}

p {
  margin-bottom: 1.5em;
  text-align: left;
}`,

  'classic': `/* Classic Legal Document */
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
}`,

  'minimal': `/* Minimal Style */
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
}`
};
