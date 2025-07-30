/**
 * Unit tests for remark field tracking plugin
 *
 * These tests verify the functionality of the remark-based field tracking
 * system, including field pattern detection, code exclusion, and integration
 * with the field tracker.
 *
 * @module
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkFieldTracking from '@plugins/remark/field-tracking';
import { fieldTracker } from '@extensions/tracking/field-tracker';

describe('Remark Field Tracking Plugin', () => {
  beforeEach(() => {
    // Clear field tracker before each test
    fieldTracker.clear();
  });

  describe('Basic Field Tracking', () => {
    it('should track simple fields in text nodes', async () => {
      const content = `
# Contract

This is a contract for {{client_name}} with amount {{contract_amount}}.

The delivery date is {{delivery_date}}.
`;

      const metadata: Record<string, any> = {
        client_name: 'ACME Corp',
        contract_amount: '$10,000',
        delivery_date: '2025-12-31'
      };
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkFieldTracking, { metadata })
        .use(remarkStringify);

      await processor.process(content);

      // Check that fields were tracked
      const fields = fieldTracker.getFields();
      expect(fields.has('client_name')).toBe(true);
      expect(fields.has('contract_amount')).toBe(true);
      expect(fields.has('delivery_date')).toBe(true);
      
      // Check field values
      expect(fields.get('client_name')?.value).toBe('ACME Corp');
      expect(fields.get('contract_amount')?.value).toBe('$10,000');
      expect(fields.get('delivery_date')?.value).toBe('2025-12-31');
      
      // Check hasLogic flag (should be false for simple fields)
      expect(fields.get('client_name')?.hasLogic).toBe(false);
    });

    it('should handle empty/missing field values', async () => {
      const content = `
Contract for {{client_name}} and {{missing_field}}.
`;

      const metadata: Record<string, any> = {
        client_name: 'ACME Corp'
        // missing_field is not defined
      };
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkFieldTracking, { metadata })
        .use(remarkStringify);

      await processor.process(content);

      // Check field tracking
      const fields = fieldTracker.getFields();
      expect(fields.has('client_name')).toBe(true);
      expect(fields.has('missing_field')).toBe(true);
      
      // Check values
      expect(fields.get('client_name')?.value).toBe('ACME Corp');
      expect(fields.get('missing_field')?.value).toBe('');
    });

    it('should track nested field names', async () => {
      const content = `
Contract details: {{contract.number}} for {{client.company.name}}.
`;

      const metadata: Record<string, any> = {
        contract: {
          number: 'CON-2025-001'
        },
        client: {
          company: {
            name: 'ACME Corporation'
          }
        }
      };
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkFieldTracking, { metadata })
        .use(remarkStringify);

      await processor.process(content);

      // Check nested field tracking
      const fields = fieldTracker.getFields();
      expect(fields.has('contract.number')).toBe(true);
      expect(fields.has('client.company.name')).toBe(true);
      
      // Check values
      expect(fields.get('contract.number')?.value).toBe('CON-2025-001');
      expect(fields.get('client.company.name')?.value).toBe('ACME Corporation');
    });
  });

  describe('Code Exclusion', () => {
    it('should exclude fields in code blocks', async () => {
      const content = `
# Documentation

Regular field: {{client_name}}

\`\`\`javascript
const template = "Hello {{client_name}}";
console.log("{{debug_message}}");
\`\`\`

Another regular field: {{contract_date}}
`;

      const metadata: Record<string, any> = {
        client_name: 'ACME Corp',
        debug_message: 'This should not be tracked',
        contract_date: '2025-01-01'
      };
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkFieldTracking, { metadata })
        .use(remarkStringify);

      await processor.process(content);

      // Check that only non-code fields were tracked
      const fields = fieldTracker.getFields();
      expect(fields.has('client_name')).toBe(true);
      expect(fields.has('contract_date')).toBe(true);
      expect(fields.has('debug_message')).toBe(false); // Should be excluded
    });

    it('should exclude fields in inline code', async () => {
      const content = `
# Instructions

Use the field \`{{client_name}}\` in your template.

The actual client name is {{client_name}}.
`;

      const metadata: Record<string, any> = {
        client_name: 'ACME Corp'
      };
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkFieldTracking, { metadata })
        .use(remarkStringify);

      await processor.process(content);

      // Check that only the non-inline-code field was tracked
      const fields = fieldTracker.getFields();
      expect(fields.has('client_name')).toBe(true);
      
      // Should only track once (not twice)
      expect(fields.get('client_name')?.value).toBe('ACME Corp');
    });
  });

  describe('Plugin Configuration', () => {
    it('should respect trackingEnabled flag', async () => {
      const content = `Contract for {{client_name}}.`;
      const metadata: Record<string, any> = { client_name: 'ACME Corp' };
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkFieldTracking, { 
          metadata,
          trackingEnabled: false 
        })
        .use(remarkStringify);

      await processor.process(content);

      // No fields should be tracked
      const fields = fieldTracker.getFields();
      expect(fields.size).toBe(0);
    });

    it('should use custom field patterns', async () => {
      const content = `
Contract for <<client_name>> and [[contract_amount]].
Normal field: {{should_not_track}}
`;

      const metadata: Record<string, any> = {
        client_name: 'ACME Corp',
        contract_amount: '$10,000',
        should_not_track: 'This should not be tracked'
      };
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkFieldTracking, { 
          metadata,
          patterns: ['<<(.+?)>>', '\\[\\[(.+?)\\]\\]'] // Custom patterns
        })
        .use(remarkStringify);

      await processor.process(content);

      // Check that only custom pattern fields were tracked
      const fields = fieldTracker.getFields();
      expect(fields.has('client_name')).toBe(true);
      expect(fields.has('contract_amount')).toBe(true);
      expect(fields.has('should_not_track')).toBe(false);
    });

    it('should store tracking statistics in metadata', async () => {
      const content = `
Contract for {{client_name}} with {{contract_amount}}.
Delivery to {{client_name}} on {{delivery_date}}.
`;

      const metadata: Record<string, any> = {
        client_name: 'ACME Corp',
        contract_amount: '$10,000',
        delivery_date: '2025-12-31'
      };
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkFieldTracking, { metadata })
        .use(remarkStringify);

      await processor.process(content);

      // Check tracking statistics
      expect(metadata['_field_tracking_stats']).toBeDefined();
      const stats = metadata['_field_tracking_stats'];
      
      expect(stats.totalFieldsTracked).toBe(4); // client_name appears twice
      expect(stats.uniqueFieldsTracked).toBe(3); // 3 unique fields
      expect(stats.trackedFieldNames).toEqual(
        expect.arrayContaining(['client_name', 'contract_amount', 'delivery_date'])
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content gracefully', async () => {
      const content = '';
      const metadata: Record<string, any> = {};
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkFieldTracking, { metadata })
        .use(remarkStringify);

      await processor.process(content);

      // No fields should be tracked
      const fields = fieldTracker.getFields();
      expect(fields.size).toBe(0);
      
      // Statistics should reflect empty state
      const stats = metadata['_field_tracking_stats'] as any;
      expect(stats.totalFieldsTracked).toBe(0);
      expect(stats.uniqueFieldsTracked).toBe(0);
    });

    it('should handle malformed field patterns gracefully', async () => {
      const content = `
Incomplete patterns: {{incomplete and {{valid_field}}.
Also: {{valid_field}} should work.
`;

      const metadata: Record<string, any> = {
        valid_field: 'Valid Value'
      };
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkFieldTracking, { metadata, debug: true })
        .use(remarkStringify);

      await processor.process(content);

      // Only valid field should be tracked
      const fields = fieldTracker.getFields();
      expect(fields.has('valid_field')).toBe(true);
      expect(fields.get('valid_field')?.value).toBe('Valid Value');
    });
  });
});