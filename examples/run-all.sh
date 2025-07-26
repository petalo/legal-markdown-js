#!/bin/bash
#Executable script to run all Legal Markdown examples

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Running all Legal Markdown examples..."
echo "This may take a few minutes..."
echo

# Check if CLI is available
if [ ! -f "$PROJECT_ROOT/dist/cli/index.js" ]; then
    echo "❌ Error: CLI not found. Please run 'npm run build' first."
    exit 1
fi

FAILED_EXAMPLES=()
SUCCESS_COUNT=0
TOTAL_COUNT=0

run_example() {
    local example_path="$1"
    local example_name="$(basename "$example_path")"
    local category="$(basename "$(dirname "$example_path")")"

    echo "📁 [$category] Running $example_name..."

    if (cd "$example_path" && timeout 60 ./run.sh > /dev/null 2>&1); then
        echo "  ✅ Success"
        ((SUCCESS_COUNT++))
    else
        echo "  ❌ Failed"
        FAILED_EXAMPLES+=("$category/$example_name")
    fi
    ((TOTAL_COUNT++))
}

# Find and run all examples
echo "🔍 Discovering examples..."
find "$SCRIPT_DIR" -name "run.sh" -type f | grep -v templates | sort | while read -r run_script; do
    example_dir="$(dirname "$run_script")"
    run_example "$example_dir"
    echo
done

# Since we're in a subshell due to the pipe, we need to collect results differently
# Let's run the examples in the main shell instead

EXAMPLE_DIRS=()
while IFS= read -r -d '' dir; do
    EXAMPLE_DIRS+=("$dir")
done < <(find "$SCRIPT_DIR" -name "run.sh" -type f -not -path "*/templates/*" -print0 | xargs -0 dirname | sort -u)

echo "📊 Found ${#EXAMPLE_DIRS[@]} examples to run"
echo

for example_dir in "${EXAMPLE_DIRS[@]}"; do
    example_name="$(basename "$example_dir")"
    category="$(basename "$(dirname "$example_dir")")"

    echo "📁 [$category] Running $example_name..."

    if (cd "$example_dir" && timeout 60 ./run.sh > /dev/null 2>&1); then
        echo "  ✅ Success"
        ((SUCCESS_COUNT++))
    else
        echo "  ❌ Failed"
        FAILED_EXAMPLES+=("$category/$example_name")
    fi
    ((TOTAL_COUNT++))
    echo
done

echo "📊 Summary:"
echo "  ✅ Successful: $SUCCESS_COUNT"
echo "  ❌ Failed: ${#FAILED_EXAMPLES[@]}"
echo "  📝 Total: $TOTAL_COUNT"

if [ ${#FAILED_EXAMPLES[@]} -gt 0 ]; then
    echo
    echo "❌ Failed examples:"
    printf '  - %s\n' "${FAILED_EXAMPLES[@]}"
    echo
    echo "💡 To debug a failed example, run it individually:"
    echo "   cd examples/category/example && ./run.sh"
    exit 1
fi

echo
echo "🎉 All examples completed successfully!"
echo "📁 Check the generated .output.* files in each example directory"
echo

# Show some stats
total_files=$(find "$SCRIPT_DIR" -name "*.output.*" | wc -l)
echo "📈 Generated $total_files output files across all examples"

echo
echo "🔗 Next steps:"
echo "  - Explore individual examples in examples/*"
echo "  - Check the README.md in each example directory"
echo "  - View generated HTML files in your browser"
echo "  - Review PDF outputs for document formatting"
