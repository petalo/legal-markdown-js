# CLI Architecture <!-- omit in toc -->

- [Overview](#overview)
- [CLI System Components](#cli-system-components)
- [Traditional CLI Mode](#traditional-cli-mode)
- [Interactive CLI Mode](#interactive-cli-mode)
- [CLI Service Architecture](#cli-service-architecture)
- [Command Line Options](#command-line-options)
- [Interactive Features](#interactive-features)

## Overview

The CLI system features both traditional command-line interface and advanced
interactive mode, providing flexible access to Legal Markdown processing
capabilities. The CLI architecture supports both simple one-off processing and
complex interactive workflows.

## CLI System Components

```mermaid
graph TB
    subgraph "CLI Architecture"
        ENTRY[cli/index.ts] --> COMMANDER[Commander.js]
        ENTRY --> SERVICE[CLI Service]
        ENTRY --> INTERACTIVE[Interactive Service]

        COMMANDER --> ARGS[Argument Parsing]
        COMMANDER --> OPTS[Option Parsing]

        SERVICE --> FILE_OPS[File Operations]
        SERVICE --> PROC_CALL[Processing Call]
        SERVICE --> OUTPUT_GEN[Output Generation]

        INTERACTIVE --> PROMPTS[Interactive Prompts]
        INTERACTIVE --> FILE_SCANNER[File Scanner]
        INTERACTIVE --> WORKFLOW[Workflow Management]
    end
```

## Traditional CLI Mode

### Basic Command Structure

```mermaid
graph TB
    subgraph "Traditional CLI Layer"
        ENTRY[cli/index.ts] --> COMMANDER[Commander.js]
        COMMANDER --> ARGS[Argument Parsing]
        COMMANDER --> OPTS[Option Parsing]

        ARGS --> INPUT_FILE[Input File]
        ARGS --> OUTPUT_FILE[Output File]
        OPTS --> PROC_OPTS[Processing Options]

        ENTRY --> SERVICE[CLI Service]
        SERVICE --> FILE_OPS[File Operations]
        SERVICE --> PROC_CALL[Processing Call]
        SERVICE --> OUTPUT_GEN[Output Generation]

        subgraph "Core Options"
            DEBUG[--debug]
            INTERACTIVE[--interactive]
            YAML_ONLY[--yaml]
            NO_HEADERS[--no-headers]
            NO_CLAUSES[--no-clauses]
            NO_REFS[--no-references]
            NO_IMPORTS[--no-imports]
            NO_MIXINS[--no-mixins]
        end

        subgraph "Advanced Options"
            DISABLE_FRONTMATTER[--disable-frontmatter-merge]
            VALIDATE_TYPES[--validate-import-types]
            LOG_IMPORTS[--log-import-operations]
            ENABLE_TRACKING[--enable-field-tracking]
            STDIN[--stdin]
            STDOUT[--stdout]
        end

        subgraph "Output Options"
            HTML_OUT[--html]
            PDF_OUT[--pdf]
            HIGHLIGHT[--highlight]
            CSS_PATH[--css]
            TITLE[--title]
            EXPORT_YAML[--export-yaml]
            EXPORT_JSON[--export-json]
            OUTPUT_PATH[--output-path]
        end

        subgraph "Archive Options"
            ARCHIVE[--archive]
            ARCHIVE_DIR[--archive-dir]
            NO_ARCHIVE[--no-archive]
        end
    end
```

## Interactive CLI Mode

### Interactive Processing Flow

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant InteractiveService
    participant FileScanner
    participant Prompts
    participant Processor

    User->>CLI: legal-md --interactive
    CLI->>InteractiveService: Initialize Interactive Mode

    InteractiveService->>FileScanner: Discover Legal Markdown Files
    FileScanner->>InteractiveService: Return File List

    InteractiveService->>Prompts: File Selection Prompt
    Prompts->>User: Display File Options
    User->>Prompts: Select File(s)

    InteractiveService->>Prompts: Processing Options Prompt
    Prompts->>User: Configure Processing
    User->>Prompts: Set Options

    InteractiveService->>Prompts: Output Format Prompt
    Prompts->>User: Choose Output Format
    User->>Prompts: Select Format(s)

    alt CSS Required
        InteractiveService->>Prompts: CSS Selection Prompt
        Prompts->>User: Choose CSS File
        User->>Prompts: Select CSS
    end

    alt Archive Enabled
        InteractiveService->>Prompts: Archive Options Prompt
        Prompts->>User: Configure Archive
        User->>Prompts: Set Archive Options
    end

    InteractiveService->>Processor: Process with Collected Options
    Processor->>InteractiveService: Return Results
    InteractiveService->>User: Display Success/Results
```

## CLI Service Architecture

### Service Layer Design

```mermaid
classDiagram
    class CliService {
        -options: CliOptions
        -interactiveService: InteractiveService
        +processFile(inputPath, outputPath, options)
        +processFromStdin(options)
        +generateHtml(content, options)
        +generatePdf(content, options)
        +exportMetadata(metadata, options)
        +handleArchiving(sourcePath, options)
    }

    class InteractiveService {
        -prompts: PromptCollection
        -fileScanner: FileScanner
        +start(): Promise<void>
        +collectProcessingOptions(): Promise<ProcessingOptions>
        +selectFiles(): Promise<string[]>
        +selectOutputFormats(): Promise<OutputFormat[]>
        +configureCss(): Promise<string>
        +configureArchive(): Promise<ArchiveOptions>
    }

    class FileScanner {
        +scanDirectory(path: string): Promise<FileInfo[]>
        +validateFile(path: string): boolean
        +getFileMetadata(path: string): FileMetadata
        +filterByType(files: FileInfo[], types: string[]): FileInfo[]
    }

    class PromptCollection {
        +fileSelector: FileSelector
        +processingOptions: ProcessingOptionsPrompt
        +outputFormat: OutputFormatPrompt
        +cssSelector: CssSelector
        +archiveOptions: ArchiveOptionsPrompt
        +confirmation: ConfirmationPrompt
        +filename: FilenamePrompt
    }

    CliService --> InteractiveService
    InteractiveService --> FileScanner
    InteractiveService --> PromptCollection
```

## Command Line Options

### Core Processing Options

| Option            | Description                 | Example                           |
| ----------------- | --------------------------- | --------------------------------- |
| `--debug`         | Enable debug output         | `legal-md doc.md --debug`         |
| `--yaml`          | YAML front matter only      | `legal-md doc.md --yaml`          |
| `--no-headers`    | Disable header processing   | `legal-md doc.md --no-headers`    |
| `--no-clauses`    | Disable optional clauses    | `legal-md doc.md --no-clauses`    |
| `--no-references` | Disable cross-references    | `legal-md doc.md --no-references` |
| `--no-imports`    | Disable file imports        | `legal-md doc.md --no-imports`    |
| `--no-mixins`     | Disable template processing | `legal-md doc.md --no-mixins`     |

### Advanced Options

| Option                        | Description                 | Example                                       |
| ----------------------------- | --------------------------- | --------------------------------------------- |
| `--disable-frontmatter-merge` | Disable frontmatter merging | `legal-md doc.md --disable-frontmatter-merge` |
| `--validate-import-types`     | Validate imported types     | `legal-md doc.md --validate-import-types`     |
| `--log-import-operations`     | Log import operations       | `legal-md doc.md --log-import-operations`     |
| `--enable-field-tracking`     | Enable field tracking       | `legal-md doc.md --enable-field-tracking`     |
| `--stdin`                     | Read from standard input    | `cat doc.md \| legal-md --stdin`              |
| `--stdout`                    | Write to standard output    | `legal-md doc.md --stdout`                    |

### Output Format Options

| Option            | Description               | Example                                     |
| ----------------- | ------------------------- | ------------------------------------------- |
| `--html`          | Generate HTML output      | `legal-md doc.md --html`                    |
| `--pdf`           | Generate PDF output       | `legal-md doc.md --pdf`                     |
| `--highlight`     | Enable field highlighting | `legal-md doc.md --html --highlight`        |
| `--css <path>`    | Custom CSS file           | `legal-md doc.md --html --css styles.css`   |
| `--title <title>` | Document title            | `legal-md doc.md --html --title "Contract"` |
| `--export-yaml`   | Export metadata as YAML   | `legal-md doc.md --export-yaml`             |
| `--export-json`   | Export metadata as JSON   | `legal-md doc.md --export-json`             |

### Archive Options

| Option                 | Description              | Example                                           |
| ---------------------- | ------------------------ | ------------------------------------------------- |
| `--archive`            | Enable source archiving  | `legal-md doc.md --archive`                       |
| `--archive-dir <path>` | Custom archive directory | `legal-md doc.md --archive --archive-dir backup/` |
| `--no-archive`         | Disable archiving        | `legal-md doc.md --no-archive`                    |

## Interactive Features

### File Discovery and Selection

The interactive mode provides intelligent file discovery:

- **Automatic Scanning**: Discovers Legal Markdown files in current directory
- **Recursive Search**: Optionally searches subdirectories
- **File Validation**: Validates file format and accessibility
- **Metadata Preview**: Shows basic file information
- **Multi-selection**: Supports batch processing of multiple files

### Processing Configuration

Interactive prompts guide users through processing options:

```mermaid
flowchart TD
    START[Start Interactive Mode] --> SCAN[Scan for Files]
    SCAN --> SELECT_FILES[Select Files]
    SELECT_FILES --> PROC_OPTIONS[Processing Options]
    PROC_OPTIONS --> OUTPUT_FORMAT[Output Format]
    OUTPUT_FORMAT --> CSS_CONFIG{CSS Required?}
    CSS_CONFIG -->|Yes| SELECT_CSS[Select CSS]
    CSS_CONFIG -->|No| ARCHIVE_CONFIG{Archive?}
    SELECT_CSS --> ARCHIVE_CONFIG
    ARCHIVE_CONFIG -->|Yes| ARCHIVE_OPTIONS[Archive Options]
    ARCHIVE_CONFIG -->|No| CONFIRM[Confirm Settings]
    ARCHIVE_OPTIONS --> CONFIRM
    CONFIRM --> PROCESS[Process Files]
    PROCESS --> RESULTS[Show Results]
```

### Smart Defaults

The interactive system provides intelligent defaults:

- **File Type Detection**: Automatically detects Legal Markdown files
- **Output Format Suggestions**: Recommends appropriate output formats
- **CSS Discovery**: Finds available CSS files in common locations
- **Archive Location**: Suggests sensible archive directories
- **Processing Options**: Sets appropriate defaults based on file content

The CLI architecture provides both simple command-line usage and sophisticated
interactive workflows, making Legal Markdown processing accessible to users with
different levels of expertise and workflow requirements.
