#!/bin/bash
# Template para run.sh - Script ejecutable base para ejemplos

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 Processing $(basename "$SCRIPT_DIR") example..."

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

# Función para procesar archivos
process_file() {
    local input="$1"
    local base_name="${input%.*}"
    
    echo "  Processing: $input"
    
    # Markdown output
    if [ ! -f "${base_name}.output.md" ] || [ "$input" -nt "${base_name}.output.md" ]; then
        $CLI "$input" --output "${base_name}.output.md"
        echo "    ✅ Generated: ${base_name}.output.md"
    else
        echo "    ⏭️  Skipped: ${base_name}.output.md (up to date)"
    fi
    
    # HTML output
    if [ ! -f "${base_name}.output.html" ] || [ "$input" -nt "${base_name}.output.html" ]; then
        $CLI "$input" --html --output "${base_name}.output.html"
        echo "    ✅ Generated: ${base_name}.output.html"
    else
        echo "    ⏭️  Skipped: ${base_name}.output.html (up to date)"
    fi
}

# Función para procesar con highlighting
process_with_highlighting() {
    local input="$1"
    local base_name="${input%.*}"
    
    echo "  Processing with highlighting: $input"
    
    # PDF normal
    if [ ! -f "${base_name}.output.pdf" ] || [ "$input" -nt "${base_name}.output.pdf" ]; then
        $CLI "$input" --pdf --output "${base_name}.output.pdf"
        echo "    ✅ Generated: ${base_name}.output.pdf"
    fi
    
    # PDF con highlighting
    if [ ! -f "${base_name}.HIGHLIGHT.output.pdf" ] || [ "$input" -nt "${base_name}.HIGHLIGHT.output.pdf" ]; then
        $CLI "$input" --pdf --highlight --output "${base_name}.HIGHLIGHT.output.pdf"
        echo "    ✅ Generated: ${base_name}.HIGHLIGHT.output.pdf"
    fi
}

# Función para procesar con metadata externa
process_with_metadata() {
    local input="$1"
    local metadata_file="$2"
    local base_name="${input%.*}"
    
    echo "  Processing with metadata: $input + $metadata_file"
    
    if [ ! -f "${base_name}.output.md" ] || [ "$input" -nt "${base_name}.output.md" ] || [ "$metadata_file" -nt "${base_name}.output.md" ]; then
        # Para archivos con metadata externa, usar combinación temporal
        cat "$metadata_file" "$input" > "${base_name}.temp.md"
        $CLI "${base_name}.temp.md" --output "${base_name}.output.md"
        rm "${base_name}.temp.md"
        echo "    ✅ Generated: ${base_name}.output.md"
    else
        echo "    ⏭️  Skipped: ${base_name}.output.md (up to date)"
    fi
}

# PROCESAMIENTO ESPECÍFICO DEL EJEMPLO
# Esta sección será personalizada por cada ejemplo

echo "✅ Example completed successfully!"
echo "📁 Check generated files in current directory"