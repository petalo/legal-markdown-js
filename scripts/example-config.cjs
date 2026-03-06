#!/usr/bin/env node

/**
 * Example configuration - shared by generate-readmes.cjs and generate-run-scripts.cjs.
 *
 * Each key is a relative path under examples/ (category/example-name).
 * - name: human-readable title used in generated run.sh scripts
 * - processingType: selects the shell template in generate-run-scripts.cjs
 *   (basic | metadata | tracking | pdf | export | cli)
 */
const EXAMPLE_CONFIG = {
  'basic-processing/simple-document': {
    name: 'Simple Document',
    processingType: 'basic',
  },
  'basic-processing/yaml-frontmatter': {
    name: 'YAML Frontmatter',
    processingType: 'metadata',
  },
  'headers/multiple-headers': {
    name: 'Multiple Headers',
    processingType: 'basic',
  },
  'headers/mixed-header-styles': {
    name: 'Mixed Header Styles',
    processingType: 'basic',
  },
  'headers/header-tracking': {
    name: 'Header Field Tracking',
    processingType: 'tracking',
  },
  'cross-references/basic-references': {
    name: 'Basic Cross References',
    processingType: 'metadata',
  },
  'optional-clauses/conditional-content': {
    name: 'Conditional Content',
    processingType: 'basic',
  },
  'optional-clauses/boolean-logic': {
    name: 'Boolean Logic',
    processingType: 'basic',
  },
  'mixins/helper-functions': {
    name: 'Helper Functions',
    processingType: 'metadata',
  },
  'mixins/template-loops': {
    name: 'Template Loops',
    processingType: 'basic',
  },
  'imports/partial-imports': {
    name: 'Partial Imports',
    processingType: 'basic',
  },
  'output-formats/pdf-generation': {
    name: 'PDF Generation',
    processingType: 'pdf',
  },
  'output-formats/metadata-export': {
    name: 'Metadata Export',
    processingType: 'export',
  },
  'advanced/office-lease-complete': {
    name: 'Office Lease Agreement',
    processingType: 'pdf',
  },
  'advanced/complex-nda': {
    name: 'Complex NDA',
    processingType: 'pdf',
  },
  'integration/cli-usage': {
    name: 'CLI Usage',
    processingType: 'cli',
  },
};

module.exports = { EXAMPLE_CONFIG };
