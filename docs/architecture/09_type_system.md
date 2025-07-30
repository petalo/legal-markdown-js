# Type System <!-- omit in toc -->

- [Overview](#overview)
- [Core Types Module](#core-types-module)
- [Processing Types](#processing-types)
- [Field Tracking Types](#field-tracking-types)
- [Import and Pipeline Types](#import-and-pipeline-types)
- [Global Type Definitions](#global-type-definitions)
- [Specialized Type Definitions](#specialized-type-definitions)
- [Type Safety Benefits](#type-safety-benefits)

## Overview

The project features a comprehensive TypeScript type system with strict typing
throughout. The type system ensures compile-time safety, provides excellent IDE
support, and maintains API consistency across all modules.

## Core Types Module

### LegalMarkdownOptions

The primary configuration interface for all processing operations:

```typescript
interface LegalMarkdownOptions {
  // Basic Processing Options
  basePath?: string;
  yamlOnly?: boolean;
  noHeaders?: boolean;
  noClauses?: boolean;
  noReferences?: boolean;
  noImports?: boolean;
  noMixins?: boolean;

  // Advanced Processing Options
  disableFrontmatterMerge?: boolean;
  validateImportTypes?: boolean;
  logImportOperations?: boolean;
  toMarkdown?: boolean;
  exportMetadata?: boolean;
  exportFormat?: 'yaml' | 'json';
  exportPath?: string;

  // Debug and Development Options
  debug?: boolean;
  throwOnYamlError?: boolean;
  noReset?: boolean;
  noIndent?: boolean;

  // Field Tracking Options
  enableFieldTracking?: boolean;
  enableFieldTrackingInMarkdown?: boolean;

  // Output Generation Options
  _htmlGeneration?: boolean;
  title?: string;
  css?: string;
  html?: boolean;
  pdf?: boolean;
  highlight?: boolean;
}
```

### RemarkOptions

Configuration for remark-based processing:

```typescript
interface RemarkOptions {
  plugins?: Plugin[];
  settings?: Settings;
  data?: Data;
}
```

## Processing Types

### ProcessingResult

Comprehensive result structure for all processing operations:

```typescript
interface ProcessingResult {
  content: string;
  metadata?: Record<string, any>;
  fieldReport?: FieldReport;
  exportedFiles?: string[];
  processingTime?: number;
  errors?: ProcessingError[];
  warnings?: string[];
}
```

### ProcessingError

Structured error information with context:

```typescript
interface ProcessingError {
  type: ErrorType;
  message: string;
  step?: string;
  line?: number;
  column?: number;
  context?: Record<string, any>;
  stack?: string;
}

type ErrorType =
  | 'YAML_PARSING_ERROR'
  | 'FILE_NOT_FOUND'
  | 'INVALID_SYNTAX'
  | 'CIRCULAR_REFERENCE'
  | 'IMPORT_ERROR'
  | 'TEMPLATE_ERROR'
  | 'VALIDATION_ERROR';
```

## Field Tracking Types

### FieldReport

Comprehensive field usage reporting:

```typescript
interface FieldReport {
  total: number;
  filled: number;
  empty: number;
  logic: number;
  fields: Map<string, TrackedField>;
  statusCounts: Record<FieldStatus, number>;
}
```

### TrackedField

Detailed field tracking information:

```typescript
interface TrackedField {
  name: string;
  status: FieldStatus;
  value: any;
  originalValue: any;
  hasLogic: boolean;
  mixinUsed: MixinType;
  resolvedValue?: string;
  isHighlighted?: boolean;
}

enum FieldStatus {
  FILLED = 'filled',
  EMPTY = 'empty',
  LOGIC = 'logic',
}

enum MixinType {
  SIMPLE = 'simple',
  HELPER = 'helper',
  CONDITIONAL = 'conditional',
  TEMPLATE_LOOP = 'template_loop',
}
```

### HeaderOptions

Header processing configuration:

```typescript
interface HeaderOptions {
  levelOne?: string;
  levelTwo?: string;
  levelThree?: string;
  levelFour?: string;
  levelFive?: string;
  levelSix?: string;
  levelIndent?: number;
  noReset?: boolean;
  noIndent?: boolean;
  enableFieldTrackingInMarkdown?: boolean;
}
```

## Import and Pipeline Types

### ImportProcessingResult

Import operation results with conflict tracking:

```typescript
interface ImportProcessingResult {
  content: string;
  importedFiles: string[];
  mergedMetadata?: Record<string, any>;
  frontmatterConflicts?: ConflictInfo[];
  mergeStatistics?: MergeStatistics;
  processingErrors?: ImportError[];
}

interface ConflictInfo {
  field: string;
  sourceValue: any;
  importedValue: any;
  resolution: 'source' | 'imported' | 'merged';
}

interface MergeStatistics {
  totalFields: number;
  mergedFields: number;
  conflictedFields: number;
  filteredFields: number;
  processingTime: number;
}
```

### PipelineResult

Pipeline execution results with step-by-step metrics:

```typescript
interface PipelineResult {
  success: boolean;
  content: string;
  metadata: Record<string, any>;
  stepResults: StepResult[];
  totalDuration: number;
  errors: ProcessingError[];
  warnings: string[];
}

interface StepResult {
  stepName: string;
  success: boolean;
  inputSize: number;
  outputSize: number;
  fieldsTracked: number;
  duration: number;
  errors: ProcessingError[];
  warnings: string[];
}
```

## Global Type Definitions

### Window Extensions

Browser environment type extensions:

```typescript
declare global {
  interface Window {
    LegalMarkdown?: LegalMarkdownBrowser;
    hljs?: HighlightJS;
    CodeMirror?: CodeMirrorEditor;
  }
}

interface LegalMarkdownBrowser {
  process: (
    content: string,
    options?: LegalMarkdownOptions
  ) => Promise<ProcessingResult>;
  version: string;
  examples: Record<string, string>;
}
```

### Node.js Environment Extensions

```typescript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      LEGAL_MARKDOWN_INPUT_DIR?: string;
      LEGAL_MARKDOWN_OUTPUT_DIR?: string;
      LEGAL_MARKDOWN_CSS_DIR?: string;
      LEGAL_MARKDOWN_ARCHIVE_DIR?: string;
      NODE_ENV?: string;
      DEBUG?: string;
      LOG_LEVEL?: string;
    }
  }
}
```

## Specialized Type Definitions

### CLI Types

Command-line interface type definitions:

```typescript
interface CliOptions {
  input?: string;
  output?: string;
  interactive?: boolean;
  debug?: boolean;
  yaml?: boolean;
  html?: boolean;
  pdf?: boolean;
  highlight?: boolean;
  css?: string;
  title?: string;
  archive?: boolean;
  archiveDir?: string;
  stdin?: boolean;
  stdout?: boolean;
}

interface InteractivePrompts {
  fileSelector: FilePrompt;
  processingOptions: OptionsPrompt;
  outputFormat: FormatPrompt;
  cssSelector: CssPrompt;
  archiveOptions: ArchivePrompt;
  confirmation: ConfirmPrompt;
}

type OutputFormat = 'markdown' | 'html' | 'pdf';
```

### Web Interface Types

```typescript
interface BrowserAPI {
  process: (
    content: string,
    options?: LegalMarkdownOptions
  ) => Promise<ProcessingResult>;
  examples: Record<string, DocumentExample>;
  themes: Record<string, ThemeDefinition>;
}

interface WebEditorState {
  content: string;
  css: string;
  preview: string;
  fieldReport?: FieldReport;
  isDirty: boolean;
  lastSaved?: Date;
}

interface PreviewOptions {
  theme: ThemeMode;
  highlightFields: boolean;
  showLineNumbers: boolean;
  autoRefresh: boolean;
  debounceMs: number;
}

type ThemeMode = 'light' | 'dark' | 'auto';
```

### Validation Types

```typescript
interface ValidationRule {
  name: string;
  validator: (value: any, context: ValidationContext) => ValidationResult;
  schema?: JSONSchema;
}

interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: string[];
}

interface ValidationContext {
  fieldName: string;
  metadata: Record<string, any>;
  options: LegalMarkdownOptions;
}

interface ValidationError {
  field: string;
  message: string;
  value: any;
  rule: string;
}
```

### Generator Types

```typescript
interface GeneratorOptions {
  format: OutputFormat;
  filename?: string;
  css?: string;
  title?: string;
  metadata?: Record<string, any>;
  highlight?: boolean;
  theme?: string;
}

interface GeneratorResult {
  content: Buffer | string;
  mimeType: string;
  filename: string;
  size: number;
  metadata?: Record<string, any>;
}
```

## Type Safety Benefits

### Compile-time Safety

The comprehensive type system provides:

1. **Parameter Validation**: Function parameters are validated at compile time
2. **Return Type Safety**: Function return types are guaranteed
3. **Interface Compliance**: All implementations must comply with defined
   interfaces
4. **Null Safety**: Optional properties are properly handled

### IDE Support

TypeScript provides excellent development experience:

1. **IntelliSense**: Auto-completion for all types and properties
2. **Error Detection**: Real-time error detection during development
3. **Refactoring Support**: Safe refactoring with type checking
4. **Documentation**: Type definitions serve as API documentation

### Runtime Benefits

Type definitions enable:

1. **Input Validation**: Runtime validation against type schemas
2. **Error Messages**: Detailed error messages with type information
3. **API Consistency**: Consistent interfaces across all modules
4. **Version Compatibility**: Type-checked compatibility between versions

The comprehensive type system ensures Legal Markdown JS provides a robust,
maintainable, and developer-friendly API while maintaining strict type safety
throughout the codebase.
