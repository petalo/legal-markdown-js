# Overview

Legal Markdown JS is a Node.js implementation of the Legal Markdown document
processing system with full TypeScript support. The system processes legal
documents written in a specialized markdown format, providing features like YAML
front matter parsing, structured headers, optional clauses, cross-references,
and advanced document generation.

## System Purpose

Legal Markdown JS transforms legal documents from structured markdown into
various output formats while maintaining document integrity and providing
advanced features for legal document management. The system is designed to
handle complex legal document requirements including:

- **Template Field Processing**: Dynamic content insertion based on YAML front
  matter
- **Structured Headers**: Hierarchical document organization with automatic
  numbering
- **Optional Clauses**: Conditional content inclusion based on boolean flags
- **Cross-References**: Internal document linking and reference management
- **Field Tracking**: Visual highlighting of template fields for document review
- **Multi-format Output**: HTML, PDF, and plain text generation

## Architecture Philosophy

The system follows a dual-architecture approach:

1. **Primary Remark-based Architecture**: Modern AST-based processing using the
   remark ecosystem for enhanced accuracy and performance
2. **Legacy Fallback Architecture**: Traditional regex-based processing for
   backward compatibility and feature completeness

This approach ensures reliability while enabling migration to more robust
processing methods.

## Current Version Status

- **Version**: 2.14.2 (stable)
- **Architecture**: Dual ESM/CommonJS support with UMD browser bundles
- **Primary Processing**: Remark-based pipeline with legacy fallback
- **TypeScript**: Full type safety with comprehensive type definitions
- **Testing**: Comprehensive test coverage with unit and integration tests

## Key Capabilities

### Document Processing

- YAML front matter parsing and validation
- Template field substitution with error handling
- Structured header processing with automatic numbering
- Optional clause evaluation with boolean logic
- Cross-reference resolution and validation

### Output Generation

- HTML generation with customizable styling
- PDF generation with legal document formatting
- Plain text output with structure preservation
- Field highlighting for document review workflows

### Development Support

- Full TypeScript support with comprehensive type definitions
- CLI interface with interactive and batch processing modes
- Web interface for browser-based document processing
- Extension points for custom processing logic

### Integration Features

- Node.js API for programmatic usage
- Browser compatibility with UMD bundles
- Batch processing capabilities for multiple documents
- Pipeline architecture for custom processing workflows

The architecture is designed to be modular, extensible, and maintainable while
providing robust processing capabilities for legal document workflows.
