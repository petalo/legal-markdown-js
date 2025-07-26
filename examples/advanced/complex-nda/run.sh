#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "🚀 Processing Complex NDA example..."

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

# Process complex NDA with advanced features
echo "  Processing nda-template.md..."
$CLI "$SCRIPT_DIR/nda-template.md" "$SCRIPT_DIR/nda-template.output.md"
$CLI "$SCRIPT_DIR/nda-template.md" --html -o "$SCRIPT_DIR/nda-template.output.html"

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
    $CLI "$SCRIPT_DIR/temp.md" "$SCRIPT_DIR/nda-with-data.output.md"
    $CLI "$SCRIPT_DIR/temp.md" --html -o "$SCRIPT_DIR/nda-with-data.output.html"
    $CLI "$SCRIPT_DIR/temp.md" --pdf --highlight -o "$SCRIPT_DIR/nda-with-data.HIGHLIGHT.output.pdf"
    rm temp.md
fi

echo "✅ Example completed successfully!"
echo "📁 Generated files:"
echo "  - nda-template.output.md"
echo "  - nda-template.output.html"
echo "  - nda-with-data.output.md (with company data)"
echo "  - nda-with-data.output.html"
echo "  - nda-with-data.HIGHLIGHT.output.pdf"