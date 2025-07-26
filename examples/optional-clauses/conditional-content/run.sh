#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "🚀 Processing Conditional Content example..."

# Detectar CLI disponible
detect_cli() {
    if command -v legal-md &> /dev/null; then
        echo "legal-md"
    elif [ -f "$PROJECT_ROOT/bin/cli.js" ]; then
        echo "$PROJECT_ROOT/bin/cli.js"
    elif [ -f "$PROJECT_ROOT/dist/cli/index.js" ]; then
        echo "node $PROJECT_ROOT/dist/cli/index.js"
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

# Process document with conditional clauses
echo "  Processing nda-template.md..."
$CLI "$SCRIPT_DIR/nda-template.md" "$SCRIPT_DIR/nda-template.output.md"
$CLI "$SCRIPT_DIR/nda-template.md" --html -o "$SCRIPT_DIR/nda-template.output.html"

echo "✅ Example completed successfully!"
echo "📁 Generated files:"
echo "  - $SCRIPT_DIR/nda-template.output.md (with conditional content)"
echo "  - $SCRIPT_DIR/nda-template.output.html (with styled conditions)"