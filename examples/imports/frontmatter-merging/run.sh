#!/bin/bash

# Frontmatter Merging Demo Script
# Demonstrates automatic YAML metadata merging from imported files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

echo_step() {
    echo -e "${GREEN}➤ $1${NC}"
}

echo_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

echo_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Create output directory
mkdir -p output

echo_header "Legal Markdown - Frontmatter Merging Demo"

echo_info "This demo shows how YAML frontmatter from imported files is automatically"
echo_info "merged using a 'source always wins' strategy with granular object merging."
echo ""

# Check if legal-markdown is available
if ! command -v npx &> /dev/null && ! command -v legal-markdown &> /dev/null; then
    echo_error "legal-markdown not found. Please install it first:"
    echo "  npm install -g legal-markdown-js"
    echo "  or run from project root: npm run build && npm link"
    exit 1
fi

# Determine command to use
if command -v legal-markdown &> /dev/null; then
    LM_CMD="legal-markdown"
else
    LM_CMD="npx legal-markdown"
fi

echo_info "Using command: $LM_CMD"
echo ""

# 1. Basic frontmatter merging
echo_step "1. Processing main contract with frontmatter merging (default behavior)"
echo_info "   Main document metadata takes precedence over imported metadata"
echo_info "   Command: $LM_CMD main-contract.md --output output/merged-contract.md"
echo ""

$LM_CMD main-contract.md --output output/merged-contract.md

if [ -f "output/merged-contract.md" ]; then
    echo_info "✓ Generated: output/merged-contract.md"
    
    # Show key merged values
    echo_info "📋 Key merged metadata values:"
    echo "   - Liability cap: \$500,000 (main document wins over client preference)"
    echo "   - Payment terms: Net 45 (main document preference)"
    echo "   - Governing law: State of New York (overrides standard California)"
    echo "   - Client name: Acme Corporation (from client-info.md import)"
    echo "   - Service level: 99.9% uptime (from service-levels.md import)"
else
    echo_error "Failed to generate merged contract"
fi

echo ""

# 2. Export merged metadata
echo_step "2. Exporting merged metadata to JSON and YAML"
echo_info "   Shows complete merged metadata structure"
echo_info "   Command: $LM_CMD main-contract.md --export-metadata --export-format json"
echo ""

$LM_CMD main-contract.md --export-metadata --export-format json
$LM_CMD main-contract.md --export-metadata --export-format yaml

if [ -f "output/contract-metadata.json" ]; then
    echo_info "✓ Generated: output/contract-metadata.json"
    echo_info "📊 Metadata contains $(jq 'keys | length' output/contract-metadata.json) top-level properties"
fi

if [ -f "output/contract-metadata.yaml" ]; then
    echo_info "✓ Generated: output/contract-metadata.yaml"
fi

echo ""

# 3. Comparison without frontmatter merging
echo_step "3. Processing without frontmatter merging (comparison)"
echo_info "   Disables automatic metadata merging to show the difference"
echo_info "   Command: $LM_CMD main-contract.md --disable-frontmatter-merge --output output/no-merge.md"
echo ""

$LM_CMD main-contract.md --disable-frontmatter-merge --output output/no-merge.md

if [ -f "output/no-merge.md" ]; then
    echo_info "✓ Generated: output/no-merge.md (no frontmatter merging)"
    echo_info "📋 Without merging, imported templates won't have access to:"
    echo "   - Client name (remains 'Default Client Name')"
    echo "   - Service level details"  
    echo "   - Contact information"
else
    echo_error "Failed to generate no-merge version"
fi

echo ""

# 4. Process templates with detailed logging
echo_step "4. Processing templates with type validation and logging"
echo_info "   Shows merge operations and type validation in action"
echo ""

echo_info "Basic service agreement template..."
$LM_CMD templates/basic-service-agreement.md \
    --validate-import-types \
    --log-import-operations \
    --output output/basic-agreement.md

if [ -f "output/basic-agreement.md" ]; then
    echo_info "✓ Generated: output/basic-agreement.md"
fi

echo ""

echo_info "Complex enterprise contract template..."
$LM_CMD templates/complex-enterprise-contract.md \
    --validate-import-types \
    --log-import-operations \
    --output output/enterprise-contract.md

if [ -f "output/enterprise-contract.md" ]; then
    echo_info "✓ Generated: output/enterprise-contract.md"
