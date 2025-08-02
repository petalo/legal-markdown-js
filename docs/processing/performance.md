# Performance Guide

Comprehensive optimization strategies, memory management, and best practices for
maximizing Legal Markdown JS performance in production environments.

## Table of Contents

- [Overview](#overview)
- [Performance Fundamentals](#performance-fundamentals)
- [Remark vs Legacy Performance](#remark-vs-legacy-performance)
- [Optimization Strategies](#optimization-strategies)
- [Memory Management](#memory-management)
- [Batch Processing](#batch-processing)
- [Caching Strategies](#caching-strategies)
- [Selective Processing](#selective-processing)
- [Benchmarking and Monitoring](#benchmarking-and-monitoring)
- [Production Optimizations](#production-optimizations)
- [Troubleshooting Performance Issues](#troubleshooting-performance-issues)

## Overview

Legal Markdown JS performance optimization focuses on several key areas:

- **Processing Speed** - Minimize document processing time
- **Memory Efficiency** - Reduce memory footprint for large documents
- **Concurrency** - Leverage parallel processing capabilities
- **Caching** - Intelligent caching of parsed templates and results
- **Resource Management** - Optimize CPU and I/O utilization

### Performance Targets

| Metric                   | Current  | Target (v2.16+) | Long-term (v3.0) |
| ------------------------ | -------- | --------------- | ---------------- |
| **Processing Speed**     | 1MB/s    | 5MB/s           | 20MB/s           |
| **Memory Usage**         | Baseline | -50%            | -75%             |
| **Startup Time**         | 2-3s     | <1s             | <500ms           |
| **Concurrent Documents** | 10       | 100             | 1000             |

## Performance Fundamentals

### Document Processing Pipeline

Understanding the processing pipeline helps identify optimization opportunities:

```typescript
// Processing stages and their typical performance impact
const processingStages = {
  'YAML Parsing': '5-10%', // Fast, minimal impact
  'Import Resolution': '15-25%', // I/O bound, cacheable
  'Template Processing': '30-40%', // CPU intensive
  'Field Tracking': '20-30%', // Memory intensive
  'Output Generation': '10-20%', // Format dependent
};
```

### Performance Bottlenecks

Common performance bottlenecks and their solutions:

```typescript
// Identify bottlenecks
const performanceProfile = {
  // CPU-bound operations
  templateProcessing: {
    issue: 'Complex template expressions',
    solution: 'Use AST caching and pre-compilation',
  },

  // Memory-bound operations
  fieldTracking: {
    issue: 'Large documents with many fields',
    solution: 'Streaming processing and selective tracking',
  },

  // I/O-bound operations
  fileOperations: {
    issue: 'Multiple import files',
    solution: 'Parallel loading and caching',
  },
};
```

## Remark vs Legacy Performance

### Performance Comparison

The remark-based processor offers significant performance improvements:

| Document Size | Legacy (ms) | Remark (ms) | Improvement |
| ------------- | ----------- | ----------- | ----------- |
| Small (1KB)   | 45          | 28          | 38% faster  |
| Medium (10KB) | 280         | 165         | 41% faster  |
| Large (100KB) | 2100        | 980         | 53% faster  |
| XL (1MB)      | 18500       | 7200        | 61% faster  |

### Why Remark is Faster

```typescript
// Legacy processing (multiple passes)
const legacyProcess = (content: string) => {
  const yamlParsed = parseYAML(content); // Pass 1
  const importsResolved = resolveImports(yamlParsed); // Pass 2
  const fieldsProcessed = processFields(importsResolved); // Pass 3
  const trackingAdded = addTracking(fieldsProcessed); // Pass 4
  return generateOutput(trackingAdded); // Pass 5
};

// Remark processing (single AST traversal)
const remarkProcess = async (content: string) => {
  return await processLegalMarkdownWithRemark(content, {
    // All operations in single AST pass:
    enableFieldTracking: true,
    processCrossReferences: true,
    processImports: true,
    enableHelpers: true,
  });
};
```

### Migration Benefits

```typescript
// Migrate to remark for better performance
import { processLegalMarkdownWithRemark } from 'legal-markdown-js';

const optimizedOptions = {
  // Performance optimizations
  useAST: true,
  enablePlugins: true,
  optimizePerformance: true,

  // Caching
  enableASTCache: true,
  astCacheSize: 100,
  astCacheTTL: 3600000,

  // Concurrency
  maxConcurrency: 4,
  streamProcessing: true,
};

const result = await processLegalMarkdownWithRemark(content, optimizedOptions);
```

## Optimization Strategies

### 1. Choose the Right Processing Mode

```typescript
// For development: Full features with debugging
const developmentOptions = {
  enableFieldTracking: true,
  includeFieldPositions: true,
  debugMode: true,
  collectErrors: true,
};

// For production: Optimized for speed
const productionOptions = {
  enableFieldTracking: false,
  optimizePerformance: true,
  minifyOutput: true,
  streamProcessing: true,
};

// For review: Balanced approach
const reviewOptions = {
  enableFieldTracking: true,
  outputFormat: 'html',
  includeHighlighting: true,
  optimizeForDisplay: true,
};
```

### 2. Selective Feature Enabling

```typescript
// Enable only needed features
const selectiveOptions = {
  // Core features
  processImports: true,
  resolveVariables: true,

  // Optional features (disable if not needed)
  enableFieldTracking: false, // Disable for clean output
  processCrossReferences: false, // Disable if no |references|
  enableHelpers: true, // Keep if using {{helpers()}}
  processConditionals: true, // Keep if using [content]{condition}

  // Performance features
  enableCache: true,
  batchProcessing: true,
};
```

### 3. Template Optimization

```typescript
// Optimize template structure
const templateOptimization = {
  // ✅ Good: Simple field references
  simpleFields: '{{client_name}}',

  // ⚠️ Caution: Nested helper calls
  nestedHelpers: '{{upper(formatDate(addDays(@today, 30), "DD/MM/YYYY"))}}',

  // ✅ Better: Pre-calculate in YAML
  preCalculated: '{{formatted_due_date}}', // Calculated in frontmatter
};

// YAML frontmatter optimization
const optimizedYAML = `
---
# Pre-calculate complex values
due_date: "@today+30"
formatted_due_date: "{{formatDate(due_date, 'DD/MM/YYYY')}}"
client_display_name: "{{upper(client_name)}}"

# Group related data
client:
  name: "Acme Corp"
  email: "contact@acme.com"
  address: "123 Main St"
---
`;
```

## Memory Management

### 1. Large Document Handling

```typescript
// Stream processing for large documents
const largeDocumentOptions = {
  streamProcessing: true,
  chunkSize: 1024 * 1024, // 1MB chunks
  maxMemoryUsage: '512MB', // Memory limit
  enableGarbageCollection: true, // Force GC
  processingTimeout: 30000, // 30 second timeout
};

// Process large documents efficiently
async function processLargeDocument(filePath: string) {
  const stream = fs.createReadStream(filePath);
  const result = await processLegalMarkdownWithRemark(
    stream,
    largeDocumentOptions
  );
  return result;
}
```

### 2. Memory Monitoring

```typescript
// Monitor memory usage during processing
function monitorMemory() {
  const usage = process.memoryUsage();
  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
    external: Math.round(usage.external / 1024 / 1024) + 'MB',
    rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
  };
}

// Memory-aware processing
async function processWithMemoryMonitoring(content: string) {
  const initialMemory = monitorMemory();
  console.log('Initial memory:', initialMemory);

  const result = await processLegalMarkdownWithRemark(content, {
    enableMemoryMonitoring: true,
    memoryCallback: usage => {
      if (usage.heapUsed > 500 * 1024 * 1024) {
        // 500MB
        console.warn('High memory usage detected:', usage);
      }
    },
  });

  const finalMemory = monitorMemory();
  console.log('Final memory:', finalMemory);

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  return result;
}
```

### 3. Memory Leak Prevention

```typescript
// Prevent memory leaks in long-running processes
class DocumentProcessor {
  private cache = new Map();
  private readonly maxCacheSize = 100;

  async processDocument(content: string) {
    // Limit cache size
    if (this.cache.size > this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    // Process with timeout
    const result = await Promise.race([
      processLegalMarkdownWithRemark(content),
      this.timeoutPromise(30000),
    ]);

    return result;
  }

  private timeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Processing timeout')), ms);
    });
  }

  // Clean up resources
  dispose() {
    this.cache.clear();
  }
}
```

## Batch Processing

### 1. Efficient Batch Operations

```typescript
// Optimize batch processing for multiple documents
import { processBatch } from 'legal-markdown-js';

const batchOptions = {
  // Concurrency control
  concurrency: 4, // Optimal for most systems
  maxConcurrentMemory: '1GB', // Total memory limit

  // Processing options
  enableCache: true, // Cache between documents
  shareTemplateCache: true, // Share cache across processes
  reuseWorkers: true, // Reuse worker processes

  // Progress monitoring
  progressCallback: (completed, total, currentFile) => {
    const percent = Math.round((completed / total) * 100);
    console.log(
      `Progress: ${percent}% (${completed}/${total}) - ${currentFile}`
    );
  },

  // Error handling
  continueOnError: true, // Don't stop on individual failures
  collectErrors: true, // Collect errors for review

  // Output options
  preserveStructure: true, // Maintain directory structure
  outputPath: './processed', // Output directory
};

// Process multiple documents
async function processBatchDocuments() {
  const result = await processBatch({
    inputDir: './documents',
    outputDir: './processed',
    extensions: ['.md', '.txt'],
    recursive: true,
    ...batchOptions,
  });

  console.log(`Processed: ${result.totalProcessed}`);
  console.log(`Errors: ${result.totalErrors}`);
  console.log(`Total time: ${result.processingTime}ms`);

  return result;
}
```

### 2. Worker Thread Optimization

```typescript
// Utilize worker threads for CPU-intensive operations
import { Worker, isMainThread, parentPort } from 'worker_threads';

// Main thread
if (isMainThread) {
  async function processWithWorkers(documents: string[]) {
    const numWorkers = Math.min(documents.length, 4);
    const workers = [];
    const chunkSize = Math.ceil(documents.length / numWorkers);

    for (let i = 0; i < numWorkers; i++) {
      const chunk = documents.slice(i * chunkSize, (i + 1) * chunkSize);
      const worker = new Worker(__filename);
      workers.push(
        new Promise((resolve, reject) => {
          worker.postMessage(chunk);
          worker.on('message', resolve);
          worker.on('error', reject);
        })
      );
    }

    const results = await Promise.all(workers);
    return results.flat();
  }
} else {
  // Worker thread
  parentPort?.on('message', async documents => {
    const results = [];
    for (const doc of documents) {
      try {
        const result = await processLegalMarkdownWithRemark(doc);
        results.push(result);
      } catch (error) {
        results.push({ error: error.message });
      }
    }
    parentPort?.postMessage(results);
  });
}
```

### 3. Batch Processing Best Practices

```typescript
// Optimal batch processing configuration
const optimalBatchConfig = {
  // System resource utilization
  concurrency: Math.min(4, require('os').cpus().length),

  // Memory management
  maxMemoryPerWorker: '256MB',
  enableMemoryMonitoring: true,

  // Performance optimization
  enableSharedCache: true,
  precompileTemplates: true,
  reuseConnections: true,

  // Error resilience
  retryFailedDocuments: 2,
  timeoutPerDocument: 30000,

  // Progress tracking
  reportInterval: 100, // Report every 100 documents
  enableDetailedLogging: false, // Disable in production
};
```

## Caching Strategies

### 1. Multi-Level Caching

```typescript
// Implement comprehensive caching strategy
const cachingStrategy = {
  // Level 1: AST Cache (in-memory)
  astCache: {
    enabled: true,
    maxSize: 100,
    ttl: 3600000, // 1 hour
    strategy: 'lru',
  },

  // Level 2: Template Cache (in-memory)
  templateCache: {
    enabled: true,
    maxSize: 50,
    ttl: 7200000, // 2 hours
    strategy: 'lfu',
  },

  // Level 3: Result Cache (persistent)
  resultCache: {
    enabled: true,
    storage: 'redis', // or 'file', 'memory'
    maxSize: '100MB',
    ttl: 86400000, // 24 hours
    strategy: 'ttl',
  },

  // Level 4: HTTP Cache (for web usage)
  httpCache: {
    enabled: true,
    headers: {
      'Cache-Control': 'public, max-age=3600',
      ETag: true,
    },
  },
};

// Configure caching
const cachedOptions = {
  ...cachingStrategy,

  // Cache validation
  validateCache: true,
  invalidateOnChange: true,

  // Cache warming
  preloadCommonTemplates: true,
  backgroundRefresh: true,
};
```

### 2. Intelligent Cache Invalidation

```typescript
// Smart cache invalidation based on content changes
class IntelligentCache {
  private cache = new Map();
  private checksums = new Map();

  async get(key: string, content: string) {
    const checksum = this.calculateChecksum(content);
    const cached = this.cache.get(key);

    if (cached && this.checksums.get(key) === checksum) {
      return cached; // Cache hit
    }

    // Cache miss or content changed
    const result = await this.process(content);
    this.cache.set(key, result);
    this.checksums.set(key, checksum);

    return result;
  }

  private calculateChecksum(content: string): string {
    return require('crypto').createHash('md5').update(content).digest('hex');
  }

  private async process(content: string) {
    return await processLegalMarkdownWithRemark(content);
  }
}
```

### 3. Distributed Caching

```typescript
// Distributed caching for multiple instances
import Redis from 'ioredis';

class DistributedCache {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
  }

  async get(key: string): Promise<any> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

## Selective Processing

### 1. Conditional Feature Activation

```typescript
// Enable features based on document characteristics
function getOptimalOptions(content: string, metadata: any) {
  const options: any = {
    // Always enabled
    processVariables: true,
    resolveImports: true,
  };

  // Enable field tracking only for review mode
  if (metadata.mode === 'review') {
    options.enableFieldTracking = true;
    options.includeHighlighting = true;
  }

  // Enable cross-references only if document contains them
  if (content.includes('|') && content.includes('|')) {
    options.processCrossReferences = true;
  }

  // Enable helpers only if document uses them
  if (content.includes('{{') && content.includes('(')) {
    options.enableHelpers = true;
  }

  // Enable conditionals only if document uses them
  if (content.includes('[') && content.includes(']{')) {
    options.processConditionals = true;
  }

  return options;
}
```

### 2. Skip Flags for CLI

```bash
# Production: Skip unnecessary processing
legal-md --no-field-tracking --no-metadata --no-validation contract.md final.pdf

# Development: Full processing with debugging
legal-md --debug --enable-field-tracking --include-positions contract.md review.html

# Quick conversion: Minimal processing
legal-md --no-imports --no-mixins --no-headers simple.md output.md

# Batch processing: Optimized for speed
legal-md --batch --no-field-tracking --concurrency 8 ./documents/ ./output/
```

### 3. Dynamic Optimization

```typescript
// Automatically optimize based on document size and complexity
function autoOptimize(content: string) {
  const size = content.length;
  const complexity = analyzeComplexity(content);

  let options = {};

  // Small documents: Full features
  if (size < 10000) {
    options = {
      enableFieldTracking: true,
      includePositions: true,
      debugMode: true,
    };
  }
  // Medium documents: Balanced
  else if (size < 100000) {
    options = {
      enableFieldTracking: true,
      streamProcessing: false,
      optimizePerformance: true,
    };
  }
  // Large documents: Performance focused
  else {
    options = {
      enableFieldTracking: false,
      streamProcessing: true,
      optimizePerformance: true,
      batchProcessing: true,
    };
  }

  // Adjust based on complexity
  if (complexity.imports > 10) {
    options.enableImportCache = true;
  }

  if (complexity.variables > 100) {
    options.enableVariableCache = true;
  }

  return options;
}

function analyzeComplexity(content: string) {
  return {
    imports: (content.match(/{{import:/g) || []).length,
    variables: (content.match(/{{[^}]+}}/g) || []).length,
    conditionals: (content.match(/\[.*?\]\{.*?\}/g) || []).length,
    helpers: (content.match(/{{[^}]*\([^}]*\)[^}]*}}/g) || []).length,
  };
}
```

## Benchmarking and Monitoring

### 1. Performance Benchmarking

```typescript
// Comprehensive benchmarking suite
class PerformanceBenchmark {
  private results: any[] = [];

  async benchmark(testCases: any[]) {
    for (const testCase of testCases) {
      const start = process.hrtime.bigint();
      const memBefore = process.memoryUsage();

      try {
        const result = await processLegalMarkdownWithRemark(
          testCase.content,
          testCase.options
        );

        const end = process.hrtime.bigint();
        const memAfter = process.memoryUsage();

        this.results.push({
          name: testCase.name,
          size: testCase.content.length,
          processingTime: Number(end - start) / 1000000, // ms
          memoryDelta: memAfter.heapUsed - memBefore.heapUsed,
          success: true,
          outputSize: result.content.length,
        });
      } catch (error) {
        this.results.push({
          name: testCase.name,
          error: error.message,
          success: false,
        });
      }
    }

    return this.generateReport();
  }

  private generateReport() {
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);

    return {
      summary: {
        totalTests: this.results.length,
        successful: successful.length,
        failed: failed.length,
        avgProcessingTime:
          successful.reduce((a, b) => a + b.processingTime, 0) /
          successful.length,
        avgMemoryUsage:
          successful.reduce((a, b) => a + b.memoryDelta, 0) / successful.length,
      },
      details: this.results,
      recommendations: this.generateRecommendations(),
    };
  }

  private generateRecommendations() {
    const recommendations = [];
    const avgTime =
      this.results.reduce((a, b) => a + (b.processingTime || 0), 0) /
      this.results.length;

    if (avgTime > 1000) {
      recommendations.push('Consider enabling caching for better performance');
    }

    const avgMemory =
      this.results.reduce((a, b) => a + (b.memoryDelta || 0), 0) /
      this.results.length;
    if (avgMemory > 50 * 1024 * 1024) {
      // 50MB
      recommendations.push(
        'High memory usage detected - consider streaming processing'
      );
    }

    return recommendations;
  }
}
```

### 2. Real-time Monitoring

```typescript
// Production monitoring and alerting
class PerformanceMonitor {
  private metrics = {
    processingTimes: [],
    memoryUsage: [],
    errorRates: [],
    throughput: [],
  };

  startMonitoring() {
    // Collect metrics every 30 seconds
    setInterval(() => {
      this.collectMetrics();
    }, 30000);

    // Alert on performance degradation
    setInterval(() => {
      this.checkAlerts();
    }, 60000);
  }

  private collectMetrics() {
    const usage = process.memoryUsage();
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
    });

    // Keep only last 100 measurements
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage.shift();
    }
  }

  private checkAlerts() {
    const recent = this.metrics.memoryUsage.slice(-10);
    const avgMemory =
      recent.reduce((a, b) => a + b.heapUsed, 0) / recent.length;

    if (avgMemory > 500 * 1024 * 1024) {
      // 500MB
      console.warn(
        `High memory usage alert: ${Math.round(avgMemory / 1024 / 1024)}MB`
      );
    }

    const recentTimes = this.metrics.processingTimes.slice(-10);
    const avgTime = recentTimes.reduce((a, b) => a + b, 0) / recentTimes.length;

    if (avgTime > 5000) {
      // 5 seconds
      console.warn(`Slow processing alert: ${Math.round(avgTime)}ms average`);
    }
  }

  recordProcessingTime(time: number) {
    this.metrics.processingTimes.push(time);
    if (this.metrics.processingTimes.length > 100) {
      this.metrics.processingTimes.shift();
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      summary: {
        avgProcessingTime:
          this.metrics.processingTimes.reduce((a, b) => a + b, 0) /
          this.metrics.processingTimes.length,
        avgMemoryUsage:
          this.metrics.memoryUsage.reduce((a, b) => a + b.heapUsed, 0) /
          this.metrics.memoryUsage.length,
        currentThroughput: this.calculateThroughput(),
      },
    };
  }

  private calculateThroughput() {
    const lastMinute = Date.now() - 60000;
    const recentProcessing = this.metrics.processingTimes.filter(
      t => t > lastMinute
    );
    return recentProcessing.length; // Documents per minute
  }
}
```

## Production Optimizations

### 1. Environment-Specific Configuration

```typescript
// Optimize for different environments
const environmentConfigs = {
  development: {
    enableFieldTracking: true,
    includeDebugInfo: true,
    logLevel: 'debug',
    enableCache: false, // Fresh results for development
    strictValidation: true,
  },

  staging: {
    enableFieldTracking: true,
    includeDebugInfo: false,
    logLevel: 'info',
    enableCache: true,
    performanceMonitoring: true,
  },

  production: {
    enableFieldTracking: false,
    includeDebugInfo: false,
    logLevel: 'error',
    enableCache: true,
    optimizePerformance: true,
    streamProcessing: true,
    batchProcessing: true,
    minifyOutput: true,
  },
};

// Load environment-specific config
const config = environmentConfigs[process.env.NODE_ENV || 'development'];
```

### 2. Resource Limits and Quotas

```typescript
// Set appropriate resource limits
const resourceLimits = {
  // Memory limits
  maxMemoryUsage: process.env.MAX_MEMORY || '512MB',
  memoryCheckInterval: 30000,

  // Processing limits
  maxProcessingTime: parseInt(process.env.MAX_PROCESSING_TIME || '30000'),
  maxConcurrentDocuments: parseInt(process.env.MAX_CONCURRENT || '10'),

  // Cache limits
  maxCacheSize: process.env.MAX_CACHE_SIZE || '100MB',
  cacheEvictionPolicy: 'lru',

  // Rate limiting
  maxRequestsPerMinute: 100,
  burstLimit: 10,
};

// Apply limits
function createLimitedProcessor() {
  const semaphore = new Semaphore(resourceLimits.maxConcurrentDocuments);

  return async function processWithLimits(content: string) {
    return await semaphore.acquire(async () => {
      const timeout = setTimeout(() => {
        throw new Error('Processing timeout exceeded');
      }, resourceLimits.maxProcessingTime);

      try {
        const result = await processLegalMarkdownWithRemark(content, {
          maxMemoryUsage: resourceLimits.maxMemoryUsage,
          enableGarbageCollection: true,
        });

        return result;
      } finally {
        clearTimeout(timeout);
      }
    });
  };
}
```

### 3. Horizontal Scaling

```typescript
// Load balancing and horizontal scaling
class ProcessingCluster {
  private workers: Worker[] = [];
  private roundRobinIndex = 0;

  constructor(workerCount: number = require('os').cpus().length) {
    for (let i = 0; i < workerCount; i++) {
      this.createWorker();
    }
  }

  private createWorker() {
    const worker = new Worker('./document-processor-worker.js');

    worker.on('error', error => {
      console.error('Worker error:', error);
      this.replaceWorker(worker);
    });

    worker.on('exit', code => {
      if (code !== 0) {
        console.error(`Worker exited with code ${code}`);
        this.replaceWorker(worker);
      }
    });

    this.workers.push(worker);
  }

  private replaceWorker(oldWorker: Worker) {
    const index = this.workers.indexOf(oldWorker);
    if (index !== -1) {
      oldWorker.terminate();
      this.workers.splice(index, 1);
      this.createWorker();
    }
  }

  async process(content: string): Promise<any> {
    const worker = this.getNextWorker();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker timeout'));
      }, 30000);

      worker.postMessage({ content, id: Date.now() });

      worker.once('message', result => {
        clearTimeout(timeout);
        if (result.error) {
          reject(new Error(result.error));
        } else {
          resolve(result.data);
        }
      });
    });
  }

  private getNextWorker(): Worker {
    const worker = this.workers[this.roundRobinIndex];
    this.roundRobinIndex = (this.roundRobinIndex + 1) % this.workers.length;
    return worker;
  }

  shutdown() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
  }
}
```

## Troubleshooting Performance Issues

### 1. Common Performance Problems

```typescript
// Diagnostic tools for performance issues
class PerformanceDiagnostics {
  static diagnoseSlowProcessing(content: string, processingTime: number) {
    const issues = [];

    // Check document size
    if (content.length > 1000000) {
      issues.push({
        type: 'Large Document',
        severity: 'high',
        suggestion: 'Enable streaming processing',
      });
    }

    // Check complexity
    const complexity = this.analyzeComplexity(content);
    if (complexity.score > 100) {
      issues.push({
        type: 'High Complexity',
        severity: 'medium',
        suggestion: 'Simplify template expressions or enable caching',
      });
    }

    // Check processing time
    if (processingTime > 5000) {
      issues.push({
        type: 'Slow Processing',
        severity: 'high',
        suggestion: 'Enable performance optimizations',
      });
    }

    return issues;
  }

