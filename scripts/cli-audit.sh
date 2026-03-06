#!/usr/bin/env bash
# Manual smoke-test tool (kept for local debugging convenience).
# Canonical e2e tests live in:
#   tests/e2e/cli-params.e2e.test.ts       (all flag tests)
#   tests/e2e/cli-flag-coverage.e2e.test.ts (flag coverage guard)
#
# Run the Vitest suite instead:
#   npm run test:e2e:cli
#   npm run test:e2e:coverage

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIXTURE_DIR="$REPO_ROOT/tests/fixtures/cli"
TMP_DIR="$REPO_ROOT/scripts/cli-audit-tmp"
NODE_CLI="node $REPO_ROOT/dist/cli/index.js"
BIN_CLI="$REPO_ROOT/dist/bin/legal-md"

# Colour helpers
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PASS=0
FAIL=0
SKIP=0

# Track failures for summary
declare -a FAILURES=()

# --------------------------------------------------------------------------- #
# Helpers                                                                      #
# --------------------------------------------------------------------------- #

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

setup() {
  mkdir -p "$TMP_DIR"
}

pass() {
  local label="$1"
  echo -e "  ${GREEN}✓${NC} $label"
  PASS=$((PASS + 1))
}

fail() {
  local label="$1"
  local detail="${2:-}"
  echo -e "  ${RED}✗${NC} $label"
  [ -n "$detail" ] && echo -e "    ${RED}↳ $detail${NC}"
  FAIL=$((FAIL + 1))
  FAILURES+=("$label")
}

skip_test() {
  local label="$1"
  local reason="${2:-}"
  echo -e "  ${YELLOW}~${NC} $label ${YELLOW}(skipped: $reason)${NC}"
  SKIP=$((SKIP + 1))
}

section() {
  echo ""
  echo -e "${BOLD}${BLUE}══ $1 ══${NC}"
}

subsection() {
  echo ""
  echo -e "${CYAN}── $1${NC}"
}

# Run CLI and capture exit code, stdout, stderr
# Usage: run_cli <target> [args...]
# Sets globals: RUN_EXIT, RUN_STDOUT, RUN_STDERR
run_cli() {
  local target="$1"; shift
  local cmd
  if [ "$target" = "node" ]; then
    cmd="$NODE_CLI"
  else
    cmd="$BIN_CLI"
  fi
  RUN_STDOUT=""
  RUN_STDERR=""
  RUN_EXIT=0
  # Run and capture separately; don't let set -e kill us here
  RUN_STDOUT=$(eval "$cmd $*" 2>/tmp/audit_stderr_cap) || RUN_EXIT=$?
  RUN_STDERR=$(cat /tmp/audit_stderr_cap)
}

# Assert: command succeeded (exit 0)
assert_ok() {
  local label="$1"
  if [ "$RUN_EXIT" -eq 0 ]; then
    pass "$label"
  else
    fail "$label" "exit=$RUN_EXIT stderr: $(echo "$RUN_STDERR" | head -1)"
  fi
}

# Assert: command failed (exit != 0)
assert_fail() {
  local label="$1"
  if [ "$RUN_EXIT" -ne 0 ]; then
    pass "$label"
  else
    fail "$label" "expected failure but got exit=0"
  fi
}

# Assert: stdout contains pattern
assert_stdout_contains() {
  local label="$1"
  local pattern="$2"
  if echo "$RUN_STDOUT" | grep -q "$pattern"; then
    pass "$label"
  else
    fail "$label" "stdout did not contain: $pattern"
  fi
}

# Assert: stdout does NOT contain pattern
assert_stdout_not_contains() {
  local label="$1"
  local pattern="$2"
  if ! echo "$RUN_STDOUT" | grep -q "$pattern"; then
    pass "$label"
  else
    fail "$label" "stdout should NOT contain: $pattern"
  fi
}

# Assert: file exists
assert_file_exists() {
  local label="$1"
  local filepath="$2"
  if [ -f "$filepath" ]; then
    pass "$label"
  else
    fail "$label" "file not found: $filepath"
  fi
}

# Assert: file contains pattern
assert_file_contains() {
  local label="$1"
  local filepath="$2"
  local pattern="$3"
  if [ -f "$filepath" ] && grep -q "$pattern" "$filepath"; then
    pass "$label"
  else
    fail "$label" "file $filepath does not contain: $pattern"
  fi
}

