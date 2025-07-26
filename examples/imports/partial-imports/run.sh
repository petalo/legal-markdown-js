#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "🚀 Processing Partial Imports example..."

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

# Process document with partial imports
echo "  Processing main-contract.md with imports..."
# Create some sample partial files
mkdir -p partials
echo "# Header Section" > partials/header.md
echo "This is the header content." >> partials/header.md
echo "## Terms and Conditions" > partials/terms.md
echo "Standard terms apply." >> partials/terms.md
echo "---" > partials/footer.md
echo "*This document is legally binding.*" >> partials/footer.md

$CLI main-contract.md main-contract.output.md
$CLI main-contract.md --html > main-contract.output.html

echo "✅ Example completed successfully!"
echo "📁 Generated files:"
echo "  - main-contract.output.md (with imported content)"
echo "  - main-contract.output.html (with combined sections)"
echo "  - partials/ (sample imported files)"