#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "🚀 Processing Simple Document Processing example..."

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

# Process simple documents
echo "  Processing input.md..."
$CLI "$SCRIPT_DIR/input.md" "$SCRIPT_DIR/input.output.md"
$CLI "$SCRIPT_DIR/input.md" --html -o "$SCRIPT_DIR/input.output.html"

echo "  Processing example.md..."
$CLI "$SCRIPT_DIR/example.md" "$SCRIPT_DIR/example.output.md"
$CLI "$SCRIPT_DIR/example.md" --html -o "$SCRIPT_DIR/example.output.html"

echo "✅ Example completed successfully!"
echo "📁 Generated files:"
echo "  - $SCRIPT_DIR/input.output.md"
echo "  - $SCRIPT_DIR/input.output.html"
echo "  - $SCRIPT_DIR/example.output.md"
echo "  - $SCRIPT_DIR/example.output.html"