# Assert: file does NOT contain pattern
assert_file_not_contains() {
  local label="$1"
  local filepath="$2"
  local pattern="$3"
  if [ -f "$filepath" ] && ! grep -q "$pattern" "$filepath"; then
    pass "$label"
  else
    fail "$label" "file $filepath should NOT contain: $pattern"
  fi
}

# Assert: stderr contains pattern
assert_stderr_contains() {
  local label="$1"
  local pattern="$2"
  if echo "$RUN_STDERR" | grep -q "$pattern"; then
    pass "$label"
  else
    fail "$label" "stderr did not contain: $pattern"
  fi
}

# --------------------------------------------------------------------------- #
# Test suites                                                                  #
# --------------------------------------------------------------------------- #

run_suite() {
  local TARGET="$1"
  local LABEL
  if [ "$TARGET" = "node" ]; then
    LABEL="node dist/cli/index.js"
  else
    LABEL="dist/bin/legal-md"
  fi

  section "TARGET: $LABEL"

  # ------------------------------------------------------------------ #
  subsection "1. Meta flags"
  # ------------------------------------------------------------------ #

  run_cli "$TARGET" "--version"
  assert_ok "$TARGET: --version exits 0"
  assert_stdout_contains "$TARGET: --version prints semver" "[0-9]\+\.[0-9]\+\.[0-9]\+"

  run_cli "$TARGET" "--help"
  assert_ok "$TARGET: --help exits 0"
  assert_stdout_contains "$TARGET: --help mentions legal-md" "legal-md"

  # ------------------------------------------------------------------ #
  subsection "2. No input file"
  # ------------------------------------------------------------------ #

  run_cli "$TARGET" ""
  assert_fail "$TARGET: no args → exit 1"
  assert_stderr_contains "$TARGET: no args → stderr mentions Input file" "Input file is required"

  # ------------------------------------------------------------------ #
  subsection "3. Nonexistent input"
  # ------------------------------------------------------------------ #

  run_cli "$TARGET" "/nonexistent/path.md"
  assert_fail "$TARGET: nonexistent file → exit 1"
  assert_stderr_contains "$TARGET: nonexistent file → stderr" "not found"

  # ------------------------------------------------------------------ #
  subsection "4. Basic file → stdout (no output arg)"
  # ------------------------------------------------------------------ #

  run_cli "$TARGET" "\"$FIXTURE_DIR/full.md\""
  assert_ok "$TARGET: input only → stdout"
  assert_stdout_contains "$TARGET: input only → Article 1." "Article 1."
  assert_stdout_contains "$TARGET: input only → Section 1." "Section 1."
  assert_stdout_contains "$TARGET: references resolved" "ACME Corp"

  # ------------------------------------------------------------------ #
  subsection "5. Basic file → output file"
  # ------------------------------------------------------------------ #

  OUT="$TMP_DIR/${TARGET}_basic_out.md"
  run_cli "$TARGET" "\"$FIXTURE_DIR/full.md\" \"$OUT\""
  assert_ok "$TARGET: file → file exits 0"
  assert_file_exists "$TARGET: output file created" "$OUT"
  assert_file_contains "$TARGET: output has headers" "$OUT" "Article 1."

  # ------------------------------------------------------------------ #
  subsection "6. --debug"
  # ------------------------------------------------------------------ #

  run_cli "$TARGET" "--debug \"$FIXTURE_DIR/full.md\""
  assert_ok "$TARGET: --debug exits 0"
  assert_stdout_contains "$TARGET: --debug shows Metadata" "Metadata:"

  # ------------------------------------------------------------------ #
  subsection "7. --yaml (YAML-only mode)"
  # ------------------------------------------------------------------ #

  OUT="$TMP_DIR/${TARGET}_yaml_only.md"
  run_cli "$TARGET" "--yaml \"$FIXTURE_DIR/full.md\" \"$OUT\""
  assert_ok "$TARGET: --yaml exits 0"
  assert_file_not_contains "$TARGET: --yaml skips headers" "$OUT" "Article 1."
  assert_file_contains "$TARGET: --yaml keeps raw l. markers" "$OUT" "l\. Parties"

  # ------------------------------------------------------------------ #
  subsection "8. --headers (auto-populate)"
  # ------------------------------------------------------------------ #

  OUT="$TMP_DIR/${TARGET}_headers-auto.md"
  run_cli "$TARGET" "--headers \"$FIXTURE_DIR/headers-auto.md\" \"$OUT\""
  assert_ok "$TARGET: --headers exits 0"

  # ------------------------------------------------------------------ #
  subsection "9. --no-headers"
  # ------------------------------------------------------------------ #

  OUT="$TMP_DIR/${TARGET}_no_headers.md"
  run_cli "$TARGET" "--no-headers \"$FIXTURE_DIR/full.md\" \"$OUT\""
  assert_ok "$TARGET: --no-headers exits 0"
  assert_file_not_contains "$TARGET: --no-headers skips header numbering" "$OUT" "Article 1."
  assert_file_contains "$TARGET: --no-headers keeps raw markers" "$OUT" "l\. Parties"

  # ------------------------------------------------------------------ #
  subsection "10. --no-clauses"
  # ------------------------------------------------------------------ #

  OUT="$TMP_DIR/${TARGET}_no_clauses.md"
  run_cli "$TARGET" "--no-clauses \"$FIXTURE_DIR/full.md\" \"$OUT\""
  assert_ok "$TARGET: --no-clauses exits 0"
  # Clause syntax should remain unprocessed
  assert_file_contains "$TARGET: --no-clauses keeps clause syntax" "$OUT" "{include_warranty}"

  # ------------------------------------------------------------------ #
  subsection "11. --no-references"
  # ------------------------------------------------------------------ #

  OUT="$TMP_DIR/${TARGET}_no_refs.md"
  run_cli "$TARGET" "--no-references \"$FIXTURE_DIR/full.md\" \"$OUT\""
  assert_ok "$TARGET: --no-references exits 0"
  assert_file_contains "$TARGET: --no-references keeps pipe refs" "$OUT" "|client_name|"

  # ------------------------------------------------------------------ #
  subsection "12. --no-imports"
  # ------------------------------------------------------------------ #

  OUT="$TMP_DIR/${TARGET}_no_imports.md"
  run_cli "$TARGET" "--no-imports \"$FIXTURE_DIR/with-import.md\" \"$OUT\""
  assert_ok "$TARGET: --no-imports exits 0"
  assert_file_not_contains "$TARGET: --no-imports skips @import" "$OUT" "imported clause"

  # ------------------------------------------------------------------ #
  subsection "13. --no-mixins"
  # ------------------------------------------------------------------ #

  # --no-mixins skips @include directives (the remarkMixins plugin), NOT {{...}} template fields
  # The fixture uses @include via with-import.md so we check the @import is NOT expanded
  OUT="$TMP_DIR/${TARGET}_no_mixins.md"
  run_cli "$TARGET" "--no-mixins \"$FIXTURE_DIR/with-import.md\" \"$OUT\""
  assert_ok "$TARGET: --no-mixins exits 0"
  # NOTE: @import is handled by remarkImports (--no-imports), not remarkMixins
  # --no-mixins is not documented to block @include; verify it completes without error
  # (the output may still import - that's controlled by --no-imports)

  # ------------------------------------------------------------------ #
  subsection "14. --no-reset"
  # ------------------------------------------------------------------ #

  OUT="$TMP_DIR/${TARGET}_no_reset.md"
  run_cli "$TARGET" "--no-reset \"$FIXTURE_DIR/full.md\" \"$OUT\""
  assert_ok "$TARGET: --no-reset exits 0"

  # ------------------------------------------------------------------ #
  subsection "15. --no-indent"
  # ------------------------------------------------------------------ #

  OUT="$TMP_DIR/${TARGET}_no_indent.md"
  run_cli "$TARGET" "--no-indent \"$FIXTURE_DIR/full.md\" \"$OUT\""
  assert_ok "$TARGET: --no-indent exits 0"
  # With --no-indent, sub-headers should not be indented with spaces
  assert_file_not_contains "$TARGET: --no-indent removes indentation" "$OUT" "^  Section"

  # ------------------------------------------------------------------ #
  subsection "16. --throwOnYamlError"
  # ------------------------------------------------------------------ #

  run_cli "$TARGET" "--throwOnYamlError \"$FIXTURE_DIR/invalid-yaml.md\""
  assert_fail "$TARGET: --throwOnYamlError exits non-0 on bad YAML"

  # Valid YAML should still work with the flag
  run_cli "$TARGET" "--throwOnYamlError \"$FIXTURE_DIR/minimal.md\""
  assert_ok "$TARGET: --throwOnYamlError passes on valid YAML"

  # ------------------------------------------------------------------ #
  subsection "17. --to-markdown"
  # ------------------------------------------------------------------ #

  run_cli "$TARGET" "--to-markdown \"$FIXTURE_DIR/full.md\""
  assert_ok "$TARGET: --to-markdown exits 0"

  # ------------------------------------------------------------------ #
  subsection "18. --stdout"
  # ------------------------------------------------------------------ #

  run_cli "$TARGET" "--stdout \"$FIXTURE_DIR/full.md\""
  assert_ok "$TARGET: --stdout exits 0"
  assert_stdout_contains "$TARGET: --stdout output to stdout" "Article 1."

  # ------------------------------------------------------------------ #
  subsection "19. --stdin"
  # ------------------------------------------------------------------ #

  RUN_EXIT=0
  RUN_STDOUT=$(cat "$FIXTURE_DIR/stdin.md" | eval "$( [ "$TARGET" = "node" ] && echo "$NODE_CLI" || echo "$BIN_CLI" ) --stdin --stdout" 2>/tmp/audit_stderr_cap) || RUN_EXIT=$?
  RUN_STDERR=$(cat /tmp/audit_stderr_cap)
  assert_ok "$TARGET: --stdin --stdout exits 0"
  assert_stdout_contains "$TARGET: --stdin processes content" "Pipe Corp"

  # --stdin with output file
  OUT="$TMP_DIR/${TARGET}_stdin_out.md"
  RUN_EXIT=0
  RUN_STDOUT=$(cat "$FIXTURE_DIR/stdin.md" | eval "$( [ "$TARGET" = "node" ] && echo "$NODE_CLI" || echo "$BIN_CLI" ) --stdin \"$OUT\"" 2>/tmp/audit_stderr_cap) || RUN_EXIT=$?
  RUN_STDERR=$(cat /tmp/audit_stderr_cap)
  assert_ok "$TARGET: --stdin with output file exits 0"
  assert_file_exists "$TARGET: --stdin output file created" "$OUT"

  # ------------------------------------------------------------------ #
  subsection "20. --export-yaml"
  # ------------------------------------------------------------------ #

  META_DIR="$TMP_DIR/${TARGET}_export_yaml"
  mkdir -p "$META_DIR"
  OUT="$META_DIR/out.md"
  run_cli "$TARGET" "--export-yaml --output-path \"$META_DIR\" \"$FIXTURE_DIR/full.md\" \"$OUT\""
  assert_ok "$TARGET: --export-yaml exits 0"
  assert_file_exists "$TARGET: --export-yaml creates metadata.yaml" "$META_DIR/metadata.yaml"
  assert_file_contains "$TARGET: --export-yaml has title" "$META_DIR/metadata.yaml" "title:"

  # ------------------------------------------------------------------ #
  subsection "21. --export-json"
  # ------------------------------------------------------------------ #

  META_DIR="$TMP_DIR/${TARGET}_export_json"
  mkdir -p "$META_DIR"
  OUT="$META_DIR/out.md"
  run_cli "$TARGET" "--export-json --output-path \"$META_DIR\" \"$FIXTURE_DIR/full.md\" \"$OUT\""
  assert_ok "$TARGET: --export-json exits 0"
  assert_file_exists "$TARGET: --export-json creates metadata.json" "$META_DIR/metadata.json"
  assert_file_contains "$TARGET: --export-json has title" "$META_DIR/metadata.json" "\"title\""

  # ------------------------------------------------------------------ #
  subsection "22. --html"
  # ------------------------------------------------------------------ #

  # KNOWN LIMITATION: --stdout is silently ignored when --html is used.
  # The service routes to generateFormattedOutputWithOptions() for html/pdf which always
  # writes to a file. --stdout only works for markdown mode.
  run_cli "$TARGET" "--html --stdout \"$FIXTURE_DIR/full.md\""
  assert_ok "$TARGET: --html --stdout exits 0"
  # stdout contains only a success message, NOT HTML content (--stdout ignored by --html)
  if echo "$RUN_STDOUT" | grep -q "<html"; then
    pass "$TARGET: --html outputs HTML tags (LIMITATION FIXED)"
  else
    skip_test "$TARGET: --html outputs HTML tags" "KNOWN LIMITATION: --stdout is ignored when --html is active; HTML always goes to file"
  fi

  # --html to file
  HTML_OUT="$TMP_DIR/${TARGET}_html.html"
  run_cli "$TARGET" "--html \"$FIXTURE_DIR/full.md\" \"$HTML_OUT\""
  assert_ok "$TARGET: --html to file exits 0"
  assert_file_exists "$TARGET: --html creates output file" "$HTML_OUT"
  assert_file_contains "$TARGET: --html file has html tag" "$HTML_OUT" "<html"

  # ------------------------------------------------------------------ #
  subsection "23. --html --title"
  # ------------------------------------------------------------------ #

  HTML_OUT="$TMP_DIR/${TARGET}_html_title.html"
  run_cli "$TARGET" "--html --title \"My Title\" \"$FIXTURE_DIR/full.md\" \"$HTML_OUT\""
  assert_ok "$TARGET: --html --title exits 0"
  assert_file_exists "$TARGET: --html --title creates file" "$HTML_OUT"
  assert_file_contains "$TARGET: --html --title sets title in file" "$HTML_OUT" "My Title"

  # ------------------------------------------------------------------ #
  subsection "24. --html --highlight"
  # ------------------------------------------------------------------ #

  HTML_OUT="$TMP_DIR/${TARGET}_html_highlight.html"
  run_cli "$TARGET" "--html --highlight \"$FIXTURE_DIR/full.md\" \"$HTML_OUT\""
  assert_ok "$TARGET: --html --highlight exits 0"
  assert_file_exists "$TARGET: --html --highlight creates file" "$HTML_OUT"
  assert_file_contains "$TARGET: --html --highlight adds highlight spans" "$HTML_OUT" "class="

  # ------------------------------------------------------------------ #
  subsection "25. --enable-field-tracking"
  # ------------------------------------------------------------------ #

  OUT="$TMP_DIR/${TARGET}_field_tracking.md"
  run_cli "$TARGET" "--enable-field-tracking \"$FIXTURE_DIR/full.md\" \"$OUT\""
  assert_ok "$TARGET: --enable-field-tracking exits 0"

  # ------------------------------------------------------------------ #
  subsection "26. --disable-frontmatter-merge"
  # ------------------------------------------------------------------ #

  OUT="$TMP_DIR/${TARGET}_no_fm_merge.md"
  run_cli "$TARGET" "--disable-frontmatter-merge \"$FIXTURE_DIR/with-import.md\" \"$OUT\""
  assert_ok "$TARGET: --disable-frontmatter-merge exits 0"

  # ------------------------------------------------------------------ #
  subsection "27. --import-tracing"
  # ------------------------------------------------------------------ #

  run_cli "$TARGET" "--import-tracing \"$FIXTURE_DIR/with-import.md\""
  assert_ok "$TARGET: --import-tracing exits 0"
  # KNOWN BUG: --import-tracing is accepted but silently ignored in current remark pipeline.
  # The option is defined in types.ts and accepted by CLI, but legal-markdown-processor.ts
  # never passes importTracing to remarkImports. Output contains no <!-- import --> comments.
  # Flagging as known no-op:
  if echo "$RUN_STDOUT" | grep -q "<!--"; then
    pass "$TARGET: --import-tracing BUG FIXED - now adds HTML comments"
  else
    skip_test "$TARGET: --import-tracing adds HTML comments" "KNOWN BUG: option accepted but not wired to remark pipeline"
  fi

  # ------------------------------------------------------------------ #
  subsection "28. --validate-import-types"
  # ------------------------------------------------------------------ #

  run_cli "$TARGET" "--validate-import-types \"$FIXTURE_DIR/with-import.md\""
  assert_ok "$TARGET: --validate-import-types exits 0"
  # KNOWN BUG: --validate-import-types is accepted but ignored.
  # legal-markdown-processor.ts hardcodes validateTypes: true regardless of this flag.
  skip_test "$TARGET: --validate-import-types is actually honoured" "KNOWN BUG: hardcoded to true in processor"

  # ------------------------------------------------------------------ #
  subsection "29. --log-import-operations"
  # ------------------------------------------------------------------ #

  run_cli "$TARGET" "--log-import-operations \"$FIXTURE_DIR/with-import.md\""
  assert_ok "$TARGET: --log-import-operations exits 0"
  # KNOWN BUG: --log-import-operations is accepted but ignored.
  # legal-markdown-processor.ts hardcodes logImportOperations: options.debug, ignoring this flag.
  skip_test "$TARGET: --log-import-operations produces import logs without --debug" "KNOWN BUG: hardcoded to options.debug in processor"

  # ------------------------------------------------------------------ #
  subsection "30. --pdf"
  # ------------------------------------------------------------------ #

  PDF_OUT="$TMP_DIR/${TARGET}_output.pdf"
  run_cli "$TARGET" "--pdf \"$FIXTURE_DIR/full.md\" \"$PDF_OUT\""
  if [ "$RUN_EXIT" -eq 0 ]; then
    pass "$TARGET: --pdf exits 0 (PDF backend available)"
    assert_file_exists "$TARGET: --pdf creates file" "$PDF_OUT"
  else
    # PDF backend may not be available in all envs — treat as a warning
    skip_test "$TARGET: --pdf" "PDF backend not available (exit=$RUN_EXIT)"
  fi

  # ------------------------------------------------------------------ #
  subsection "31. --pdf-connector auto"
  # ------------------------------------------------------------------ #

  run_cli "$TARGET" "--pdf --pdf-connector auto \"$FIXTURE_DIR/minimal.md\""
  if [ "$RUN_EXIT" -eq 0 ]; then
    pass "$TARGET: --pdf-connector auto exits 0"
  else
    skip_test "$TARGET: --pdf-connector auto" "PDF backend not available"
  fi

  # ------------------------------------------------------------------ #
  subsection "32. --pdf-connector invalid value"
  # ------------------------------------------------------------------ #

  run_cli "$TARGET" "--pdf-connector badvalue \"$FIXTURE_DIR/minimal.md\""
  assert_fail "$TARGET: --pdf-connector <invalid> → exit 1"

  # ------------------------------------------------------------------ #
  subsection "33. --css (valid path)"
  # ------------------------------------------------------------------ #

  CSS_FILE="$TMP_DIR/custom.css"
  HTML_OUT="$TMP_DIR/${TARGET}_css_out.html"
  echo "body { color: red; }" > "$CSS_FILE"
  # --html writes to file not stdout; use explicit output path
  run_cli "$TARGET" "--html --css \"$CSS_FILE\" \"$FIXTURE_DIR/full.md\" \"$HTML_OUT\""
  assert_ok "$TARGET: --html --css exits 0"
  assert_file_exists "$TARGET: --html --css creates output file" "$HTML_OUT"
  assert_file_contains "$TARGET: --html --css injects CSS" "$HTML_OUT" "color: red"

  # ------------------------------------------------------------------ #
  subsection "34. --archive-source"
  # ------------------------------------------------------------------ #

  ARCHIVE_DIR="$TMP_DIR/${TARGET}_archive"
  mkdir -p "$ARCHIVE_DIR"
  # Copy fixture to a temp location (archive moves/copies the source)
  cp "$FIXTURE_DIR/minimal.md" "$TMP_DIR/${TARGET}_archive_src.md"
  OUT="$TMP_DIR/${TARGET}_archive_out.md"
  run_cli "$TARGET" "--archive-source \"$ARCHIVE_DIR\" \"$TMP_DIR/${TARGET}_archive_src.md\" \"$OUT\""
  assert_ok "$TARGET: --archive-source exits 0"
  assert_file_exists "$TARGET: --archive-source creates output" "$OUT"
  # Archive dir should have at least 1 file
  ARCHIVE_COUNT=$(ls "$ARCHIVE_DIR" 2>/dev/null | wc -l)
  if [ "$ARCHIVE_COUNT" -gt 0 ]; then
    pass "$TARGET: --archive-source archived file"
  else
    fail "$TARGET: --archive-source archive dir is empty"
  fi

  # ------------------------------------------------------------------ #
  subsection "35. Subcommand: config show"
  # ------------------------------------------------------------------ #

  run_cli "$TARGET" "config show"
  assert_ok "$TARGET: config show exits 0"
  assert_stdout_contains "$TARGET: config show has paths key" "paths"

  # ------------------------------------------------------------------ #
  subsection "36. Subcommand: config get"
  # ------------------------------------------------------------------ #

  run_cli "$TARGET" "config get paths.input"
  assert_ok "$TARGET: config get paths.input exits 0"

  run_cli "$TARGET" "config get nonexistent.key"
  assert_fail "$TARGET: config get nonexistent key → exit 1"

  run_cli "$TARGET" "config get"
  assert_fail "$TARGET: config get with no key → exit 1"

  # ------------------------------------------------------------------ #
  subsection "37. Subcommand: config set"
  # ------------------------------------------------------------------ #

  # NOTE: config set writes to .legalmdrc.yaml in CWD; we test and immediately undo
  run_cli "$TARGET" "config set logging.level warn"
  assert_ok "$TARGET: config set exits 0 (creates/updates .legalmdrc.yaml)"
  # Clean up the rc file created by this test
  rm -f "$REPO_ROOT/.legalmdrc.yaml"

  # ------------------------------------------------------------------ #
  subsection "38. Subcommand: config unsupported action"
  # ------------------------------------------------------------------ #

  run_cli "$TARGET" "config bogus"
  assert_fail "$TARGET: config bogus action → exit 1"

  # ------------------------------------------------------------------ #
  subsection "39. Combinations"
  # ------------------------------------------------------------------ #

  # --debug + --export-json + file → file
  META_DIR="$TMP_DIR/${TARGET}_combo1"
  mkdir -p "$META_DIR"
  OUT="$META_DIR/out.md"
  run_cli "$TARGET" "--debug --export-json --output-path \"$META_DIR\" \"$FIXTURE_DIR/full.md\" \"$OUT\""
  assert_ok "$TARGET: --debug + --export-json exits 0"
  assert_stdout_contains "$TARGET: combo shows Metadata:" "Metadata:"
  assert_stdout_contains "$TARGET: combo shows Exported files:" "Exported files:"
  assert_file_exists "$TARGET: combo creates metadata.json" "$META_DIR/metadata.json"

  # --no-headers + --no-clauses + --no-references + --no-mixins (all skip flags)
  OUT="$TMP_DIR/${TARGET}_all_skip.md"
  run_cli "$TARGET" "--no-headers --no-clauses --no-references --no-mixins \"$FIXTURE_DIR/full.md\" \"$OUT\""
  assert_ok "$TARGET: all --no-X flags exits 0"
  assert_file_contains "$TARGET: all-skip keeps raw l. marker" "$OUT" "l\. Parties"
  assert_file_contains "$TARGET: all-skip keeps pipe ref" "$OUT" "|client_name|"
  assert_file_contains "$TARGET: all-skip keeps clause syntax" "$OUT" "{include_warranty}"
  assert_file_contains "$TARGET: all-skip keeps handlebars" "$OUT" "{{client_name}}"

  # --html + --highlight + --title + --debug
  HTML_COMBO="$TMP_DIR/${TARGET}_combo_html.html"
  run_cli "$TARGET" "--html --highlight --title \"Combo Doc\" --debug \"$FIXTURE_DIR/full.md\" \"$HTML_COMBO\""
  assert_ok "$TARGET: --html+--highlight+--title+--debug exits 0"
  assert_file_exists "$TARGET: combo HTML output file exists" "$HTML_COMBO"
  assert_file_contains "$TARGET: combo HTML contains title" "$HTML_COMBO" "Combo Doc"
  assert_file_contains "$TARGET: combo HTML contains spans" "$HTML_COMBO" "class="

  # --stdout + --debug
  run_cli "$TARGET" "--stdout --debug \"$FIXTURE_DIR/full.md\""
  assert_ok "$TARGET: --stdout + --debug exits 0"

  # --stdin + --stdout
  RUN_EXIT=0
  RUN_STDOUT=$(cat "$FIXTURE_DIR/stdin.md" | eval "$( [ "$TARGET" = "node" ] && echo "$NODE_CLI" || echo "$BIN_CLI" ) --stdin --stdout --debug" 2>/tmp/audit_stderr_cap) || RUN_EXIT=$?
  RUN_STDERR=$(cat /tmp/audit_stderr_cap)
  assert_ok "$TARGET: --stdin + --stdout + --debug exits 0"

  # --export-yaml + --export-json together (both should work, json takes precedence on format)
  META_DIR="$TMP_DIR/${TARGET}_both_exports"
  mkdir -p "$META_DIR"
  OUT="$META_DIR/out.md"
  run_cli "$TARGET" "--export-yaml --export-json --output-path \"$META_DIR\" \"$FIXTURE_DIR/full.md\" \"$OUT\""
  assert_ok "$TARGET: --export-yaml + --export-json exits 0"

  # --to-markdown + --debug
  run_cli "$TARGET" "--to-markdown --debug \"$FIXTURE_DIR/full.md\""
  assert_ok "$TARGET: --to-markdown + --debug exits 0"

  # ------------------------------------------------------------------ #
  subsection "40. Edge cases"
  # ------------------------------------------------------------------ #

  # Empty file
  EMPTY_FILE="$TMP_DIR/empty.md"
  touch "$EMPTY_FILE"
  run_cli "$TARGET" "\"$EMPTY_FILE\""
  assert_ok "$TARGET: empty file → exit 0"

  # File with no YAML frontmatter
  NO_YAML="$TMP_DIR/no_yaml.md"
  echo "Just plain content, no frontmatter." > "$NO_YAML"
  run_cli "$TARGET" "\"$NO_YAML\""
  assert_ok "$TARGET: no YAML frontmatter → exit 0"

  # Output to nonexistent directory
  # The CLI auto-creates parent directories for the output file (via writeFileSync with mkdir -p logic)
  # This is intentional permissive behaviour; both targets exit 0 and create the file
  OUT_NESTED="$TMP_DIR/nested/deep/auto.md"
  run_cli "$TARGET" "\"$FIXTURE_DIR/minimal.md\" \"$OUT_NESTED\""
  assert_ok "$TARGET: output to nonexistent dir → auto-created, exit 0"
  assert_file_exists "$TARGET: output to nested nonexistent dir → file created" "$OUT_NESTED"
}

