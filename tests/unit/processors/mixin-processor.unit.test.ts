/**
 * @fileoverview Tests for the mixin processor and template variable system
 * 
 * This test suite covers the {{variable}} template substitution system:
 * - Basic variable substitution with various data types
 * - Nested object access using dot notation
 * - Conditional expressions with ternary operators
 * - Recursive mixin processing and infinite recursion prevention
 * - Edge cases like null values, empty metadata, and complex documents
 */

import { processMixins } from '@core/processors/mixin-processor';

describe('processMixins', () => {
  // Helper function to process mixins without field tracking for cleaner test expectations
  const processWithoutTracking = (content: string, metadata: Record<string, any> = {}) => {
    return processMixins(content, metadata, { enableFieldTrackingInMarkdown: false });
  };
  describe('Basic Variable Substitution', () => {
    it('should replace simple variables with metadata values', () => {
      const content = 'The client is {{client_name}}.';
      const metadata = { client_name: 'Acme Corp' };
      const result = processWithoutTracking(content, metadata);
      expect(result).toBe('The client is Acme Corp.');
    });

    it('should replace multiple variables in the same content', () => {
      const content = '{{title}} between {{party1}} and {{party2}}.';
      const metadata = {
        title: 'Service Agreement',
        party1: 'Company A',
        party2: 'Company B',
      };
      const result = processWithoutTracking(content, metadata);
      expect(result).toBe('Service Agreement between Company A and Company B.');
    });

    it('should keep original mixin if value not found', () => {
      const content = 'The value is {{undefined_variable}}.';
      const metadata = {};
      const result = processWithoutTracking(content, metadata);
      expect(result).toBe('The value is {{undefined_variable}}.');
    });

    it('should handle numeric values', () => {
      const content = 'Payment due in {{payment_days}} days.';
      const metadata = { payment_days: 30 };
      const result = processWithoutTracking(content, metadata);
      expect(result).toBe('Payment due in 30 days.');
    });

    it('should handle boolean values', () => {
      const content = 'Warranty included: {{include_warranty}}.';
      const metadata = { include_warranty: true };
      const result = processWithoutTracking(content, metadata);
      expect(result).toBe('Warranty included: true.');
    });
  });

  describe('Nested Object Access', () => {
    it('should access nested object properties using dot notation', () => {
      const content = 'Contact {{company.contact.name}} at {{company.contact.email}}.';
      const metadata = {
        company: {
          contact: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      };
      const result = processWithoutTracking(content, metadata);
      expect(result).toBe('Contact John Doe at john@example.com.');
    });

    it('should handle array access with dot notation', () => {
      const content = 'First party: {{parties.0.name}} ({{parties.0.type}})';
      const metadata = {
        parties: [
          { name: 'TechCorp Inc.', type: 'Corporation' },
          { name: 'ClientCorp LLC', type: 'LLC' },
        ],
      };
      const result = processWithoutTracking(content, metadata);
      expect(result).toBe('First party: TechCorp Inc. (Corporation)');
    });
  });

  describe('Nested Mixins', () => {
    it('should process nested mixins recursively', () => {
      const content = 'The {{field}} is {{value}}.';
      const metadata = {
        field: 'client name',
        value: '{{client_name}}',
        client_name: 'Acme Corp',
      };
      const result = processWithoutTracking(content, metadata);
      expect(result).toBe('The client name is Acme Corp.');
    });

    it('should prevent infinite recursion', () => {
      const content = 'Value: {{recursive}}';
      const metadata = {
        recursive: '{{recursive}}',
      };
      const result = processWithoutTracking(content, metadata);
      expect(result).toBe('Value: {{recursive}}');
    });
  });

  describe('Conditional Mixins', () => {
    it('should handle simple conditional mixins', () => {
      const content = 'Warranty: {{include_warranty ? Included : Not included}}.';
      const metadata = { include_warranty: true };
      const result = processWithoutTracking(content, metadata);
      expect(result).toBe('Warranty: Included.');
    });

    it('should handle false conditions', () => {
      const content = 'Late fees: {{late_fees_apply ? Apply : Do not apply}}.';
      const metadata = { late_fees_apply: false };
      const result = processWithoutTracking(content, metadata);
      expect(result).toBe('Late fees: Do not apply.');
    });

    it('should handle missing values in conditionals', () => {
      const content = 'Status: {{status ? Active : Inactive}}.';
      const metadata = {};
      const result = processWithoutTracking(content, metadata);
      expect(result).toBe('Status: Inactive.');
    });

    it('should handle conditions with mixin values', () => {
      const content = 'Premium: {{client_type ? Gold service with priority support : Standard service}}.';
      const metadata = {
        client_type: 'premium',
      };
      const result = processWithoutTracking(content, metadata);
      expect(result).toBe('Premium: Gold service with priority support.');
    });
  });

  describe('Special Cases', () => {
    it('should handle empty metadata', () => {
      const content = 'Hello {{name}}!';
      const metadata = {};
      const result = processWithoutTracking(content, metadata);
      expect(result).toBe('Hello {{name}}!');
    });

    it('should handle content without mixins', () => {
      const content = 'This is plain text without any mixins.';
      const metadata = { some: 'value' };
      const result = processWithoutTracking(content, metadata);
      expect(result).toBe('This is plain text without any mixins.');
    });

    it('should handle null and undefined values', () => {
      const content = 'Value1: {{null_value}}, Value2: {{undefined_value}}';
      const metadata = {
        null_value: null,
        undefined_value: undefined,
      };
      const result = processWithoutTracking(content, metadata);
      expect(result).toBe('Value1: {{null_value}}, Value2: {{undefined_value}}');
    });

    it('should handle mixins with spaces', () => {
      const content = 'The client is {{ client_name }}.';
      const metadata = { client_name: 'Acme Corp' };
      const result = processWithoutTracking(content, metadata);
      expect(result).toBe('The client is Acme Corp.');
    });
  });

  describe('Template Loops', () => {
    describe('Array Iteration', () => {
      it('should process array loops with {{#items}}...{{/items}} syntax', () => {
        const content = '\nItems:\n{{#items}}\n- {{name}} - ${{price}}\n{{/items}}\nDone.';
        const metadata = {
          items: [
            { name: 'Product A', price: 10.99 },
            { name: 'Product B', price: 15.50 }
          ]
        };
        const result = processWithoutTracking(content, metadata);
        expect(result).toContain('<li>Product A - $10.99</li>');
        expect(result).toContain('<li>Product B - $15.5</li>');
      });

      it('should handle array loops with conditional expressions', () => {
        const content = '\n{{#items}}\n- {{name}} {{onSale ? "(ON SALE!)" : ""}} - ${{price}}\n{{/items}}';
        const metadata = {
          items: [
            { name: 'Product A', price: 10.99, onSale: true },
            { name: 'Product B', price: 15.50, onSale: false }
          ]
        };
        const result = processWithoutTracking(content, metadata);
        expect(result).toContain('<li>Product A (ON SALE!) - $10.99</li>');
        expect(result).toContain('<li>Product B  - $15.5</li>');
      });

      it('should handle empty arrays', () => {
        const content = '\n{{#items}}\n- {{name}}\n{{/items}}\nNo items found.';
        const metadata = { items: [] };
        const result = processWithoutTracking(content, metadata);
        expect(result).not.toContain('<li>');
        expect(result).toContain('No items found.');
      });

      it('should handle missing array variable', () => {
        const content = '\n{{#items}}\n- {{name}}\n{{/items}}\nDone.';
        const metadata = {};
        const result = processWithoutTracking(content, metadata);
        expect(result).not.toContain('<li>');
        expect(result).toContain('Done.');
      });
    });

    describe('Conditional Blocks', () => {
      it('should process conditional blocks when condition is truthy', () => {
        const content = '\n{{#loyaltyMember}}\nMember Points: {{pointsEarned}}\nTotal Points: {{pointsBalance}}\n{{/loyaltyMember}}';
        const metadata = {
          loyaltyMember: true,
          pointsEarned: 85,
          pointsBalance: 340
        };
        const result = processWithoutTracking(content, metadata);
        expect(result).toContain('Member Points: 85');
        expect(result).toContain('Total Points: 340');
      });

      it('should skip conditional blocks when condition is falsy', () => {
        const content = '\n{{#loyaltyMember}}\nMember Points: {{pointsEarned}}\n{{/loyaltyMember}}\nThank you!';
        const metadata = {
          loyaltyMember: false,
          pointsEarned: 85
        };
        const result = processWithoutTracking(content, metadata);
        expect(result).not.toContain('Member Points:');
        expect(result).toContain('Thank you!');
      });

      it('should skip conditional blocks when condition is undefined', () => {
        const content = '\n{{#loyaltyMember}}\nMember content\n{{/loyaltyMember}}\nRegular content';
        const metadata = {};
        const result = processWithoutTracking(content, metadata);
        expect(result).not.toContain('Member content');
        expect(result).toContain('Regular content');
      });
    });

    describe('Table Loops', () => {
      it('should process table loops with HTML structure', () => {
        const content = '\n<table>\n<tr><th>Day</th><th>Hours</th></tr>\n{{#businessHours}}\n<tr><td>{{day}}</td><td>{{hours}}</td></tr>\n{{/businessHours}}\n</table>';
        const metadata = {
          businessHours: [
            { day: 'Monday', hours: '9:00 AM - 9:00 PM' },
            { day: 'Tuesday', hours: '9:00 AM - 9:00 PM' }
          ]
        };
        const result = processWithoutTracking(content, metadata);
        expect(result).toContain('<tr><td>Monday</td><td>9:00 AM - 9:00 PM</td></tr>');
        expect(result).toContain('<tr><td>Tuesday</td><td>9:00 AM - 9:00 PM</td></tr>');
      });
    });

    describe('Nested Loops', () => {
      it('should handle nested array loops', () => {
        const content = '\n{{#categories}}\n## {{name}}\n{{#items}}\n- {{name}} - ${{price}}\n{{/items}}\n{{/categories}}';
        const metadata = {
          categories: [
            {
              name: 'Electronics',
              items: [
                { name: 'Phone', price: 699 },
                { name: 'Laptop', price: 1299 }
              ]
            },
            {
              name: 'Books',
              items: [
                { name: 'Novel', price: 12.99 }
              ]
            }
          ]
        };
        const result = processWithoutTracking(content, metadata);
        expect(result).toContain('## Electronics');
        expect(result).toContain('<li>Phone - $699</li>');
        expect(result).toContain('<li>Laptop - $1299</li>');
        expect(result).toContain('## Books');
        expect(result).toContain('<li>Novel - $12.99</li>');
      });
    });

    describe('Complex Expressions in Loops', () => {
      it('should handle complex conditional expressions with concatenation', () => {
        const content = '\n{{#items}}\n- {{name}} {{price ? "$" + price : "[Price Missing]"}}\n{{/items}}';
        const metadata = {
          items: [
            { name: 'Product A', price: 10.99 },
            { name: 'Product B', price: null }
          ]
        };
        const result = processWithoutTracking(content, metadata);
        expect(result).toContain('Product A $10.99');
        expect(result).toContain('Product B [Price Missing]');
      });
    });

    describe('Loop Context Variables', () => {
      it('should provide loop context variables like @index', () => {
        const content = '\n{{#items}}\n{{@index}}. {{name}}\n{{/items}}';
        const metadata = {
          items: [
            { name: 'First Item' },
            { name: 'Second Item' }
          ]
        };
        const result = processWithoutTracking(content, metadata);
        expect(result).toContain('0. First Item');
        expect(result).toContain('1. Second Item');
      });
    });
  });

  describe('Options', () => {
    it('should skip processing when noMixins is true', () => {
      const content = 'The client is {{client_name}}.';
      const metadata = { client_name: 'Acme Corp' };
      const result = processMixins(content, metadata, { noMixins: true });
      expect(result).toBe('The client is {{client_name}}.');
    });
  });

  describe('Field Tracking Control', () => {
    it('should NOT include tracking fields by default (Ruby compatibility)', () => {
      const content = 'The client is {{client_name}}.';
      const metadata = { client_name: 'Acme Corp' };
      const result = processMixins(content, metadata);
      expect(result).toBe('The client is Acme Corp.');
      expect(result).not.toContain('<span');
      expect(result).not.toContain('data-field');
    });

    it('should include tracking fields when enableFieldTrackingInMarkdown is true', () => {
      const content = 'The client is {{client_name}}.';
      const metadata = { client_name: 'Acme Corp' };
      const result = processMixins(content, metadata, { enableFieldTrackingInMarkdown: true });
      expect(result).toContain('<span class="imported-value" data-field="client_name">Acme Corp</span>');
    });

    it('should include tracking fields for helper functions when enabled', () => {
      const content = 'Today is {{formatDate(@today, "YYYY-MM-DD")}}.';
      const metadata = {};
      const result = processMixins(content, metadata, { enableFieldTrackingInMarkdown: true });
      expect(result).toContain('<span class="highlight">');
      expect(result).toContain('data-field="formatDate(@today, &quot;YYYY-MM-DD&quot;)"');
    });

    it('should include tracking fields for conditional expressions when enabled', () => {
      const content = 'Status: {{active ? "Active" : "Inactive"}}.';
      const metadata = { active: true };
      const result = processMixins(content, metadata, { enableFieldTrackingInMarkdown: true });
      expect(result).toContain('<span class="highlight">');
      expect(result).toContain('data-field="active ? &quot;Active&quot; : &quot;Inactive&quot;"');
      expect(result).toContain('Active');
    });

    it('should show missing value spans when field tracking is enabled', () => {
      const content = 'The value is {{missing_field}}.';
      const metadata = {};
      const result = processMixins(content, metadata, { enableFieldTrackingInMarkdown: true });
      expect(result).toContain('<span class="missing-value" data-field="missing_field">[[missing_field]]</span>');
    });

    it('should work with legacy enableFieldTracking for backward compatibility', () => {
      const content = 'The client is {{client_name}}.';
      const metadata = { client_name: 'Acme Corp' };
      const result = processMixins(content, metadata, { enableFieldTracking: true });
      expect(result).toBe('The client is Acme Corp.');
      expect(result).not.toContain('<span');
    });
  });

  describe('Complex Document Examples', () => {
    it('should process a complete legal document section', () => {
      const content = `
---
title: {{document_type}}
---

l. Agreement

This {{document_type}} is entered into on {{effective_date}} between {{parties.0.name}} ("{{parties.0.role}}") and {{parties.1.name}} ("{{parties.1.role}}").

ll. Payment Terms

Payment of {{payment_amount}} is due within {{payment_days}} days.
{{late_fees_apply ? Late fees of 1.5% will apply : No late fees}}.
`;

      const metadata = {
        document_type: 'Service Agreement',
        effective_date: '2024-01-01',
        parties: [
          { name: 'TechCorp Inc.', role: 'Service Provider' },
          { name: 'ClientCorp LLC', role: 'Client' },
        ],
        payment_amount: '$10,000',
        payment_days: 30,
        late_fees_apply: true,
        late_fee_percentage: 1.5,
      };

      const result = processWithoutTracking(content, metadata);
      expect(result).toContain('This Service Agreement is entered into');
      expect(result).toContain('TechCorp Inc. ("Service Provider")');
      expect(result).toContain('ClientCorp LLC ("Client")');
      expect(result).toContain('Payment of $10,000 is due within 30 days');
      expect(result).toContain('Late fees of 1.5% will apply');
    });
  });
});