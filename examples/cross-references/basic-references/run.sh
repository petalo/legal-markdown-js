#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 Processing Basic Cross References example..."

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

# Process document with cross-references and metadata
echo "  Processing agreement.md with metadata..."
# Combine metadata with document for processing
cat metadata.yaml > temp.md
echo "---" >> temp.md
tail -n +2 agreement.md >> temp.md
$CLI temp.md --output agreement.output.md
$CLI temp.md --html --output agreement.output.html
rm temp.md

echo "✅ Example completed successfully!"
echo "📁 Generated files:"
echo "  - agreement.output.md (with resolved references)"
echo "  - agreement.output.html (with formatted values)"