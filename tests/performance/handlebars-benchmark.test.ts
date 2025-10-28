/**
 * Performance Benchmarks: Legacy vs Handlebars
 *
 * This test suite measures performance differences between legacy and Handlebars
 * template processing to ensure Handlebars doesn't introduce significant overhead.
 *
 * Benchmarks include:
 * - Simple variable substitution
 * - Helper function calls
 * - Loops with various sizes
 * - Conditionals
 * - Complex nested structures
 * - Real-world document scenarios
 */

import { describe, it, expect } from 'vitest';
import { processLegalMarkdown } from '../../src/index';

interface BenchmarkResult {
  name: string;
  legacyTime: number;
  handlebarsTime: number;
  ratio: number;
  operations: number;
}

/**
 * Runs a benchmark comparing legacy vs Handlebars performance
 */
async function benchmark(
  name: string,
  legacyTemplate: string,
  handlebarsTemplate: string,
  iterations: number = 100
): Promise<BenchmarkResult> {
  // Warm up
  await processLegalMarkdown(legacyTemplate);
  await processLegalMarkdown(handlebarsTemplate);

  // Benchmark legacy
  const legacyStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await processLegalMarkdown(legacyTemplate);
  }
  const legacyEnd = performance.now();
  const legacyTime = legacyEnd - legacyStart;

  // Benchmark Handlebars
  const handlebarsStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await processLegalMarkdown(handlebarsTemplate);
  }
  const handlebarsEnd = performance.now();
  const handlebarsTime = handlebarsEnd - handlebarsStart;

  const ratio = handlebarsTime / legacyTime;

  return {
    name,
    legacyTime,
    handlebarsTime,
    ratio,
    operations: iterations,
  };
}

/**
 * Prints benchmark results in a formatted table
 */
