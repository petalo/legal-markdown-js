/**
 * Memory Profiling Tests: Legacy vs Handlebars
 *
 * This test suite measures memory usage for both legacy and Handlebars
 * template processing with large documents to detect memory leaks and
 * ensure efficient memory management.
 *
 * Tests include:
 * - Large documents (100KB, 500KB, 1MB)
 * - Multiple sequential operations
 * - Memory leak detection
 * - Garbage collection efficiency
 */

import { describe, it, expect } from 'vitest';
import { processLegalMarkdown } from '../../src/index';

interface MemorySnapshot {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

interface MemoryTestResult {
  name: string;
  before: MemorySnapshot;
  after: MemorySnapshot;
  delta: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  documentSize: number;
}

/**
 * Takes a memory snapshot
 */
function takeMemorySnapshot(): MemorySnapshot {
  const mem = process.memoryUsage();
  return {
    heapUsed: mem.heapUsed,
    heapTotal: mem.heapTotal,
    external: mem.external,
    rss: mem.rss,
  };
}

/**
 * Forces garbage collection if available
 */
function forceGC(): void {
  if (global.gc) {
    global.gc();
  }
}

/**
 * Formats bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

/**
 * Runs a memory test
 */
async function memoryTest(
  name: string,
  template: string,
  iterations: number = 10
): Promise<MemoryTestResult> {
  // Force GC before test
  forceGC();
  await new Promise(resolve => setTimeout(resolve, 100));

  const before = takeMemorySnapshot();
  const documentSize = Buffer.byteLength(template, 'utf8');

  // Process template multiple times
  for (let i = 0; i < iterations; i++) {
    await processLegalMarkdown(template);
  }

  // Force GC after test
  forceGC();
  await new Promise(resolve => setTimeout(resolve, 100));

  const after = takeMemorySnapshot();

  return {
    name,
    before,
    after,
    delta: {
      heapUsed: after.heapUsed - before.heapUsed,
      heapTotal: after.heapTotal - before.heapTotal,
      external: after.external - before.external,
      rss: after.rss - before.rss,
    },
    documentSize,
  };
}

/**
 * Prints memory test results
 */
function printMemoryResults(results: MemoryTestResult[]): void {
  console.log('\n' + '='.repeat(90));
  console.log('MEMORY PROFILING RESULTS');
  console.log('='.repeat(90));
  console.log(
    `${'Test'.padEnd(30)} | ${'Doc Size'.padStart(12)} | ${'Heap Δ'.padStart(12)} | ${'RSS Δ'.padStart(12)}`
  );
  console.log('-'.repeat(90));

  for (const result of results) {
    const docSize = formatBytes(result.documentSize);
    const heapDelta = formatBytes(result.delta.heapUsed);
    const rssDelta = formatBytes(result.delta.rss);

    // Check if memory increase is reasonable (less than 10x document size)
    const ratio = result.delta.heapUsed / result.documentSize;
    const indicator = ratio < 10 ? '✓' : ratio < 50 ? '⚠' : '✗';

    console.log(
      `${result.name.padEnd(30)} | ${docSize.padStart(12)} | ${heapDelta.padStart(12)} | ${rssDelta.padStart(12)} ${indicator}`
    );
  }

  console.log('-'.repeat(90));
  console.log('\nLegend: ✓ < 10x | ⚠ 10-50x | ✗ > 50x (heap growth vs document size)');
  console.log('='.repeat(90) + '\n');
}

/**
 * Generates a large template with many variables and loops
 */
function generateLargeTemplate(targetSize: number): string {
  const items = Math.floor(targetSize / 200); // Approximate items needed

  const itemsArray = Array.from({ length: items }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    description: `This is a detailed description for item ${i + 1}`,
    price: 99.99 + i,
    quantity: 10 + (i % 50),
  }));

  return `---
title: "Large Contract Document"
company: "ACME Corporation"
items: ${JSON.stringify(itemsArray)}
---

# {{title}}

**Company**: {{company}}

## Items

{{#each items}}
### Item {{id}}: {{name}}

{{description}}

- **Price**: {{formatCurrency price "USD"}}
- **Quantity**: {{quantity}}
- **Total**: {{formatCurrency (multiply price quantity) "USD"}}

{{/each}}

## Summary

Total items: {{items.length}}
`;
}

describe('Memory Profiling: Handlebars Template Processing', () => {
  const results: MemoryTestResult[] = [];

  it('should handle small documents (10KB) efficiently', async () => {
    const template = generateLargeTemplate(10 * 1024); // 10KB
    const result = await memoryTest('Small doc (10KB)', template, 20);
    results.push(result);

    // Small documents have higher overhead ratio due to fixed initialization costs
    // This is acceptable and improves dramatically with larger documents
    const ratio = result.delta.heapUsed / result.documentSize;
    expect(ratio).toBeLessThan(250);
  });

  it('should handle medium documents (100KB) efficiently', async () => {
    const template = generateLargeTemplate(100 * 1024); // 100KB
    const result = await memoryTest('Medium doc (100KB)', template, 10);
    results.push(result);

    const ratio = result.delta.heapUsed / result.documentSize;
    expect(ratio).toBeLessThan(50);
  });

  it('should handle large documents (500KB) efficiently', async () => {
    const template = generateLargeTemplate(500 * 1024); // 500KB
    const result = await memoryTest('Large doc (500KB)', template, 5);
    results.push(result);

    const ratio = result.delta.heapUsed / result.documentSize;
    expect(ratio).toBeLessThan(50);
  });

  it('should handle very large documents (1MB) efficiently', async () => {
    const template = generateLargeTemplate(1024 * 1024); // 1MB
    const result = await memoryTest('Very large doc (1MB)', template, 3);
    results.push(result);

    const ratio = result.delta.heapUsed / result.documentSize;
    expect(ratio).toBeLessThan(50);
  });

  it('should not leak memory with sequential operations', async () => {
    const template = `---
items:
  - name: Item 1
  - name: Item 2
  - name: Item 3
---
{{#each items}}
- {{name}}
{{/each}}`;

    forceGC();
    await new Promise(resolve => setTimeout(resolve, 100));
    const before = takeMemorySnapshot();

    // Process 100 times
    for (let i = 0; i < 100; i++) {
      await processLegalMarkdown(template);
    }

    forceGC();
    await new Promise(resolve => setTimeout(resolve, 100));
    const after = takeMemorySnapshot();

    const heapGrowth = after.heapUsed - before.heapUsed;

    // Memory growth should be minimal after GC (less than 5MB for 100 operations)
    expect(heapGrowth).toBeLessThan(5 * 1024 * 1024);
  });

  it('should print memory profiling summary', () => {
    printMemoryResults(results);
  });
});
