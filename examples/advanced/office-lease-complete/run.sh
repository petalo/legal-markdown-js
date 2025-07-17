#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "🚀 Processing Office Lease Agreement example..."

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

# Process complex office lease with rich data
echo "  Processing lease-agreement.md..."
$CLI lease-agreement.md lease-agreement.output.md
$CLI lease-agreement.md --html -o lease-agreement.output.html
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
    $CLI temp.md lease-with-data.output.md
    $CLI temp.md --html -o lease-with-data.output.html
    $CLI temp.md --pdf --highlight --output lease-with-data.HIGHLIGHT.output.pdf
    rm temp.md
fi

echo "✅ Example completed successfully!"
echo "📁 Generated files:"
echo "  - lease-agreement.output.md"
echo "  - lease-agreement.output.html"
echo "  - lease-agreement.output.pdf"
echo "  - lease-with-data.output.md (with external data)"
echo "  - lease-with-data.output.html"
echo "  - lease-with-data.HIGHLIGHT.output.pdf"