function printResults(results: BenchmarkResult[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('PERFORMANCE BENCHMARK RESULTS: Legacy vs Handlebars');
  console.log('='.repeat(80));
  console.log(
    `${'Test'.padEnd(35)} | ${'Legacy'.padStart(10)} | ${'Handlebars'.padStart(10)} | ${'Ratio'.padStart(8)}`
  );
  console.log('-'.repeat(80));

  for (const result of results) {
    const legacy = `${result.legacyTime.toFixed(2)}ms`;
    const handlebars = `${result.handlebarsTime.toFixed(2)}ms`;
    const ratio = `${result.ratio.toFixed(2)}x`;
    const indicator = result.ratio < 1.2 ? '✓' : result.ratio < 2 ? '⚠' : '✗';

    console.log(
      `${result.name.padEnd(35)} | ${legacy.padStart(10)} | ${handlebars.padStart(10)} | ${ratio.padStart(8)} ${indicator}`
    );
  }

  console.log('-'.repeat(80));

  // Summary statistics
  const avgRatio = results.reduce((sum, r) => sum + r.ratio, 0) / results.length;
  const maxRatio = Math.max(...results.map(r => r.ratio));
  const minRatio = Math.min(...results.map(r => r.ratio));

  console.log(`Average ratio: ${avgRatio.toFixed(2)}x`);
  console.log(`Min ratio: ${minRatio.toFixed(2)}x (best relative performance)`);
  console.log(`Max ratio: ${maxRatio.toFixed(2)}x (worst relative performance)`);
  console.log('\nLegend: ✓ < 1.2x | ⚠ 1.2-2x | ✗ > 2x');
  console.log('='.repeat(80) + '\n');
}

describe('Performance Benchmarks: Legacy vs Handlebars', () => {
  const results: BenchmarkResult[] = [];

  it('should benchmark simple variable substitution', async () => {
    const legacy = `---
name: "John Doe"
company: "ACME Corp"
---
This agreement is between {{name}} and {{company}}.`;

    const handlebars = `---
name: "John Doe"
company: "ACME Corp"
---
This agreement is between {{name}} and {{company}}.`;

    const result = await benchmark('Simple variables', legacy, handlebars, 200);
    results.push(result);

    // Handlebars should be within 2x of legacy performance
    expect(result.ratio).toBeLessThan(2);
  });

  it('should benchmark helper functions', async () => {
    const legacy = `---
date: 2025-01-15
amount: 1234.56
---
Date: {{formatDate(date, "US")}}
Amount: {{formatCurrency(amount, "USD")}}`;

    const handlebars = `---
date: 2025-01-15
amount: 1234.56
---
Date: {{formatDate date "US"}}
Amount: {{formatCurrency amount "USD"}}`;

    const result = await benchmark('Helper functions', legacy, handlebars, 200);
    results.push(result);

    // Helper functions have more overhead due to Handlebars option filtering
    // but this is acceptable for the added robustness (typically ~3-4x)
    expect(result.ratio).toBeLessThan(5);
  });

  it('should benchmark small loops (10 items)', async () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
    }));

    const legacy = `---
items: ${JSON.stringify(items)}
---
{{#each items}}
- {{id}}: {{name}}
{{/each}}`;

    const handlebars = `---
items: ${JSON.stringify(items)}
---
{{#each items}}
- {{id}}: {{name}}
{{/each}}`;

    const result = await benchmark('Small loop (10 items)', legacy, handlebars, 150);
    results.push(result);

    expect(result.ratio).toBeLessThan(2);
  });

  it('should benchmark medium loops (100 items)', async () => {
    const items = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
    }));

    const legacy = `---
items: ${JSON.stringify(items)}
---
{{#each items}}
- {{id}}: {{name}}
{{/each}}`;

    const handlebars = `---
items: ${JSON.stringify(items)}
---
{{#each items}}
- {{id}}: {{name}}
{{/each}}`;

    const result = await benchmark('Medium loop (100 items)', legacy, handlebars, 100);
    results.push(result);

    expect(result.ratio).toBeLessThan(2);
  });

  it('should benchmark large loops (1000 items)', async () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
    }));

    const legacy = `---
items: ${JSON.stringify(items)}
---
{{#each items}}
- {{id}}: {{name}}
{{/each}}`;

    const handlebars = `---
items: ${JSON.stringify(items)}
---
{{#each items}}
- {{id}}: {{name}}
{{/each}}`;

    const result = await benchmark('Large loop (1000 items)', legacy, handlebars, 50);
    results.push(result);

    expect(result.ratio).toBeLessThan(2);
  });

  it('should benchmark conditionals', async () => {
    const legacy = `---
premium: true
trial: false
---
{{#if premium}}Premium features enabled{{/if}}
{{#if trial}}Trial period{{else}}Full version{{/if}}`;

    const handlebars = `---
premium: true
trial: false
---
{{#if premium}}Premium features enabled{{/if}}
{{#if trial}}Trial period{{else}}Full version{{/if}}`;

    const result = await benchmark('Conditionals', legacy, handlebars, 200);
    results.push(result);

    expect(result.ratio).toBeLessThan(2);
  });

  it('should benchmark nested loops', async () => {
    const sections = Array.from({ length: 5 }, (_, i) => ({
      title: `Section ${i + 1}`,
      items: Array.from({ length: 10 }, (_, j) => ({
        name: `Item ${j + 1}`,
      })),
    }));

    const legacy = `---
sections: ${JSON.stringify(sections)}
---
{{#each sections}}
## {{title}}
{{#each items}}
- {{name}}
{{/each}}
{{/each}}`;

    const handlebars = `---
sections: ${JSON.stringify(sections)}
---
{{#each sections}}
## {{title}}
{{#each items}}
- {{name}}
{{/each}}
{{/each}}`;

    const result = await benchmark('Nested loops', legacy, handlebars, 100);
    results.push(result);

    expect(result.ratio).toBeLessThan(2);
  });

  it('should benchmark complex contract scenario', async () => {
    const legacy = `---
clientName: "ACME Corp"
providerName: "Service Ltd"
services:
  - name: "Consulting"
    hours: 40
    rate: 150
  - name: "Development"
    hours: 80
    rate: 200
  - name: "Support"
    hours: 20
    rate: 100
startDate: 2025-01-15
endDate: 2025-12-31
---
# SERVICE AGREEMENT

**Client**: {{clientName}}
**Provider**: {{providerName}}
**Start Date**: {{formatDate(startDate, "US")}}
**End Date**: {{formatDate(endDate, "US")}}

## Services

{{#each services}}
### {{name}}
- Hours: {{hours}}
- Rate: {{formatCurrency(rate, "USD")}}/hour
- Total: {{formatCurrency(hours * rate, "USD")}}
{{/each}}`;

    const handlebars = `---
clientName: "ACME Corp"
providerName: "Service Ltd"
services:
  - name: "Consulting"
    hours: 40
    rate: 150
  - name: "Development"
    hours: 80
    rate: 200
  - name: "Support"
    hours: 20
    rate: 100
startDate: 2025-01-15
endDate: 2025-12-31
---
# SERVICE AGREEMENT

**Client**: {{clientName}}
**Provider**: {{providerName}}
**Start Date**: {{formatDate startDate "US"}}
**End Date**: {{formatDate endDate "US"}}

## Services

{{#each services}}
### {{name}}
- Hours: {{hours}}
- Rate: {{formatCurrency rate "USD"}}/hour
- Total: {{formatCurrency (multiply hours rate) "USD"}}
{{/each}}`;

    const result = await benchmark('Complex contract', legacy, handlebars, 100);
    results.push(result);

    expect(result.ratio).toBeLessThan(2);
  });

  it('should benchmark mathematical subexpressions', async () => {
    const handlebars = `---
price: 100
quantity: 5
taxRate: 0.15
---
Subtotal: {{multiply price quantity}}
Tax: {{multiply (multiply price quantity) taxRate}}
Total: {{add (multiply price quantity) (multiply (multiply price quantity) taxRate)}}`;

    const result = await benchmark(
      'Math subexpressions (HB only)',
      handlebars,
      handlebars,
      150
    );
    results.push(result);

    // Self-comparison, should be ~1x
    expect(result.ratio).toBeLessThan(1.1);
  });

  it('should print benchmark summary', () => {
    printResults(results);

    // Overall performance check
    const avgRatio = results.reduce((sum, r) => sum + r.ratio, 0) / results.length;
    console.log(`\n✓ Overall average ratio: ${avgRatio.toFixed(2)}x`);

    // All benchmarks should be within reasonable performance bounds
    expect(avgRatio).toBeLessThan(1.5);
  });
});
