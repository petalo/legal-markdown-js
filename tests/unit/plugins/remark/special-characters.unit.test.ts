/**
 * Unit tests for special characters in variable names
 *
 * Tests edge cases with special characters, particularly underscores,
 * in various positions within variable names.
 *
 * This addresses potential edge cases with:
 * - Leading/trailing underscores
 * - Multiple consecutive underscores
 * - Underscores mixed with numbers
 * - Unconventional but valid variable names
 *
 * @module
 */

import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkTemplateFields from '../../../../src/plugins/remark/template-fields';

describe('Special Characters in Variable Names', () => {
  describe('Leading Underscores', () => {
    it('should process variables starting with a single underscore', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { _private: 'Private Value' },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'Value: {{_private}}';
      const result = await processor.process(input);

      expect(result.toString()).toContain('Private Value');
    });

    it('should process variables starting with double underscores', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { __internal: 'Internal Value' },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'Value: {{__internal}}';
      const result = await processor.process(input);

      expect(result.toString()).toContain('Internal Value');
    });

    it('should process variables with leading underscore and regular name', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { _client_name: 'Acme Corp' },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'Client: {{_client_name}}';
      const result = await processor.process(input);

      expect(result.toString()).toContain('Acme Corp');
    });
  });

  describe('Trailing Underscores', () => {
    it('should process variables ending with a single underscore', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { field_: 'Trailing Value' },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'Value: {{field_}}';
      const result = await processor.process(input);

      expect(result.toString()).toContain('Trailing Value');
    });

    it('should process variables ending with double underscores', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { field__: 'Double Trailing' },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'Value: {{field__}}';
      const result = await processor.process(input);

      expect(result.toString()).toContain('Double Trailing');
    });

    it('should process variables with regular name and trailing underscore', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { client_name_: 'Acme Corp' },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'Client: {{client_name_}}';
      const result = await processor.process(input);

      expect(result.toString()).toContain('Acme Corp');
    });
  });

  describe('Double Underscores', () => {
    it('should process variables with double underscores in the middle', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { field__name: 'Double Underscore Value' },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'Value: {{field__name}}';
      const result = await processor.process(input);

      expect(result.toString()).toContain('Double Underscore Value');
    });

    it('should process variables with multiple double underscores', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { first__middle__last: 'Multi Double' },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'Value: {{first__middle__last}}';
      const result = await processor.process(input);

      expect(result.toString()).toContain('Multi Double');
    });

    it('should process variables with triple underscores', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { field___name: 'Triple Underscore' },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'Value: {{field___name}}';
      const result = await processor.process(input);

      expect(result.toString()).toContain('Triple Underscore');
    });
  });

  describe('Underscores with Numbers', () => {
    it('should process variables with numbers and underscores', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            field_1: 'First',
            field_2: 'Second',
            field_3: 'Third',
          },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = '{{field_1}}, {{field_2}}, {{field_3}}';
      const result = await processor.process(input);
      const output = result.toString();

      expect(output).toContain('First');
      expect(output).toContain('Second');
      expect(output).toContain('Third');
    });

    it('should process variables with numbers between underscores', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { field_1_name: 'Numbered Field' },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'Value: {{field_1_name}}';
      const result = await processor.process(input);

      expect(result.toString()).toContain('Numbered Field');
    });

    it('should process version-style variables', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            v1_0_0: '1.0.0',
            v2_1_3: '2.1.3',
          },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'Versions: {{v1_0_0}}, {{v2_1_3}}';
      const result = await processor.process(input);
      const output = result.toString();

      expect(output).toContain('1.0.0');
      expect(output).toContain('2.1.3');
    });

    it('should process variables starting with numbers after underscore', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { section_1_title: 'Introduction' },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = '# {{section_1_title}}';
      const result = await processor.process(input);

      expect(result.toString()).toContain('Introduction');
    });
  });

  describe('Complex Underscore Patterns', () => {
    it('should document limitation: variables with underscores at both ends', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { _special_: 'Both Ends' },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'Value: {{_special_}}';
      const result = await processor.process(input);

      // NOTE: This test uses the plugin directly WITHOUT the fix from legal-markdown-processor
      // The fix (escapeTemplateUnderscores) prevents this issue at the processor level
      // This test documents what happens when the plugin is used standalone
      expect(result.toString()).toContain('{{*special*}}');
    });

    it('should document mixed underscore patterns behavior', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            _field1: 'Leading',
            field2_: 'Trailing',
            field__3: 'Double',
            field_4_name: 'Mixed',
          },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = '{{_field1}}, {{field2_}}, {{field__3}}, {{field_4_name}}';
      const result = await processor.process(input);
      const output = result.toString();

      // NOTE: This test uses the plugin directly WITHOUT the fix from legal-markdown-processor
      // The fix (escapeTemplateUnderscores) prevents this issue at the processor level
      // This documents standalone plugin behavior for reference
      expect(output).toContain('{{*field1}}'); // Leading _ becomes * (without fix)
      expect(output).toContain('{{field2*}}'); // Trailing _ becomes * (without fix)
      // BUT: Double underscores and mid-word underscores work fine even without fix
      expect(output).toContain('Double');
      expect(output).toContain('Mixed');
    });

    it('should process very long variable names with underscores', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            very_long_variable_name_with_many_underscores_and_words: 'Long Value',
          },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'Value: {{very_long_variable_name_with_many_underscores_and_words}}';
      const result = await processor.process(input);

      expect(result.toString()).toContain('Long Value');
    });
  });

  describe('Nested Objects with Special Characters', () => {
    it('should process nested objects with underscores in property names', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            client_info: {
              company_name: 'Acme Corp',
              contact_person: 'John Doe',
            },
          },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'Company: {{client_info.company_name}}, Contact: {{client_info.contact_person}}';
      const result = await processor.process(input);
      const output = result.toString();

      expect(output).toContain('Acme Corp');
      expect(output).toContain('John Doe');
    });

    it('should process deeply nested objects with underscores', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            project_data: {
              client_info: {
                primary_contact: {
                  first_name: 'John',
                  last_name: 'Doe',
                },
              },
            },
          },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'Contact: {{project_data.client_info.primary_contact.first_name}} {{project_data.client_info.primary_contact.last_name}}';
      const result = await processor.process(input);

      expect(result.toString()).toContain('John Doe');
    });
  });

  describe('Real-world Naming Conventions', () => {
    it('should handle snake_case convention', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            client_name: 'Acme Corp',
            contract_date: '2024-01-01',
            payment_terms: '30 days',
            late_fee_percentage: '1.5%',
          },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = `# Service Agreement

Client: {{client_name}}
Date: {{contract_date}}
Terms: {{payment_terms}}
Late Fee: {{late_fee_percentage}}`;

      const result = await processor.process(input);
      const output = result.toString();

      expect(output).toContain('Acme Corp');
      expect(output).toContain('2024-01-01');
      expect(output).toContain('30 days');
      expect(output).toContain('1.5%');
    });

    it('should handle database-style naming', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            user_id: '12345',
            created_at: '2024-01-01',
            updated_at: '2024-01-15',
            is_active: true,
          },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'ID: {{user_id}}, Created: {{created_at}}, Updated: {{updated_at}}, Active: {{is_active}}';
      const result = await processor.process(input);
      const output = result.toString();

      expect(output).toContain('12345');
      expect(output).toContain('2024-01-01');
      expect(output).toContain('2024-01-15');
      expect(output).toContain('true');
    });

    it('should document technical/programming conventions behavior', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            __version__: '1.0.0',
            _internal_state: 'active',
            DEBUG_MODE: true,
            max_retries_: 3,
          },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'Version: {{__version__}}, State: {{_internal_state}}, Debug: {{DEBUG_MODE}}, Retries: {{max_retries_}}';
      const result = await processor.process(input);
      const output = result.toString();

      // LIMITATION: Variables with leading/trailing underscores have parsing conflicts
      expect(output).toContain('{{**version**}}'); // Double underscores at both ends
      expect(output).toContain('{{*internal\\_state}}'); // Leading _ becomes *, internal _ escaped
      expect(output).toContain('true'); // DEBUG_MODE works (no leading/trailing _)
      expect(output).toContain('{{max\\_retries*}}'); // Trailing _ becomes *, internal _ escaped
    });
  });

  describe('Edge Cases', () => {
    it('should document empty string behavior with special characters', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            _field: '',
            field_: '',
            field__name: '',
          },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'Values: {{_field}}, {{field_}}, {{field__name}}';
      const result = await processor.process(input);

      // Empty values remain as placeholders, but with asterisks due to parsing limitation
      expect(result.toString()).toContain('{{*field}}'); // Leading _ becomes *
      expect(result.toString()).toContain('{{field*}}'); // Trailing _ becomes *
      expect(result.toString()).toContain('{{field\\_\\_name}}'); // Double underscore gets escaped
    });

    it('should document null values behavior with special characters', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            _field: null,
            field_: null,
            field__name: null,
          },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'Values: {{_field}}, {{field_}}, {{field__name}}';
      const result = await processor.process(input);

      // Null values remain as placeholders, but with asterisks due to parsing limitation
      expect(result.toString()).toContain('{{*field}}');
      expect(result.toString()).toContain('{{field*}}');
      expect(result.toString()).toContain('{{field\\_\\_name}}');
    });

    it('should document boolean false behavior with special characters', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            _enabled: false,
            is_active_: false,
          },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'Enabled: {{_enabled}}, Active: {{is_active_}}';
      const result = await processor.process(input);

      // LIMITATION: Leading/trailing underscores cause parsing issues even with values
      expect(result.toString()).toContain('{{*enabled}}');
      expect(result.toString()).toContain('{{is\\_active*}}'); // Mid-word _ escaped, trailing becomes *
    });

    it('should document zero values behavior with special characters', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            _count: 0,
            total_amount_: 0,
          },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'Count: {{_count}}, Amount: {{total_amount_}}';
      const result = await processor.process(input);
      const output = result.toString();

      // LIMITATION: Leading/trailing underscores cause parsing issues
      expect(output).toContain('{{*count}}');
      expect(output).toContain('{{total\\_amount*}}'); // Mid-word _ escaped, trailing becomes *
    });
  });
});
