# Troubleshooting Guide

Comprehensive troubleshooting guide for common issues, debugging strategies, and
performance problems in Legal Markdown JS. This guide helps users and developers
quickly identify and resolve problems.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Common Issues](#common-issues)
- [Error Messages Guide](#error-messages-guide)
- [Debug Mode and Tools](#debug-mode-and-tools)
- [Performance Issues](#performance-issues)
- [Installation Problems](#installation-problems)
- [Configuration Issues](#configuration-issues)
- [Processing Errors](#processing-errors)
- [Output Problems](#output-problems)
- [Advanced Debugging](#advanced-debugging)
- [Getting Help](#getting-help)

## Quick Diagnostics

### First Steps Checklist

When encountering issues, run through this quick checklist:

```bash
# 1. Check Legal Markdown version
legal-md --version

# 2. Verify Node.js version (requires 18+)
node --version

# 3. Run built-in diagnostics
legal-md --validate document.md

# 4. Test with minimal example
echo "# Test" | legal-md --stdin --stdout

# 5. Check for recent changes
git log --oneline -5
```

### Quick Health Check

```bash
# Run comprehensive health check
legal-md --health-check

# Verify installation integrity
npm ls legal-markdown-js

# Check for conflicting dependencies
npm ls | grep -E "(legal|markdown)"

# Test file permissions
legal-md --test-permissions ./
```

### Basic Environment Check

```bash
# Check environment variables
env | grep -i legal

# Verify file system access
ls -la ./templates 2>/dev/null || echo "Templates directory not found"

# Test memory and disk space
df -h .
free -h 2>/dev/null || vm_stat
```

## Common Issues

### 1. File Not Found Errors

**Problem**: `Error: File not found: ./template.md`

**Causes and Solutions**:

```bash
# Check file exists and has correct permissions
ls -la ./template.md

# Verify current working directory
pwd
ls -la

# Use absolute path
legal-md /full/path/to/template.md output.pdf

# Check file permissions
chmod +r ./template.md
```

**Debug with**:

```bash
# Enable verbose output
legal-md --verbose template.md

# Test file access
legal-md --test-file-access template.md
```

### 2. YAML Parsing Errors

**Problem**: `YamlParsingError: Invalid YAML syntax`

**Common YAML Issues**:

```yaml
# ❌ Bad: Mixed tabs and spaces
---
title: "Contract"
 amount: 50000    # Tab used here
---

# ✅ Good: Consistent spacing
---
title: "Contract"
amount: 50000
---

# ❌ Bad: Unquoted special characters
---
title: Contract: Terms & Conditions
email: user@domain.com
---

# ✅ Good: Quoted special characters
---
title: "Contract: Terms & Conditions"
email: "user@domain.com"
---

# ❌ Bad: Improper list formatting
---
services:
- Consulting
 - Analysis    # Wrong indentation
---

# ✅ Good: Proper list formatting
---
services:
  - Consulting
  - Analysis
---
```

**Debug YAML**:

```bash
# Validate YAML syntax only
legal-md --validate-yaml document.md

# Extract and test YAML
legal-md --extract-yaml document.md > test.yaml
legal-md --test-yaml test.yaml

# Use YAML linter
npm install -g yaml-lint
yaml-lint document.md
```

### 3. Template Field Issues

**Problem**: Template fields not processing or showing as `{{field_name}}`

**Debugging Steps**:

```bash
# 1. Check field definitions
legal-md --list-fields document.md

# 2. Validate field names
legal-md --validate-fields document.md

# 3. Test with simple template
echo '---
name: "Test"
---
Hello {{name}}!' | legal-md --stdin --stdout

# 4. Debug field resolution
legal-md --debug-fields document.md
```

**Common Field Problems**:

```markdown
<!-- ❌ Bad: Undefined field -->

Client: {{client_nam}} <!-- Typo: should be client_name -->

<!-- ❌ Bad: Invalid characters -->

Amount: {{contract-value}} <!-- Use underscore: contract_value -->

<!-- ❌ Bad: Nested braces -->

Result: {{{{calculation}}}} <!-- Should be: {{calculation}} -->

<!-- ✅ Good: Proper field reference -->

Client: {{client_name}} Amount: {{contract_value}} Result: {{calculation}}
```

### 4. Import Problems

**Problem**: `ImportError: Cannot resolve import './sections/terms.md'`

**Debugging Imports**:

```bash
# 1. Verify import path
ls -la ./sections/terms.md

# 2. Check relative path resolution
legal-md --debug-imports document.md

# 3. Test import individually
legal-md ./sections/terms.md

# 4. Validate import syntax
grep "@@include" document.md
```

**Import Best Practices**:

```markdown
<!-- ✅ Good: Relative paths -->

@@include ./sections/definitions.md @@include ../common/signatures.md

<!-- ❌ Bad: Absolute paths (security risk) -->

@@include /etc/passwd @@include C:\Windows\System32\config

<!-- ✅ Good: Consistent path format -->

@@include ./terms.md @@include ./conditions.md

<!-- ❌ Bad: Mixed path separators -->

@@include ./terms.md @@include .\conditions.md
```

### 5. Output Generation Problems

**Problem**: Generated PDF/HTML is empty or malformed

**Debugging Output**:

```bash
# 1. Test with markdown output first
legal-md document.md output.md

# 2. Verify content processing
legal-md --debug --no-output document.md

# 3. Test output formats individually
legal-md --html document.md test.html
legal-md --pdf document.md test.pdf

# 4. Check output directory permissions
ls -la output/
mkdir -p output && chmod 755 output
```

## Error Messages Guide

### YamlParsingError

```text
YamlParsingError: bad indentation of a mapping entry at line 5, column 3
```

**Solution**:

1. Check line 5 in YAML frontmatter
2. Ensure consistent indentation (spaces only)
3. Verify proper YAML structure

```bash
# Extract and validate YAML
sed -n '/^---$/,/^---$/p' document.md | legal-md --validate-yaml --stdin
```

### TemplateError

```text
TemplateError: Template processing failed for field 'client_name': field not found
```

**Solution**:

1. Add field to YAML frontmatter
2. Check for typos in field name
3. Verify field name uses valid characters

```yaml
---
# Add missing field
client_name: 'Acme Corporation'
---
```

### CircularReferenceError

```text
CircularReferenceError: Circular reference detected: document.md -> terms.md -> document.md
```

**Solution**:

1. Review import chain
2. Remove circular imports
3. Restructure document hierarchy

```bash
# Visualize import dependencies
legal-md --show-dependencies document.md
```

### SecurityError

```text
SecurityError: Path traversal detected in import: ../../../etc/passwd
```

**Solution**:

1. Use relative paths within project
2. Avoid directory traversal (`../`)
3. Configure allowed paths

```bash
# Configure allowed paths
legal-md --allowed-paths ./templates:./sections document.md
```

### WriteError

```text
WriteError: Permission denied writing to /protected/output.pdf
```

**Solution**:

1. Check output directory permissions
2. Verify disk space
3. Use writable output path

```bash
# Fix permissions
chmod 755 output/
# Check disk space
df -h .
```

## Debug Mode and Tools

### Enable Debug Mode

```bash
# Basic debug mode
legal-md --debug document.md

# Verbose debug output
legal-md --debug --verbose document.md

# Debug specific components
legal-md --debug-yaml --debug-imports --debug-fields document.md

# Debug with performance profiling
legal-md --debug --profile document.md
```

### Debug Output Analysis

```bash
# Save debug output for analysis
legal-md --debug document.md 2> debug.log

# Filter debug information
grep -E "(ERROR|WARN|DEBUG)" debug.log

# Extract timing information
grep "Duration:" debug.log | sort -k2 -n
```

### Built-in Diagnostic Tools

```bash
# Comprehensive system diagnostics
legal-md --diagnostics

# Test specific functionality
legal-md --test-yaml-parser
legal-md --test-import-resolver
legal-md --test-template-engine

# Benchmark performance
legal-md --benchmark document.md
```

### Custom Debug Configuration

```yaml
# debug-config.yml
debug:
  enabled: true
  level: 'verbose'
  components:
    - yaml-parser
    - template-engine
    - import-resolver
  output:
    file: './debug.log'
    console: true
  performance:
    enabled: true
    threshold: 100 # milliseconds
```

```bash
# Use custom debug configuration
legal-md --debug-config debug-config.yml document.md
```

## Performance Issues

### Slow Processing

**Symptoms**:

- Processing takes longer than 30 seconds
- High CPU usage
- System becomes unresponsive

**Diagnosis**:

```bash
# 1. Profile processing time
time legal-md document.md output.pdf

# 2. Monitor resource usage
# On Linux/macOS:
top -p $(pgrep legal-md)
# On macOS:
ps aux | grep legal-md

# 3. Analyze document complexity
legal-md --analyze-complexity document.md

# 4. Test with simplified version
legal-md --no-imports --no-mixins document.md output.pdf
```

**Solutions**:

```bash
# Enable performance optimizations
legal-md --optimize-performance document.md

# Use streaming processing for large files
legal-md --stream-processing large-document.md

# Disable field tracking for production
legal-md --no-field-tracking document.md final.pdf

# Process in batch mode
legal-md --batch *.md --output-dir ./processed/
```

### Memory Issues

**Symptoms**:

- Out of memory errors
- System swap usage increases
- Processing fails on large documents

**Diagnosis**:

```bash
# Monitor memory usage
legal-md --memory-monitor document.md

# Check document size
ls -lh document.md
wc -l document.md

# Test with memory limits
legal-md --max-memory 512MB document.md
```

**Solutions**:

```bash
# Use chunked processing
legal-md --chunk-size 1MB large-document.md

# Enable garbage collection
legal-md --gc-aggressive document.md

# Process in separate process
timeout 300 legal-md document.md || echo "Processing timeout"
```

### I/O Bottlenecks

**Symptoms**:

- Slow file operations
- Import delays
- Network timeout on remote imports

**Diagnosis**:

```bash
# Check disk performance
iostat -x 1 5  # Linux
# or
iotop           # If available

# Test file access speed
time ls -la ./templates/

# Monitor import resolution
legal-md --debug-imports --time-imports document.md
```

**Solutions**:

```bash
# Use local imports only
legal-md --local-imports-only document.md

# Cache imports
legal-md --cache-imports --cache-dir ./cache document.md

# Parallel import processing
legal-md --parallel-imports document.md
```

## Installation Problems

### Node.js Version Issues

**Problem**: `Error: Node.js version 16.x is not supported`

**Solution**:

```bash
# Check current Node.js version
node --version

# Install/update Node.js (using nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Or using package manager
# Ubuntu/Debian:
sudo apt update && sudo apt install nodejs npm

# macOS:
brew install node@18
```

### Package Installation Issues

**Problem**: `npm ERR! peer dep missing: remark@^14.0.0`

**Solution**:

```bash
# Clear npm cache
npm cache clean --force

# Reinstall with peer dependencies
npm install --legacy-peer-deps

# Or install specific versions
npm install remark@^14.0.0 legal-markdown-js

# Use yarn as alternative
yarn install
```

### Global vs Local Installation

**Problem**: Command not found after installation

**Solution**:

```bash
# Check global installation
npm list -g legal-markdown-js

# Install globally if needed
npm install -g legal-markdown-js

# Or use npx for local installation
npx legal-markdown-js document.md

# Check PATH
echo $PATH | grep npm
```

### Permission Issues

**Problem**: `EACCES: permission denied`

**Solution**:

```bash
# Fix npm permissions
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH

# Or use sudo (not recommended)
sudo npm install -g legal-markdown-js

# Better: use nvm for user-level installation
nvm use 18
npm install -g legal-markdown-js
```

## Configuration Issues

### Config File Problems

**Problem**: Configuration not loading or invalid

**Diagnosis**:

```bash
# Check config file location
legal-md --config-path

# Validate configuration
legal-md --validate-config

# Use default config
legal-md --default-config document.md

# Debug config loading
legal-md --debug-config document.md
```

**Common Config Issues**:

```json
// ❌ Bad: Invalid JSON
{
  "outputFormat": "pdf",
  "enableFieldTracking": true,  // Trailing comma
}

// ✅ Good: Valid JSON
{
  "outputFormat": "pdf",
  "enableFieldTracking": true
}

// ❌ Bad: Wrong data types
{
  "maxFileSize": "10MB",  // Should be number
  "enableDebug": "true"   // Should be boolean
}

// ✅ Good: Correct data types
{
  "maxFileSize": 10485760,
  "enableDebug": true
}
```

### Environment Variables

**Problem**: Environment configuration not working

**Check Environment**:

```bash
# List Legal Markdown environment variables
env | grep -i legal

# Check specific variables
echo $LEGAL_MD_CONFIG_PATH
echo $LEGAL_MD_DEBUG
echo $LEGAL_MD_TEMPLATE_PATH

# Set environment variables
export LEGAL_MD_DEBUG=true
export LEGAL_MD_CONFIG_PATH=./config.json
```

## Processing Errors

### Template Engine Errors

**Problem**: Helper functions not working

**Diagnosis**:

```bash
# List available helpers
legal-md --list-helpers

# Test helper individually
echo '{{formatDate("2025-08-01", "DD/MM/YYYY")}}' | legal-md --test-helper --stdin

# Debug helper execution
legal-md --debug-helpers document.md
```

**Helper Issues**:

```markdown
<!-- ❌ Bad: Wrong syntax -->

{{formatDate(contract_date, DD/MM/YYYY)}} <!-- Missing quotes -->

<!-- ❌ Bad: Unknown helper -->

{{calculateTax(amount, rate)}} <!-- Helper doesn't exist -->

<!-- ✅ Good: Correct syntax -->

{{formatDate(contract_date, "DD/MM/YYYY")}}

<!-- ✅ Good: Available helper -->

{{formatCurrency(amount, "EUR")}}
```

### Import Resolution Errors

**Problem**: Cannot resolve imports despite files existing

**Debug Steps**:

```bash
# Check import resolution
legal-md --trace-imports document.md

# Test import path resolution
legal-md --resolve-path "./sections/terms.md" --base-path "."

# Verify file encoding
file document.md sections/terms.md

# Check for hidden characters
cat -A document.md | grep "@@include"
```

### Field Resolution Errors

**Problem**: Fields showing as `{{field_name}}` in output

**Debug Process**:

```bash
# 1. List all fields in document
legal-md --extract-fields document.md

# 2. Show field values
legal-md --show-field-values document.md

# 3. Test field resolution
legal-md --test-fields document.md

# 4. Debug YAML parsing
legal-md --debug-yaml document.md
```

## Output Problems

### PDF Generation Issues

**Problem**: PDF output is blank or corrupted

**Solutions**:

```bash
# Test HTML generation first
legal-md --html document.md test.html

# Use alternative PDF engine
legal-md --pdf-engine puppeteer document.md output.pdf

# Check for PDF dependencies
legal-md --check-pdf-deps

# Generate with debug info
legal-md --pdf --debug-pdf document.md debug.pdf
```

### HTML Rendering Issues

**Problem**: HTML output has broken formatting

**Debug Steps**:

```bash
# Validate HTML structure
legal-md --html --validate-html document.md

# Test CSS loading
legal-md --html --inline-css document.md

# Check for encoding issues
legal-md --html --encoding utf-8 document.md

# Debug field highlighting
legal-md --html --debug-highlighting document.md
```

### Character Encoding Problems

**Problem**: Special characters not displaying correctly

**Solutions**:

```bash
# Specify input encoding
legal-md --input-encoding utf-8 document.md

# Force output encoding
legal-md --output-encoding utf-8 document.md

# Check file encoding
file -i document.md

# Convert encoding if needed
iconv -f windows-1252 -t utf-8 document.md > document-utf8.md
```

## Advanced Debugging

### Network Debugging

For remote imports or API integrations:

```bash
# Enable network debugging
export DEBUG=legal-md:network
legal-md document.md

# Test network connectivity
curl -I https://templates.example.com/terms.md

# Use proxy if needed
export HTTP_PROXY=http://proxy.company.com:8080
legal-md document.md
```

### Memory Profiling

For memory leak investigation:

```bash
# Generate heap snapshot
legal-md --heap-snapshot document.md

# Profile memory usage
legal-md --memory-profile document.md

# Monitor memory over time
while true; do
  ps -o pid,vsz,rss,comm -p $(pgrep legal-md)
  sleep 1
done
```

### Performance Profiling

For detailed performance analysis:

```bash
# Generate performance profile
legal-md --performance-profile document.md

# Use Node.js profiler
node --prof `which legal-md` document.md
node --prof-process isolate-*.log > profile.txt

# Benchmark against baseline
legal-md --benchmark --baseline ./benchmarks/ document.md
```

### Log Analysis

Analyzing debug logs for patterns:

```bash
# Extract error patterns
grep -E "(ERROR|FATAL)" debug.log | sort | uniq -c

# Timing analysis
grep "Duration:" debug.log | awk '{sum+=$2; count++} END {print "Average:", sum/count "ms"}'

# Memory usage patterns
grep "Memory:" debug.log | tail -20

# Find performance bottlenecks
grep "Duration:" debug.log | sort -k2 -nr | head -10
```

## Getting Help

### Self-Service Resources

1. **Documentation**: Check relevant sections
   - [Configuration Guide](../advanced/configuration.md)
   - [Error Handling](../advanced/error-handling.md)
   - [Performance Guide](../processing/performance.md)

2. **Built-in Help**:

   ```bash
   legal-md --help
   legal-md --help-examples
   legal-md --troubleshoot
   ```

3. **Online Resources**:
   - GitHub Issues: Search existing issues
   - Documentation: Check latest updates
   - Community Forums: Ask questions

### Diagnostic Information to Collect

When reporting issues, include:

```bash
# System information
legal-md --version
node --version
npm --version
uname -a  # or system info

# Configuration
legal-md --show-config

# Error reproduction
legal-md --debug document.md 2>&1 | tee error.log

# File information
ls -la document.md
file document.md
head -20 document.md
```

### Issue Reporting Template

```markdown
## Problem Description

Brief description of the issue.

## Environment

- Legal Markdown JS version:
- Node.js version:
- Operating System:
- Installation method:

## Steps to Reproduce

1. Create file with content...
2. Run command...
3. Observe error...

## Expected Behavior

What should happen.

## Actual Behavior

What actually happens.

## Debug Information
```

Attach debug.log file

```log

## Error Logs
```

Paste relevant error messages

```text

## Additional Context
Any other relevant information.
```

### Emergency Troubleshooting

When everything fails:

```bash
# 1. Complete reset
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# 2. Use minimal configuration
legal-md --no-config --default-options document.md

# 3. Test with minimal document
echo -e "---\ntitle: Test\n---\n# {{title}}" | legal-md --stdin --stdout

# 4. Reinstall from scratch
npm uninstall -g legal-markdown-js
npm install -g legal-markdown-js@latest

# 5. Check for system issues
npm doctor
node -e "console.log('Node.js working')"
```

### Getting Community Help

1. **GitHub Discussions**: For questions and community support
2. **Stack Overflow**: Tag questions with `legal-markdown-js`
3. **Discord/Slack**: Real-time community chat (if available)
4. **Documentation Issues**: Report doc problems on GitHub

Remember to search existing issues before creating new ones, and provide
complete diagnostic information to help maintainers assist you quickly.

## See Also

- [Error Handling](../advanced/error-handling.md) - Comprehensive error handling
  strategies
- [Performance Guide](../processing/performance.md) - Performance optimization
  and troubleshooting
- [Configuration](../advanced/configuration.md) - Configuration options and
  examples
- [Security](security.md) - Security-related troubleshooting
- [Development Guide](../development/development-guide.md) - Development
  environment setup
