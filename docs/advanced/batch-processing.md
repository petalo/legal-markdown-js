# Batch Processing

Process multiple Legal Markdown documents efficiently with parallel processing,
progress tracking, and comprehensive error handling.

## Table of Contents

- [Overview](#overview)
- [Basic Batch Processing](#basic-batch-processing)
- [Batch Options](#batch-options)
- [Progress Callbacks](#progress-callbacks)
- [Error Handling](#error-handling)
- [Advanced Configuration](#advanced-configuration)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

Batch processing allows you to process multiple Legal Markdown files
simultaneously, with features for:

- **Parallel processing** - Multiple files processed concurrently
- **Directory traversal** - Recursive processing of folder structures
- **Progress tracking** - Real-time feedback on processing status
- **Error handling** - Graceful handling of failures
- **Structure preservation** - Maintain original directory layouts

## Basic Batch Processing

### Simple Batch Operation

```typescript
import { processBatch } from 'legal-markdown-js';

const result = await processBatch({
  inputDir: './documents',
  outputDir: './processed',
  extensions: ['.md', '.txt'],
  recursive: true,
  preserveStructure: true,
  concurrency: 5,
  onProgress: (processed, total, currentFile) => {
    console.log(`Processing: ${currentFile} (${processed}/${total})`);
  },
});

console.log(`Processed: ${result.totalProcessed}`);
console.log(`Errors: ${result.totalErrors}`);
```

### Command Line Batch Processing

```bash
# Process all markdown files in a directory
legal-md batch ./contracts --output ./processed --recursive

# Process with specific options
legal-md batch ./templates --output ./generated --pdf --highlight --concurrency 3

# Process with filtering
legal-md batch ./docs --output ./html --html --extensions .md,.txt --exclude-patterns "draft*,temp*"
```

## Batch Options

### Core Configuration

| Option              | Type     | Default   | Description                  |
| ------------------- | -------- | --------- | ---------------------------- |
| `inputDir`          | string   | Required  | Source directory path        |
| `outputDir`         | string   | Required  | Output directory path        |
| `extensions`        | string[] | `['.md']` | File extensions to process   |
| `recursive`         | boolean  | `true`    | Process subdirectories       |
| `preserveStructure` | boolean  | `true`    | Maintain directory structure |
| `concurrency`       | number   | `5`       | Number of parallel processes |
| `onProgress`        | function | -         | Progress callback function   |

### Processing Options

```typescript
const options = {
  // Directory settings
  inputDir: './source',
  outputDir: './output',
  recursive: true,
  preserveStructure: true,

  // File filtering
  extensions: ['.md', '.txt', '.markdown'],
  includePatterns: ['contract*', 'legal*'],
  excludePatterns: ['draft*', 'temp*', '*.backup'],

  // Processing settings
  concurrency: 3,
  outputFormat: 'pdf',
  cssPath: './styles/batch.css',
  includeHighlighting: false,

  // Progress tracking
  onProgress: (processed, total, file) => {
    console.log(`[${processed}/${total}] Processing: ${file}`);
  },

  // Error handling
  onError: (file, error) => {
    console.error(`Failed to process ${file}: ${error.message}`);
  },

  continueOnError: true,
  logErrors: true,
};

const result = await processBatch(options);
```

## Progress Callbacks

### Basic Progress Tracking

```typescript
const result = await processBatch({
  inputDir: './documents',
  outputDir: './processed',
  onProgress: (processed, total, currentFile) => {
    const percentage = ((processed / total) * 100).toFixed(1);
    console.log(
      `Progress: ${percentage}% (${processed}/${total}) - ${currentFile}`
    );
  },
});
```

### Advanced Progress Monitoring

```typescript
class ProgressMonitor {
  constructor() {
    this.startTime = Date.now();
    this.processedFiles = [];
    this.errorFiles = [];
  }

  onProgress = (processed, total, currentFile) => {
    const elapsed = Date.now() - this.startTime;
    const rate = processed / (elapsed / 1000);
    const eta = (total - processed) / rate;

    console.log(`[${processed}/${total}] ${currentFile}`);
    console.log(`Rate: ${rate.toFixed(1)} files/sec, ETA: ${eta.toFixed(0)}s`);

    this.processedFiles.push(currentFile);
  };

  onError = (file, error) => {
    console.error(`❌ Failed: ${file} - ${error.message}`);
    this.errorFiles.push({ file, error: error.message });
  };

  summary() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    console.log(`\n📊 Batch Processing Summary:`);
    console.log(`Total time: ${elapsed.toFixed(1)}s`);
    console.log(`Files processed: ${this.processedFiles.length}`);
    console.log(`Errors: ${this.errorFiles.length}`);
  }
}

const monitor = new ProgressMonitor();
const result = await processBatch({
  inputDir: './documents',
  outputDir: './processed',
  onProgress: monitor.onProgress,
  onError: monitor.onError,
});
monitor.summary();
```

### Progress Bar Integration

```typescript
import { ProgressBar } from 'progress';

let progressBar;

const result = await processBatch({
  inputDir: './documents',
  outputDir: './processed',
  onStart: total => {
    progressBar = new ProgressBar(
      'Processing [:bar] :rate/fps :percent :etas',
      {
        complete: '=',
        incomplete: ' ',
        width: 40,
        total: total,
      }
    );
  },
  onProgress: (processed, total, currentFile) => {
    progressBar.tick({
      file: currentFile.substring(0, 30),
    });
  },
});
```

## Error Handling

### Error Types

```typescript
interface BatchError {
  file: string;
  error: Error;
  type: 'parse' | 'process' | 'write' | 'permission' | 'unknown';
  recoverable: boolean;
}

interface BatchResult {
  totalProcessed: number;
  totalErrors: number;
  totalSkipped: number;
  errors: BatchError[];
  processedFiles: string[];
  skippedFiles: string[];
  duration: number;
}
```

### Comprehensive Error Handling

```typescript
const result = await processBatch({
  inputDir: './documents',
  outputDir: './processed',

  // Error handling options
  continueOnError: true,
  logErrors: true,
  errorLogPath: './batch-errors.log',

  // Custom error handling
  onError: (file, error, type) => {
    console.error(`Error in ${file}: ${error.message} (${type})`);

    // Handle specific error types
    switch (type) {
      case 'permission':
        console.log('Check file permissions');
        break;
      case 'parse':
        console.log('Invalid markdown syntax');
        break;
      case 'process':
        console.log('Template processing failed');
        break;
    }
  },

  // Retry configuration
  retryAttempts: 3,
  retryDelay: 1000,

  // File validation
  validateBeforeProcessing: true,
  skipInvalidFiles: true,
});

// Handle batch-level errors
if (result.totalErrors > 0) {
  console.error(`❌ ${result.totalErrors} files failed to process`);

  // Group errors by type
  const errorsByType = result.errors.reduce((acc, err) => {
    acc[err.type] = (acc[err.type] || 0) + 1;
    return acc;
  }, {});

  console.log('Error breakdown:', errorsByType);

  // Retry failed files
  const failedFiles = result.errors
    .filter(err => err.recoverable)
    .map(err => err.file);

  if (failedFiles.length > 0) {
    console.log(`Retrying ${failedFiles.length} recoverable failures...`);
    // Implement retry logic
  }
}
```

### Graceful Failure Handling

```typescript
async function robustBatchProcessing(inputDir, outputDir) {
  try {
    const result = await processBatch({
      inputDir,
      outputDir,
      continueOnError: true,

      // Pre-validation
      validateFiles: true,
      skipCorrupted: true,

      // Processing safeguards
      timeout: 30000, // 30 second timeout per file
      memoryLimit: '512MB',

      // Error recovery
      onError: async (file, error, type) => {
        if (type === 'memory') {
          console.log(`Memory issue with ${file}, processing individually...`);
          // Retry with lower memory settings
          return await processFileIndividually(file);
        }

        if (type === 'timeout') {
          console.log(`Timeout on ${file}, skipping...`);
          return null;
        }

        // Log for manual review
        await logErrorForReview(file, error, type);
      },
    });

    return result;
  } catch (batchError) {
    console.error('Batch processing completely failed:', batchError.message);

    // Fallback to sequential processing
    console.log('Falling back to sequential processing...');
    return await fallbackSequentialProcessing(inputDir, outputDir);
  }
}
```

## Advanced Configuration

### Performance Optimization

```typescript
const result = await processBatch({
  inputDir: './large-dataset',
  outputDir: './processed',

  // Performance settings
  concurrency: Math.min(8, require('os').cpus().length),
  chunkSize: 100, // Process in chunks
  memoryLimit: '1GB',
  timeout: 60000,

  // Optimization flags
  enableCaching: true,
  reuseCompiledTemplates: true,
  optimizeImages: true,

  // Resource management
  maxMemoryPerProcess: '256MB',
  gcAfterBatch: true,

  // I/O optimization
  useStreaming: true,
  bufferSize: 64 * 1024, // 64KB buffer
});
```

### Filtering and Selection

```typescript
const result = await processBatch({
  inputDir: './documents',
  outputDir: './processed',

  // File filtering
  extensions: ['.md', '.markdown'],
  includePatterns: ['contract-*.md', 'legal/*.md', 'templates/**.md'],
  excludePatterns: ['draft-*', '*.temp.md', 'archive/**', 'backup/**'],

  // Date filtering
  modifiedAfter: new Date('2025-01-01'),
  modifiedBefore: new Date('2025-12-31'),

  // Size filtering
  minFileSize: 1024, // 1KB minimum
  maxFileSize: 10 * 1024 * 1024, // 10MB maximum

  // Custom filtering
  customFilter: (filePath, stats) => {
    // Only process files modified in last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return stats.mtime.getTime() > thirtyDaysAgo;
  },
});
```

## Examples

### Legal Document Processing

```typescript
// Process contract templates
const contractResult = await processBatch({
  inputDir: './contract-templates',
  outputDir: './generated-contracts',

  // Contract-specific settings
  cssPath: './styles/legal-contract.css',
  outputFormat: 'pdf',
  includeHighlighting: false,

  // Performance for legal docs
  concurrency: 3, // Conservative for complex documents
  timeout: 120000, // 2 minutes per contract

  // Quality assurance
  validateBeforeProcessing: true,
  requireFieldCompletion: 0.9, // 90% field completion

  onProgress: (processed, total, file) => {
    console.log(`📄 Processing contract: ${file} (${processed}/${total})`);
  },
});
```

### Invoice Generation

```typescript
// Batch generate invoices
const invoices = await processBatch({
  inputDir: './invoice-data',
  outputDir: './generated-invoices',

  // Invoice settings
  outputFormat: 'both', // PDF and HTML
  cssPath: './styles/invoice.css',

  // File naming
  outputNaming: (inputFile, outputFormat) => {
    const date = new Date().toISOString().split('T')[0];
    const name = path.basename(inputFile, '.md');
    return `${name}_${date}.${outputFormat}`;
  },

  // Data enrichment
  preprocessor: async (content, filePath) => {
    // Add automatic invoice numbers
    const invoiceNumber = generateInvoiceNumber(filePath);
    return content.replace('{{auto_invoice_number}}', invoiceNumber);
  },
});
```

### Documentation Site Generation

```typescript
// Generate documentation site
const docsResult = await processBatch({
  inputDir: './docs-source',
  outputDir: './docs-site',

  // Web-optimized settings
  outputFormat: 'html',
  cssPath: './styles/docs.css',
  includeHighlighting: true,

  // Site generation
  generateIndex: true,
  linkProcessing: true,
  optimizeForWeb: true,

  // SEO and metadata
  addMetadata: true,
  generateSitemap: true,

  postProcessor: async (html, filePath) => {
    // Add navigation and footer
    return addSiteNavigation(html, filePath);
  },
});
```

### Multi-Language Processing

```typescript
// Process documents in multiple languages
const languages = ['en', 'es', 'fr', 'de'];

const multiLangResults = await Promise.all(
  languages.map(lang =>
    processBatch({
      inputDir: `./templates/${lang}`,
      outputDir: `./output/${lang}`,

      // Language-specific settings
      cssPath: `./styles/${lang}.css`,
      locale: lang,

      // Localization
      dateFormat: getDateFormatForLocale(lang),
      currencyFormat: getCurrencyFormatForLocale(lang),

      onProgress: (processed, total, file) => {
        console.log(`🌍 [${lang.toUpperCase()}] Processing: ${file}`);
      },
    })
  )
);
```

## Best Practices

### 1. Resource Management

```typescript
// ✅ Good - Reasonable concurrency
const result = await processBatch({
  concurrency: Math.min(4, require('os').cpus().length),
  memoryLimit: '512MB',
  timeout: 30000,
});

// ❌ Avoid - Too aggressive
const result = await processBatch({
  concurrency: 20, // May overwhelm system
  timeout: 5000, // Too short for complex docs
});
```

### 2. Error Handling Strategy

```typescript
// ✅ Good - Comprehensive error handling
const result = await processBatch({
  continueOnError: true,
  logErrors: true,
  retryAttempts: 2,

  onError: (file, error, type) => {
    // Log for analysis
    logger.error(`Batch processing error`, {
      file,
      error: error.message,
      type,
    });

    // Send notifications for critical errors
    if (type === 'critical') {
      notifyAdministrators(file, error);
    }
  },
});
```

### 3. Progress Monitoring

```typescript
// ✅ Good - Informative progress tracking
const result = await processBatch({
  onProgress: (processed, total, currentFile) => {
    const percentage = ((processed / total) * 100).toFixed(1);
    const fileName = path.basename(currentFile);

    // Clear, informative output
    console.log(`[${percentage}%] ${fileName} (${processed}/${total})`);

    // Update external systems
    updateProgressDashboard(processed, total);
  },
});
```

### 4. Directory Structure

```typescript
// ✅ Good - Preserve meaningful structure
const result = await processBatch({
  inputDir: './source',
  outputDir: './output',
  preserveStructure: true,

  // Custom directory mapping
  directoryMapping: inputPath => {
    return inputPath
      .replace('/drafts/', '/final/')
      .replace('/templates/', '/documents/');
  },
});
```

### 5. Validation and Quality Control

```typescript
// ✅ Good - Validate before and after processing
const result = await processBatch({
  // Pre-processing validation
  validateBeforeProcessing: true,
  skipInvalidFiles: true,

  // Post-processing validation
  validateOutput: true,

  // Quality checks
  requireFieldCompletion: 0.85,
  checkLinkValidity: true,

  // Custom validation
  customValidator: async (inputPath, outputPath) => {
    const isValid = await validateDocumentQuality(outputPath);
    if (!isValid) {
      throw new Error(`Quality check failed for ${outputPath}`);
    }
  },
});
```

## Troubleshooting

### Common Issues

**High memory usage:**

- Reduce concurrency level
- Enable streaming mode
- Process in smaller chunks

**Slow processing:**

- Check file sizes and complexity
- Optimize CSS and templates
- Use appropriate concurrency

**Permission errors:**

- Verify directory permissions
- Check file access rights
- Run with appropriate privileges

**Incomplete processing:**

- Review error logs
- Check disk space
- Validate input files

### Performance Monitoring

```typescript
// Monitor batch performance
const monitor = {
  startTime: Date.now(),
  memoryUsage: process.memoryUsage(),

  logPerformance: (processed, total) => {
    const currentMemory = process.memoryUsage();
    const elapsed = Date.now() - monitor.startTime;
    const rate = processed / (elapsed / 1000);

    console.log(
      `Memory: ${(currentMemory.heapUsed / 1024 / 1024).toFixed(1)}MB`
    );
    console.log(`Rate: ${rate.toFixed(1)} files/sec`);
  },
};
```

## See Also

- [Configuration](configuration.md) - Global and project configuration
- [Error Handling](error-handling.md) - Comprehensive error management
- [Best Practices](best-practices.md) - Performance and optimization
- [Processing Details](../processing/performance.md) - Technical performance
  guide
