# Core System Architecture

## High-Level Architecture

```mermaid
graph TB
    subgraph "Input Layer"
        INPUT[Document Input]
        MD[".md files"]
        RST[".rst files"]
        TEX[".tex files"]
        TXT[".txt files"]
    end

    subgraph "CLI Layer"
        CLI[CLI Interface]
        ARGS[Command Arguments]
        OPTS[Options Parsing]
    end

    subgraph "Core Processing Engine"
        MAIN[Main Processor]
        YAML[YAML Parser]
        CONV[Format Converters]

        subgraph "Remark-based Processing Architecture"
            REMARK_PROC[Remark Processor]
            TEMPLATE_FIELDS[Template Fields Plugin]
            CROSS_REFS[Cross-References Plugin]
            FIELD_TRACKING[Field Tracking Plugin]
            CLAUSES[Clauses Plugin]
            HEADERS[Headers Plugin]
            IMPORTS[Imports Plugin]
            MIXINS[Mixins Plugin]
        end

        subgraph "Helper System"
            HELPERS[Helper Functions]
            DATE[Date Helpers]
            NUM[Number Helpers]
            STR[String Helpers]
        end
    end

    subgraph "Extensions Layer"
        VALID[Validators]
        BATCH[Batch Processor]
        TRACK[Field Tracker]
        UTIL[Utilities]
        AST_MIXIN[AST Mixin Processor]
    end

    subgraph "Output Layer"
        HTML[HTML Generator]
        PDF[PDF Generator]
        META[Metadata Exporter]
        OUT[Output Files]
    end

    INPUT --> CLI
    MD --> REMARK_PROC
    RST --> CONV
    TEX --> CONV
    TXT --> REMARK_PROC
    CONV --> REMARK_PROC

    CLI --> REMARK_PROC
    ARGS --> OPTS
    OPTS --> REMARK_PROC

    REMARK_PROC --> YAML
    REMARK_PROC --> TEMPLATE_FIELDS
    REMARK_PROC --> CROSS_REFS
    REMARK_PROC --> FIELD_TRACKING
    REMARK_PROC --> CLAUSES
    REMARK_PROC --> HEADERS
    REMARK_PROC --> IMPORTS
    REMARK_PROC --> MIXINS

    TEMPLATE_FIELDS --> HELPERS
    HELPERS --> DATE
    HELPERS --> NUM
    HELPERS --> STR

    REMARK_PROC --> VALID
    REMARK_PROC --> BATCH
    REMARK_PROC --> TRACK
    REMARK_PROC --> AST_MIXIN

    REMARK_PROC --> HTML
    REMARK_PROC --> PDF
    REMARK_PROC --> META
    HTML --> OUT
    PDF --> OUT
    META --> OUT

    %% All processing is now remark-based
```

## Module Architecture

### Core Module (`src/core/`)

The core module maintains parity with the original Ruby Legal Markdown
implementation with minimal, Ruby-compatible functionality:

```mermaid
graph TB
    subgraph "Core Module Structure"
        CORE[core/index.ts]

        subgraph "Helpers (Ruby Compatible)"
            DATE_H[helpers/date-helpers.ts]
            NUM_H[helpers/number-helpers.ts]
            STR_H[helpers/string-helpers.ts]
        end

        subgraph "Parsers (Ruby Compatible)"
            YAML_P[parsers/yaml-parser.ts]
        end

        subgraph "Processors (Ruby Compatible)"
            BASE_P[processors/base-processor.ts]
            DATE_P[processors/date-processor.ts]
            HDR_P[processors/header-processor.ts]
            MIX_P[processors/mixin-processor.ts]
            REF_P[processors/reference-processor.ts]
        end

        subgraph "Exporters (Ruby Compatible)"
            META_E[exporters/metadata-exporter.ts]
        end
    end

    CORE --> DATE_H
    CORE --> NUM_H
    CORE --> STR_H
    CORE --> YAML_P
    CORE --> BASE_P
    DATE_P --> DATE_H
    HDR_P --> BASE_P
    MIX_P --> BASE_P
    REF_P --> BASE_P
    META_E --> YAML_P
```

**Key Characteristics:**

- **Ruby Compatibility**: Maintains behavior compatibility with original Ruby
  implementation
- **Minimal Dependencies**: Limited external dependencies for core functionality
- **Type Safety**: Full TypeScript implementation with comprehensive types
- **Base Processor Pattern**: Consistent processing architecture across all
  processors

### Remark Plugins Module (`src/plugins/`)

Modern AST-based processing using the unified/remark ecosystem:

```mermaid
graph TB
    subgraph "Remark Plugins Architecture"
        PLUGINS[plugins/index.ts]

        subgraph "Core Plugins"
            TEMPLATE[remark/template-fields.ts]
            CROSS_REF[remark/cross-references.ts]
            FIELD_TRACK[remark/field-tracking.ts]
        end

        subgraph "Planned Plugins"
            CLAUSES[remark/clauses.ts]
            HEADERS[remark/headers.ts]
        end
    end

    PLUGINS --> TEMPLATE
    PLUGINS --> CROSS_REF
    PLUGINS --> FIELD_TRACK
    PLUGINS -.-> CLAUSES
    PLUGINS -.-> HEADERS

    subgraph "Plugin Capabilities"
        AST_PROC[AST Processing]
        TREE_WALK[Tree Walking]
        NODE_TRANS[Node Transformation]
        CONTEXT_AWARE[Context Awareness]
    end

    TEMPLATE --> AST_PROC
    CROSS_REF --> TREE_WALK
    FIELD_TRACK --> NODE_TRANS
    CROSS_REF --> CONTEXT_AWARE
```

**Key Features:**

