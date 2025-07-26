#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 Processing CLI Usage Examples examples..."

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

# Demonstrate various CLI usage patterns
echo "  Basic processing..."
$CLI "$SCRIPT_DIR/demo-contract.md" "$SCRIPT_DIR/demo-contract.output.md"

echo "  HTML generation..."
$CLI "$SCRIPT_DIR/demo-contract.md" --html --title "Demo Contract" -o "$SCRIPT_DIR/demo-contract.output.html"

echo "  PDF generation..."
$CLI "$SCRIPT_DIR/demo-contract.md" --pdf -o "$SCRIPT_DIR/demo-contract.output.pdf"

echo "  Processing with highlighting..."
$CLI "$SCRIPT_DIR/simple-contract.md" --highlight -o "$SCRIPT_DIR/simple-contract.output.md"
$CLI "$SCRIPT_DIR/simple-contract.md" --html --highlight -o "$SCRIPT_DIR/simple-contract.output.html"

echo "  Batch processing demonstration..."
for file in *.md; do
    if [[ "$file" != *.output.md ]]; then
        echo "    Processing $file..."
        base_name="${file%.*}"
        $CLI "$file" --output "${base_name}.batch.output.md"
    fi
done

echo "✅ All CLI examples completed successfully!"
echo "📁 Generated files demonstrate various CLI options:"
echo "  - demo-contract.output.md"
echo "  - demo-contract.output.html"
echo "  - demo-contract.output.pdf"
echo "  - simple-contract.output.md (with highlighting)"
echo "  - simple-contract.output.html (with highlighting)"
echo "  - *.batch.output.md (batch processed files)"