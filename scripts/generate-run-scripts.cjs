#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { EXAMPLE_CONFIG } = require('./migrate-examples');

// Templates específicos por tipo de procesamiento
const SCRIPT_TEMPLATES = {
  basic: `#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 Processing {EXAMPLE_NAME} example..."

# Detectar CLI disponible
detect_cli() {
    if command -v legal-md &> /dev/null; then
        echo "legal-md"
    elif [ -f "$PROJECT_ROOT/bin/cli.js" ]; then
        echo "$PROJECT_ROOT/bin/cli.js"
    elif [ -f "$PROJECT_ROOT/dist/cli.js" ]; then
        echo "node $PROJECT_ROOT/dist/cli.js"
    elif [ -f "$PROJECT_ROOT/src/cli/index.ts" ]; then
        echo "npx tsx $PROJECT_ROOT/src/cli/index.ts"
    else
        echo "❌ Error: Legal Markdown CLI not found"
        echo "Options:"
        echo "  1. Install globally: npm install -g legal-markdown-js"
        echo "  2. Run from project root: npm run build"
        echo "  3. Use: npm run examples"
        exit 1
    fi
}

CLI=$(detect_cli)
echo "📄 Using CLI: $CLI"

{PROCESSING_COMMANDS}

echo "✅ Example completed successfully!"
echo "📁 Generated files:"
{OUTPUT_LIST}`,

  metadata: `#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 Processing {EXAMPLE_NAME} example..."

# Detectar CLI disponible
detect_cli() {
    if command -v legal-md &> /dev/null; then
        echo "legal-md"
    elif [ -f "$PROJECT_ROOT/bin/cli.js" ]; then
        echo "$PROJECT_ROOT/bin/cli.js"
    elif [ -f "$PROJECT_ROOT/dist/cli.js" ]; then
        echo "node $PROJECT_ROOT/dist/cli.js"
    elif [ -f "$PROJECT_ROOT/src/cli/index.ts" ]; then
        echo "npx tsx $PROJECT_ROOT/src/cli/index.ts"
    else
        echo "❌ Error: Legal Markdown CLI not found"
        echo "Options:"
        echo "  1. Install globally: npm install -g legal-markdown-js"
        echo "  2. Run from project root: npm run build"
        echo "  3. Use: npm run examples"
        exit 1
    fi
}

CLI=$(detect_cli)
echo "📄 Using CLI: $CLI"

{PROCESSING_COMMANDS}

echo "✅ Example completed successfully!"
echo "📁 Generated files:"
{OUTPUT_LIST}`,

  tracking: `#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 Processing {EXAMPLE_NAME} example with field tracking..."

# Detectar CLI disponible
detect_cli() {
    if command -v legal-md &> /dev/null; then
        echo "legal-md"
    elif [ -f "$PROJECT_ROOT/bin/cli.js" ]; then
        echo "$PROJECT_ROOT/bin/cli.js"
    elif [ -f "$PROJECT_ROOT/dist/cli.js" ]; then
        echo "node $PROJECT_ROOT/dist/cli.js"
    elif [ -f "$PROJECT_ROOT/src/cli/index.ts" ]; then
        echo "npx tsx $PROJECT_ROOT/src/cli/index.ts"
    else
        echo "❌ Error: Legal Markdown CLI not found"
        echo "Options:"
        echo "  1. Install globally: npm install -g legal-markdown-js"
        echo "  2. Run from project root: npm run build"
        echo "  3. Use: npm run examples"
        exit 1
    fi
}

CLI=$(detect_cli)
echo "📄 Using CLI: $CLI"

{PROCESSING_COMMANDS}

echo "✅ Example completed successfully!"
echo "📁 Generated files with field tracking:"
{OUTPUT_LIST}`,

  pdf: `#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 Processing {EXAMPLE_NAME} example with PDF generation..."

# Detectar CLI disponible
detect_cli() {
    if command -v legal-md &> /dev/null; then
        echo "legal-md"
    elif [ -f "$PROJECT_ROOT/bin/cli.js" ]; then
        echo "$PROJECT_ROOT/bin/cli.js"
    elif [ -f "$PROJECT_ROOT/dist/cli.js" ]; then
        echo "node $PROJECT_ROOT/dist/cli.js"
    elif [ -f "$PROJECT_ROOT/src/cli/index.ts" ]; then
        echo "npx tsx $PROJECT_ROOT/src/cli/index.ts"
    else
        echo "❌ Error: Legal Markdown CLI not found"
        echo "Options:"
        echo "  1. Install globally: npm install -g legal-markdown-js"
        echo "  2. Run from project root: npm run build"
        echo "  3. Use: npm run examples"
        exit 1
    fi
}

CLI=$(detect_cli)
echo "📄 Using CLI: $CLI"

{PROCESSING_COMMANDS}

echo "✅ Example completed successfully!"
echo "📁 Generated files including PDFs:"
{OUTPUT_LIST}`,

  export: `#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 Processing {EXAMPLE_NAME} example with metadata export..."

# Detectar CLI disponible
detect_cli() {
    if command -v legal-md &> /dev/null; then
        echo "legal-md"
    elif [ -f "$PROJECT_ROOT/bin/cli.js" ]; then
        echo "$PROJECT_ROOT/bin/cli.js"
    elif [ -f "$PROJECT_ROOT/dist/cli.js" ]; then
        echo "node $PROJECT_ROOT/dist/cli.js"
    elif [ -f "$PROJECT_ROOT/src/cli/index.ts" ]; then
        echo "npx tsx $PROJECT_ROOT/src/cli/index.ts"
    else
        echo "❌ Error: Legal Markdown CLI not found"
        echo "Options:"
        echo "  1. Install globally: npm install -g legal-markdown-js"
        echo "  2. Run from project root: npm run build"
        echo "  3. Use: npm run examples"
        exit 1
    fi
}

CLI=$(detect_cli)
echo "📄 Using CLI: $CLI"

{PROCESSING_COMMANDS}

echo "✅ Example completed successfully!"
echo "📁 Generated files with exported metadata:"
{OUTPUT_LIST}`,

  cli: `#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 Processing {EXAMPLE_NAME} examples..."

# Detectar CLI disponible
detect_cli() {
    if command -v legal-md &> /dev/null; then
        echo "legal-md"
    elif [ -f "$PROJECT_ROOT/bin/cli.js" ]; then
        echo "$PROJECT_ROOT/bin/cli.js"
    elif [ -f "$PROJECT_ROOT/dist/cli.js" ]; then
        echo "node $PROJECT_ROOT/dist/cli.js"
    elif [ -f "$PROJECT_ROOT/src/cli/index.ts" ]; then
        echo "npx tsx $PROJECT_ROOT/src/cli/index.ts"
    else
        echo "❌ Error: Legal Markdown CLI not found"
        echo "Options:"
        echo "  1. Install globally: npm install -g legal-markdown-js"
        echo "  2. Run from project root: npm run build"
        echo "  3. Use: npm run examples"
        exit 1
    fi
}

CLI=$(detect_cli)
echo "📄 Using CLI: $CLI"

{PROCESSING_COMMANDS}

echo "✅ All CLI examples completed successfully!"
echo "📁 Generated files demonstrate various CLI options:"
{OUTPUT_LIST}`
};

