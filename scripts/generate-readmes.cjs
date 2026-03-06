#!/usr/bin/env node

/**
 * README.md Generator for Legal Markdown Examples
 *
 * This script automatically generates comprehensive README.md files for all examples
 * in the examples/ directory. It ensures consistent documentation across all examples
 * and reduces maintenance overhead by using predefined templates.
 *
 * Features:
 * - Automated README generation for all example directories
 * - Consistent formatting and structure across examples
 * - Detailed explanations of what each example demonstrates
 * - File listings with descriptions
 * - Usage instructions and learning resources
 * - Integration with example configuration from migrate-examples.js
 *
 * Usage:
 *   node scripts/generate-readmes.js
 *   npm run generate:readmes
 *
 * The script will:
 * 1. Read the EXAMPLE_CONFIG from migrate-examples.js
 * 2. For each configured example, check if the directory exists
 * 3. Generate a README.md file using the predefined template
 * 4. Write the file to the example directory
 *
 * Templates are stored in README_TEMPLATES object and include:
 * - Example description and purpose
 * - File listings with explanations
 * - Usage instructions
 * - Key features demonstrated
 * - Links to relevant documentation
 *
 * Adding New Examples:
 * 1. Add the example path to EXAMPLE_CONFIG in migrate-examples.js
 * 2. Add a corresponding template in README_TEMPLATES below
 * 3. Run this script to generate the README.md
 *
 */

const fs = require('fs');
const path = require('path');
const { EXAMPLE_CONFIG } = require('./example-config.cjs');

