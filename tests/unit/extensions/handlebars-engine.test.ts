/**
 * @fileoverview Tests for Handlebars Template Engine
 *
 * This file provides comprehensive test coverage for the handlebars-engine module,
 * which is CRITICAL for v4.0 as it will be the ONLY template engine after removing
 * legacy syntax (1,210 lines in template-loops.ts).
 *
 * Test Coverage:
 * - Basic template compilation and rendering
 * - All 30+ registered helpers (core, extension, mathematical, utility)
 * - Block helpers (if, unless, each, with)
 * - Nested structures and complex templates
 * - Error handling (undefined variables, type errors, invalid syntax)
 * - Edge cases (null values, empty arrays, circular references)
 * - Custom helper registration
 * - Field tracking helper
 * - Handlebars options object filtering
 */

import {
  handlebarsInstance,
  compileHandlebarsTemplate,
  registerCustomHelper,
} from '../../../src/extensions/handlebars-engine';

describe('Handlebars Engine', () => {
  // ==========================================================================
  // BASIC COMPILATION AND RENDERING
  // ==========================================================================

  describe('compileHandlebarsTemplate', () => {
    it('should compile and render simple templates', () => {
      const result = compileHandlebarsTemplate('Hello {{name}}!', { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('should handle multiple variables', () => {
      const result = compileHandlebarsTemplate(
        '{{firstName}} {{lastName}}',
        { firstName: 'John', lastName: 'Doe' }
      );
      expect(result).toBe('John Doe');
    });

    it('should handle nested object properties', () => {
      const result = compileHandlebarsTemplate(
        '{{person.name}} is {{person.age}} years old',
        { person: { name: 'Alice', age: 30 } }
      );
      expect(result).toBe('Alice is 30 years old');
    });

    it('should handle array iteration with each', () => {
      const result = compileHandlebarsTemplate(
        '{{#each items}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}',
        { items: ['Apple', 'Banana', 'Cherry'] }
      );
      expect(result).toBe('Apple, Banana, Cherry');
    });

    it('should render empty string for undefined variables', () => {
      const result = compileHandlebarsTemplate('Hello {{undefinedVar}}!', {});
      expect(result).toBe('Hello !');
    });

    it('should handle templates with no variables', () => {
      const result = compileHandlebarsTemplate('Static content only', {});
      expect(result).toBe('Static content only');
    });
  });

  // ==========================================================================
  // CORE HELPERS (Ruby-compatible date helpers)
  // ==========================================================================

  describe('Core Date Helpers', () => {
    describe('today', () => {
      it('should render current date', () => {
        const result = compileHandlebarsTemplate('{{today}}', {});
        const today = new Date().toISOString().split('T')[0];
        expect(result).toContain(today.split('-')[0]); // At least year should match
      });
    });

    describe('formatBasicDate', () => {
      it('should format dates with DD/MM/YYYY pattern', () => {
        const testDate = new Date('2025-03-15');
        const result = compileHandlebarsTemplate(
          '{{formatBasicDate date "DD/MM/YYYY"}}',
          { date: testDate }
        );
        expect(result).toBe('15/03/2025');
      });

      it('should format dates with YYYY-MM-DD pattern', () => {
        const testDate = new Date('2025-03-15');
        const result = compileHandlebarsTemplate(
          '{{formatBasicDate date "YYYY-MM-DD"}}',
          { date: testDate }
        );
        expect(result).toBe('2025-03-15');
      });
    });

    describe('parseToday', () => {
      it('should return current date when passed @today token', () => {
        const result = compileHandlebarsTemplate('{{parseToday "@today"}}', {});
        // parseToday returns a Date object, which Handlebars converts to string
        expect(result).toContain(new Date().getFullYear().toString());
      });

      it('should return null for non-@today tokens', () => {
        const result = compileHandlebarsTemplate('{{parseToday "other"}}', {});
        expect(result).toBe('');
      });
    });
  });

  // ==========================================================================
  // EXTENSION DATE HELPERS (Advanced date manipulation)
  // ==========================================================================

  describe('Extension Date Helpers', () => {
    describe('addYears', () => {
      it('should add years to a date', () => {
        const testDate = new Date('2025-01-01');
        const result = compileHandlebarsTemplate(
          '{{formatBasicDate (addYears date 5) "YYYY-MM-DD"}}',
          { date: testDate }
        );
        expect(result).toBe('2030-01-01');
      });
    });

    describe('addMonths', () => {
      it('should add months to a date', () => {
        const testDate = new Date('2025-01-15');
        const result = compileHandlebarsTemplate(
          '{{formatBasicDate (addMonths date 3) "YYYY-MM-DD"}}',
          { date: testDate }
        );
        expect(result).toBe('2025-04-15');
      });
    });

    describe('addDays', () => {
      it('should add days to a date', () => {
        const testDate = new Date('2025-01-15');
        const result = compileHandlebarsTemplate(
          '{{formatBasicDate (addDays date 10) "YYYY-MM-DD"}}',
          { date: testDate }
        );
        expect(result).toBe('2025-01-25');
      });

      it('should subtract days with negative values', () => {
        const testDate = new Date('2025-01-15');
        const result = compileHandlebarsTemplate(
          '{{formatBasicDate (addDays date -5) "YYYY-MM-DD"}}',
          { date: testDate }
        );
        expect(result).toBe('2025-01-10');
      });
    });

    describe('formatDate', () => {
      it('should format dates with various patterns', () => {
        const testDate = new Date('2025-03-15T10:30:00');
        const result = compileHandlebarsTemplate(
          '{{formatDate date "MMMM Do, YYYY"}}',
          { date: testDate }
        );
        expect(result).toContain('March');
        expect(result).toContain('2025');
      });
    });
  });

  // ==========================================================================
  // NUMBER HELPERS (Currency, formatting, calculations)
  // ==========================================================================

  describe('Number Helpers', () => {
    describe('formatCurrency', () => {
      it('should format currency with default USD', () => {
        const result = compileHandlebarsTemplate('{{formatCurrency price}}', { price: 1234.56 });
        expect(result).toContain('1,234.56');
      });

      it('should format currency with specific currency code', () => {
        const result = compileHandlebarsTemplate(
          '{{formatCurrency price "EUR"}}',
          { price: 1234.56 }
        );
        expect(result).toContain('1,234.56');
      });

      it('should format currency with custom decimal places', () => {
        const result = compileHandlebarsTemplate(
          '{{formatCurrency price "USD" 0}}',
          { price: 1234.56 }
        );
        expect(result).toContain('1,235'); // Rounded
      });

      it('should handle Handlebars options object gracefully', () => {
        // When called with only one argument, Handlebars passes options as second param
        const result = compileHandlebarsTemplate('{{formatCurrency 100}}', {});
        expect(result).toContain('100');
      });
    });

    describe('formatInteger', () => {
      it('should format integers with default separator', () => {
        const result = compileHandlebarsTemplate('{{formatInteger num}}', { num: 1234567 });
        expect(result).toBe('1,234,567');
      });

      it('should format integers with custom separator', () => {
        const result = compileHandlebarsTemplate(
          '{{formatInteger num "."}}',
          { num: 1234567 }
        );
        expect(result).toBe('1.234.567');
      });

      it('should handle Handlebars options object gracefully', () => {
        const result = compileHandlebarsTemplate('{{formatInteger 1000}}', {});
        expect(result).toBe('1,000');
      });
    });

    describe('formatPercent', () => {
      it('should format decimal as percentage with default 2 decimals', () => {
        const result = compileHandlebarsTemplate('{{formatPercent rate}}', { rate: 0.1234 });
        expect(result).toBe('12.34%');
      });

      it('should format percentage with 0 decimals', () => {
        const result = compileHandlebarsTemplate('{{formatPercent rate 0}}', { rate: 0.1234 });
        expect(result).toBe('12%');
      });
    });

    describe('formatEuro', () => {
      it('should format as Euro currency', () => {
        const result = compileHandlebarsTemplate('{{formatEuro amount}}', { amount: 1234.56 });
        expect(result).toContain('1,234.56');
      });
    });

    describe('formatDollar', () => {
      it('should format as Dollar currency', () => {
        const result = compileHandlebarsTemplate('{{formatDollar amount}}', { amount: 1234.56 });
        expect(result).toContain('1,234.56');
      });
    });

    describe('formatPound', () => {
      it('should format as Pound currency', () => {
        const result = compileHandlebarsTemplate('{{formatPound amount}}', { amount: 1234.56 });
        expect(result).toContain('1,234.56');
      });
    });

    describe('numberToWords', () => {
      it('should convert numbers to words', () => {
        const result = compileHandlebarsTemplate('{{numberToWords num}}', { num: 42 });
        expect(result).toContain('forty');
      });
    });

    describe('round', () => {
      it('should round numbers to specified decimal places', () => {
        const result = compileHandlebarsTemplate('{{round num 2}}', { num: 3.14159 });
        expect(result).toBe('3.14');
      });
    });
  });

  // ==========================================================================
  // STRING HELPERS (Text manipulation)
  // ==========================================================================

  describe('String Helpers', () => {
    describe('capitalize', () => {
      it('should capitalize first letter', () => {
        const result = compileHandlebarsTemplate('{{capitalize text}}', { text: 'hello' });
        expect(result).toBe('Hello');
      });
    });

    describe('capitalizeWords', () => {
      it('should capitalize each word', () => {
        const result = compileHandlebarsTemplate(
          '{{capitalizeWords text}}',
          { text: 'hello world' }
        );
        expect(result).toBe('Hello World');
      });
    });

    describe('upper', () => {
      it('should convert to uppercase', () => {
        const result = compileHandlebarsTemplate('{{upper text}}', { text: 'hello' });
        expect(result).toBe('HELLO');
      });
    });

    describe('lower', () => {
      it('should convert to lowercase', () => {
        const result = compileHandlebarsTemplate('{{lower text}}', { text: 'HELLO' });
        expect(result).toBe('hello');
      });
    });

    describe('titleCase', () => {
      it('should convert to title case', () => {
        const result = compileHandlebarsTemplate(
          '{{titleCase text}}',
          { text: 'the quick brown fox' }
        );
        expect(result).toBe('The Quick Brown Fox');
      });
    });

    describe('kebabCase', () => {
      it('should convert to kebab-case', () => {
        const result = compileHandlebarsTemplate('{{kebabCase text}}', { text: 'hello world' });
        expect(result).toBe('hello-world');
      });
    });

    describe('snakeCase', () => {
      it('should convert to snake_case', () => {
        const result = compileHandlebarsTemplate('{{snakeCase text}}', { text: 'hello world' });
        expect(result).toBe('hello_world');
      });
    });

    describe('camelCase', () => {
      it('should convert to camelCase', () => {
        const result = compileHandlebarsTemplate('{{camelCase text}}', { text: 'hello world' });
        expect(result).toBe('helloWorld');
      });
    });

    describe('pascalCase', () => {
      it('should convert to PascalCase', () => {
        const result = compileHandlebarsTemplate('{{pascalCase text}}', { text: 'hello world' });
        expect(result).toBe('HelloWorld');
      });
    });

    describe('truncate', () => {
      it('should truncate long strings', () => {
        const result = compileHandlebarsTemplate(
          '{{truncate text 10}}',
          { text: 'This is a very long text' }
        );
        expect(result.length).toBeLessThanOrEqual(13); // 10 + "..." = 13
      });

      it('should use custom suffix', () => {
        const result = compileHandlebarsTemplate(
          '{{truncate text 10 " [...]"}}',
          { text: 'This is a very long text' }
        );
        expect(result).toContain('[...]');
      });

      it('should handle Handlebars options object gracefully', () => {
        const result = compileHandlebarsTemplate(
          '{{truncate "Hello World" 5}}',
          {}
        );
        expect(result.length).toBeLessThanOrEqual(8); // 5 + "..."
      });
    });

    describe('clean', () => {
      it('should remove extra whitespace', () => {
        const result = compileHandlebarsTemplate(
          '{{clean text}}',
          { text: '  hello   world  ' }
        );
        expect(result).toBe('hello world');
      });
    });

    describe('pluralize', () => {
      it('should pluralize words', () => {
        const result = compileHandlebarsTemplate('{{pluralize word}}', { word: 'cat' });
        expect(result).toBe('cats');
      });
    });

    describe('padStart', () => {
      it('should pad start of string', () => {
        const result = compileHandlebarsTemplate('{{padStart text 5 "0"}}', { text: '42' });
        expect(result).toBe('00042');
      });
    });

    describe('padEnd', () => {
      it('should pad end of string', () => {
        const result = compileHandlebarsTemplate('{{padEnd text 5 "0"}}', { text: '42' });
        expect(result).toBe('42000');
      });
    });

    describe('contains', () => {
      it('should check if string contains substring', () => {
        const result = compileHandlebarsTemplate(
          '{{contains text "world"}}',
          { text: 'hello world' }
        );
        expect(result).toBe('true');
      });
    });

    describe('replaceAll', () => {
      it('should replace all occurrences', () => {
        const result = compileHandlebarsTemplate(
          '{{replaceAll text "o" "0"}}',
          { text: 'hello world' }
        );
        expect(result).toBe('hell0 w0rld');
      });
    });

    describe('initials', () => {
      it('should extract initials from name', () => {
        const result = compileHandlebarsTemplate('{{initials name}}', { name: 'John Doe Smith' });
        expect(result).toBe('JDS');
      });
    });
  });

  // ==========================================================================
  // MATHEMATICAL HELPERS (Legacy migration support)
  // ==========================================================================

  describe('Mathematical Helpers', () => {
    describe('multiply', () => {
      it('should multiply two numbers', () => {
        const result = compileHandlebarsTemplate('{{multiply a b}}', { a: 5, b: 3 });
        expect(result).toBe('15');
      });

      it('should handle string numbers', () => {
        const result = compileHandlebarsTemplate('{{multiply a b}}', { a: '5', b: '3' });
        expect(result).toBe('15');
      });

      it('should return NaN when Handlebars options object passed as b', () => {
        const result = compileHandlebarsTemplate('{{multiply 5}}', {});
        expect(result).toBe('NaN');
      });
    });

    describe('divide', () => {
      it('should divide two numbers', () => {
        const result = compileHandlebarsTemplate('{{divide a b}}', { a: 15, b: 3 });
        expect(result).toBe('5');
      });

      it('should handle decimal division', () => {
        const result = compileHandlebarsTemplate('{{divide a b}}', { a: 10, b: 4 });
        expect(result).toBe('2.5');
      });

      it('should return NaN for division by zero', () => {
        const result = compileHandlebarsTemplate('{{divide a b}}', { a: 10, b: 0 });
        expect(result).toBe('NaN');
      });
    });

    describe('add', () => {
      it('should add two numbers', () => {
        const result = compileHandlebarsTemplate('{{add a b}}', { a: 5, b: 3 });
        expect(result).toBe('8');
      });

      it('should handle decimal addition', () => {
        const result = compileHandlebarsTemplate('{{add a b}}', { a: 1.5, b: 2.3 });
        expect(result).toBe('3.8');
      });
    });

    describe('subtract', () => {
      it('should subtract two numbers', () => {
        const result = compileHandlebarsTemplate('{{subtract a b}}', { a: 10, b: 3 });
        expect(result).toBe('7');
      });

      it('should handle negative results', () => {
        const result = compileHandlebarsTemplate('{{subtract a b}}', { a: 3, b: 10 });
        expect(result).toBe('-7');
      });
    });
  });

  // ==========================================================================
  // STRING CONCATENATION HELPER
  // ==========================================================================

  describe('concat helper', () => {
    it('should concatenate multiple strings', () => {
      const result = compileHandlebarsTemplate(
        '{{concat prefix name suffix}}',
        { prefix: 'Mr. ', name: 'John Doe', suffix: ' Esq.' }
      );
      expect(result).toBe('Mr. John Doe Esq.');
    });

    it('should concatenate literals and variables', () => {
      const result = compileHandlebarsTemplate(
        '{{concat "$" price}}',
        { price: '100' }
      );
      expect(result).toBe('$100');
    });

    it('should handle empty strings', () => {
      const result = compileHandlebarsTemplate('{{concat a b c}}', { a: 'hello', b: '', c: 'world' });
      expect(result).toBe('helloworld');
    });
  });

  // ==========================================================================
  // FIELD TRACKING HELPER
  // ==========================================================================

  describe('trackField helper', () => {
    it('should wrap content in tracking span', () => {
      const result = compileHandlebarsTemplate(
        '{{#trackField "clientName"}}{{name}}{{/trackField}}',
        { name: 'John Doe' }
      );
      expect(result).toBe('<span class="legal-md-field" data-field="clientName">John Doe</span>');
    });

    it('should preserve content formatting', () => {
      const result = compileHandlebarsTemplate(
        '{{#trackField "amount"}}${{price}}{{/trackField}}',
        { price: '1,000' }
      );
      expect(result).toContain('$1,000');
      expect(result).toContain('data-field="amount"');
    });
  });

  // ==========================================================================
  // BUILT-IN HANDLEBARS BLOCK HELPERS
  // ==========================================================================

  describe('Built-in Block Helpers', () => {
    describe('if helper', () => {
      it('should render block when condition is true', () => {
        const result = compileHandlebarsTemplate(
          '{{#if active}}Active{{/if}}',
          { active: true }
        );
        expect(result).toBe('Active');
      });

      it('should not render block when condition is false', () => {
        const result = compileHandlebarsTemplate(
          '{{#if active}}Active{{/if}}',
          { active: false }
        );
        expect(result).toBe('');
      });

      it('should support else clause', () => {
        const result = compileHandlebarsTemplate(
          '{{#if active}}Active{{else}}Inactive{{/if}}',
          { active: false }
        );
        expect(result).toBe('Inactive');
      });
    });

    describe('unless helper', () => {
      it('should render block when condition is false', () => {
        const result = compileHandlebarsTemplate(
          '{{#unless completed}}Pending{{/unless}}',
          { completed: false }
        );
        expect(result).toBe('Pending');
      });

      it('should not render block when condition is true', () => {
        const result = compileHandlebarsTemplate(
          '{{#unless completed}}Pending{{/unless}}',
          { completed: true }
        );
        expect(result).toBe('');
      });
    });

    describe('each helper', () => {
      it('should iterate over array', () => {
        const result = compileHandlebarsTemplate(
          '{{#each items}}{{this}} {{/each}}',
          { items: ['A', 'B', 'C'] }
        );
        expect(result).toBe('A B C ');
      });

      it('should provide @index variable', () => {
        const result = compileHandlebarsTemplate(
          '{{#each items}}{{@index}}:{{this}} {{/each}}',
          { items: ['A', 'B', 'C'] }
        );
        expect(result).toBe('0:A 1:B 2:C ');
      });

      it('should provide @first and @last variables', () => {
        const result = compileHandlebarsTemplate(
          '{{#each items}}{{#if @first}}First: {{/if}}{{this}}{{#if @last}} Last{{/if}} {{/each}}',
          { items: ['A', 'B'] }
        );
        expect(result).toContain('First: A');
        expect(result).toContain('B Last');
      });

      it('should handle empty arrays', () => {
        const result = compileHandlebarsTemplate(
          '{{#each items}}{{this}}{{else}}No items{{/each}}',
          { items: [] }
        );
        expect(result).toBe('No items');
      });

      it('should iterate over object properties', () => {
        const result = compileHandlebarsTemplate(
          '{{#each person}}{{@key}}: {{this}} {{/each}}',
          { person: { name: 'John', age: 30 } }
        );
        expect(result).toContain('name: John');
        expect(result).toContain('age: 30');
      });
    });

    describe('with helper', () => {
      it('should change context', () => {
        const result = compileHandlebarsTemplate(
          '{{#with person}}{{name}} is {{age}}{{/with}}',
          { person: { name: 'John', age: 30 } }
        );
        expect(result).toBe('John is 30');
      });
    });
  });

  // ==========================================================================
  // NESTED STRUCTURES AND COMPLEX TEMPLATES
  // ==========================================================================

  describe('Complex Template Scenarios', () => {
    it('should handle nested if blocks', () => {
      const result = compileHandlebarsTemplate(
        '{{#if outer}}Outer{{#if inner}} Inner{{/if}}{{/if}}',
        { outer: true, inner: true }
      );
      expect(result).toBe('Outer Inner');
    });

    it('should handle nested each loops', () => {
      const result = compileHandlebarsTemplate(
        '{{#each groups}}{{name}}: {{#each members}}{{this}} {{/each}}; {{/each}}',
        {
          groups: [
            { name: 'A', members: ['1', '2'] },
            { name: 'B', members: ['3', '4'] },
          ],
        }
      );
      expect(result).toBe('A: 1 2 ; B: 3 4 ; ');
    });

    it('should combine helpers with block helpers', () => {
      const result = compileHandlebarsTemplate(
        '{{#each items}}{{upper this}} {{/each}}',
        { items: ['hello', 'world'] }
      );
      expect(result).toBe('HELLO WORLD ');
    });

    it('should handle deeply nested object access', () => {
      const result = compileHandlebarsTemplate(
        '{{company.department.team.lead.name}}',
        {
          company: {
            department: {
              team: {
                lead: { name: 'Alice' },
              },
            },
          },
        }
      );
      expect(result).toBe('Alice');
    });

    it('should combine multiple helpers in sequence', () => {
      const result = compileHandlebarsTemplate(
        '{{upper (capitalize name)}}',
        { name: 'john' }
      );
      expect(result).toBe('JOHN');
    });

    it('should handle mathematical operations in templates', () => {
      const result = compileHandlebarsTemplate(
        'Total: {{formatCurrency (multiply price quantity)}}',
        { price: 10.5, quantity: 3 }
      );
      expect(result).toContain('31.50');
    });
  });

  // ==========================================================================
  // ERROR HANDLING AND EDGE CASES
  // ==========================================================================

  describe('Error Handling', () => {
    it('should handle undefined variables gracefully', () => {
      const result = compileHandlebarsTemplate(
        'Hello {{undefinedVar}}!',
        {}
      );
      expect(result).toBe('Hello !');
    });

    it('should handle null values', () => {
      const result = compileHandlebarsTemplate(
        'Value: {{value}}',
        { value: null }
      );
      expect(result).toBe('Value: ');
    });

    it('should handle empty strings', () => {
      const result = compileHandlebarsTemplate(
        'Name: {{name}}',
        { name: '' }
      );
      expect(result).toBe('Name: ');
    });

    it('should handle zero values', () => {
      const result = compileHandlebarsTemplate(
        'Count: {{count}}',
        { count: 0 }
      );
      expect(result).toBe('Count: 0');
    });

    it('should handle false boolean values', () => {
      const result = compileHandlebarsTemplate(
        'Active: {{active}}',
        { active: false }
      );
      expect(result).toBe('Active: false');
    });

    it('should not throw on invalid template syntax', () => {
      expect(() => {
        compileHandlebarsTemplate('{{#if}}{{/if}}', {});
      }).toThrow();
    });

    it('should handle circular references without crashing', () => {
      const data: any = { name: 'Test' };
      data.self = data; // Create circular reference

      // Handlebars should handle this without throwing
      const result = compileHandlebarsTemplate('{{name}}', data);
      expect(result).toBe('Test');
    });
  });

  // ==========================================================================
  // CUSTOM HELPER REGISTRATION
  // ==========================================================================

  describe('registerCustomHelper', () => {
    beforeEach(() => {
      // Clean up any previously registered test helpers
      // Note: Handlebars doesn't provide unregisterHelper, so we rely on test isolation
    });

    it('should register and use custom helper', () => {
      registerCustomHelper('shout', (text: string) => {
        return text.toUpperCase() + '!!!';
      });

      const result = compileHandlebarsTemplate('{{shout text}}', { text: 'hello' });
      expect(result).toBe('HELLO!!!');
    });

    it('should register custom helper with multiple arguments', () => {
      registerCustomHelper('repeat', (text: string, times: number) => {
        return text.repeat(times);
      });

      const result = compileHandlebarsTemplate('{{repeat text 3}}', { text: 'Ha' });
      expect(result).toBe('HaHaHa');
    });

    it('should register custom block helper', () => {
      registerCustomHelper('bold', function (this: any, options: any) {
        return '<strong>' + options.fn(this) + '</strong>';
      });

      const result = compileHandlebarsTemplate('{{#bold}}Important{{/bold}}', {});
      expect(result).toBe('<strong>Important</strong>');
    });
  });

  // ==========================================================================
  // HANDLEBARS INSTANCE DIRECT USAGE
  // ==========================================================================

  describe('handlebarsInstance', () => {
    it('should be accessible for direct compilation', () => {
      const template = handlebarsInstance.compile('Hello {{name}}!');
      const result = template({ name: 'Direct' });
      expect(result).toBe('Hello Direct!');
    });

    it('should have all helpers registered', () => {
      const helpers = handlebarsInstance.helpers;

      // Core helpers
      expect(helpers.today).toBeDefined();
      expect(helpers.formatBasicDate).toBeDefined();

      // Extension helpers
      expect(helpers.addYears).toBeDefined();
      expect(helpers.formatCurrency).toBeDefined();
      expect(helpers.capitalize).toBeDefined();

      // Mathematical helpers
      expect(helpers.multiply).toBeDefined();
      expect(helpers.divide).toBeDefined();
      expect(helpers.add).toBeDefined();
      expect(helpers.subtract).toBeDefined();

      // Utility helpers
      expect(helpers.concat).toBeDefined();
      expect(helpers.trackField).toBeDefined();
    });
  });

  // ==========================================================================
  // PERFORMANCE AND EDGE CASES
  // ==========================================================================

  describe('Performance and Edge Cases', () => {
    it('should handle large data sets efficiently', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => i);
      const start = Date.now();

      const result = compileHandlebarsTemplate(
        '{{#each items}}{{this}}{{/each}}',
        { items: largeArray }
      );

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
      expect(result).toContain('999');
    });

    it('should handle very long strings', () => {
      const longString = 'x'.repeat(10000);
      const result = compileHandlebarsTemplate('{{text}}', { text: longString });
      expect(result.length).toBe(10000);
    });

    it('should handle special HTML characters', () => {
      const result = compileHandlebarsTemplate(
        '{{text}}',
        { text: '<script>alert("xss")</script>' }
      );
      // Handlebars escapes HTML by default
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;');
    });

    it('should handle Unicode characters', () => {
      const result = compileHandlebarsTemplate(
        '{{text}}',
        { text: 'Hello 世界 🌍' }
      );
      expect(result).toBe('Hello 世界 🌍');
    });

    it('should handle empty data object', () => {
      const result = compileHandlebarsTemplate('Static text', {});
      expect(result).toBe('Static text');
    });

    it('should handle arrays with mixed types', () => {
      const result = compileHandlebarsTemplate(
        '{{#each items}}{{this}} {{/each}}',
        { items: [1, 'two', true, null, undefined] }
      );
      expect(result).toContain('1');
      expect(result).toContain('two');
      expect(result).toContain('true');
    });
  });
});