// Comandos específicos por ejemplo
const PROCESSING_COMMANDS = {
  'basic-processing/simple-document': {
    commands: `# Process simple documents
echo "  Processing input.md..."
$CLI input.md --output input.output.md
$CLI input.md --html --output input.output.html

echo "  Processing example.md..."
$CLI example.md --output example.output.md
$CLI example.md --html --output example.output.html`,
    outputs: `echo "  - input.output.md"
echo "  - input.output.html"
echo "  - example.output.md"
echo "  - example.output.html"`
  },

  'basic-processing/yaml-frontmatter': {
    commands: `# Process document with YAML frontmatter
echo "  Processing document.md..."
$CLI document.md --output document.output.md
$CLI document.md --html --output document.output.html

# Extract only YAML metadata
echo "  Extracting YAML only..."
$CLI document.md --yaml-only --output document.yaml-only.md`,
    outputs: `echo "  - document.output.md"
echo "  - document.output.html"
echo "  - document.yaml-only.md"`
  },

  'headers/multiple-headers': {
    commands: `# Process document with multiple header levels
echo "  Processing contract.md..."
$CLI contract.md --output contract.output.md
$CLI contract.md --html --output contract.output.html`,
    outputs: `echo "  - contract.output.md (with numbered headers)"
echo "  - contract.output.html (with styled headers)"`
  },

  'headers/mixed-header-styles': {
    commands: `# Process document with mixed header styles
echo "  Processing document.md..."
$CLI document.md --output document.output.md
$CLI document.md --html --output document.output.html`,
    outputs: `echo "  - document.output.md (normalized headers)"
echo "  - document.output.html (with consistent styling)"`
  },

  'headers/header-tracking': {
    commands: `# Process document with field tracking enabled
echo "  Processing tracked-document.md with field tracking..."
$CLI tracked-document.md --highlight --output tracked-document.output.md
$CLI tracked-document.md --html --highlight --output tracked-document.output.html`,
    outputs: `echo "  - tracked-document.output.md (with field markers)"
echo "  - tracked-document.output.html (with field highlighting)"`
  },

  'cross-references/basic-references': {
    commands: `# Process document with cross-references and metadata
echo "  Processing agreement.md with metadata..."
# Combine metadata with document for processing
cat metadata.yaml > temp.md
echo "---" >> temp.md
tail -n +2 agreement.md >> temp.md
$CLI temp.md --output agreement.output.md
$CLI temp.md --html --output agreement.output.html
rm temp.md`,
    outputs: `echo "  - agreement.output.md (with resolved references)"
echo "  - agreement.output.html (with formatted values)"`
  },

  'optional-clauses/conditional-content': {
    commands: `# Process document with conditional clauses
echo "  Processing nda-template.md..."
$CLI nda-template.md --output nda-template.output.md
$CLI nda-template.md --html --output nda-template.output.html`,
    outputs: `echo "  - nda-template.output.md (with conditional content)"
echo "  - nda-template.output.html (with styled conditions)"`
  },

  'optional-clauses/boolean-logic': {
    commands: `# Process document with complex boolean logic
echo "  Processing complex-conditions.md..."
$CLI complex-conditions.md --output complex-conditions.output.md
$CLI complex-conditions.md --html --output complex-conditions.output.html`,
    outputs: `echo "  - complex-conditions.output.md (with resolved logic)"
echo "  - complex-conditions.output.html (with conditional styling)"`
  },

  'mixins/helper-functions': {
    commands: `# Process document with helper functions and metadata
echo "  Processing formatted-contract.md with contract data..."
if [ -f "contract-data.json" ]; then
    # Convert JSON to YAML frontmatter temporarily
    echo "---" > temp.md
    node -e "
    const data = require('./contract-data.json');
    for (const [key, value] of Object.entries(data)) {
        console.log(key + ': ' + JSON.stringify(value));
    }" >> temp.md
    echo "---" >> temp.md
    tail -n +2 formatted-contract.md >> temp.md
    $CLI temp.md --output formatted-contract.output.md
    $CLI temp.md --html --output formatted-contract.output.html
    rm temp.md
else
    $CLI formatted-contract.md --output formatted-contract.output.md
    $CLI formatted-contract.md --html --output formatted-contract.output.html
fi`,
    outputs: `echo "  - formatted-contract.output.md (with helper functions)"
echo "  - formatted-contract.output.html (with formatted values)"`
  },

  'mixins/template-loops': {
    commands: `# Process document with template loops
echo "  Processing items-list.md..."
$CLI items-list.md --output items-list.output.md
$CLI items-list.md --html --output items-list.output.html`,
    outputs: `echo "  - items-list.output.md (with expanded loops)"
echo "  - items-list.output.html (with rendered arrays)"`
  },

  'imports/partial-imports': {
    commands: `# Process document with partial imports
echo "  Processing main-contract.md with imports..."
# Create some sample partial files
mkdir -p partials
echo "# Header Section" > partials/header.md
echo "This is the header content." >> partials/header.md
echo "## Terms and Conditions" > partials/terms.md
echo "Standard terms apply." >> partials/terms.md
echo "---" > partials/footer.md
echo "*This document is legally binding.*" >> partials/footer.md

$CLI main-contract.md --output main-contract.output.md
$CLI main-contract.md --html --output main-contract.output.html`,
    outputs: `echo "  - main-contract.output.md (with imported content)"
echo "  - main-contract.output.html (with combined sections)"
echo "  - partials/ (sample imported files)"`
  },

  'output-formats/pdf-generation': {
    commands: `# Generate PDF outputs with and without highlighting
echo "  Processing printable-agreement.md..."
$CLI printable-agreement.md --output printable-agreement.output.md
$CLI printable-agreement.md --html --output printable-agreement.output.html
$CLI printable-agreement.md --pdf --output printable-agreement.output.pdf
$CLI printable-agreement.md --pdf --highlight --output printable-agreement.HIGHLIGHT.output.pdf`,
    outputs: `echo "  - printable-agreement.output.md"
echo "  - printable-agreement.output.html"
echo "  - printable-agreement.output.pdf (clean PDF)"
echo "  - printable-agreement.HIGHLIGHT.output.pdf (with field highlighting)"`
  },

  'output-formats/metadata-export': {
    commands: `# Process document and export metadata
echo "  Processing document-with-meta.md..."
$CLI document-with-meta.md --output document-with-meta.output.md
$CLI document-with-meta.md --html --output document-with-meta.output.html
$CLI document-with-meta.md --export-yaml --output document-with-meta.output.yaml
$CLI document-with-meta.md --export-json --output document-with-meta.output.json`,
    outputs: `echo "  - document-with-meta.output.md"
echo "  - document-with-meta.output.html"
echo "  - document-with-meta.output.yaml (exported metadata)"
echo "  - document-with-meta.output.json (exported metadata)"`
  },

  'advanced/office-lease-complete': {
    commands: `# Process complex office lease with rich data
echo "  Processing lease-agreement.md..."
$CLI lease-agreement.md --output lease-agreement.output.md
$CLI lease-agreement.md --html --output lease-agreement.output.html
$CLI lease-agreement.md --pdf --output lease-agreement.output.pdf

if [ -f "lease-data.json" ]; then
    echo "  Processing lease-with-data.md with external data..."
    # Process with external data
    echo "---" > temp.md
    node -e "
    const data = require('./lease-data.json');
    for (const [key, value] of Object.entries(data)) {
        console.log(key + ': ' + JSON.stringify(value));
    }" >> temp.md
    echo "---" >> temp.md
    tail -n +2 lease-with-data.md >> temp.md
    $CLI temp.md --output lease-with-data.output.md
    $CLI temp.md --html --output lease-with-data.output.html
    $CLI temp.md --pdf --highlight --output lease-with-data.HIGHLIGHT.output.pdf
    rm temp.md
fi`,
    outputs: `echo "  - lease-agreement.output.md"
echo "  - lease-agreement.output.html"
echo "  - lease-agreement.output.pdf"
echo "  - lease-with-data.output.md (with external data)"
echo "  - lease-with-data.output.html"
echo "  - lease-with-data.HIGHLIGHT.output.pdf"`
  },

  'advanced/complex-nda': {
    commands: `# Process complex NDA with advanced features
echo "  Processing nda-template.md..."
$CLI nda-template.md --output nda-template.output.md
$CLI nda-template.md --html --output nda-template.output.html

if [ -f "nda-data.json" ]; then
    echo "  Processing nda-with-data.md with company data..."
    echo "---" > temp.md
    node -e "
    const data = require('./nda-data.json');
    for (const [key, value] of Object.entries(data)) {
        console.log(key + ': ' + JSON.stringify(value));
    }" >> temp.md
    echo "---" >> temp.md
    tail -n +2 nda-with-data.md >> temp.md
    $CLI temp.md --output nda-with-data.output.md
    $CLI temp.md --html --output nda-with-data.output.html
    $CLI temp.md --pdf --highlight --output nda-with-data.HIGHLIGHT.output.pdf
    rm temp.md
fi`,
    outputs: `echo "  - nda-template.output.md"
echo "  - nda-template.output.html"
echo "  - nda-with-data.output.md (with company data)"
echo "  - nda-with-data.output.html"
echo "  - nda-with-data.HIGHLIGHT.output.pdf"`
  },

  'integration/cli-usage': {
    commands: `# Demonstrate various CLI usage patterns
echo "  Basic processing..."
$CLI demo-contract.md --output demo-contract.output.md

echo "  HTML generation..."
$CLI demo-contract.md --html --title "Demo Contract" --output demo-contract.output.html

echo "  PDF generation..."
$CLI demo-contract.md --pdf --output demo-contract.output.pdf

echo "  Processing with highlighting..."
$CLI simple-contract.md --highlight --output simple-contract.output.md
$CLI simple-contract.md --html --highlight --output simple-contract.output.html

echo "  Batch processing demonstration..."
for file in *.md; do
    if [[ "$file" != *.output.md ]]; then
        echo "    Processing $file..."
        base_name="\${file%.*}"
        $CLI "$file" --output "\${base_name}.batch.output.md"
    fi
done`,
    outputs: `echo "  - demo-contract.output.md"
echo "  - demo-contract.output.html"
echo "  - demo-contract.output.pdf"
echo "  - simple-contract.output.md (with highlighting)"
echo "  - simple-contract.output.html (with highlighting)"
echo "  - *.batch.output.md (batch processed files)"`
  }
};

