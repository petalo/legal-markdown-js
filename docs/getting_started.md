# Getting Started

This guide will help you get up and running with Legal Markdown JS, from
installation to creating your first legal document.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Setup](#quick-setup)
- [Your First Document](#your-first-document)
- [Basic Usage](#basic-usage)
- [Common Use Cases](#common-use-cases)
- [Configuration](#configuration)
- [File Formats](#file-formats)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

## Prerequisites

- Node.js >= 18.0.0
- npm >= 7.0.0

Check your versions:

```bash
node --version
npm --version
```

## Installation

### Global Installation (Recommended for CLI usage)

```bash
npm install -g legal-markdown-js
```

After global installation, you can use the CLI anywhere:

```bash
legal-md --version
```

### Local Installation (For project integration)

```bash
# In your project directory
npm install legal-markdown-js

# Or as a dev dependency
npm install --save-dev legal-markdown-js
```

### Verify Installation

```bash
# Global installation
legal-md --help

# Local installation
npx legal-md --help
```

## Quick Setup

### Create Your First Document

Create a file called `agreement.md`:

```markdown
---
title: Service Agreement
client:
  name: Acme Corporation
  address: 123 Business Street, City, State 12345
provider:
  name: Professional Services LLC
  address: 456 Service Avenue, City, State 67890
effective_date: 2024-01-01
payment_terms: 30
---

# {{title}}

This Service Agreement ("Agreement") is entered into on {{effective_date}}
between:

**CLIENT**: {{client.name}} Address: {{client.address}}

**PROVIDER**: {{provider.name}} Address: {{provider.address}}

l. Services ll. Scope of Work The Provider agrees to perform professional
services as detailed in Schedule A.

ll. Payment Terms Payment is due within {{payment_terms}} days of invoice date.

l. Term and Termination This Agreement shall commence on {{effective_date}} and
continue until terminated.
```

### Process Your Document

```bash
# Basic processing
legal-md agreement.md processed-agreement.md

# Generate PDF
legal-md agreement.md --pdf

# Generate HTML with highlighting
legal-md agreement.md --html --highlight
```

## Your First Document

Let's walk through creating a complete legal document step by step.

### Step 1: YAML Front Matter

Every legal document starts with YAML front matter containing metadata and
variables:

```yaml
---
title: Software License Agreement
parties:
  - name: TechCorp Inc.
    type: Corporation
    role: Licensor
  - name: Client LLC
    type: LLC
    role: Licensee
effective_date: 2024-01-01
jurisdiction: California
license_fee: 5000
support_included: true
---
```

### Step 2: Document Structure

Use the hierarchical numbering system for legal structure:

```markdown
l. Definitions ll. Software "Software" means the computer program licensed under
this Agreement.

ll. License "License" means the terms and conditions set forth herein.

l. Grant of License ll. Rights Granted Subject to the terms of this Agreement,
Licensor grants Licensee a license to use the Software.

ll. Restrictions Licensee may not distribute, modify, or reverse engineer the
Software.

l. Payment The license fee is ${{license_fee}}, payable upon execution of this
Agreement.

[Premium support is included for the first year.]{support_included}

l. Governing Law This Agreement shall be governed by the laws of
{{jurisdiction}}.
```

### Step 3: Processing

```bash
# Process the document
legal-md license.md processed-license.md

# Generate PDF with highlighting for review
legal-md license.md --pdf --highlight --title "Software License Agreement"
```

## Basic Usage

### Command Line Interface

```bash
# Basic processing
legal-md input.md output.md

# With options
legal-md input.md output.md --debug --export-yaml

# Generate different formats
legal-md input.md --pdf --html --highlight

# Process from stdin
cat input.md | legal-md --stdin --stdout
```

### Programmatic Usage

```typescript
import {
  processLegalMarkdown,
  processLegalMarkdownWithRemark,
} from 'legal-markdown-js';

// Basic processing (legacy)
const result = processLegalMarkdown(content);
console.log(result.content);

// Remark-based processing (recommended for new projects)
const remarkResult = await processLegalMarkdownWithRemark(content, {
  basePath: './documents',
  enableFieldTracking: true,
  debug: false,
});

console.log(remarkResult.content);
console.log(remarkResult.metadata);
console.log(remarkResult.fieldReport);

// With options (legacy)
const result = processLegalMarkdown(content, {
  basePath: './documents',
  exportMetadata: true,
  exportFormat: 'json',
  enableFieldTracking: true,
});

console.log(result.content);
console.log(result.metadata);
console.log(result.fieldReport);
```

## Common Use Cases

### Contract Generation

```markdown
---
contract_type: Service Agreement
parties:
  client: Acme Corp
  provider: Professional Services LLC
payment_terms: 30
confidentiality_required: true
---

# {{contract_type}}

This {{contract_type}} is between {{parties.client}} and {{parties.provider}}.

l. Payment Terms Payment is due within {{payment_terms}} days.

[l. Confidentiality Both parties agree to maintain
confidentiality.]{confidentiality_required}
```

### Legal Briefs

```markdown
---
case_name: Smith v. Jones
court: Superior Court of California
filing_date: 2024-01-15
attorney:
  name: Jane Legal
  bar_number: 12345
---

# Brief in Support of Motion to Dismiss

## Case No. {{case_name}}

**TO THE HONORABLE COURT:**

Defendant respectfully submits this brief in support of the Motion to Dismiss
filed on {{filing_date}}.

l. Introduction ll. Statement of Facts ll. Argument

l. Conclusion For the foregoing reasons, the Court should grant Defendant's
Motion to Dismiss.

Respectfully submitted, {{attorney.name}} State Bar No. {{attorney.bar_number}}
```

### Policy Documents

```markdown
---
company: TechCorp Inc.
policy_type: Privacy Policy
effective_date: 2024-01-01
data_retention_days: 365
gdpr_applicable: true
---

# {{company}} {{policy_type}}

Effective Date: {{effective_date}}

l. Information We Collect ll. Personal Information ll. Usage Data

l. How We Use Information We use collected information to provide and improve
our services.

l. Data Retention We retain personal data for {{data_retention_days}} days.

[l. GDPR Rights EU residents have additional rights under
GDPR.]{gdpr_applicable}
```

## Configuration

### Global Configuration

Create a `.legalmd` file in your home directory:

```yaml
default_options:
  debug: false
  export_format: json
  enable_field_tracking: true

output_formats:
  pdf:
    format: Letter
    margins: 1in
  html:
    include_highlighting: true

template_paths:
  - ~/legal-templates
  - ./templates
```

### Project Configuration

Create a `legal-markdown.config.js` file:

```javascript
module.exports = {
  basePath: './documents',
  exportMetadata: true,
  exportFormat: 'json',
  enableFieldTracking: true,
  pdfOptions: {
    format: 'A4',
    margins: '1in',
  },
  htmlOptions: {
    includeHighlighting: true,
    cssPath: './styles/legal.css',
  },
};
```

## File Formats

Legal Markdown JS supports multiple input formats:

### Markdown (.md)

```markdown
# Document Title

Standard markdown with legal extensions.
```

### reStructuredText (.rst)

```rst
Document Title
==============

Standard reStructuredText that gets converted to legal markdown.
```

### LaTeX (.tex)

```latex
\documentclass{article}
\title{Document Title}
\begin{document}
\section{Introduction}
LaTeX content converted to legal markdown.
\end{document}
```

### Plain Text (.txt)

```text
Document Title
==============

Plain text with legal markdown syntax.
```

## Troubleshooting

### Common Issues

#### Installation Problems

```bash
# Clear npm cache
npm cache clean --force

# Reinstall
npm uninstall -g legal-markdown-js
npm install -g legal-markdown-js
```

#### Permission Errors

```bash
# Use sudo (macOS/Linux)
sudo npm install -g legal-markdown-js

# Or use npx for local usage
npx legal-markdown-js input.md output.md
```

#### Path Issues

```bash
# Verify installation
which legal-md

# Check PATH
echo $PATH

# Use full path if needed
$(npm bin -g)/legal-md input.md output.md
```

### Debug Mode

Use debug mode to troubleshoot processing issues:

```bash
legal-md --debug input.md output.md
```

This will show:

- File processing steps
- YAML parsing results
- Header processing details
- Reference resolution
- Error messages with stack traces

### Validation

Validate your document structure:

```bash
# Check YAML front matter
legal-md --yaml input.md

# Check headers only
legal-md --headers input.md

# Export metadata for inspection
legal-md --export-json input.md
```

### Common Error Messages

#### "YAML front matter not found"

- Ensure your document starts with `---`
- Check YAML syntax with online validators

#### "Reference not found: |variable|"

- Verify the variable is defined in YAML front matter
- Check for typos in variable names

#### "Invalid header syntax"

- Ensure proper `l.`, `ll.`, `lll.` format
- Check for missing spaces after dots

## Next Steps

Now that you have Legal Markdown JS set up, explore these resources:

- **[CLI Reference](cli_reference.md)** - Complete command-line documentation
- **[Features Guide](features_guide.md)** - Advanced features and helpers
- **[Headers & Numbering](headers_numbering.md)** - Detailed numbering system
  guide
- **[Examples](../examples/)** - Real-world document templates

### Learn More

- Study the example documents in the `examples/` directory
- Experiment with different numbering formats
- Try the mixins system for dynamic content
- Explore PDF generation with custom styling
- Set up batch processing for multiple documents

### Get Help

- Check the [troubleshooting section](#troubleshooting) above
- Review the [CLI Reference](cli_reference.md) for command options
- Consult the [Features Guide](features_guide.md) for advanced usage
- Open an issue on GitHub for bug reports or feature requests
