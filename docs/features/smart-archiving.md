# Smart Archiving

Legal Markdown JS features an intelligent archiving system that automatically
organizes processed files based on content analysis. The system compares
original and processed content to determine the optimal archiving strategy,
ensuring both templates and results are preserved appropriately.

## Table of Contents

- [Overview](#overview)
- [Archive Logic](#archive-logic)
- [Content Comparison](#content-comparison)
- [Archive Scenarios](#archive-scenarios)
- [Configuration and Usage](#configuration-and-usage)
- [Archive Features](#archive-features)
- [Use Cases](#use-cases)
- [Best Practices](#best-practices)

## Overview

The smart archiving system automatically decides whether to save one or two
versions of your documents based on whether processing changed the content. This
intelligent approach ensures:

- **Template preservation** for reusable documents
- **Result preservation** for processed outputs
- **Storage efficiency** by avoiding unnecessary duplicates
- **Clear organization** with descriptive file naming

### Key Benefits

- **Automatic Decision Making**: No manual choices needed
- **Template Safety**: Original templates are never lost
- **Audit Trail**: Complete record of processing results
- **Storage Optimization**: Eliminates redundant file storage

## Archive Logic

The smart archiving system makes decisions based on content comparison:

```typescript
// Smart archiving workflow
const originalContent = readFile('document.md');
const processedContent = processLegalMarkdown(originalContent);

if (contentsAreIdentical(originalContent, processedContent)) {
  // Archive only the original file
  archive('document.md' → 'archive/document.md');
} else {
  // Archive both versions with clear suffixes
  archive('document.md' → 'archive/document.ORIGINAL.md');   // Template
  writeFile('archive/document.PROCESSED.md', processedContent); // Result
}
```

### Decision Tree

```text
Document Processing
       │
       ▼
Content Comparison
       │
   ┌───┴───┐
   ▼       ▼
Identical Different
   │       │
   ▼       ▼
Single   Dual
Archive  Archive
```

## Content Comparison

The system performs intelligent content comparison that:

- **Normalizes line endings** (handles Windows/Unix differences)
- **Trims whitespace** (ignores formatting differences)
- **Compares actual content** (focuses on meaningful changes)

```typescript
// Content normalization for comparison
function areContentsIdentical(content1: string, content2: string): boolean {
  const normalize = (content: string) => content.replace(/\r\n/g, '\n').trim();
  return normalize(content1) === normalize(content2);
}
```

### Comparison Features

- **Cross-platform compatibility**: Handles different line ending formats
- **Whitespace tolerance**: Ignores insignificant formatting changes
- **Content focus**: Detects meaningful content modifications
- **Binary safety**: Works with various file encodings

## Archive Scenarios

### Scenario 1: Static Documents

For documents where processing doesn't change the content (e.g., documents with
only frontmatter):

```yaml
---
title: Legal Notice
client: Acme Corp
date: 2024-01-01
---
# Legal Notice

This is a static legal notice.
```

**Archive Result**:

```bash
archive/legal-notice.md  # Single file - template is preserved
```

The document contains no template variables, imports, or conditional content, so
processing produces identical output.

### Scenario 2: Template Documents

For documents with imports, mixins, or variable substitution:

```yaml
---
title: Service Agreement
client: Acme Corp
effective_date: 2024-01-01
---
# {{title}}

@import clauses/standard-terms.md

This agreement between Legal Services Inc. and {{client}}
is effective {{formatDate(effective_date, "MMMM Do, YYYY")}}.

[Confidentiality clause applies]{client.confidentiality_required}
```

**Archive Result**:

```bash
archive/service-agreement.ORIGINAL.md   # Template file
archive/service-agreement.PROCESSED.md  # Processed result
```

The document contains template variables and imports, so processing produces
different output that needs to be preserved separately.

### Scenario 3: Conflict Resolution

When files with the same name already exist in the archive:

```bash
# First document
legal-md contract.md --archive-source ./archive
# Creates: archive/contract.md

# Second document with same name
legal-md contract.md --archive-source ./archive
# Creates: archive/contract_1.md (automatic renaming)

# With different content (template processing)
legal-md template.md --archive-source ./archive
# Creates: archive/template.ORIGINAL_1.md
#          archive/template.PROCESSED_1.md
```

### Scenario 4: Complex Templates

For documents with multiple template features:

```yaml
---
clients:
  - name: "Acme Corp"
    premium: true
  - name: "Beta Inc"
    premium: false
base_rate: 500
---

@import headers/legal-header.md

{{#clients}}
## Service Agreement for {{name}}

Rate: {{formatCurrency(base_rate, "USD")}}
{{#if premium}}
- Premium support included
- 24/7 availability
{{/if}}

{{/clients}}
```

**Archive Result**: Dual archiving (template + processed) due to multiple
dynamic elements.

## Configuration and Usage

### Basic Usage

```bash
# Enable smart archiving with default directory
legal-md document.md --archive-source

# Custom archive directory
legal-md document.md --archive-source ./completed

# With PDF generation
legal-md document.md --pdf --highlight --archive-source ./processed
```

### Environment Configuration

```bash
# Set default archive directory
export ARCHIVE_DIR="./processed-documents"

# Use default directory
legal-md document.md --archive-source
```

### Programmatic Usage

```typescript
import { CliService } from 'legal-markdown-js';

const cliService = new CliService({
  archiveSource: './archive',
});

// Smart archiving happens automatically
await cliService.processFile('template.md', 'output.md');
```

### Advanced Configuration

```bash
# Archive with metadata export
legal-md template.md --archive-source ./archive --export-yaml --export-json

# Archive with custom CSS and formatting
legal-md template.md --archive-source ./archive --css custom.css --pdf --highlight

# Force archiving for debugging
legal-md template.md --archive-source ./debug --debug
```

## Archive Features

### Core Features

- **Intelligent Decision Making**: Automatically determines whether to archive
  one or two files
- **Template Preservation**: Keeps original templates intact for reuse
- **Result Preservation**: Saves processed content for reference
- **Clear Naming**: Uses `.ORIGINAL` and `.PROCESSED` suffixes for clarity
- **Conflict Resolution**: Automatic renaming when files already exist
- **Error Handling**: Graceful handling of archive failures
- **Cross-Platform**: Works consistently across different operating systems

### File Naming Convention

| Scenario         | Original File | Archive Result                                                         |
| ---------------- | ------------- | ---------------------------------------------------------------------- |
| No changes       | `document.md` | `archive/document.md`                                                  |
| With changes     | `document.md` | `archive/document.ORIGINAL.md` and `archive/document.PROCESSED.md`     |
| Name conflict    | `document.md` | `archive/document_1.md`                                                |
| Complex conflict | `document.md` | `archive/document.ORIGINAL_1.md` and `archive/document.PROCESSED_1.md` |

### Metadata Preservation

When archiving, the system preserves:

- **Original YAML frontmatter** in `.ORIGINAL` files
- **Processed metadata** in accompanying files
- **File timestamps** and basic metadata
- **Directory structure** relationships

## Use Cases

### Document Template Management

```bash
# Process multiple templates
for template in templates/*.md; do
  legal-md "$template" --pdf --archive-source ./completed
done
# Templates with imports → dual archiving
# Static templates → single archiving
```

This approach allows you to:

- Maintain template libraries
- Preserve processing results
- Track template evolution
- Support template reuse

### Workflow Integration

```bash
# Process and archive in production pipeline
legal-md contract-template.md --pdf --highlight --archive-source ./production-archive
# Preserves both template (for future use) and result (for records)
```

Benefits for workflows:

- **Audit compliance**: Complete processing history
- **Template reuse**: Original templates remain available
- **Result tracking**: Processed outputs are preserved
- **Quality assurance**: Compare inputs and outputs

### Quality Assurance

```bash
# Archive for review and compliance
legal-md legal-document.md --pdf --export-json --archive-source ./compliance
# Smart archiving helps maintain audit trail
```

QA applications:

- **Compliance audits**: Complete document history
- **Process validation**: Verify template processing
- **Change tracking**: Monitor document evolution
- **Backup strategy**: Automated document preservation

### Batch Processing

```bash
# Process entire directories with archiving
find ./contracts -name "*.md" -exec legal-md {} --pdf --archive-source ./processed-contracts \;
```

Batch benefits:

- **Efficient processing**: Handle multiple documents
- **Consistent archiving**: Uniform organization
- **Storage optimization**: Intelligent space usage
- **Scalable workflows**: Handle large document sets

### Development and Testing

```bash
# Archive with debug information
legal-md test-template.md --archive-source ./debug --debug --export-yaml

# Compare processing results
diff ./debug/test-template.ORIGINAL.md ./debug/test-template.PROCESSED.md
```

Development advantages:

- **Template debugging**: Compare inputs and outputs
- **Processing verification**: Validate template logic
- **Performance testing**: Track processing changes
- **Regression testing**: Ensure consistent results

## Best Practices

### 1. Archive Directory Organization

Structure your archive directories logically:

```bash
archives/
├── production/        # Live document processing
├── staging/          # Testing and validation
├── development/      # Template development
└── compliance/       # Audit and regulatory
```

### 2. Archive Naming Strategy

Use descriptive archive directory names:

```bash
# ✅ Good - descriptive purposes
--archive-source ./completed-contracts
--archive-source ./processed-invoices
--archive-source ./compliance-archive

# ❌ Avoid - generic names
--archive-source ./archive
--archive-source ./files
--archive-source ./done
```

### 3. Regular Archive Maintenance

```bash
# Periodic cleanup of old archives
find ./archives -name "*.md" -mtime +365 -delete

# Compress old archives
tar -czf archives-2023.tar.gz ./archives/2023/
```

### 4. Integration with Version Control

```bash
# Archive to version-controlled directory
legal-md template.md --archive-source ./git-tracked-archives

# Exclude from git if too large
echo "large-archives/" >> .gitignore
```

### 5. Backup Strategy

```bash
# Regular archive backups
rsync -av ./archives/ ./backup/archives/

# Cloud backup integration
aws s3 sync ./archives/ s3://legal-document-archives/
```

### 6. Monitoring and Logging

```bash
# Log archiving operations
legal-md template.md --archive-source ./archive --debug 2>&1 | tee archive.log

# Monitor archive directory sizes
du -sh ./archives/*/
```

### 7. Access Control

```bash
# Set appropriate permissions
chmod 750 ./archives/
chmod 640 ./archives/*.md

# Restrict access to sensitive archives
chown legal-team:legal-group ./archives/compliance/
```

## Integration with Other Features

### With Export Features

```bash
# Archive with metadata export
legal-md contract.md --archive-source ./archive --export-yaml --export-json
```

Result:

```text
archive/contract.ORIGINAL.md
archive/contract.PROCESSED.md
archive/contract.yaml
archive/contract.json
```

### With PDF Generation

```bash
# Archive with PDF output
legal-md template.md --pdf --archive-source ./archive
```

PDF files are also archived alongside markdown files.

### With Force Commands

Templates with force commands are intelligently archived:

```yaml
---
title: 'Auto-configured Document'
force_commands: '--pdf --highlight --archive-source ./auto-archive'
---
```

The force commands trigger archiving automatically.

## Troubleshooting

### Common Issues

**Archive directory creation fails:**

```bash
# Ensure parent directory exists
mkdir -p ./path/to/archive
legal-md document.md --archive-source ./path/to/archive
```

**Permission denied:**

```bash
# Check directory permissions
ls -la ./archive/
chmod 755 ./archive/
```

**Disk space issues:**

```bash
# Check available space
df -h ./archive/
# Clean old archives if needed
```

### Debug Mode

```bash
# Enable debug output for archiving
legal-md document.md --archive-source ./archive --debug
```

This shows:

- Content comparison results
- Archive decision reasoning
- File operation details
- Error messages and warnings

## See Also

- [CLI Reference](../cli_reference.md) - Archive-related command options
- [Force Commands](force-commands.md) - Auto-archiving with force commands
- [YAML Frontmatter](yaml-frontmatter.md) - Metadata that affects archiving
  decisions
- [Partial Imports](partial-imports.md) - Import processing affects archiving
  strategy
