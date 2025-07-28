# Frontmatter Merging Examples

This directory demonstrates the frontmatter merging feature that automatically
combines YAML metadata from imported files using a "source always wins"
strategy.

## 📋 What this example demonstrates

- **Frontmatter Merging**: Automatic merging of YAML frontmatter from imported
  files
- **Source Always Wins**: Main document metadata takes precedence over imports
- **Granular Merging**: Property-level merging for nested objects
- **Sequential Processing**: First import wins over subsequent imports for
  conflicts
- **Reserved Fields Filtering**: Security protection against system
  configuration override
- **Type Validation**: Optional type safety during merge operations

## 📁 File Structure

```
frontmatter-merging/
├── README.md                     # This file
├── run.sh                        # Demo script
├── main-contract.md              # Main document with imports
├── components/                   # Reusable contract components
│   ├── standard-terms.md         # Standard legal terms with metadata
│   ├── client-info.md            # Client-specific information
│   └── service-levels.md         # Service level agreements
├── templates/                    # Document templates
│   ├── basic-service-agreement.md
│   └── complex-enterprise-contract.md
└── output/                       # Generated files
    ├── merged-contract.md
    ├── contract-metadata.json
    └── contract-metadata.yaml
```

## 🚀 Quick Start

Run the complete demo:

```bash
./run.sh
```

Or process individual examples:

```bash
# Basic frontmatter merging
npx legal-markdown main-contract.md --output output/merged-contract.md

# Export merged metadata
npx legal-markdown main-contract.md --export-metadata --export-format json

# Disable frontmatter merging (comparison)
npx legal-markdown main-contract.md --disable-frontmatter-merge --output output/no-merge.md

# Enable type validation and logging
npx legal-markdown main-contract.md --validate-import-types --log-import-operations
```

## 🔍 Key Features Demonstrated

### 1. Basic Frontmatter Merging

**Main Document** (`main-contract.md`):

```yaml
---
title: "Professional Services Agreement"
parties:
  provider: "TechServices Inc."
  client: "Default Client"  # Will be overridden by import
liability_cap: 500000       # Main document wins over imports
---

# {{title}}

@import components/client-info.md
@import components/standard-terms.md
```

**Imported Component** (`components/client-info.md`):

```yaml
---
client:
  name: "Acme Corporation"     # Overrides main document
  industry: "Manufacturing"   # New field, added to metadata
contact:
  email: "legal@acme.com"     # New nested structure
liability_cap: 2000000        # Loses to main document
---

**Client:** {{client.name}} ({{client.industry}})
**Contact:** {{contact.email}}
```

**Result**: Main document's `liability_cap: 500000` wins, but `client.name` and
other non-conflicting fields are merged.

### 2. Granular Property-Level Merging

```yaml
# Main document
config:
  debug: true
  server: "production"

# Import
config:
  debug: false      # Conflict - main wins
  database: "mysql" # New field - added

# Result
config:
  debug: true         # From main (wins conflict)
  server: "production" # From main (preserved)
  database: "mysql"   # From import (added)
```

### 3. Sequential Import Processing

```yaml
# main.md
shared_field: "main_value"

# @import first.md
shared_field: "first_value"  # Loses to main
new_field: "from_first"

# @import second.md
shared_field: "second_value" # Loses to main
new_field: "from_second"     # Loses to first import

# Result
shared_field: "main_value"   # Main wins
new_field: "from_first"      # First import wins
```

### 4. Reserved Fields Security

```yaml
# Malicious import attempt
level-one: 'HACKED %n' # Filtered out (security)
force_commands: 'rm -rf /' # Filtered out (security)
meta-yaml-output: '/etc/passwd' # Filtered out (security)
legitimate_field: 'safe value' # Allowed through

# Result: Only legitimate_field is merged
```

### 5. Type Validation

```yaml
# Main document
count: 42
config: { debug: true }

# Import with type conflicts
count: "not a number"    # Type conflict - main value preserved
config: "not an object"  # Type conflict - main value preserved
valid_field: "string"    # No conflict - added

# Result with --validate-import-types
count: 42                # Preserved (type conflict warning logged)
config: { debug: true }  # Preserved (type conflict warning logged)
valid_field: "string"    # Added (no conflict)
```

## 🎯 Use Cases

### Legal Document Assembly

- **Standard Terms**: Common clauses with default values
- **Client Terms**: Client-specific overrides and additions
- **Project Terms**: Project-specific parameters
- **Regulatory Terms**: Jurisdiction-specific requirements

### Template Composition

- **Base Templates**: Core document structure
- **Component Library**: Reusable sections with metadata
- **Customization Layers**: Client/project specific modifications
- **Compliance Overlays**: Industry-specific requirements

### Configuration Management

- **Default Settings**: Base configuration in main document
- **Environment Overrides**: Environment-specific imports
- **Feature Flags**: Conditional functionality metadata
- **User Preferences**: Personalization through imports

## ⚙️ Configuration Options

| Option                        | Description                               | Default           |
| ----------------------------- | ----------------------------------------- | ----------------- |
| `--disable-frontmatter-merge` | Disable automatic frontmatter merging     | `false` (enabled) |
| `--validate-import-types`     | Validate type compatibility during merge  | `false`           |
| `--log-import-operations`     | Log detailed merge operations             | `false`           |
| `--import-tracing`            | Add HTML comments around imported content | `false`           |

## 🔧 Advanced Usage

### Custom Merge Validation

```bash
# Process with strict type validation
npx legal-markdown contract.md \
  --validate-import-types \
  --log-import-operations \
  --output validated-contract.md
```

### Debug Import Processing

```bash
# Enable tracing and logging for debugging
npx legal-markdown contract.md \
  --import-tracing \
  --log-import-operations \
  --output traced-contract.md
```

### Security-First Processing

```bash
# Ensure no reserved fields leak through
npx legal-markdown contract.md \
  --validate-import-types \
  --log-import-operations \
  --export-metadata \
  --export-format json
```

## 🚨 Security Considerations

The frontmatter merging system includes built-in security protections:

- **Reserved Field Filtering**: Prevents override of system configuration
- **Type Validation**: Detects and prevents type confusion attacks
- **Timeout Protection**: Prevents infinite loops from circular references
- **Sanitized Logging**: Safe logging without exposing sensitive data

### Reserved Fields (Automatically Filtered)

- `level-one`, `level-two`, etc. (header configuration)
- `force_commands`, `commands` (command injection prevention)
- `meta-yaml-output`, `meta-json-output` (path traversal prevention)
- `pipeline-config` (system configuration protection)

## 📚 Related Examples

- [Basic Imports](../partial-imports/) - Simple file inclusion without metadata
- [Nested Imports](../nested-imports/) - Complex import hierarchies
- [Optional Clauses](../../optional-clauses/) - Conditional content rendering
- [Metadata Export](../../output-formats/metadata-export/) - Working with merged
  metadata

## 💡 Tips and Best Practices

1. **Structure Hierarchy**: Put most general settings in main document
2. **Use Descriptive Names**: Name import files by their purpose
3. **Document Precedence**: Comment which fields should win conflicts
4. **Validate Types**: Use `--validate-import-types` in CI/CD
5. **Security First**: Never import untrusted content without validation
6. **Test Thoroughly**: Verify merged metadata matches expectations