async function generateRunScripts() {
  console.log('🔧 Generating run.sh scripts for each example...');
  
  const examplesDir = path.resolve('examples');
  
  for (const [examplePath, config] of Object.entries(EXAMPLE_CONFIG)) {
    const fullPath = path.join(examplesDir, examplePath);
    const runScriptPath = path.join(fullPath, 'run.sh');
    
    if (!fs.existsSync(fullPath)) {
      console.log(`  ⚠️  Directory not found: ${examplePath}`);
      continue;
    }
    
    const processingType = config.processingType || 'basic';
    const template = SCRIPT_TEMPLATES[processingType];
    const commands = PROCESSING_COMMANDS[examplePath];
    
    if (!template) {
      console.log(`  ⚠️  No template for processing type: ${processingType}`);
      continue;
    }
    
    if (!commands) {
      console.log(`  ⚠️  No commands defined for: ${examplePath}`);
      continue;
    }
    
    let script = template
      .replace(/{EXAMPLE_NAME}/g, config.name)
      .replace(/{PROCESSING_COMMANDS}/g, commands.commands)
      .replace(/{OUTPUT_LIST}/g, commands.outputs);
    
    fs.writeFileSync(runScriptPath, script);
    fs.chmodSync(runScriptPath, 0o755); // Make executable
    
    console.log(`  ✅ Generated: ${examplePath}/run.sh`);
  }
  
  console.log('\n✅ All run.sh scripts generated successfully!');
}

if (require.main === module) {
  generateRunScripts().catch(console.error);
}

module.exports = { generateRunScripts };