- **AST-based Processing**: Direct manipulation of markdown syntax trees
- **Plugin Architecture**: Modular, composable processing components
- **Context Awareness**: Full understanding of document structure
- **No Text Contamination**: Precise targeting without affecting surrounding
  content

### Extensions Module (`src/extensions/`)

Enhanced functionality beyond the core Ruby-compatible implementation:

```mermaid
graph TB
    subgraph "Extensions Architecture"
        EXT[extensions/index.ts]

        subgraph "Processing Extensions"
            BATCH[batch-processor.ts]
            REMARK_PROC[remark/legal-markdown-processor.ts]
            PIPELINE[pipeline/pipeline-manager.ts]
            TEMPLATE_LOOPS[template-loops.ts]
        end

        subgraph "Generation Extensions"
            HTML_GEN[generators/html-generator.ts]
            PDF_GEN[generators/pdf-generator.ts]
            PDF_TMPL[generators/pdf-templates.ts]
        end

        subgraph "Tracking Extensions"
            FIELD_TRACKER[tracking/field-tracker.ts]
        end

        subgraph "Parser Extensions"
            PARSER_IDX[parsers/index.ts]
        end
    end

    EXT --> BATCH
    EXT --> REMARK_PROC
    EXT --> PIPELINE
    EXT --> TEMPLATE_LOOPS
    EXT --> HTML_GEN
    EXT --> PDF_GEN
    EXT --> PDF_TMPL
    EXT --> FIELD_TRACKER
    EXT --> PARSER_IDX
```

**Extension Categories:**

- **Processing**: Batch processing, pipeline management, template loops
- **Generation**: HTML/PDF output with customizable templates
- **Tracking**: Advanced field tracking and reporting
- **Parsing**: Extended parser capabilities

### Constants Module (`src/constants/`)

Centralized configuration and constants management:

```mermaid
graph TB
    subgraph "Constants Architecture"
        CONST[constants/index.ts]

        subgraph "Configuration Constants"
            PATTERNS[patterns.ts]
            DEFAULTS[defaults.ts]
            VERSIONS[versions.ts]
        end

        subgraph "Processing Constants"
            REGEX[regex-patterns.ts]
            FORMATS[output-formats.ts]
            ERRORS[error-codes.ts]
        end
    end

    CONST --> PATTERNS
    CONST --> DEFAULTS
    CONST --> VERSIONS
    CONST --> REGEX
    CONST --> FORMATS
    CONST --> ERRORS
```

### Assets and Styles Module (`src/assets/` & `src/styles/`)

Static assets and styling for document generation:

```mermaid
graph TB
    subgraph "Assets Architecture"
        ASSETS[assets/index.ts]
        STYLES[styles/index.ts]

        subgraph "Document Assets"
            CSS[legal-document.css]
            TEMPLATES[html-templates/]
            FONTS[fonts/]
        end

        subgraph "PDF Styling"
            PDF_CSS[pdf-styles.css]
            PRINT_CSS[print-styles.css]
        end
    end

    ASSETS --> CSS
    ASSETS --> TEMPLATES
    ASSETS --> FONTS
    STYLES --> PDF_CSS
    STYLES --> PRINT_CSS
```

### Utilities Module (`src/utils/`)

Common utility functions and helpers:

```mermaid
graph TB
    subgraph "Utilities Architecture"
        UTILS[utils/index.ts]

        subgraph "File Utilities"
            FILE_IO[file-operations.ts]
            PATH_UTILS[path-utilities.ts]
        end

        subgraph "Processing Utilities"
            TEXT_UTILS[text-processing.ts]
            VALIDATION[validation-helpers.ts]
        end

        subgraph "Format Utilities"
            FORMAT_CONV[format-converters.ts]
            OUTPUT_UTILS[output-helpers.ts]
        end
    end

    UTILS --> FILE_IO
    UTILS --> PATH_UTILS
    UTILS --> TEXT_UTILS
    UTILS --> VALIDATION
    UTILS --> FORMAT_CONV
    UTILS --> OUTPUT_UTILS
```

### Interactive CLI Module (`src/cli/interactive/`)

Advanced interactive command-line interface:

```mermaid
graph TB
    subgraph "Interactive CLI Architecture"
        CLI_INTERACTIVE[cli/interactive/service.ts]

        subgraph "Prompt System"
            ARCHIVE_PROMPTS[prompts/archive-options.ts]
            CSS_PROMPTS[prompts/css-selector.ts]
            FILE_PROMPTS[prompts/file-selector.ts]
        end

        subgraph "CLI Services"
            CLI_SERVICE[service.ts]
            CLI_MAIN[../service.ts]
        end
    end

    CLI_INTERACTIVE --> ARCHIVE_PROMPTS
    CLI_INTERACTIVE --> CSS_PROMPTS
    CLI_INTERACTIVE --> FILE_PROMPTS
    CLI_INTERACTIVE --> CLI_SERVICE
    CLI_SERVICE --> CLI_MAIN
```

**Interactive Features:**

- **File Selection**: Interactive file and directory selection
- **Option Configuration**: Dynamic option configuration with validation
- **Progress Tracking**: Real-time processing progress display
- **Error Recovery**: Interactive error handling and recovery options

## System Integration

The modular architecture ensures clean separation of concerns while maintaining
tight integration between components:

1. **Core Compatibility**: Core module maintains Ruby implementation
   compatibility
2. **Plugin Extensibility**: Remark plugins provide modern AST processing
3. **Extension Points**: Extensions module enables advanced functionality
4. **Centralized Configuration**: Constants module provides system-wide
   configuration
5. **Asset Management**: Dedicated asset management for output generation
6. **Utility Support**: Common utilities support all system components
7. **Interactive Interface**: Enhanced CLI experience with interactive
   capabilities

This architecture supports both backward compatibility and modern development
practices while providing a foundation for future enhancements.
