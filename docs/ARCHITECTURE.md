# Legal Markdown JS - Architecture Documentation <!-- omit in toc -->

Legal Markdown JS is a Node.js implementation of the Legal Markdown document
processing system with full TypeScript support. This document serves as the main
index for the comprehensive architecture documentation, which has been organized
into specialized sections for better navigation and maintenance.

## Architecture Documentation Index

### Core System Architecture

- **[01. Overview](architecture/01_overview.md)** - System purpose, philosophy,
  and key capabilities
- **[02. Core System](architecture/02_core_system.md)** - High-level
  architecture and module organization
- **[03. Processing Pipeline](architecture/03_processing_pipeline.md)** -
  Document processing workflows and pipeline architecture

### Processing and Integration

- **[04. Remark Integration](architecture/04_remark_integration.md)** - Modern
  AST-based processing with unified/remark ecosystem
- **[05. Field Tracking](architecture/05_field_tracking.md)** - Template field
  tracking and reporting system
- **[06. Web Interface](architecture/06_web_interface.md)** - Browser-based
  document editor and preview system

### Interface and Extensibility

- **[07. CLI System](architecture/07_cli_system.md)** - Command-line interface
  architecture and interactive mode
- **[08. Extensions](architecture/08_extensions.md)** - Extension points and
  plugin system
- **[09. Type System](architecture/09_type_system.md)** - Comprehensive
  TypeScript type definitions

### Development and Deployment

- **[10. Build & Deployment](architecture/10_build_deployment.md)** - Dual build
  system and distribution strategy
- **[11. Testing Strategy](architecture/11_testing_strategy.md)** - Testing
  architecture and quality assurance
- **[12. Performance](architecture/12_performance.md)** - Performance
  optimization and monitoring

### Security and Reliability

- **[13. Security](architecture/13_security.md)** - Security considerations and
  protection measures
- **[14. Migration Strategy](architecture/14_migration_strategy.md)** - Legacy
  to modern architecture migration
- **[15. Troubleshooting](architecture/15_troubleshooting.md)** - Error handling
  and diagnostic tools

### Project Status

- **[16. Future Roadmap](architecture/16_future_roadmap.md)** - Development
  roadmap and planned features
- **[17. Current Status](architecture/17_current_status.md)** - Version
  information and maturity assessment

## Quick Navigation

### For Developers

- **Getting Started**: Read [01. Overview](architecture/01_overview.md) and
  [02. Core System](architecture/02_core_system.md)
- **Implementation Details**: See
  [03. Processing Pipeline](architecture/03_processing_pipeline.md) and
  [04. Remark Integration](architecture/04_remark_integration.md)
- **Extension Development**: Check
  [08. Extensions](architecture/08_extensions.md) and
  [09. Type System](architecture/09_type_system.md)

### For Integrators

- **API Usage**: Review [09. Type System](architecture/09_type_system.md) and
  [07. CLI System](architecture/07_cli_system.md)
- **Web Integration**: See [06. Web Interface](architecture/06_web_interface.md)
  and [10. Build & Deployment](architecture/10_build_deployment.md)
- **Security**: Review [13. Security](architecture/13_security.md) for security
  considerations

### For Maintainers

- **Code Quality**: See
  [11. Testing Strategy](architecture/11_testing_strategy.md) and
  [12. Performance](architecture/12_performance.md)
- **System Health**: Check
  [15. Troubleshooting](architecture/15_troubleshooting.md) and
  [17. Current Status](architecture/17_current_status.md)
- **Future Planning**: Review
  [16. Future Roadmap](architecture/16_future_roadmap.md) and
  [14. Migration Strategy](architecture/14_migration_strategy.md)

## Architecture Highlights

### Current Version: 2.14.2

- **Hybrid Processing**: Primary remark-based AST processing with legacy
  fallback
- **Dual Build System**: ESM/CommonJS compatibility with UMD browser bundles
- **Comprehensive Type Safety**: Full TypeScript implementation with strict
  typing
- **Interactive CLI**: Advanced command-line interface with intelligent file
  discovery
- **Web Interface**: Full-featured browser-based document editor with live
  preview
- **Security Hardened**: Input validation, frontmatter filtering, and XSS
  protection
- **Performance Optimized**: Pipeline architecture with concurrency control and
  caching

### Key Features

- **Template Field Processing**: Dynamic content insertion with {{field}} syntax
- **Structured Headers**: Hierarchical document organization with automatic
  numbering
- **Optional Clauses**: Conditional content inclusion with [text]{condition}
  syntax
- **Cross-References**: Internal document linking with |reference| syntax
- **Field Tracking**: Visual highlighting and comprehensive reporting
- **Multi-format Output**: HTML, PDF, and plain text generation
- **Batch Processing**: Efficient processing of multiple documents
- **Extension Points**: Plugin system for custom functionality

### Architecture Maturity

The current architecture demonstrates production-ready maturity with
comprehensive error handling, extensive logging, modular plugin system,
performance monitoring, security-first design, and cross-platform compatibility.

---

**Last Updated**: Version 2.14.2 - This documentation reflects the current
production state of the Legal Markdown JS architecture.

For detailed information on any aspect of the system, please refer to the
specific documentation files linked above.
