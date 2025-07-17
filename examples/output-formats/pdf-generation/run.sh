#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 Processing PDF Generation example with PDF generation..."

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

# Generate PDF outputs with and without highlighting
echo "  Processing printable-agreement.md..."
$CLI printable-agreement.md --output printable-agreement.output.md
$CLI printable-agreement.md --html --output printable-agreement.output.html
$CLI printable-agreement.md --pdf --output printable-agreement.output.pdf
$CLI printable-agreement.md --pdf --highlight --output printable-agreement.HIGHLIGHT.output.pdf

echo "✅ Example completed successfully!"
echo "📁 Generated files including PDFs:"
echo "  - printable-agreement.output.md"
echo "  - printable-agreement.output.html"
echo "  - printable-agreement.output.pdf (clean PDF)"
echo "  - printable-agreement.HIGHLIGHT.output.pdf (with field highlighting)"