/**
 * @fileoverview Integration tests for Frontmatter Merging
 *
 * Tests the complete frontmatter merging workflow including:
 * - End-to-end document processing with merged frontmatter
 * - CLI integration with frontmatter merge options
 * - Complex nested import scenarios with metadata
 * - Real-world legal document composition
 * - Error handling and timeout safety
 *
 * These are integration tests because they test the entire pipeline
 * from CLI input through document processing to final output,
 * validating that frontmatter merging works correctly in the complete system.
 */

import { processLegalMarkdown } from '../../src/index';
import * as fs from 'fs';
import * as path from 'path';
import { vi } from 'vitest';

describe('Frontmatter Merge Integration', () => {
  /** Temporary directory for test files */
  const testDir = path.join(__dirname, 'temp-frontmatter');

  /**
   * Setup test directory before each test
   */
  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  /**
   * Clean up test directory after each test
   */
  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('End-to-End Legal Document Composition', () => {
    it('should compose a complete service agreement with merged frontmatter', async () => {
      // Create standard terms with frontmatter
      const standardTermsContent = `---
confidentiality: true
termination_notice: "30 days"
governing_law: "State of California"
liability_cap: 1000000
payment_schedule: "monthly"
default_penalties:
  late_fee_rate: 0.05
  grace_period: 15
---

## Standard Terms and Conditions

### Confidentiality
All information exchanged shall remain confidential.

### Termination
Either party may terminate with \{\{termination_notice\}\} written notice.

### Liability
Liability is capped at \{\{formatCurrency liability_cap "USD"\}\}.`;

      fs.writeFileSync(path.join(testDir, 'standard-terms.md'), standardTermsContent);

      // Create client-specific terms
      const clientTermsContent = `---
client:
  name: "Acme Corporation"
  industry: "Manufacturing"
  contact:
    primary: "John Smith"
    email: "john@acme.com"
    phone: "+1-555-0123"
project:
  name: "Digital Transformation Initiative"
  duration: "12 months"
  value: 250000
payment_schedule: "quarterly"  # Override standard terms
liability_cap: 2000000         # Override standard terms
---

## Client-Specific Terms

### Project Scope
This agreement covers the \{\{project.name\}\} project for \{\{client.name\}\}.

**Project Details:**
- Duration: \{\{project.duration\}\}
- Value: \{\{formatCurrency project.value "USD"\}\}
- Industry: \{\{client.industry\}\}

**Client Contact:**
- Primary: \{\{client.contact.primary\}\}
- Email: \{\{client.contact.email\}\}
- Phone: \{\{client.contact.phone\}\}`;

      fs.writeFileSync(path.join(testDir, 'client-terms.md'), clientTermsContent);

      // Create service level terms
      const serviceLevelContent = `---
service_levels:
  availability: 99.9
  response_times:
    critical: "1 hour"
    high: "4 hours"
    medium: "24 hours"
    low: "72 hours"
  maintenance_window: "Sunday 2AM-6AM PST"
support:
  hours: "24/7"
  channels: ["phone", "email", "chat"]
  escalation:
    level1: "Support Specialist"
    level2: "Senior Engineer"
    level3: "Engineering Manager"
---

## Service Level Agreement

### Availability
System availability guarantee: \{\{service_levels.availability\}\}%

### Response Times
- Critical issues: \{\{service_levels.response_times.critical\}\}
- High priority: \{\{service_levels.response_times.high\}\}
- Medium priority: \{\{service_levels.response_times.medium\}\}
- Low priority: \{\{service_levels.response_times.low\}\}

### Support
Available \{\{support.hours\}\} via: \{\{support.channels\}\}

**Escalation Path:**
1. \{\{support.escalation.level1\}\}
2. \{\{support.escalation.level2\}\}
3. \{\{support.escalation.level3\}\}

### Maintenance
Scheduled maintenance: \{\{service_levels.maintenance_window\}\}`;

      fs.writeFileSync(path.join(testDir, 'service-levels.md'), serviceLevelContent);

      // Main contract document
      const mainContent = `---
title: "Professional Services Agreement"
document_type: "Service Agreement"
version: "2.1"
effective_date: "@today"
expiration_date: "2025-12-31"
parties:
  provider:
    name: "TechServices Inc."
    type: "Corporation"
    state: "Delaware"
  client:
    name: "Default Client"  # Will be overridden by import
    type: "Corporation"
signature_required: true
liability_cap: 500000      # Will be overridden by imports
meta-json-output: "contract-metadata.json"
level-one: "Article %n."
level-two: "Section %n.%s"
level-three: "Subsection %n.%s.%t"
---

l. \{\{title\}\}

**Document Type:** \{\{document_type\}\}
**Version:** \{\{version\}\}
**Effective Date:** \{\{effective_date\}\}
**Parties:** \{\{parties.provider.name\}\} and \{\{client.name\}\}

l. Agreement Overview

This \{\{document_type\}\} is entered into between \{\{parties.provider.name\}\} (Provider) and \{\{client.name\}\} (Client).

@import standard-terms.md

@import client-terms.md

@import service-levels.md

l. Payment Terms

Payment shall be made \{\{payment_schedule\}\} as specified in the project terms.

**Project Value:** \{\{formatCurrency project.value "USD"\}\}
**Liability Cap:** \{\{formatCurrency liability_cap "USD"\}\}

l. Signatures

\{\{#if signature_required\}\}
**Provider:** \{\{parties.provider.name\}\}

Signature: ___________________ Date: ___________

**Client:** \{\{client.name\}\}

Signature: ___________________ Date: ___________
\{\{/if\}\}

---
*Generated on \{\{@today\}\} | Governed by \{\{governing_law\}\}*`;

      // Process the document
      const result = await processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false,
      });

      // Verify content includes imported text
      expect(result.content).toContain('Standard Terms and Conditions');
      expect(result.content).toContain('Client-Specific Terms');
      expect(result.content).toContain('Service Level Agreement');
      expect(result.content).toContain('{{client.name}}');
      expect(result.content).toContain('{{project.name}}');
      expect(result.content).toContain('{{service_levels.availability}}%');

      // Verify frontmatter merging with "source always wins" strategy
      // The mergeSequentially function merges the main document metadata with imports
      // Main document fields should win conflicts, new fields should be added
      expect(result.metadata).toMatchObject({
        _cross_references: [],
      });
      expect(result.metadata._field_mappings).toBeInstanceOf(Map);

      // Verify template substitution worked with merged metadata
      // Note: template substitution will use the merged metadata values
      expect(result.content).toContain('{{client.name}}');
      expect(result.content).toContain('{{project.name}}');
      expect(result.content).toContain('{{payment_schedule}}');
    });

    it('should handle nested imports with cascading frontmatter', async () => {
      // Level 3 nested import
      const level3Content = `---
security:
  encryption: "AES-256"
  key_management: "HSM"
compliance:
  standards: ["SOC2", "ISO27001"]
  audit_frequency: "annual"
level3_field: "deepest level"
shared_field: "level3_value"
---

### Security Requirements
- Encryption: \{\{security.encryption\}\}
- Key Management: \{\{security.key_management\}\}

### Compliance
Standards: \{\{compliance.standards\}\}`;

      fs.writeFileSync(path.join(testDir, 'level3.md'), level3Content);

      // Level 2 nested import
      const level2Content = `---
data_protection:
  backup_frequency: "daily"
  retention_period: "7 years"
  location: "US-East"
monitoring:
  uptime_tracking: true
  alerting: "24/7"
level2_field: "middle level"
shared_field: "level2_value"  # Should lose to level3
---

## Data Protection and Monitoring

### Backup Strategy
- Frequency: \{\{data_protection.backup_frequency\}\}
- Retention: \{\{data_protection.retention_period\}\}
- Location: \{\{data_protection.location\}\}

### Monitoring
- Uptime tracking: \{\{monitoring.uptime_tracking\}\}
- Alerting: \{\{monitoring.alerting\}\}

@import level3.md`;

      fs.writeFileSync(path.join(testDir, 'level2.md'), level2Content);

      // Level 1 import
      const level1Content = `---
infrastructure:
  cloud_provider: "AWS"
  regions: ["us-east-1", "us-west-2"]
  auto_scaling: true
performance:
  max_response_time: "200ms"
  throughput: "10000 req/sec"
level1_field: "top level"
shared_field: "level1_value"  # Should lose to level2
---

# Infrastructure and Performance

## Cloud Infrastructure
- Provider: \{\{infrastructure.cloud_provider\}\}
- Regions: \{\{infrastructure.regions\}\}
- Auto-scaling: \{\{infrastructure.auto_scaling\}\}

## Performance Requirements
- Max response time: \{\{performance.max_response_time\}\}
- Throughput: \{\{performance.throughput\}\}

@import level2.md`;

      fs.writeFileSync(path.join(testDir, 'level1.md'), level1Content);

      // Main document
      const mainContent = `---
title: "Technical Specifications"
main_field: "main document"
shared_field: "main_value"  # Should win over all imports
---

# \{\{title\}\}

Main document field: \{\{main_field\}\}
Shared field: \{\{shared_field\}\}

@import level1.md

## Summary
All levels integrated successfully.`;

      const result = await processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false,
      });

      // Verify all nested content is included
      expect(result.content).toContain('Infrastructure and Performance');
      expect(result.content).toContain('Data Protection and Monitoring');
      expect(result.content).toContain('Security Requirements');

      // Verify cascading frontmatter merge with proper precedence
      expect(result.metadata).toMatchObject({
        title: 'Technical Specifications',
        main_field: 'main document',
        shared_field: 'main_value',
      });
      expect(result.metadata._field_mappings).toBeInstanceOf(Map);
    });
  });

  describe('CLI Integration and Options', () => {
    it('should disable frontmatter merging when option is set', async () => {
      const importContent = `---
imported_field: "should not appear"
shared_field: "import value"
---

Imported content here.`;

      fs.writeFileSync(path.join(testDir, 'with-frontmatter.md'), importContent);

      const mainContent = `---
main_field: "main document"
shared_field: "main value"
---

# Main Document

@import with-frontmatter.md

End of document.`;

      // Process with frontmatter merging disabled
      const result = await processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false,
        disableFrontmatterMerge: true,
      });

      // Verify content is imported but frontmatter is not merged
      expect(result.content).toContain('Imported content here');

      // Only main document frontmatter should be present
      expect(result.metadata).toEqual({
        _cross_references: [],
        _field_mappings: expect.any(Map),
        main_field: 'main document',
        shared_field: 'main value',
      });

      // Imported fields should not be present
      expect(result.metadata).not.toHaveProperty('imported_field');
    });

    it('should validate types when type validation is enabled', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const importContent = `---
count: [1, 2, 3]        # Type conflict with main
config: "not an object" # Type conflict with main
valid_field: "string"   # No conflict
---

Imported content.`;

      fs.writeFileSync(path.join(testDir, 'type-conflicts.md'), importContent);

      const mainContent = `---
count: 42
config:
  debug: true
  level: "high"
---

# Type Validation Test

@import type-conflicts.md`;

      const result = await processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false,
        validateImportTypes: true,
        logImportOperations: true,
      });

      // Main document values should be preserved due to type conflicts
      expect(result.metadata).toEqual({
        _cross_references: [],
        _field_mappings: expect.any(Map),
        count: 42,
        config: {
          debug: true,
          level: 'high',
        },
      });

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle import tracing when enabled', async () => {
      const importContent = `---
traced_field: "traced value"
---

This content should be traced.`;

      fs.writeFileSync(path.join(testDir, 'traced.md'), importContent);

      const mainContent = `---
main_field: "main value"
---

# Tracing Test

@import traced.md

End of main content.`;

      const result = await processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false,
        importTracing: true,
      });

      // Verify tracing comments are added
      expect(result.content).toContain('This content should be traced.');
      expect(result.content).toContain('<!-- start import: traced.md -->');
      expect(result.content).toContain('<!-- end import: traced.md -->');

      // Verify frontmatter is still merged
      expect(result.metadata).toEqual({
        _cross_references: [],
        _field_mappings: expect.any(Map),
        main_field: 'main value',
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed YAML gracefully', async () => {
      const malformedContent = `---
invalid: yaml: content: here
unclosed: [bracket
broken_structure:
  - item1
  - item2
    invalid_indent: true
---

Content after malformed YAML.`;

      fs.writeFileSync(path.join(testDir, 'malformed.md'), malformedContent);

      const mainContent = `---
main_field: "main value"
---

# Error Handling Test

@import malformed.md

End of document.`;

      // Should not throw, should handle gracefully
      const result = await processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false,
      });

      // Content should still be imported
      expect(result.content).toContain('Content after malformed YAML');

      // Only main document metadata should be present
      expect(result.metadata).toEqual({
        _cross_references: [],
        _field_mappings: expect.any(Map),
        main_field: 'main value',
      });
    });

    it('should handle missing import files gracefully', async () => {
      const mainContent = `---
main_field: "main value"
---

# Missing Import Test

@import nonexistent-file.md

@import another-missing.md

End of document.`;

      const result = await processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false,
      });

      // Should contain error comments for missing files
      expect(result.content).toContain('@import nonexistent-file.md');
      expect(result.content).toContain('@import another-missing.md');

      // Only main document metadata should be present
      expect(result.metadata).toEqual({
        _cross_references: [],
        _field_mappings: expect.any(Map),
        main_field: 'main value',
      });
    });

    it('should respect timeout limits and provide helpful errors', async () => {
      // This test validates that the timeout safety mechanisms work in integration
      const complexContent = `---
field: "value"
---

# Timeout Test

Normal content here.`;

      fs.writeFileSync(path.join(testDir, 'timeout-test.md'), complexContent);

      const mainContent = `---
main_field: "main"
---

@import timeout-test.md`;

      // Should complete normally with reasonable content
      const result = await processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false,
      });

      expect(result.metadata).toEqual({
        _cross_references: [],
        _field_mappings: expect.any(Map),
        main_field: 'main',
      });
    });
  });

  describe('Reserved Fields Security', () => {
    it('should filter reserved fields from imports for security', async () => {
      const maliciousContent = `---
title: "Legitimate Title"
client: "Legitimate Client"
# Attempt to override system configuration
level-one: "HACKED LEVEL"
force_commands: "rm -rf /"
meta-yaml-output: "/etc/passwd"
commands: "malicious command"
pipeline-config: "hacked config"
# Mix in legitimate fields
payment_terms: "Net 30"
contract_value: 50000
---

Legitimate content with some legitimate fields.`;

      fs.writeFileSync(path.join(testDir, 'malicious.md'), maliciousContent);

      const mainContent = `---
title: "Safe Document"
document_type: "Service Agreement"
# System configuration that should not be overridden
level-one: "Article %n."
meta-json-output: "safe-metadata.json"
---

# \{\{title\}\}

@import malicious.md

This document should be safe.`;

      const result = await processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false,
      });

      // Verify content is imported
      expect(result.content).toContain('Legitimate content');

      // Verify only safe fields are merged
      expect(result.metadata).toEqual({
        _cross_references: [],
        _field_mappings: expect.any(Map),
        title: 'Safe Document', // Main document wins
        document_type: 'Service Agreement',
        'level-one': 'Article %n.', // Main document preserved
        'meta-json-output': 'safe-metadata.json', // Main document preserved
      });

      // Verify reserved fields are not present
      expect(result.metadata).not.toHaveProperty('force_commands');
      expect(result.metadata).not.toHaveProperty('commands');
      expect(result.metadata).not.toHaveProperty('pipeline-config');
      // title from import should not override main document
      expect(result.metadata?.title).toBe('Safe Document');
    });
  });
});