// Templates detallados para README por tipo
const README_TEMPLATES = {
  'basic-processing/simple-document': `# Simple Document Processing

Basic Legal Markdown document processing without any special features. This example demonstrates the core functionality of Legal Markdown processing with minimal configuration.

## 📋 What this example demonstrates

- Basic markdown processing
- YAML front matter parsing
- Simple text formatting
- Clean output generation

## 📁 Files

- **input.md** - Basic Legal Markdown document
- **example.md** - Another simple document example
- **input.output.md** - Processed markdown output
- **input.output.html** - HTML output with styling
- **example.output.md** - Processed example output
- **example.output.html** - HTML output for example

## 🚀 Usage

\`\`\`bash
./run.sh
\`\`\`

## 🔍 Key features shown

1. **Basic Processing**: Simple document processing without complex features
2. **YAML Frontmatter**: Basic metadata parsing and handling
3. **HTML Generation**: Converting processed markdown to styled HTML
4. **File Naming**: Demonstration of .output.* naming convention

## 💡 Learn more

- [Getting Started Guide](../../../docs/getting_started.md)
- [Basic Processing](../../../docs/basic-processing.md)`,

  'basic-processing/yaml-frontmatter': `# YAML Front Matter Processing

Demonstrates YAML front matter parsing and metadata extraction. This example shows how Legal Markdown handles document metadata and separates it from content.

## 📋 What this example demonstrates

- YAML front matter parsing
- Metadata extraction and validation
- Document structure separation
- YAML-only processing mode

## 📁 Files

- **document.md** - Document with YAML frontmatter
- **document.output.md** - Processed document with metadata applied
- **document.output.html** - HTML output with metadata integration
- **document.yaml-only.md** - YAML metadata extraction only

## 🚀 Usage

\`\`\`bash
./run.sh
\`\`\`

## 🔍 Key features shown

1. **YAML Parsing**: Robust YAML frontmatter parsing
2. **Metadata Extraction**: Separating metadata from content
3. **YAML-Only Mode**: Extracting only the YAML metadata
4. **Document Structure**: Understanding document organization

## 💡 Learn more

- [YAML Frontmatter Guide](../../../docs/yaml-frontmatter.md)
- [Metadata Processing](../../../docs/metadata.md)`,

  'headers/multiple-headers': `# Multiple Header Levels

Shows how Legal Markdown processes documents with multiple header levels using the traditional l., ll., lll. syntax.

## 📋 What this example demonstrates

- Traditional header syntax (l., ll., lll.)
- Automatic numbering
- Hierarchical structure
- Header formatting

## 📁 Files

- **contract.md** - Document with multiple header levels
- **contract.output.md** - Processed markdown with numbered headers
- **contract.output.html** - HTML with styled headers

## 🚀 Usage

\`\`\`bash
./run.sh
\`\`\`

## 🔍 Key features shown

1. **Header Syntax**: Traditional l., ll., lll. header format
2. **Automatic Numbering**: Sequential numbering of headers
3. **Hierarchy**: Proper nesting and indentation
4. **Styling**: Professional header formatting in HTML

## 💡 Learn more

- [Header Processing Guide](../../../docs/headers.md)
- [Formatting Options](../../../docs/formatting.md)`,

  'headers/mixed-header-styles': `# Mixed Header Styles

Demonstrates mixing traditional (l., ll.) and alternative (l1., l2.) header syntax in the same document.

## 📋 What this example demonstrates

- Mixed header syntax support
- Alternative numbering (l1., l2.)
- Style consistency
- Format normalization

## 📁 Files

- **document.md** - Document with mixed header styles
- **document.output.md** - Normalized header output
- **document.output.html** - Consistently styled headers

## 🚀 Usage

\`\`\`bash
./run.sh
\`\`\`

## 🔍 Key features shown

1. **Mixed Syntax**: Supporting both traditional and alternative formats
2. **Normalization**: Converting to consistent output format
3. **Flexibility**: Accommodating different input styles
4. **Consistency**: Uniform output regardless of input variation

## 💡 Learn more

- [Header Syntax Guide](../../../docs/headers.md)
- [Style Mixing](../../../docs/advanced-headers.md)`,

  'headers/header-tracking': `# Header Field Tracking

Shows field tracking capabilities in header processing with highlighting support.

## 📋 What this example demonstrates

- Field tracking in headers
- Header highlighting
- Processing analytics
- Visual feedback

## 📁 Files

- **tracked-document.md** - Document with trackable fields in headers
- **tracked-document.output.md** - Processed with field markers
- **tracked-document.output.html** - HTML with field highlighting

## 🚀 Usage

\`\`\`bash
./run.sh
\`\`\`

## 🔍 Key features shown

1. **Field Tracking**: Monitoring field usage in headers
2. **Visual Highlighting**: CSS classes for field identification
3. **Analytics**: Processing statistics and reports
4. **Review Support**: Tools for document review and validation

## 💡 Learn more

- [Field Tracking Guide](../../../docs/field-tracking.md)
- [Highlighting Features](../../../docs/highlighting.md)`,

  'cross-references/basic-references': `# Basic Cross References

Basic cross-reference processing with metadata substitution using the |reference| syntax.

## 📋 What this example demonstrates

- Cross-reference syntax |ref|
- Metadata substitution
- Value resolution
- Reference processing

## 📁 Files

- **agreement.md** - Document with cross-references
- **metadata.yaml** - Metadata values for substitution
- **agreement.output.md** - Document with resolved references
- **agreement.output.html** - HTML with formatted values

## 🚀 Usage

\`\`\`bash
./run.sh
\`\`\`

## 🔍 Key features shown

1. **Reference Syntax**: Using |reference| for value substitution
2. **Metadata Integration**: Combining YAML metadata with document
3. **Value Resolution**: Automatic replacement of references
4. **Type Handling**: Proper formatting of different data types

## 💡 Learn more

- [Cross-References Guide](../../../docs/cross-references.md)
- [Metadata Integration](../../../docs/metadata.md)`,

  'optional-clauses/conditional-content': `# Conditional Content

Conditional clause processing based on metadata values using the [text]{condition} syntax.

## 📋 What this example demonstrates

- Optional clause syntax [text]{condition}
- Boolean logic evaluation
- Conditional rendering
- Dynamic content

## 📁 Files

- **nda-template.md** - NDA template with conditional clauses
- **nda-template.output.md** - Processed with conditional content
- **nda-template.output.html** - HTML with rendered conditions

## 🚀 Usage

\`\`\`bash
./run.sh
\`\`\`

## 🔍 Key features shown

1. **Conditional Syntax**: [content]{condition} format
2. **Boolean Evaluation**: True/false condition testing
3. **Dynamic Content**: Including/excluding text based on conditions
4. **Template Flexibility**: Creating adaptable document templates

## 💡 Learn more

- [Optional Clauses Guide](../../../docs/optional-clauses.md)
- [Template Design](../../../docs/templates.md)`,

  'optional-clauses/boolean-logic': `# Boolean Logic in Conditions

Complex boolean logic in conditional clauses with AND/OR operations.

## 📋 What this example demonstrates

- AND/OR operations in conditions
- Complex boolean expressions
- Nested logical conditions
- Advanced conditional rendering

## 📁 Files

- **complex-conditions.md** - Document with complex boolean logic
- **complex-conditions.output.md** - Processed with resolved logic
- **complex-conditions.output.html** - HTML with conditional styling

## 🚀 Usage

\`\`\`bash
./run.sh
\`\`\`

## 🔍 Key features shown

1. **Boolean Operators**: AND, OR, NOT operations
2. **Complex Expressions**: Multi-part conditional statements
3. **Logical Precedence**: Proper evaluation order
4. **Advanced Templates**: Sophisticated document logic

## 💡 Learn more

- [Boolean Logic Guide](../../../docs/boolean-logic.md)
- [Advanced Conditions](../../../docs/advanced-clauses.md)`,

  'mixins/helper-functions': `# Helper Functions

Using helper functions for data formatting including dates, currency, and string manipulation.

## 📋 What this example demonstrates

- Helper function calls in templates
- Date formatting functions
- Currency formatting
- String manipulation helpers

## 📁 Files

- **formatted-contract.md** - Contract using helper functions
- **contract-data.json** - External data for helper functions
- **formatted-contract.output.md** - Document with formatted values
- **formatted-contract.output.html** - HTML with helper-formatted content

## 🚀 Usage

\`\`\`bash
./run.sh
\`\`\`

## 🔍 Key features shown

1. **Helper Functions**: Built-in formatting functions
2. **Date Formatting**: Various date display formats
3. **Currency Formatting**: Money and number formatting
4. **String Helpers**: Text manipulation and formatting

## 💡 Learn more

- [Helper Functions Guide](../../../docs/helpers.md)
- [Template Functions](../../../docs/template-functions.md)`,

  'mixins/template-loops': `# Template Loops

Array iteration and loops in templates using the {{#array}}...{{/array}} syntax.

## 📋 What this example demonstrates

- Template loops {{#array}}...{{/array}}
- Array iteration and processing
- Conditional blocks within loops
- Dynamic list generation

## 📁 Files

- **items-list.md** - Document with template loops
- **items-list.output.md** - Document with expanded loops
- **items-list.output.html** - HTML with rendered arrays

## 🚀 Usage

\`\`\`bash
./run.sh
\`\`\`

## 🔍 Key features shown

1. **Loop Syntax**: {{#variable}}...{{/variable}} format
2. **Array Iteration**: Processing lists and arrays
3. **Conditional Loops**: Logic within loop blocks
4. **Dynamic Content**: Generating content from data

## 💡 Learn more

- [Template Loops Guide](../../../docs/template-loops.md)
- [Array Processing](../../../docs/arrays.md)`,

  'imports/partial-imports': `# Partial Imports

Importing external markdown files into documents using the @import syntax.

## 📋 What this example demonstrates

- Import syntax @import filename
- Modular document construction
- File inclusion and processing
- Partial file management

## 📁 Files

- **main-contract.md** - Main document with import statements
- **partials/** - Directory containing imported files
  - **header.md** - Header section partial
  - **terms.md** - Terms and conditions partial
  - **footer.md** - Footer section partial
- **main-contract.output.md** - Document with imported content
- **main-contract.output.html** - HTML with combined sections

## 🚀 Usage

\`\`\`bash
./run.sh
\`\`\`

## 🔍 Key features shown

1. **Import Syntax**: @import for file inclusion
2. **Modular Design**: Breaking documents into reusable parts
3. **Path Resolution**: Relative and absolute import paths
4. **Content Merging**: Seamless integration of imported content

## 💡 Learn more

- [Import System Guide](../../../docs/imports.md)
- [Modular Documents](../../../docs/modular-design.md)`,

  'output-formats/pdf-generation': `# PDF Generation

Generating PDF output with styling and field highlighting capabilities.

## 📋 What this example demonstrates

- PDF generation from Legal Markdown
- Field highlighting in PDFs
- Professional document styling
- Multiple PDF output formats

## 📁 Files

- **printable-agreement.md** - Document designed for PDF output
- **printable-agreement.output.md** - Processed markdown
- **printable-agreement.output.html** - HTML version
- **printable-agreement.output.pdf** - Clean PDF output
- **printable-agreement.HIGHLIGHT.output.pdf** - PDF with field highlighting

## 🚀 Usage

\`\`\`bash
./run.sh
\`\`\`

## 🔍 Key features shown

1. **PDF Generation**: Converting markdown to professional PDFs
2. **Field Highlighting**: Visual indicators for reviewable fields
3. **Styling Control**: Professional formatting and layout
4. **Multiple Formats**: Clean and highlighted versions

## 💡 Learn more

- [PDF Generation Guide](../../../docs/pdf-generation.md)
- [Styling and Themes](../../../docs/styling.md)`,

  'output-formats/metadata-export': `# Metadata Export

Exporting processed metadata to external files in YAML and JSON formats.

## 📋 What this example demonstrates

- Metadata export functionality
- YAML and JSON output formats
- Processed metadata extraction
- External data integration

## 📁 Files

- **document-with-meta.md** - Document with rich metadata
- **document-with-meta.output.md** - Processed document
- **document-with-meta.output.html** - HTML output
- **document-with-meta.output.yaml** - Exported metadata in YAML
- **document-with-meta.output.json** - Exported metadata in JSON

## 🚀 Usage

\`\`\`bash
./run.sh
\`\`\`

## 🔍 Key features shown

1. **Metadata Export**: Extracting processed metadata
2. **Multiple Formats**: YAML and JSON export options
3. **Data Integration**: Using exported data in other systems
4. **Processing Pipeline**: Metadata through the processing chain

## 💡 Learn more

- [Metadata Export Guide](../../../docs/metadata-export.md)
- [Data Integration](../../../docs/data-integration.md)`,

  'advanced/office-lease-complete': `# Office Lease Agreement

Complete office lease agreement demonstrating complex data processing and professional document generation.

## 📋 What this example demonstrates

- Complex document structure and organization
- Rich metadata integration
- Professional formatting and styling
- Real-world legal document example

## 📁 Files

- **lease-agreement.md** - Complete office lease template
- **lease-with-data.md** - Lease with external data integration
- **lease-data.json** - Comprehensive lease data
- **lease-agreement.output.md** - Processed lease document
- **lease-agreement.output.html** - HTML with professional styling
- **lease-agreement.output.pdf** - PDF for signing
- **lease-with-data.output.md** - Data-integrated version
- **lease-with-data.output.html** - Rich HTML output
- **lease-with-data.HIGHLIGHT.output.pdf** - Review version with highlighting

## 🚀 Usage

\`\`\`bash
./run.sh
\`\`\`

## 🔍 Key features shown

1. **Complex Documents**: Real-world legal document structure
2. **Data Integration**: External JSON data processing
3. **Professional Output**: Publication-ready documents
4. **Multiple Versions**: Clean and review versions

## 💡 Learn more

- [Advanced Documents Guide](../../../docs/advanced-documents.md)
- [Legal Templates](../../../docs/legal-templates.md)`,

  'advanced/complex-nda': `# Complex Non-Disclosure Agreement

Non-disclosure agreement with advanced conditional logic and multiple data sources.

## 📋 What this example demonstrates

- Complex conditional logic and decision trees
- Multiple data source integration
- Professional legal document formatting
- Advanced template features

## 📁 Files

- **nda-template.md** - Complex NDA template
- **nda-with-data.md** - NDA with company-specific data
- **nda-data.json** - Company and agreement data
- **nda-template.output.md** - Processed NDA template
- **nda-template.output.html** - HTML version
- **nda-with-data.output.md** - Data-integrated NDA
- **nda-with-data.output.html** - Rich HTML output
- **nda-with-data.HIGHLIGHT.output.pdf** - Review PDF with highlighting

## 🚀 Usage

\`\`\`bash
./run.sh
\`\`\`

## 🔍 Key features shown

1. **Advanced Logic**: Complex conditional statements
2. **Data Integration**: Multiple data sources
3. **Professional Documents**: Legal-grade output
4. **Template Flexibility**: Adaptable to different scenarios

## 💡 Learn more

- [Complex Templates Guide](../../../docs/complex-templates.md)
- [Legal Document Automation](../../../docs/legal-automation.md)`,

  'integration/cli-usage': `# CLI Usage Examples

Comprehensive examples demonstrating various command-line interface usage patterns and options.

## 📋 What this example demonstrates

- Command-line interface usage patterns
- Batch processing capabilities
- Various output format options
- CLI flags and options

## 📁 Files

- **demo-contract.md** - Sample contract for CLI demonstration
- **simple-contract.md** - Simple document for batch processing
- **demo-contract.output.md** - Basic CLI output
- **demo-contract.output.html** - HTML with title
- **demo-contract.output.pdf** - PDF generation
- **simple-contract.output.md** - Highlighted output
- **simple-contract.output.html** - HTML with highlighting
- **\\*.batch.output.md** - Batch processed files

## 🚀 Usage

\`\`\`bash
./run.sh
\`\`\`

## 🔍 Key features shown

1. **CLI Commands**: Various command-line options
2. **Batch Processing**: Processing multiple files
3. **Output Formats**: HTML, PDF, and markdown outputs
4. **Advanced Options**: Highlighting, titles, and formatting

## 💡 Learn more

- [CLI Reference](../../../docs/cli-reference.md)
- [Batch Processing Guide](../../../docs/batch-processing.md)`,
};