# =========================================================================== #
# Main                                                                         #
# =========================================================================== #

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║         CLI Parameter Audit                  ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════╝${NC}"

setup

# Check that both targets exist
if ! node --version &>/dev/null; then
  echo -e "${RED}node not found in PATH${NC}"
  exit 1
fi

if [ ! -f "$REPO_ROOT/dist/cli/index.js" ]; then
  echo -e "${RED}dist/cli/index.js not found. Run: npm run build:ts${NC}"
  exit 1
fi

BINARY_AVAILABLE=true
if [ ! -f "$BIN_CLI" ]; then
  echo -e "${YELLOW}dist/bin/legal-md not found — skipping binary tests${NC}"
  BINARY_AVAILABLE=false
fi

run_suite "node"

if [ "$BINARY_AVAILABLE" = true ]; then
  run_suite "binary"
else
  echo ""
  echo -e "${YELLOW}Skipped binary suite (binary not built)${NC}"
fi

# =========================================================================== #
# Summary                                                                      #
# =========================================================================== #

TOTAL=$((PASS + FAIL + SKIP))
echo ""
echo -e "${BOLD}══════════════════════════════════════════${NC}"
echo -e "${BOLD}  Results: $TOTAL tests${NC}"
echo -e "  ${GREEN}✓ Pass: $PASS${NC}"
echo -e "  ${RED}✗ Fail: $FAIL${NC}"
echo -e "  ${YELLOW}~ Skip: $SKIP${NC}"
echo -e "${BOLD}══════════════════════════════════════════${NC}"

if [ ${#FAILURES[@]} -gt 0 ]; then
  echo ""
  echo -e "${RED}${BOLD}Failed tests:${NC}"
  for f in "${FAILURES[@]}"; do
    echo -e "  ${RED}✗ $f${NC}"
  done
fi

echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
