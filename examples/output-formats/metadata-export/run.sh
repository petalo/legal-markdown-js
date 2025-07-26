#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 Processing Metadata Export example with metadata export..."

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

# Process document and export metadata
echo "  Processing document-with-meta.md..."
$CLI "$SCRIPT_DIR/document-with-meta.md" "$SCRIPT_DIR/document-with-meta.output.md"
$CLI "$SCRIPT_DIR/document-with-meta.md" --html -o "$SCRIPT_DIR/document-with-meta.output.html"
$CLI "$SCRIPT_DIR/document-with-meta.md" --export-yaml -o "$SCRIPT_DIR/document-with-meta.output.yaml"
$CLI "$SCRIPT_DIR/document-with-meta.md" --export-json -o "$SCRIPT_DIR/document-with-meta.output.json"

echo "✅ Example completed successfully!"
echo "📁 Generated files with exported metadata:"
echo "  - document-with-meta.output.md"
echo "  - document-with-meta.output.html"
echo "  - document-with-meta.output.yaml (exported metadata)"
echo "  - document-with-meta.output.json (exported metadata)"