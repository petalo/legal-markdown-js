#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "🚀 Processing Basic Cross References example..."

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

# Process documents with internal cross-references
echo "  Processing agreement.md..."
$CLI "$SCRIPT_DIR/agreement.md" "$SCRIPT_DIR/agreement.output.md"
$CLI "$SCRIPT_DIR/agreement.md" --html -o "$SCRIPT_DIR/agreement.output.html"

echo "  Processing internal-references.md..."
$CLI "$SCRIPT_DIR/internal-references.md" "$SCRIPT_DIR/internal-references.output.md"
$CLI "$SCRIPT_DIR/internal-references.md" --html -o "$SCRIPT_DIR/internal-references.output.html"

echo "✅ Example completed successfully!"
echo "📁 Generated files:"
echo "  - $SCRIPT_DIR/agreement.output.md (with resolved internal cross-references)"
echo "  - $SCRIPT_DIR/agreement.output.html (with resolved internal cross-references)"
echo "  - $SCRIPT_DIR/internal-references.output.md (with resolved cross-references)"
echo "  - $SCRIPT_DIR/internal-references.output.html (with resolved cross-references)"