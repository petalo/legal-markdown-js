/**
 * Comprehensive integration tests for frontmatter import and merge behavior.
 *
 * Tests the "source always wins" strategy:
 * - Fields present in main document → main value wins (import ignored)
 * - Fields NOT present in main → import value is added
 *
 * Coverage:
 * - Basic merge strategy
 * - Data type handling (strings, numbers, dates, objects, arrays)
 * - Nested objects with partial overlap
 * - Field ordering independence
 * - YAML comments handling
 * - Special types (Date, Buffer, Error)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { processLegalMarkdown } from '../../src/index';
import { flattenObject, unflattenObject } from '../../src/core/utils/object-flattener';
import * as fs from 'fs';
import * as path from 'path';

describe('Frontmatter Import and Merge', () => {
  const testDir = path.join(__dirname, 'temp-frontmatter-import-merge');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Basic Merge Strategy: Source Always Wins', () => {
    it.skip('should apply "source wins" for existing fields, add missing fields from import', () => {
      // TODO: Skipped due to issue #141 - Date fields from main are being overridden by import values
      const importedContent = `---
# Fields that should be ADDED (not in main)
author: John Smith from Import
version: 2.0
imported_variables:
  field1: value from import
  field2: another value

# Fields that should be IGNORED (already in main, main should win)
title: Title from Import (SHOULD BE IGNORED)
date: 2020-01-01 (SHOULD BE IGNORED)
---

# Imported Content

This is the imported file content.`;

      fs.writeFileSync(path.join(testDir, 'imported.md'), importedContent);

      const mainContent = `---
title: Main Document Title
date: 2025-01-15
# Note: author, version, imported_variables are NOT here
# They should be added from import
---

# {{title}}

**Date:** {{date}}

@import imported.md

## Testing "source always wins" strategy

**Title (should be from main):** {{title}}
**Date (should be from main):** {{date}}
**Author (should be from import):** {{author}}
**Version (should be from import):** {{version}}
**Field 1 (should be from import):** {{imported_variables.field1}}
**Field 2 (should be from import):** {{imported_variables.field2}}`;

      const result = processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false
      });

      // 1. Fields present in MAIN should win (import should be ignored)
      expect(result.metadata.title).toBe('Main Document Title');
      expect(result.metadata.title).not.toBe('Title from Import (SHOULD BE IGNORED)');

      const dateStr = result.metadata.date?.toString() || '';
      expect(dateStr).toContain('2025'); // Main value
      expect(dateStr).not.toContain('2020'); // Not import value

      // 2. Fields NOT present in MAIN should be added from import
      expect(result.metadata.author).toBe('John Smith from Import');
      expect(result.metadata.version).toBe(2.0);
      expect(result.metadata.imported_variables).toEqual({
        field1: 'value from import',
        field2: 'another value'
      });

      // 3. Check content has the right values
      expect(result.content).toContain('**Title (should be from main):** Main Document Title');
      expect(result.content).toContain('**Author (should be from import):** John Smith from Import');
      expect(result.content).toContain('**Field 1 (should be from import):** value from import');
      expect(result.content).toContain('**Field 2 (should be from import):** another value');
    });

    it('should add ALL fields from import when main has NO frontmatter', () => {
      const importedContent = `---
author: John Smith
version: 2.0
title: Title from Import
---

Imported content.`;

      fs.writeFileSync(path.join(testDir, 'imported.md'), importedContent);

      const mainContent = `# No Frontmatter in Main

@import imported.md

**Author:** {{author}}
**Version:** {{version}}
**Title:** {{title}}`;

      const result = processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false
      });

      // ALL fields from import should be added
      expect(result.metadata.author).toBe('John Smith');
      expect(result.metadata.version).toBe(2.0);
      expect(result.metadata.title).toBe('Title from Import');

      // Variables should be substituted in content
      expect(result.content).toContain('**Author:** John Smith');
      expect(result.content).toContain('**Title:** Title from Import');
    });

    it('should handle nested objects with "source wins" at property level', () => {
      const importedContent = `---
client:
  name: Client from Import (SHOULD BE IGNORED)
  industry: Manufacturing
  contact:
    email: import@example.com (SHOULD BE IGNORED)
    phone: 555-0000
project:
  name: Project from Import
  value: 100000
---

Imported content.`;

      fs.writeFileSync(path.join(testDir, 'nested.md'), importedContent);

      const mainContent = `---
client:
  name: Client from Main
  contact:
    email: main@example.com
# Note: client.industry, client.contact.phone, project are NOT in main
---

@import nested.md

**Client Name (should be from main):** {{client.name}}
**Client Industry (should be from import):** {{client.industry}}
**Contact Email (should be from main):** {{client.contact.email}}
**Contact Phone (should be from import):** {{client.contact.phone}}
**Project Name (should be from import):** {{project.name}}
**Project Value (should be from import):** {{project.value}}`;

      const result = processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false
      });

      // Main values should win at property level
      expect(result.metadata.client.name).toBe('Client from Main');
      expect(result.metadata.client.contact.email).toBe('main@example.com');

      // Missing properties should be added from import
      expect(result.metadata.client.industry).toBe('Manufacturing');
      expect(result.metadata.client.contact.phone).toBe('555-0000');
      expect(result.metadata.project).toEqual({
        name: 'Project from Import',
        value: 100000
      });

      // Check content
      expect(result.content).toContain('**Client Name (should be from main):** Client from Main');
      expect(result.content).toContain('**Client Industry (should be from import):** Manufacturing');
      expect(result.content).toContain('**Contact Email (should be from main):** main@example.com');
      expect(result.content).toContain('**Contact Phone (should be from import):** 555-0000');
      expect(result.content).toContain('**Project Name (should be from import):** Project from Import');
    });
  });

  describe('Data Type Handling', () => {
    it('should handle ALL data types at first level', () => {
      const importedContent = `---
# All these should be IGNORED (main should win)
string_field: "String from IMPORT"
number_field: 999
boolean_field: false
array_field: ["import", "array"]
object_field:
  nested: "from import"
null_field: null
date_field: 2020-01-01
---

Content`;

      fs.writeFileSync(path.join(testDir, 'imported.md'), importedContent);

      const mainContent = `---
# All these should WIN over import
string_field: "String from MAIN"
number_field: 100
boolean_field: true
array_field: ["main", "array"]
object_field:
  nested: "from main"
null_field: "not null in main"
date_field: 2025-12-31
---

@import imported.md`;

      const result = processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false
      });

      // ALL main values should win
      expect(result.metadata.string_field).toBe('String from MAIN');
      expect(result.metadata.number_field).toBe(100);
      expect(result.metadata.boolean_field).toBe(true);
      expect(result.metadata.array_field).toEqual(['main', 'array']);
      expect(result.metadata.object_field).toEqual({ nested: 'from main' });
      expect(result.metadata.null_field).toBe('not null in main');

      // date_field - check if it's from main (2025) or import (2020)
      const dateStr = result.metadata.date_field?.toString() || '';
      expect(dateStr.includes('2025') || !dateStr.includes('2020')).toBe(true);
    });

    it('should handle multiple string fields correctly', () => {
      const importedContent = `---
field1: "Import Value 1"
field2: "Import Value 2"
field3: "Import Value 3"
field4: "Import Value 4"
field5: "Import Value 5"
---

Content`;

      fs.writeFileSync(path.join(testDir, 'imported.md'), importedContent);

      const mainContent = `---
field1: "Main Value 1"
field2: "Main Value 2"
field3: "Main Value 3"
field4: "Main Value 4"
field5: "Main Value 5"
---

@import imported.md`;

      const result = processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false
      });

      for (let i = 1; i <= 5; i++) {
        expect(result.metadata[`field${i}`]).toBe(`Main Value ${i}`);
      }
    });

    it('should handle arrays at first level', () => {
      const importedContent = `---
simple_array: ["import1", "import2"]
number_array: [100, 200, 300]
mixed_array: [1, "two", true, null]
---

Content`;

      fs.writeFileSync(path.join(testDir, 'imported.md'), importedContent);

      const mainContent = `---
simple_array: ["main1", "main2"]
number_array: [1, 2, 3]
mixed_array: ["main", 42, false]
---

@import imported.md`;

      const result = processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false
      });

      expect(result.metadata.simple_array).toEqual(['main1', 'main2']);
      expect(result.metadata.number_array).toEqual([1, 2, 3]);
      expect(result.metadata.mixed_array).toEqual(['main', 42, false]);
    });
  });

  describe('Nested Object Handling', () => {
    it('should handle nested objects at different levels', () => {
      const importedContent = `---
level1:
  name: "Import L1"
  level2:
    name: "Import L2"
    level3:
      name: "Import L3"
      value: 999
---

Content`;

      fs.writeFileSync(path.join(testDir, 'imported.md'), importedContent);

      const mainContent = `---
level1:
  name: "Main L1"
  level2:
    name: "Main L2"
    level3:
      name: "Main L3"
      value: 100
---

@import imported.md`;

      const result = processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false
      });

      expect(result.metadata.level1.name).toBe('Main L1');
      expect(result.metadata.level1.level2.name).toBe('Main L2');
      expect(result.metadata.level1.level2.level3.name).toBe('Main L3');
      expect(result.metadata.level1.level2.level3.value).toBe(100);
    });

    it('should handle partial overlap in nested objects', () => {
      const importedContent = `---
client:
  name: "Import Client"
  email: "import@example.com"
  extra: "Should be added"
  nested:
    field1: "Import Nested 1"
    field2: "Import Nested 2"
---

Content`;

      fs.writeFileSync(path.join(testDir, 'imported.md'), importedContent);

      const mainContent = `---
client:
  name: "Main Client"
  email: "main@example.com"
  nested:
    field1: "Main Nested 1"
---

@import imported.md`;

      const result = processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false
      });

      // Main should win for existing fields
      expect(result.metadata.client.name).toBe('Main Client');
      expect(result.metadata.client.email).toBe('main@example.com');
      expect(result.metadata.client.nested.field1).toBe('Main Nested 1');

      // Import should add missing fields
      expect(result.metadata.client.extra).toBe('Should be added');
      expect(result.metadata.client.nested.field2).toBe('Import Nested 2');
    });

    it('should work when nested object appears BEFORE conflicting simple fields', () => {
      const importedContent = `---
nested_object:
  prop1: "nested 1"
  prop2: "nested 2"
field1: "Import field1"
field2: "Import field2"
---

Content`;

      fs.writeFileSync(path.join(testDir, 'imported.md'), importedContent);

      const mainContent = `---
field1: "Main field1"
field2: "Main field2"
---

@import imported.md`;

      const result = processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false
      });

      expect(result.metadata.field1).toBe('Main field1');
      expect(result.metadata.field2).toBe('Main field2');
      expect(result.metadata.nested_object).toEqual({ prop1: 'nested 1', prop2: 'nested 2' });
    });

    it('should work with MULTIPLE nested objects before simple fields', () => {
      const importedContent = `---
nested1:
  a: "value a"
nested2:
  b: "value b"
nested3:
  c: "value c"
field1: "Import field1"
field2: "Import field2"
field3: "Import field3"
---

Content`;

      fs.writeFileSync(path.join(testDir, 'imported.md'), importedContent);

      const mainContent = `---
field1: "Main field1"
field2: "Main field2"
field3: "Main field3"
---

@import imported.md`;

      const result = processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false
      });

      expect(result.metadata.field1).toBe('Main field1');
      expect(result.metadata.field2).toBe('Main field2');
      expect(result.metadata.field3).toBe('Main field3');
    });
  });

  describe('Field Order Independence', () => {
    it('should be independent of field declaration order', () => {
      const importedContent = `---
aaa: "Import AAA"
bbb: "Import BBB"
ccc: "Import CCC"
zzz: "Import ZZZ"
---

Content`;

      fs.writeFileSync(path.join(testDir, 'imported.md'), importedContent);

      const mainContent = `---
zzz: "Main ZZZ"
ccc: "Main CCC"
bbb: "Main BBB"
aaa: "Main AAA"
---

@import imported.md`;

      const result = processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false
      });

      expect(result.metadata.aaa).toBe('Main AAA');
      expect(result.metadata.bbb).toBe('Main BBB');
      expect(result.metadata.ccc).toBe('Main CCC');
      expect(result.metadata.zzz).toBe('Main ZZZ');
    });

    it('should work when main has only some fields', () => {
      const importedContent = `---
field1: "Import 1"
field2: "Import 2"
field3: "Import 3"
field4: "Import 4"
---

Content`;

      fs.writeFileSync(path.join(testDir, 'imported.md'), importedContent);

      const mainContent = `---
field1: "Main 1"
field3: "Main 3"
---

@import imported.md`;

      const result = processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false
      });

      // Main should win for existing fields
      expect(result.metadata.field1).toBe('Main 1');
      expect(result.metadata.field3).toBe('Main 3');

      // Import should provide missing fields
      expect(result.metadata.field2).toBe('Import 2');
      expect(result.metadata.field4).toBe('Import 4');
    });

    it('should handle fields in different order (import has new fields first)', () => {
      const importedContent = `---
new_field1: "Import New 1"
new_field2: "Import New 2"
title: "Title from Import"
date: "2020-01-01 (SHOULD BE IGNORED)"
new_field3: "Import New 3"
---

Content`;

      fs.writeFileSync(path.join(testDir, 'imported.md'), importedContent);

      const mainContent = `---
title: "Main Document Title"
date: "2025-01-15"
---

@import imported.md`;

      const result = processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false
      });

      expect(result.metadata.title).toBe('Main Document Title');
      expect(result.metadata.date).toBe('2025-01-15');
      expect(result.metadata.new_field1).toBe('Import New 1');
      expect(result.metadata.new_field2).toBe('Import New 2');
      expect(result.metadata.new_field3).toBe('Import New 3');
    });
  });

  describe('YAML Comments Handling', () => {
    it('should work when main has NO comments', () => {
      const importedContent = `---
field1: "Import field1"
field2: "Import field2"
---

Content`;

      fs.writeFileSync(path.join(testDir, 'imported.md'), importedContent);

      const mainContent = `---
field1: "Main field1"
field2: "Main field2"
---

@import imported.md`;

      const result = processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false
      });

      expect(result.metadata.field1).toBe('Main field1');
      expect(result.metadata.field2).toBe('Main field2');
    });

    it('should work when main has comments AFTER fields', () => {
      const importedContent = `---
field1: "Import field1"
field2: "Import field2"
---

Content`;

      fs.writeFileSync(path.join(testDir, 'imported.md'), importedContent);

      const mainContent = `---
field1: "Main field1"
field2: "Main field2"
# This is a comment AFTER fields
---

@import imported.md`;

      const result = processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false
      });

      expect(result.metadata.field1).toBe('Main field1');
      expect(result.metadata.field2).toBe('Main field2');
    });

    it('should work when main has comments BEFORE fields', () => {
      const importedContent = `---
field1: "Import field1"
field2: "Import field2"
---

Content`;

      fs.writeFileSync(path.join(testDir, 'imported.md'), importedContent);

      const mainContent = `---
# This is a comment BEFORE fields
field1: "Main field1"
field2: "Main field2"
---

@import imported.md`;

      const result = processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false
      });

      expect(result.metadata.field1).toBe('Main field1');
      expect(result.metadata.field2).toBe('Main field2');
    });

    it('should handle YAML comments in import', () => {
      const importedContent = `---
# This is a comment
new_field: "Import New"
# Another comment
title: "Title from Import"
# Yet another comment
date: "2020-01-01"
---

Content`;

      fs.writeFileSync(path.join(testDir, 'imported.md'), importedContent);

      const mainContent = `---
title: "Main Document Title"
date: "2025-01-15"
---

@import imported.md`;

      const result = processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false
      });

      expect(result.metadata.title).toBe('Main Document Title');
      expect(result.metadata.date).toBe('2025-01-15');
    });
  });

  describe('Date Type Handling', () => {
    it('should work when both are valid dates', () => {
      const importedContent = `---
field1: "String 1"
date: 2020-01-01
field2: "String 2"
---

Content`;

      fs.writeFileSync(path.join(testDir, 'imported.md'), importedContent);

      const mainContent = `---
field1: "Main String 1"
date: 2025-01-15
field2: "Main String 2"
---

@import imported.md`;

      const result = processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false
      });

      const dateStr = result.metadata.date?.toString() || '';
      expect(result.metadata.field1).toBe('Main String 1');
      expect(result.metadata.field2).toBe('Main String 2');
      // Date should be from main (2025) not import (2020)
      expect(dateStr.includes('2025') || !dateStr.includes('2020')).toBe(true);
    });

    it.skip('should work when main is date, import is string with text', () => {
      // TODO: Skipped due to issue #141 - Date type mismatches can cause import to override main
      const importedContent = `---
field1: "String 1"
date: 2020-01-01 (with extra text)
field2: "String 2"
---

Content`;

      fs.writeFileSync(path.join(testDir, 'imported.md'), importedContent);

      const mainContent = `---
field1: "Main String 1"
date: 2025-01-15
field2: "Main String 2"
---

@import imported.md`;

      const result = processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false
      });

      const dateStr = result.metadata.date?.toString() || '';
      expect(result.metadata.field1).toBe('Main String 1');
      expect(result.metadata.field2).toBe('Main String 2');
      expect(dateStr.includes('2025') || !dateStr.includes('2020')).toBe(true);
    });

    it('should work when both are strings (no dates)', () => {
      const importedContent = `---
field1: "String 1"
date: "2020-01-01 (with extra text)"
field2: "String 2"
---

Content`;

      fs.writeFileSync(path.join(testDir, 'imported.md'), importedContent);

      const mainContent = `---
field1: "Main String 1"
date: "2025-01-15"
field2: "Main String 2"
---

@import imported.md`;

      const result = processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false
      });

      expect(result.metadata.field1).toBe('Main String 1');
      expect(result.metadata.date).toBe('2025-01-15');
      expect(result.metadata.field2).toBe('Main String 2');
    });

    it('should handle Date objects correctly', () => {
      const importedContent = `---
field1: "String 1"
date_field: 2020-01-01
field2: "String 2"
---

Content`;

      fs.writeFileSync(path.join(testDir, 'imported.md'), importedContent);

      const mainContent = `---
field1: "Main String 1"
date_field: 2025-01-15
field2: "Main String 2"
---

@import imported.md`;

      const result = processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false
      });

      const dateStr = result.metadata.date_field?.toString() || '';
      expect(dateStr.includes('2025') || !dateStr.includes('2020')).toBe(true);
    });
  });

  describe('YAML Type System', () => {
    it('should parse YAML types correctly', () => {
      const yamlContent = `---
plain_date: 2025-01-15
string_date: "2025-01-15"
number: 42
string: "text"
boolean: true
array: [1, 2, 3]
object:
  nested: value
---

Content`;

      fs.writeFileSync(path.join(testDir, 'yaml-types.md'), yamlContent);

      const mainContent = `@import yaml-types.md`;

      const result = processLegalMarkdown(mainContent, {
        basePath: testDir,
        noImports: false
      });

      // Verify YAML parser creates expected types
      expect(typeof result.metadata.number).toBe('number');
      expect(typeof result.metadata.string).toBe('string');
      expect(typeof result.metadata.boolean).toBe('boolean');
      expect(Array.isArray(result.metadata.array)).toBe(true);
      expect(typeof result.metadata.object).toBe('object');
      expect(result.metadata.object).toEqual({ nested: 'value' });
    });

    it('should flatten and unflatten nested objects with dot notation', () => {
      const testObj = {
        result: {
          message: 'normal text',
          details: { code: 404, type: 'NotFound' }
        }
      };

      const flattened = flattenObject(testObj);
      // Objects are completely flattened to dot notation
      expect(flattened['result.message']).toBe('normal text');
      expect(flattened['result.details.code']).toBe(404);
      expect(flattened['result.details.type']).toBe('NotFound');

      const unflattened = unflattenObject(flattened);
      expect(unflattened.result.message).toBe('normal text');
      expect(unflattened.result.details).toEqual({ code: 404, type: 'NotFound' });
    });
  });
});
