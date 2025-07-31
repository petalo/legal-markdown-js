/**
 * Tests for custom frontmatter formats in cross-references plugin
 *
 * These tests validate that the remark-based cross-reference processor
 * correctly handles user-defined custom formats that go beyond simple
 * %n, %c, %r, %R patterns. This is critical because users can define
 * completely arbitrary formats and the system cannot rely on hardcoded
 * regex patterns.
 *
 * @module
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkCrossReferences from '@plugins/remark/cross-references';
import { parseYamlFrontMatter } from '@core/parsers/yaml-parser';

describe('Custom Frontmatter Formats', () => {
  describe('Simple Custom Formats', () => {
    it('should handle custom prefix/suffix formats', async () => {
      const content = `---
level1: "CONTRATO"
level2: "Art. %n -"
level3: "Sección %n -"
---

# Payment Terms |payment|

Payment is due within 30 days.

## Interest Calculation |interest|

Interest rates apply.

### Late Payment |late|

Late fees apply.

# References

See |payment|, specifically |interest| and |late|.
`;

      // Parse frontmatter first
      const { content: contentWithoutYaml, metadata: yamlMetadata } = parseYamlFrontMatter(content);
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkCrossReferences, { metadata: yamlMetadata })
        .use(remarkStringify);

      const result = await processor.process(contentWithoutYaml);
      const processedContent = String(result);

      // Check that cross-references were extracted
      expect(yamlMetadata['_cross_references']).toBeDefined();
      expect(yamlMetadata['_cross_references']).toHaveLength(3);
      
      // Check section numbers match custom formats
      const paymentRef = yamlMetadata['_cross_references'].find((ref: any) => ref.key === 'payment');
      const interestRef = yamlMetadata['_cross_references'].find((ref: any) => ref.key === 'interest');
      const lateRef = yamlMetadata['_cross_references'].find((ref: any) => ref.key === 'late');
      
      expect(paymentRef.sectionNumber).toBe('CONTRATO');
      expect(interestRef.sectionNumber).toBe('Art. 1 -');
      expect(lateRef.sectionNumber).toBe('Sección 1 -');
      
      // Check content contains resolved references
      expect(processedContent).toContain('See CONTRATO');
      expect(processedContent).toContain('specifically Art. 1 -');
      expect(processedContent).toContain('and Sección 1 -');
    });

    it('should handle Roman numeral custom formats', async () => {
      const content = `---
level1: "Capítulo %R"
level2: "Artículo %n.%r"
level6: "Anexo %R -"
---

# Introduction |intro|
# Payment |payment|
# Final Terms |final|

###### Appendix A |appendix|

See |intro|, |payment|, |final|, and |appendix|.
`;

      // Parse frontmatter first
      const { content: contentWithoutYaml, metadata: yamlMetadata } = parseYamlFrontMatter(content);
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkCrossReferences, { metadata: yamlMetadata })
        .use(remarkStringify);

      await processor.process(contentWithoutYaml);

      // Check Roman numeral formatting
      const refs = yamlMetadata['_cross_references'];
      const introRef = refs.find((ref: any) => ref.key === 'intro');
      const paymentRef = refs.find((ref: any) => ref.key === 'payment');
      const finalRef = refs.find((ref: any) => ref.key === 'final');
      const appendixRef = refs.find((ref: any) => ref.key === 'appendix');
      
      expect(introRef.sectionNumber).toBe('Capítulo I');
      expect(paymentRef.sectionNumber).toBe('Capítulo II');
      expect(finalRef.sectionNumber).toBe('Capítulo III');
      expect(appendixRef.sectionNumber).toBe('Anexo I -');
    });
  });

  describe('Hierarchical Academic Formats', () => {
    it('should handle academic hierarchical formats with %s, %t, %f, %i', async () => {
      const content = `---
level1: "Chapter %n."
level2: "Section %n.%s"
level3: "Subsection %n.%s.%t"
level4: "Paragraph %n.%s.%t.%f"
level5: "Subparagraph %n.%s.%t.%f.%i"
---

# Introduction |intro|

## Data Processing |data|

### Personal Information |personal|

#### Storage Requirements |storage|

##### Backup Procedures |backup|

See |intro|, then |data|, specifically |personal|, including |storage| and |backup|.
`;

      // Parse frontmatter first
      const { content: contentWithoutYaml, metadata: yamlMetadata } = parseYamlFrontMatter(content);
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkCrossReferences, { metadata: yamlMetadata })
        .use(remarkStringify);

      await processor.process(contentWithoutYaml);

      // Check hierarchical numbering
      const refs = yamlMetadata['_cross_references'];
      const introRef = refs.find((ref: any) => ref.key === 'intro');
      const dataRef = refs.find((ref: any) => ref.key === 'data');
      const personalRef = refs.find((ref: any) => ref.key === 'personal');
      const storageRef = refs.find((ref: any) => ref.key === 'storage');
      const backupRef = refs.find((ref: any) => ref.key === 'backup');
      
      expect(introRef.sectionNumber).toBe('Chapter 1.');
      expect(dataRef.sectionNumber).toBe('Section 1.1');
      expect(personalRef.sectionNumber).toBe('Subsection 1.1.1');
      expect(storageRef.sectionNumber).toBe('Paragraph 1.1.1.1');
      expect(backupRef.sectionNumber).toBe('Subparagraph 1.1.1.1.1');
    });

    it('should handle mixed academic and simple formats', async () => {
      const content = `---
level1: "Part %R"
level2: "Section %n.%s"  
level3: "(%c)"
level4: "(%n%c)"
---

# General Provisions |general|

## Definitions |definitions|

### Important Terms |terms|

#### Legal Framework |framework|

References: |general|, |definitions|, |terms|, |framework|.
`;

      // Parse frontmatter first
      const { content: contentWithoutYaml, metadata: yamlMetadata } = parseYamlFrontMatter(content);
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkCrossReferences, { metadata: yamlMetadata })
        .use(remarkStringify);

      await processor.process(contentWithoutYaml);

      // Check mixed format handling
      const refs = yamlMetadata['_cross_references'];
      const generalRef = refs.find((ref: any) => ref.key === 'general');
      const definitionsRef = refs.find((ref: any) => ref.key === 'definitions');
      const termsRef = refs.find((ref: any) => ref.key === 'terms');
      const frameworkRef = refs.find((ref: any) => ref.key === 'framework');
      
      expect(generalRef.sectionNumber).toBe('Part I');
      expect(definitionsRef.sectionNumber).toBe('Section 1.1');
      expect(termsRef.sectionNumber).toBe('(a)');
      expect(frameworkRef.sectionNumber).toBe('(1a)');
    });
  });

  describe('Complex Custom Formats', () => {
    it('should handle completely arbitrary custom formats', async () => {
      const content = `---
level1: "TÍTULO %R: "
level2: "Artículo %n°.-"
level3: "Literal %c)"
level4: "Numeral %n%c."
level5: "Inciso %r-"
level6: "§ %n"
---

# Contract Basics |basics|
## Payment Terms |payment|
### Currency |currency|
#### Exchange Rate |rate|
##### Daily Updates |updates|
###### Final Notes |notes|

References: |basics|, |payment|, |currency|, |rate|, |updates|, |notes|.
`;

      // Parse frontmatter first
      const { content: contentWithoutYaml, metadata: yamlMetadata } = parseYamlFrontMatter(content);
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkCrossReferences, { metadata: yamlMetadata })
        .use(remarkStringify);

      await processor.process(contentWithoutYaml);

      // Check arbitrary format handling
      const refs = yamlMetadata['_cross_references'];
      const basicsRef = refs.find((ref: any) => ref.key === 'basics');
      const paymentRef = refs.find((ref: any) => ref.key === 'payment');
      const currencyRef = refs.find((ref: any) => ref.key === 'currency');
      const rateRef = refs.find((ref: any) => ref.key === 'rate');
      const updatesRef = refs.find((ref: any) => ref.key === 'updates');
      const notesRef = refs.find((ref: any) => ref.key === 'notes');
      
      expect(basicsRef.sectionNumber).toBe('TÍTULO I: ');
      expect(paymentRef.sectionNumber).toBe('Artículo 1°.-');
      expect(currencyRef.sectionNumber).toBe('Literal a)');
      expect(rateRef.sectionNumber).toBe('Numeral 1a.');
      expect(updatesRef.sectionNumber).toBe('Inciso i-');
      expect(notesRef.sectionNumber).toBe('§ 1');
    });

    it('should handle formats with special characters and Unicode', async () => {
      const content = `---
level1: "§§ %n 🔸"
level2: "⚡ %c ⚡"
level3: "→ %r ←"
level4: "【%n】"
level5: "❯ %c"
---

# Security |security|
## Encryption |encryption|
### Algorithms |algorithms|
#### Implementation |implementation|
##### Testing |testing|

Check |security|, |encryption|, |algorithms|, |implementation|, |testing|.
`;

      // Parse frontmatter first
      const { content: contentWithoutYaml, metadata: yamlMetadata } = parseYamlFrontMatter(content);
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkCrossReferences, { metadata: yamlMetadata })
        .use(remarkStringify);

      await processor.process(contentWithoutYaml);

      // Check Unicode and special character handling
      const refs = yamlMetadata['_cross_references'];
      expect(refs.find((ref: any) => ref.key === 'security').sectionNumber).toBe('§§ 1 🔸');
      expect(refs.find((ref: any) => ref.key === 'encryption').sectionNumber).toBe('⚡ a ⚡');
      expect(refs.find((ref: any) => ref.key === 'algorithms').sectionNumber).toBe('→ i ←');
      expect(refs.find((ref: any) => ref.key === 'implementation').sectionNumber).toBe('【1】');
      expect(refs.find((ref: any) => ref.key === 'testing').sectionNumber).toBe('❯ a');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing level formats gracefully', async () => {
      const content = `---
level1: "Chapter %n"
# level2 is missing - should use default
level3: "(%c)"
---

# Introduction |intro|
## Payment |payment|
### Details |details|

See |intro|, |payment|, |details|.
`;

      // Parse frontmatter first
      const { content: contentWithoutYaml, metadata: yamlMetadata } = parseYamlFrontMatter(content);
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkCrossReferences, { metadata: yamlMetadata })
        .use(remarkStringify);

      await processor.process(contentWithoutYaml);

      // Should use defaults for missing levels
      const refs = yamlMetadata['_cross_references'];
      expect(refs.find((ref: any) => ref.key === 'intro').sectionNumber).toBe('Chapter 1');
      expect(refs.find((ref: any) => ref.key === 'payment').sectionNumber).toMatch(/Article|Section/); // Default format
      expect(refs.find((ref: any) => ref.key === 'details').sectionNumber).toBe('(a)');
    });

    it('should handle malformed format strings', async () => {
      const content = `---
level1: "Chapter %n %unknown %missing"
level2: "Section %"
level3: "%%n"
---

# Introduction |intro|
## Payment |payment|
### Details |details|

See |intro|, |payment|, |details|.
`;

      // Parse frontmatter first
      const { content: contentWithoutYaml, metadata: yamlMetadata } = parseYamlFrontMatter(content);
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkCrossReferences, { metadata: yamlMetadata })
        .use(remarkStringify);

      await processor.process(contentWithoutYaml);

      // Should handle malformed formats gracefully
      const refs = yamlMetadata['_cross_references'];
      expect(refs).toHaveLength(3);
      
      // Unknown tokens should remain unchanged
      expect(refs.find((ref: any) => ref.key === 'intro').sectionNumber).toBe('Chapter 1 %unknown %missing');
      expect(refs.find((ref: any) => ref.key === 'payment').sectionNumber).toBe('Section %');
      expect(refs.find((ref: any) => ref.key === 'details').sectionNumber).toBe('%1');
    });
  });
});