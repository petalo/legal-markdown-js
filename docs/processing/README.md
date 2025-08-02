# Processing Details Overview

Technical documentation about how Legal Markdown JS processes documents and
handles various content types.

## Processing Topics

- [Remark Processing](remark-processing.md) - Modern AST-based processing engine
- [Field Tracking](field-tracking.md) - Variable tracking and highlighting
  details
- [Performance](performance.md) - Optimization strategies and memory management

## Processing Modes

### Legacy Mode

- String-based processing
- Compatible with Ruby LegalMarkdown
- Field tracking disabled by default for markdown output

### Remark Mode (Recommended)

- AST-based processing
- Improved accuracy and performance
- Advanced field tracking capabilities

## Quick Comparison

| Feature        | Legacy Mode | Remark Mode        |
| -------------- | ----------- | ------------------ |
| Performance    | Standard    | Optimized          |
| Field Tracking | Basic       | Advanced           |
| Text Accuracy  | Good        | Excellent          |
| Future Support | Maintenance | Active Development |

## Navigation

- [← Advanced Topics](../advanced/README.md)
- [← Back to Documentation](../README.md)
- [Development →](../development/README.md)