  static analyzeComplexity(content: string) {
    const metrics = {
      imports: (content.match(/{{import:/g) || []).length,
      variables: (content.match(/{{[^}]+}}/g) || []).length,
      helpers: (content.match(/{{[^}]*\([^}]*\)[^}]*}}/g) || []).length,
      conditionals: (content.match(/\[.*?\]\{.*?\}/g) || []).length,
      crossRefs: (content.match(/\|[^|]+\|/g) || []).length,
    };

    // Calculate complexity score
    const score =
      metrics.imports * 5 +
      metrics.variables * 1 +
      metrics.helpers * 3 +
      metrics.conditionals * 2 +
      metrics.crossRefs * 2;

    return { ...metrics, score };
  }
}
```

### 2. Memory Leak Detection

```typescript
// Memory leak detection and prevention
class MemoryLeakDetector {
  private snapshots: any[] = [];
  private intervalId: NodeJS.Timeout | null = null;

  startMonitoring() {
    this.intervalId = setInterval(() => {
      this.takeSnapshot();
      this.analyzeLeaks();
    }, 30000);
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private takeSnapshot() {
    const usage = process.memoryUsage();
    this.snapshots.push({
      timestamp: Date.now(),
      ...usage,
    });

    // Keep only last 20 snapshots
    if (this.snapshots.length > 20) {
      this.snapshots.shift();
    }
  }

  private analyzeLeaks() {
    if (this.snapshots.length < 10) return;

    const recent = this.snapshots.slice(-10);
    const oldest = recent[0];
    const newest = recent[recent.length - 1];

    const heapGrowth = newest.heapUsed - oldest.heapUsed;
    const timeSpan = newest.timestamp - oldest.timestamp;
    const growthRate = heapGrowth / timeSpan; // bytes per ms

    if (growthRate > 100) {
      // 100 bytes per ms = potential leak
      console.warn(
        `Potential memory leak detected: ${Math.round(growthRate * 1000)} bytes/second growth`
      );

      // Trigger garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
  }
}
```

### 3. Performance Debugging

```bash
# Enable performance debugging
NODE_OPTIONS="--inspect" legal-md --debug --profile document.md

# Memory profiling
NODE_OPTIONS="--inspect --expose-gc" legal-md --debug document.md

# CPU profiling
NODE_OPTIONS="--prof" legal-md document.md
# Then analyze with: node --prof-process isolate-*-v8.log

# Heap snapshots
legal-md --debug --heap-snapshot document.md
```

```typescript
// Programmatic performance debugging
const performanceOptions = {
  enableProfiling: true,
  profileOutput: './profiles',
  measureOperations: true,
  trackMemoryAllocations: true,

  // Detailed timing
  timingCallback: (operation: string, duration: number) => {
    if (duration > 100) {
      console.log(`Slow operation: ${operation} took ${duration}ms`);
    }
  },

  // Memory tracking
  memoryCallback: (operation: string, delta: number) => {
    if (delta > 10 * 1024 * 1024) {
      // 10MB
      console.log(
        `Memory spike: ${operation} used ${Math.round(delta / 1024 / 1024)}MB`
      );
    }
  },
};
```

## Best Practices Summary

### 1. Choose the Right Approach

- **Development**: Use full features with debugging enabled
- **Review**: Enable field tracking and highlighting for visual feedback
- **Production**: Optimize for speed with minimal features

### 2. Optimize Based on Document Characteristics

- **Small documents**: Full processing with all features
- **Large documents**: Streaming processing with selective features
- **Complex documents**: Enable caching and pre-compilation

### 3. Monitor and Measure

- Implement performance monitoring in production
- Use benchmarking to validate optimizations
- Monitor memory usage and detect leaks early

### 4. Scale Appropriately

- Use batch processing for multiple documents
- Implement worker threads for CPU-intensive operations
- Consider horizontal scaling for high-throughput scenarios

## See Also

- [Remark Processing](remark-processing.md) - AST-based performance improvements
- [Field Tracking](field-tracking.md) - Field tracking performance
  considerations
- [Batch Processing](../advanced/batch-processing.md) - Efficient multi-document
  processing
- [Configuration](../advanced/configuration.md) - Performance-related
  configuration options