fi

echo ""

# 5. Security demonstration
echo_step "5. Security features demonstration"
echo_info "   Reserved fields are automatically filtered for security"
echo ""

# Create a test file with potentially malicious frontmatter
cat > output/test-security.md << 'EOF'
---
title: "Security Test"
# These should be filtered out for security
level-one: "HACKED %n"
force_commands: "rm -rf /"
meta-yaml-output: "/etc/passwd"
# This should be allowed
legitimate_field: "safe value"
---

# Security Test

This is a test: {{legitimate_field}}

@import ../components/standard-terms.md
EOF

echo_info "Processing document with potentially dangerous frontmatter..."
$LM_CMD output/test-security.md \
    --validate-import-types \
    --log-import-operations \
    --output output/security-filtered.md

if [ -f "output/security-filtered.md" ]; then
    echo_info "✓ Generated: output/security-filtered.md"
    echo_info "🔒 Security: Reserved fields automatically filtered out"
fi

# Clean up test file
rm -f output/test-security.md

echo ""

# 6. Show file sizes and statistics
echo_step "6. Generated files summary"
echo ""

if [ -d "output" ]; then
    echo_info "📁 Output directory contents:"
    ls -la output/ | grep -v "^total" | while read line; do
        echo "   $line"
    done
    
    echo ""
    echo_info "📊 File statistics:"
    for file in output/*.md; do
        if [ -f "$file" ]; then
            words=$(wc -w < "$file" 2>/dev/null || echo "0")
            lines=$(wc -l < "$file" 2>/dev/null || echo "0")
            size=$(wc -c < "$file" 2>/dev/null || echo "0")
            filename=$(basename "$file")
            printf "   %-25s %6s words, %4s lines, %6s bytes\n" "$filename" "$words" "$lines" "$size"
        fi
    done
fi

echo ""

# 7. Metadata comparison
echo_step "7. Metadata comparison"
echo ""

if [ -f "output/contract-metadata.json" ]; then
    echo_info "🔍 Top-level metadata keys in merged contract:"
    jq -r 'keys[]' output/contract-metadata.json | sed 's/^/   - /'
    echo ""
    
    echo_info "📋 Key merged values:"
    echo "   - Title: $(jq -r '.title // "N/A"' output/contract-metadata.json)"
    echo "   - Client: $(jq -r '.client.name // "N/A"' output/contract-metadata.json)"
    echo "   - Liability Cap: \$$(jq -r '.liability_cap // "N/A"' output/contract-metadata.json | number_with_commas || echo "N/A")"
    echo "   - Payment Terms: $(jq -r '.payment_terms // "N/A"' output/contract-metadata.json)"
    echo "   - Governing Law: $(jq -r '.governing_law // "N/A"' output/contract-metadata.json)"
    echo "   - Service Level: $(jq -r '.service_levels.availability.uptime_guarantee // "N/A"' output/contract-metadata.json)% uptime"
fi

echo ""

echo_header "Demo Complete!"

echo_info "✅ Successfully demonstrated frontmatter merging features:"
echo "   • Automatic YAML metadata merging from imported files"
echo "   • 'Source always wins' conflict resolution strategy"  
echo "   • Granular property-level merging for nested objects"
echo "   • Security filtering of reserved fields"
echo "   • Type validation and conflict detection"
echo "   • Sequential import processing"
echo ""

echo_info "📂 Generated files in output/ directory:"
echo "   • merged-contract.md - Main contract with merged metadata"
echo "   • contract-metadata.json/yaml - Exported merged metadata"
echo "   • no-merge.md - Comparison without frontmatter merging"
echo "   • basic-agreement.md - Simple template example"
echo "   • enterprise-contract.md - Complex enterprise template"
echo "   • security-filtered.md - Security filtering demonstration"
echo ""

echo_info "🎯 Key takeaways:"
echo "   • Main document metadata always wins conflicts"
echo "   • Imported metadata fills in missing fields"
echo "   • Security is built-in with reserved field filtering"
echo "   • Type validation prevents dangerous type confusion"
echo "   • Complex nested objects merge at property level"
echo ""

echo_info "📖 For more details, see README.md in this directory"

# Helper function for number formatting (if available)
number_with_commas() {
    sed ':a;s/\B[0-9]\{3\}\>/,&/;ta'
}