# Configuration

Comprehensive configuration options for Legal Markdown JS including global
settings, project-specific configuration, and environment variables.

## Table of Contents

- [Overview](#overview)
- [Global Configuration](#global-configuration)
- [Project Configuration](#project-configuration)
- [Environment Variables](#environment-variables)
- [Configuration Hierarchy](#configuration-hierarchy)
- [Common Configurations](#common-configurations)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Legal Markdown JS supports multiple levels of configuration:

1. **Global Configuration** - System-wide defaults via `.legalmdrc`
2. **Project Configuration** - Project-specific settings via config files
3. **Document Configuration** - Document-level settings via YAML frontmatter
4. **Command Line Options** - Runtime overrides via CLI flags
5. **Environment Variables** - Environment-specific settings

Configuration is applied in order of precedence (highest to lowest): CLI Options
→ Document YAML → Project Config → Global Config → Defaults

## Global Configuration

### Creating Global Configuration

Create `.legalmdrc` file in your home directory for system-wide defaults:

```json
{
  "defaultOptions": {
    "debug": false,
    "exportFormat": "json",
    "enableFieldTracking": true,
    "includeHighlighting": false
  },
  "outputFormats": {
    "pdf": {
      "format": "Letter",
      "margins": "1in",
      "displayHeaderFooter": false
    },
    "html": {
      "includeHighlighting": true,
      "responsive": true
    }
  },
  "templatePaths": [
    "~/legal-templates",
    "./templates",
    "/usr/local/share/legal-markdown/templates"
  ],
  "stylePaths": ["~/legal-styles", "./styles"],
  "helpers": {
    "enabled": true,
    "customHelpersPath": "~/legal-helpers"
  }
}
```

### Global Configuration Options

| Section          | Option                | Type    | Description                         |
| ---------------- | --------------------- | ------- | ----------------------------------- |
| `defaultOptions` | `debug`               | boolean | Enable debug output globally        |
|                  | `exportFormat`        | string  | Default metadata export format      |
|                  | `enableFieldTracking` | boolean | Enable field tracking by default    |
| `outputFormats`  | `pdf`                 | object  | Default PDF generation options      |
|                  | `html`                | object  | Default HTML generation options     |
| `templatePaths`  |                       | array   | Directories to search for templates |
| `stylePaths`     |                       | array   | Directories to search for CSS files |

### Alternative Global Config Formats

#### YAML Format (`.legalmdrc.yml`)

```yaml
defaultOptions:
  debug: false
  exportFormat: json
  enableFieldTracking: true

outputFormats:
  pdf:
    format: Letter
    margins: 1in
  html:
    includeHighlighting: true

templatePaths:
  - ~/legal-templates
  - ./templates

stylePaths:
  - ~/legal-styles
  - ./styles
```

#### JavaScript Format (`.legalmdrc.js`)

```javascript
module.exports = {
  defaultOptions: {
    debug: process.env.NODE_ENV === 'development',
    exportFormat: 'json',
    enableFieldTracking: true,
  },

  outputFormats: {
    pdf: {
      format: 'Letter',
      margins: '1in',
    },
    html: {
      includeHighlighting: true,
    },
  },

  templatePaths: [
    require('path').join(require('os').homedir(), 'legal-templates'),
    './templates',
  ],

  // Dynamic configuration
  helpers: {
    customDate: () => new Date().toISOString().split('T')[0],
  },
};
```

## Project Configuration

### Project Config File

Create `legal-markdown.config.js` in your project root:

```javascript
module.exports = {
  // Base directory for relative paths
  basePath: './documents',

  // Metadata options
  exportMetadata: true,
  exportFormat: 'json',
  metadataOutputPath: './metadata',

  // Processing options
  enableFieldTracking: true,
  enableCrossReferences: true,
  processImports: true,

  // Output format configurations
  pdfOptions: {
    format: 'A4',
    margins: '1in',
    landscape: false,
    includeHighlighting: false,
    cssPath: './styles/pdf.css',
  },

  htmlOptions: {
    includeHighlighting: true,
    responsive: true,
    cssPath: './styles/html.css',
    customTemplate: './templates/document.html',
  },

  // Custom helpers
  helpers: {
    companyName: () => 'Legal Services LLC',
    currentYear: () => new Date().getFullYear(),
    customFormat: value => value.toUpperCase().replace(/\s+/g, '_'),
  },

  // Template and style paths
  templatePaths: ['./templates', '../shared-templates'],
  stylePaths: ['./styles', '../shared-styles'],

  // Build and deployment
  buildOptions: {
    outputDir: './dist',
    cleanBeforeBuild: true,
    generateIndex: true,
  },

  // Development settings
  development: {
    debug: true,
    watch: true,
    hotReload: true,
  },

  // Production settings
  production: {
    debug: false,
    minifyOutput: true,
    optimizeImages: true,
  },
};
```

### TypeScript Configuration

For TypeScript projects, create `legal-markdown.config.ts`:

```typescript
import { LegalMarkdownConfig } from 'legal-markdown-js';

const config: LegalMarkdownConfig = {
  basePath: './src/documents',
  exportMetadata: true,
  enableFieldTracking: true,

  pdfOptions: {
    format: 'A4',
    margins: '25mm',
    includeHighlighting: false,
  },

  htmlOptions: {
    includeHighlighting: true,
    cssPath: './dist/styles/main.css',
  },

  helpers: {
    formatLegalDate: (date: Date): string => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    },
  },
};

export default config;
```

### Package.json Configuration

For simple projects, configure in `package.json`:

```json
{
  "name": "legal-documents",
  "version": "1.0.0",
  "legalMarkdown": {
    "basePath": "./documents",
    "exportFormat": "json",
    "pdfOptions": {
      "format": "Letter",
      "margins": "1in"
    },
    "htmlOptions": {
      "includeHighlighting": true
    }
  }
}
```

## Environment Variables

### Core Environment Variables

```bash
# Processing options
LEGAL_MD_DEBUG=true
LEGAL_MD_FIELD_TRACKING=true
LEGAL_MD_EXPORT_FORMAT=json

# Paths
LEGAL_MD_TEMPLATE_PATH=/usr/local/share/legal-templates
LEGAL_MD_STYLE_PATH=/usr/local/share/legal-styles
LEGAL_MD_OUTPUT_PATH=./output

# PDF options
LEGAL_MD_PDF_FORMAT=A4
LEGAL_MD_PDF_MARGINS=1in

# HTML options
LEGAL_MD_HTML_HIGHLIGHTING=true
LEGAL_MD_HTML_RESPONSIVE=true

# Performance
LEGAL_MD_CONCURRENCY=4
LEGAL_MD_MEMORY_LIMIT=512MB
LEGAL_MD_TIMEOUT=30000
```

### Environment-Specific Configuration

#### Development Environment

```bash
# .env.development
NODE_ENV=development
LEGAL_MD_DEBUG=true
LEGAL_MD_FIELD_TRACKING=true
LEGAL_MD_LOG_LEVEL=debug
LEGAL_MD_WATCH_MODE=true
```

#### Production Environment

```bash
# .env.production
NODE_ENV=production
LEGAL_MD_DEBUG=false
LEGAL_MD_FIELD_TRACKING=false
LEGAL_MD_LOG_LEVEL=error
LEGAL_MD_OPTIMIZE_OUTPUT=true
LEGAL_MD_CACHE_ENABLED=true
```

#### CI/CD Environment

```bash
# .env.ci
NODE_ENV=test
LEGAL_MD_DEBUG=false
LEGAL_MD_FIELD_TRACKING=true
LEGAL_MD_VALIDATION_STRICT=true
LEGAL_MD_FAIL_ON_ERROR=true
LEGAL_MD_GENERATE_REPORTS=true
```

### Loading Environment Variables

```javascript
// legal-markdown.config.js
require('dotenv').config();

module.exports = {
  debug: process.env.LEGAL_MD_DEBUG === 'true',
  enableFieldTracking: process.env.LEGAL_MD_FIELD_TRACKING !== 'false',

  pdfOptions: {
    format: process.env.LEGAL_MD_PDF_FORMAT || 'A4',
    margins: process.env.LEGAL_MD_PDF_MARGINS || '1in',
  },

  // Environment-specific helpers
  helpers: {
    buildInfo: () => ({
      environment: process.env.NODE_ENV,
      buildDate: new Date().toISOString(),
      version: process.env.npm_package_version,
    }),
  },
};
```

## Configuration Hierarchy

### Precedence Order

1. **CLI Arguments** (highest precedence)

   ```bash
   legal-md --pdf --format A4 --margins 1in document.md
   ```

2. **Force Commands** (document-level overrides)

   ```yaml
   ---
   force_commands: '--pdf --format Letter --css custom.css'
   ---
   ```

3. **Document YAML Frontmatter**

   ```yaml
   ---
   pdf_format: A4
   css_path: ./styles/document.css
   ---
   ```

4. **Project Configuration File**

   ```javascript
   // legal-markdown.config.js
   module.exports = {
     pdfOptions: { format: 'Letter' },
   };
   ```

5. **Global Configuration File**

   ```json
   // ~/.legalmdrc
   {
     "outputFormats": {
       "pdf": { "format": "A4" }
     }
   }
   ```

6. **Environment Variables**

   ```bash
   LEGAL_MD_PDF_FORMAT=Letter
   ```

7. **Built-in Defaults** (lowest precedence)

### Configuration Merging

```javascript
// Example configuration merging
const finalConfig = {
  // Defaults
  format: 'A4',
  margins: '1in',

  // Overridden by environment
  format: process.env.LEGAL_MD_PDF_FORMAT || 'A4',

  // Overridden by global config
  ...globalConfig.outputFormats.pdf,

  // Overridden by project config
  ...projectConfig.pdfOptions,

  // Overridden by document YAML
  ...documentYaml.pdfOptions,

  // Overridden by CLI args
  ...cliOptions,
};
```

## Common Configurations

### Legal Firm Configuration

```javascript
// legal-markdown.config.js
module.exports = {
  basePath: './contracts',

  // Firm branding
  defaultMetadata: {
    firm_name: 'Smith & Associates Legal',
    firm_address: '123 Legal Street, Law City, LC 12345',
    firm_phone: '+1-555-LAW-FIRM',
  },

  pdfOptions: {
    format: 'Letter',
    margins: '1in',
    cssPath: './styles/firm-letterhead.css',
    displayHeaderFooter: true,
  },

  htmlOptions: {
    cssPath: './styles/firm-web.css',
    includeHighlighting: true,
  },

  helpers: {
    firmLetterhead: () => 'Smith & Associates Legal Services',
    currentDate: () => new Date().toLocaleDateString('en-US'),
    contractNumber: () => `CONT-${Date.now()}`,
  },

  templatePaths: ['./templates/contracts', './templates/legal'],
  stylePaths: ['./styles/firm', './styles/legal'],
};
```

### Academic Institution Configuration

```javascript
module.exports = {
  basePath: './research-papers',

  defaultMetadata: {
    institution: 'University of Legal Studies',
    department: 'Department of Legal Technology',
  },

  pdfOptions: {
    format: 'A4',
    margins: '1in',
  },

  // Academic header format
  headerFormats: {
    'level-one': '%l1.',
    'level-two': '%l1.%l2',
    'level-three': '%l1.%l2.%l3',
  },

  helpers: {
    academicDate: date =>
      date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    citation: (author, year, title) => `${author} (${year}). ${title}.`,
  },
};
```

### Corporate Configuration

```javascript
module.exports = {
  basePath: './corporate-docs',

  // Corporate branding
  defaultMetadata: {
    company: 'Acme Corporation',
    company_legal: 'Acme Corporation Inc.',
    logo: 'acme-logo.png',
  },

  pdfOptions: {
    format: 'Letter',
    margins: '0.75in',
    cssPath: './styles/corporate.css',
  },

  // Multiple output formats
  buildTargets: ['pdf', 'html', 'docx'],

  helpers: {
    companyHeader: () => 'ACME CORPORATION',
    documentId: () =>
      `ACME-DOC-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    approvalDate: () => new Date().toISOString().split('T')[0],
  },
};
```

### Multi-Language Configuration

```javascript
module.exports = {
  basePath: './documents',

  // Language-specific settings
  locales: {
    en: {
      dateFormat: 'MM/DD/YYYY',
      currencyFormat: 'USD',
      headerFormats: {
        'level-one': 'Article %n.',
        'level-two': 'Section %n.',
      },
    },
    es: {
      dateFormat: 'DD/MM/YYYY',
      currencyFormat: 'EUR',
      headerFormats: {
        'level-one': 'Artículo %n.',
        'level-two': 'Sección %n.',
      },
    },
  },

  helpers: {
    localizedDate: (date, locale = 'en') => {
      const options = module.exports.locales[locale];
      return formatDate(date, options.dateFormat);
    },
  },
};
```

## Best Practices

### 1. Environment Separation

```javascript
// legal-markdown.config.js
const baseConfig = {
  basePath: './documents',
  templatePaths: ['./templates'],
};

const environments = {
  development: {
    ...baseConfig,
    debug: true,
    enableFieldTracking: true,
    outputPath: './dev-output',
  },

  production: {
    ...baseConfig,
    debug: false,
    enableFieldTracking: false,
    outputPath: './dist',
    optimizeOutput: true,
  },

  test: {
    ...baseConfig,
    debug: false,
    enableFieldTracking: true,
    outputPath: './test-output',
    strictValidation: true,
  },
};

module.exports = environments[process.env.NODE_ENV] || environments.development;
```

### 2. Modular Configuration

```javascript
// config/base.js
module.exports = {
  basePath: './documents',
  enableFieldTracking: true,
};

// config/pdf.js
module.exports = {
  format: 'Letter',
  margins: '1in',
  includeHighlighting: false,
};

// config/html.js
module.exports = {
  includeHighlighting: true,
  responsive: true,
};

// legal-markdown.config.js
const baseConfig = require('./config/base');
const pdfConfig = require('./config/pdf');
const htmlConfig = require('./config/html');

module.exports = {
  ...baseConfig,
  pdfOptions: pdfConfig,
  htmlOptions: htmlConfig,
};
```

### 3. Configuration Validation

```javascript
// legal-markdown.config.js
const Joi = require('joi');

const configSchema = Joi.object({
  basePath: Joi.string().required(),
  enableFieldTracking: Joi.boolean().default(true),
  pdfOptions: Joi.object({
    format: Joi.string().valid('A4', 'Letter', 'Legal').default('A4'),
    margins: Joi.string().default('1in'),
  }),
  helpers: Joi.object().pattern(Joi.string(), Joi.function()),
});

const config = {
  basePath: './documents',
  enableFieldTracking: true,
  pdfOptions: {
    format: 'A4',
    margins: '1in',
  },
};

const { error, value: validatedConfig } = configSchema.validate(config);
if (error) {
  throw new Error(`Configuration validation failed: ${error.message}`);
}

module.exports = validatedConfig;
```

### 4. Documentation Configuration

```javascript
// Include configuration documentation
module.exports = {
  /**
   * Base directory for all document processing operations.
   * All relative paths will be resolved relative to this directory.
   */
  basePath: './documents',

  /**
   * Enable field tracking for document completeness analysis.
   * Recommended for development and review workflows.
   */
  enableFieldTracking: true,

  /**
   * PDF generation options.
   * Used when generating PDF output from legal documents.
   */
  pdfOptions: {
    format: 'Letter', // Page format: A4, Letter, Legal
    margins: '1in', // Page margins (CSS units)
    includeHighlighting: false, // Disable highlighting in final PDFs
  },
};
```

### 5. Security Considerations

```javascript
module.exports = {
  // Restrict template paths to prevent directory traversal
  templatePaths: [
    path.resolve('./templates'),
    path.resolve('./shared-templates'),
  ],

  // Disable potentially dangerous features in production
  allowArbitraryCode: process.env.NODE_ENV !== 'production',

  // Sanitize user inputs
  sanitizeInputs: true,

  // Limit resource usage
  maxFileSize: '10MB',
  maxProcessingTime: 30000,

  // Security headers for HTML output
  htmlOptions: {
    addSecurityHeaders: true,
    contentSecurityPolicy: "default-src 'self'",
  },
};
```

## Troubleshooting

### Configuration Issues

#### Config File Not Found

```bash
# Check configuration file locations
legal-md --show-config

# Use specific config file
legal-md --config ./custom-config.js document.md

# Debug configuration loading
legal-md --debug-config document.md
```

#### Configuration Validation Errors

```javascript
// Add validation to catch errors early
try {
  const config = require('./legal-markdown.config.js');
  validateConfig(config);
} catch (error) {
  console.error('Configuration error:', error.message);
  process.exit(1);
}
```

#### Environment Variable Issues

```bash
# Check environment variables
legal-md --show-env

# Test environment variable loading
LEGAL_MD_DEBUG=true legal-md --show-config document.md
```

### Common Fixes

**Configuration not taking effect:**

- Check configuration precedence order
- Verify file paths are correct
- Use `--show-config` to debug

**Environment variables ignored:**

- Ensure proper variable names
- Check for typos in variable names
- Verify environment is loading correctly

**Template/style paths not working:**

- Use absolute paths when possible
- Check file permissions
- Verify directory structure

## See Also

- [Best Practices](best-practices.md) - Configuration best practices
- [Error Handling](error-handling.md) - Configuration error handling
- [Batch Processing](batch-processing.md) - Batch configuration options
- [CLI Reference](../cli_reference.md) - Command line configuration options
