/**
 * @fileoverview Tests for the header processor and numbering system
 * 
 * This test suite covers the core header processing functionality:
 * - Multi-level header notation (l., ll., lll., etc.) and alternative syntax
 * - Hierarchical numbering with proper sequence management
 * - Custom format templates for different document types
 * - Indentation control and level-specific formatting
 * - Edge cases like skip-level numbering and malformed headers
 */

import { processHeaders } from '../../../src/core/processors/header-processor';

describe('Headers & Numbering', () => {
  describe('Process l. notation for first level headers', () => {
    it('should process first level headers with l. notation', () => {
      const content = `l. First Header
Some content
l. Second Header`;

      const result = processHeaders(content, {});
      
      expect(result).toContain('Article 1. First Header');
      expect(result).toContain('Article 2. Second Header');
    });

    it('should maintain proper numbering sequence', () => {
      const content = `l. Introduction
l. Terms and Definitions
l. Obligations`;

      const result = processHeaders(content, {});
      
      expect(result).toContain('Article 1. Introduction');
      expect(result).toContain('Article 2. Terms and Definitions');
      expect(result).toContain('Article 3. Obligations');
    });
  });

  describe('Process ll. notation for second level headers', () => {
    it('should process second level headers with ll. notation', () => {
      const content = `l. Main Section
ll. Subsection One
ll. Subsection Two`;

      const result = processHeaders(content, {});
      
      expect(result).toContain('Article 1. Main Section');
      expect(result).toContain('  Section 1. Subsection One');
      expect(result).toContain('  Section 2. Subsection Two');
    });

    it('should reset numbering for new first level', () => {
      const content = `l. First Main
ll. First Sub
ll. Second Sub
l. Second Main
ll. Third Sub`;

      const result = processHeaders(content, {});
      
      expect(result).toContain('Article 1. First Main');
      expect(result).toContain('  Section 1. First Sub');
      expect(result).toContain('  Section 2. Second Sub');
      expect(result).toContain('Article 2. Second Main');
      expect(result).toContain('  Section 1. Third Sub');
    });
  });

  describe('Process lll. notation for third level headers', () => {
    it('should process third level headers with lll. notation', () => {
      const content = `l. Main Section
ll. Subsection
lll. Sub-subsection One
lll. Sub-subsection Two`;

      const result = processHeaders(content, {});
      
      expect(result).toContain('Article 1. Main Section');
      expect(result).toContain('  Section 1. Subsection');
      expect(result).toContain('    (1) Sub-subsection One');
      expect(result).toContain('    (2) Sub-subsection Two');
    });

    it('should handle complex nesting with proper numbering', () => {
      const content = `l. Chapter One
ll. Section A
lll. Part 1
lll. Part 2
ll. Section B
lll. Part 3
l. Chapter Two
ll. Section C
lll. Part 4`;

      const result = processHeaders(content, {});
      
      expect(result).toContain('Article 1. Chapter One');
      expect(result).toContain('  Section 1. Section A');
      expect(result).toContain('    (1) Part 1');
      expect(result).toContain('    (2) Part 2');
      expect(result).toContain('  Section 2. Section B');
      expect(result).toContain('    (1) Part 3');
      expect(result).toContain('Article 2. Chapter Two');
      expect(result).toContain('  Section 1. Section C');
      expect(result).toContain('    (1) Part 4');
    });
  });

  describe('Process llll. notation for fourth level headers', () => {
    it('should process fourth level headers with llll. notation', () => {
      const content = `l. Main
ll. Sub
lll. SubSub
llll. SubSubSub One
llll. SubSubSub Two`;

      const result = processHeaders(content, {});
      
      expect(result).toContain('Article 1. Main');
      expect(result).toContain('  Section 1. Sub');
      expect(result).toContain('    (1) SubSub');
      expect(result).toContain('      (1a) SubSubSub One');
      expect(result).toContain('      (1b) SubSubSub Two');
    });
  });

  describe('Process lllll. notation for fifth level headers', () => {
    it('should process fifth level headers with lllll. notation', () => {
      const content = `l. Level 1
ll. Level 2
lll. Level 3
llll. Level 4
lllll. Level 5 One
lllll. Level 5 Two`;

      const result = processHeaders(content, {});
      
      expect(result).toContain('Article 1. Level 1');
      expect(result).toContain('  Section 1. Level 2');
      expect(result).toContain('    (1) Level 3');
      expect(result).toContain('      (1a) Level 4');
      expect(result).toContain('        (1ai) Level 5 One');
      expect(result).toContain('        (1aii) Level 5 Two');
    });
  });

  describe('Support alternative l1., l2., l3. syntax', () => {
    it('should process alternative l1. syntax', () => {
      const content = `l1. First Level
l2. Second Level
l3. Third Level`;

      const result = processHeaders(content, {});
      
      expect(result).toContain('Article 1. First Level');
      expect(result).toContain('  Section 1. Second Level');
      expect(result).toContain('    (1) Third Level');
    });

    it('should handle mixed syntax', () => {
      const content = `l. Traditional First
l2. Alternative Second
ll. Traditional Second
l3. Alternative Third`;

      const result = processHeaders(content, {});
      
      expect(result).toContain('Article 1. Traditional First');
      expect(result).toContain('  Section 1. Alternative Second');
      expect(result).toContain('  Section 2. Traditional Second');
      expect(result).toContain('    (1) Alternative Third');
    });

    it('should support l4. and l5. syntax', () => {
      const content = `l1. Level 1
l2. Level 2
l3. Level 3
l4. Level 4
l5. Level 5`;

      const result = processHeaders(content, {});
      
      expect(result).toContain('Article 1. Level 1');
      expect(result).toContain('  Section 1. Level 2');
      expect(result).toContain('    (1) Level 3');
      expect(result).toContain('      (1a) Level 4');
      expect(result).toContain('        (1ai) Level 5');
    });
  });

  describe('Support level-one format customization', () => {
    it('should use custom level-one format', () => {
      const metadata = {
        'level-one': 'Chapter %n:'
      };
      
      const content = `l. First Chapter
l. Second Chapter`;

      const result = processHeaders(content, metadata);
      
      expect(result).toContain('Chapter 1: First Chapter');
      expect(result).toContain('Chapter 2: Second Chapter');
    });

    it('should handle different level-one formats', () => {
      const metadata = {
        'level-one': '§%n.'
      };
      
      const content = `l. Section One
l. Section Two`;

      const result = processHeaders(content, metadata);
      
      expect(result).toContain('§1. Section One');
      expect(result).toContain('§2. Section Two');
    });
  });

  describe('Support level-two through level-five customization', () => {
    it('should use custom formats for all levels', () => {
      const metadata = {
        'level-one': 'Part %n.',
        'level-two': 'Chapter %n.',
        'level-three': 'Section %n.',
        'level-four': 'Subsection %n%c.',
        'level-five': 'Paragraph %n%c%r.'
      };
      
      const content = `l. Part Title
ll. Chapter Title
lll. Section Title
llll. Subsection Title
lllll. Paragraph Title`;

      const result = processHeaders(content, metadata);
      
      expect(result).toContain('Part 1. Part Title');
      expect(result).toContain('  Chapter 1. Chapter Title');
      expect(result).toContain('    Section 1. Section Title');
      expect(result).toContain('      Subsection 1a. Subsection Title');
      expect(result).toContain('        Paragraph 1ai. Paragraph Title');
    });

    it('should handle missing custom formats gracefully', () => {
      const metadata = {
        'level-one': 'Custom %n.',
        'level-three': 'Special (%n)'
      };
      
      const content = `l. Custom Level
ll. Default Level
lll. Special Level`;

      const result = processHeaders(content, metadata);
      
      expect(result).toContain('Custom 1. Custom Level');
      expect(result).toContain('  Section 1. Default Level');
      expect(result).toContain('    Special (1) Special Level');
    });
  });

  describe('Support level-indent specification', () => {
    it('should use custom indentation', () => {
      const metadata = {
        'level-indent': '3.0'
      };
      
      const content = `l. Level 1
ll. Level 2
lll. Level 3`;

      const result = processHeaders(content, metadata);
      
      expect(result).toContain('Article 1. Level 1');
      expect(result).toContain('      Section 1. Level 2');
      expect(result).toContain('            (1) Level 3');
    });

    it('should handle different indent values', () => {
      const metadata = {
        'level-indent': '1.0'
      };
      
      const content = `l. Level 1
ll. Level 2`;

      const result = processHeaders(content, metadata);
      
      expect(result).toContain('Article 1. Level 1');
      expect(result).toContain('  Section 1. Level 2');
    });
  });

  describe('Generate proper numbering sequences (1., 1.1, 1.1.1)', () => {
    it('should generate proper hierarchical numbering', () => {
      const content = `l. First Major Section
ll. First Subsection
lll. First Sub-subsection
lll. Second Sub-subsection
ll. Second Subsection
lll. Third Sub-subsection
l. Second Major Section
ll. Third Subsection`;

      const result = processHeaders(content, {});
      
      expect(result).toContain('Article 1. First Major Section');
      expect(result).toContain('  Section 1. First Subsection');
      expect(result).toContain('    (1) First Sub-subsection');
      expect(result).toContain('    (2) Second Sub-subsection');
      expect(result).toContain('  Section 2. Second Subsection');
      expect(result).toContain('    (1) Third Sub-subsection');
      expect(result).toContain('Article 2. Second Major Section');
      expect(result).toContain('  Section 1. Third Subsection');
    });

    it('should handle complex numbering with all levels', () => {
      const content = `l. Article 1
ll. Section A
lll. Part I
llll. Subpart a
lllll. Item i
lllll. Item ii
llll. Subpart b
lll. Part II
ll. Section B
l. Article 2`;

      const result = processHeaders(content, {});
      
      expect(result).toContain('Article 1. Article 1');
      expect(result).toContain('  Section 1. Section A');
      expect(result).toContain('    (1) Part I');
      expect(result).toContain('      (1a) Subpart a');
      expect(result).toContain('        (1ai) Item i');
      expect(result).toContain('        (1aii) Item ii');
      expect(result).toContain('      (1b) Subpart b');
      expect(result).toContain('    (2) Part II');
      expect(result).toContain('  Section 2. Section B');
      expect(result).toContain('Article 2. Article 2');
    });

    it('should handle skip-level numbering correctly', () => {
      const content = `l. Level 1
lll. Level 3 (skipped 2)
l. Level 1 again
ll. Level 2
llll. Level 4 (skipped 3)`;

      const result = processHeaders(content, {});
      
      expect(result).toContain('Article 1. Level 1');
      expect(result).toContain('    (1) Level 3 (skipped 2)');
      expect(result).toContain('Article 2. Level 1 again');
      expect(result).toContain('  Section 1. Level 2');
      expect(result).toContain('      (1a) Level 4 (skipped 3)');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle empty content', () => {
      const result = processHeaders('', {});
      expect(result).toBe('');
    });

    it('should handle content without headers', () => {
      const content = `This is regular content
without any headers
at all.`;

      const result = processHeaders(content, {});
      expect(result).toBe(content);
    });

    it('should handle malformed headers gracefully', () => {
      const content = `l. Valid header
l Invalid header without dot
ll. Another valid header`;

      const result = processHeaders(content, {});
      
      expect(result).toContain('Article 1. Valid header');
      expect(result).toContain('l Invalid header without dot');
      expect(result).toContain('  Section 1. Another valid header');
    });

    it('should handle headers with special characters', () => {
      const content = `l. Header with "quotes" and symbols!
ll. Header with numbers 123 and $%^
lll. Header with unicode: åáâãäåæçèéêë`;

      const result = processHeaders(content, {});
      
      expect(result).toContain('Article 1. Header with "quotes" and symbols!');
      expect(result).toContain('  Section 1. Header with numbers 123 and $%^');
      expect(result).toContain('    (1) Header with unicode: åáâãäåæçèéêë');
    });
  });
});