/**
 * Generates README.md files for all configured examples
 *
 * This function iterates through all examples defined in EXAMPLE_CONFIG,
 * checks if the example directory exists, finds the corresponding template,
 * and writes a comprehensive README.md file to each example directory.
 *
 * The process:
 * 1. Resolves the examples directory path
 * 2. Iterates through each configured example
 * 3. Validates that the example directory exists
 * 4. Retrieves the appropriate README template
 * 5. Writes the template content to README.md
 * 6. Reports success/failure for each example
 *
 * Error Handling:
 * - Skips examples with missing directories (with warning)
 * - Skips examples with missing templates (with warning)
 * - Continues processing other examples if one fails
 *
 * @async
 * @returns {Promise<void>} Resolves when all README files are generated
 * @throws {Error} If there are file system errors during writing
 */
async function generateReadmes() {
  console.log('📝 Generating README.md files for each example...');

  const examplesDir = path.resolve('examples');

  for (const [examplePath] of Object.entries(EXAMPLE_CONFIG)) {
    const fullPath = path.join(examplesDir, examplePath);
    const readmePath = path.join(fullPath, 'README.md');

    if (!fs.existsSync(fullPath)) {
      console.log(`  ⚠️  Directory not found: ${examplePath}`);
      continue;
    }

    const readmeContent = README_TEMPLATES[examplePath];

    if (!readmeContent) {
      console.log(`  ⚠️  No README template for: ${examplePath}`);
      continue;
    }

    fs.writeFileSync(readmePath, readmeContent);
    console.log(`  ✅ Generated: ${examplePath}/README.md`);
  }

  console.log('\n✅ All README.md files generated successfully!');
}

// Execute the script when run directly from command line
if (require.main === module) {
  generateReadmes().catch(console.error);
}

// Export for use in other scripts or build processes
module.exports = { generateReadmes };
