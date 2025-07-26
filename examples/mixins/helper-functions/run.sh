#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "🚀 Processing Helper Functions example..."

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

# Process document with helper functions and metadata
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
    $CLI "$SCRIPT_DIR/temp.md" "$SCRIPT_DIR/formatted-contract.output.md"
    $CLI "$SCRIPT_DIR/temp.md" --html -o "$SCRIPT_DIR/formatted-contract.output.html"
    rm temp.md
else
    $CLI "$SCRIPT_DIR/formatted-contract.md" "$SCRIPT_DIR/formatted-contract.output.md"
    $CLI "$SCRIPT_DIR/formatted-contract.md" --html -o "$SCRIPT_DIR/formatted-contract.output.html"
fi

echo "✅ Example completed successfully!"
echo "📁 Generated files:"
echo "  - formatted-contract.output.md (with helper functions)"
echo "  - formatted-contract.output.html (with formatted values)"