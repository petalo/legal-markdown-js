/**
 * @fileoverview Tests for advanced features of the legal-markdown system
 * 
 * This test suite covers sophisticated functionality including:
 * - Custom header template systems for different document types
 * - Complex numbering format patterns (Roman numerals, alphabetic, mixed)
 * - Multi-level template configurations and hierarchical numbering
 * - Error handling for invalid configurations and edge cases
 * - Integration testing with full document processing pipeline
 */

import { processLegalMarkdown } from "../../../src/index";
import { processHeaders } from "../../../src/core/processors/header-processor";

describe("Advanced Features", () => {
  describe("Template customization support", () => {
    it("should support custom header templates", () => {
      const metadata = {
        "level-one": "Chapter %n:",
        "level-two": "Section %n.%s",
        "level-three": "Subsection (%n)",
        "level-four": "Part %n%c",
        "level-five": "Item %n%c%r",
      };

      const content = `l. First Chapter
ll. First Section
lll. First Subsection
llll. First Part
lllll. First Item
lllll. Second Item
llll. Second Part
l. Second Chapter`;

      const result = processHeaders(content, metadata);

      expect(result).toContain("Chapter 1: First Chapter");
      expect(result).toContain("  Section 1.1 First Section");
      expect(result).toContain("    Subsection (1) First Subsection");
      expect(result).toContain("      Part 1a First Part");
      expect(result).toContain("        Item 1ai First Item");
      expect(result).toContain("        Item 1aii Second Item");
      expect(result).toContain("      Part 1b Second Part");
      expect(result).toContain("Chapter 2: Second Chapter");
    });

    it("should support legal document templates", () => {
      const metadata = {
        "level-one": "Article %n.",
        "level-two": "Section %n.",
        "level-three": "(%n)",
        "level-four": "(%n)(%c)",
        "level-five": "(%n)(%c)(%r)",
      };

      const content = `l. Definitions
ll. General Definitions
lll. Terms
l. Obligations
ll. Buyer Obligations
lll. Payment
llll. Due Date
lllll. Grace Period`;

      const result = processHeaders(content, metadata);

      expect(result).toContain("Article 1. Definitions");
      expect(result).toContain("  Section 1. General Definitions");
      expect(result).toContain("    (1) Terms");
      expect(result).toContain("Article 2. Obligations");
      expect(result).toContain("  Section 1. Buyer Obligations");
      expect(result).toContain("    (1) Payment");
      expect(result).toContain("      (1)(a) Due Date");
      expect(result).toContain("        (1)(a)(i) Grace Period");
    });

    it("should support academic paper templates", () => {
      const metadata = {
        "level-one": "%n.",
        "level-two": "%n.%s",
        "level-three": "%n.%s.%t",
        "level-four": "%n.%s.%t.%f",
        "level-five": "%n.%s.%t.%f.%i",
      };

      const content = `l. Introduction
ll. Background
lll. Previous Work
l. Methodology
ll. Data Collection
lll. Analysis Methods
llll. Statistical Tests`;

      const result = processHeaders(content, metadata);

      expect(result).toContain("1. Introduction");
      expect(result).toContain("  1.1 Background");
      expect(result).toContain("    1.1.1 Previous Work");
      expect(result).toContain("2. Methodology");
      expect(result).toContain("  2.1 Data Collection");
      expect(result).toContain("    2.1.1 Analysis Methods");
      expect(result).toContain("      2.1.1.1 Statistical Tests");
    });
  });

  describe("Custom header formats", () => {
    it("should handle Roman numeral formats", () => {
      const metadata = {
        "level-one": "%r.",
        "level-two": "%r.%n",
        "level-three": "(%n)",
        "level-four": "(%n%c)",
        "level-five": "(%n%c%r)",
      };

      const content = `l. First Main
l. Second Main
l. Third Main
ll. Sub under third
lll. Sub-sub
llll. Deep level
lllll. Deepest level`;

      const result = processHeaders(content, metadata);

      expect(result).toContain("i. First Main");
      expect(result).toContain("ii. Second Main");
      expect(result).toContain("iii. Third Main");
      expect(result).toContain("  iii.1 Sub under third");
      expect(result).toContain("    (1) Sub-sub");
      expect(result).toContain("      (1a) Deep level");
      expect(result).toContain("        (1ai) Deepest level");
    });

    it("should handle alphabetic formats", () => {
      const metadata = {
        "level-one": "%c.",
        "level-two": "%c.%n",
        "level-three": "(%c)",
        "level-four": "(%c%n)",
        "level-five": "(%c%n%r)",
      };

      const content = `l. Alpha
l. Bravo
l. Charlie
ll. Sub Charlie
lll. Sub-sub
llll. Deep
lllll. Deepest`;

      const result = processHeaders(content, metadata);

      expect(result).toContain("a. Alpha");
      expect(result).toContain("b. Bravo");
      expect(result).toContain("c. Charlie");
      expect(result).toContain("  c.1 Sub Charlie");
      expect(result).toContain("    (c) Sub-sub");
      expect(result).toContain("      (c1) Deep");
      expect(result).toContain("        (c1i) Deepest");
    });

    it("should handle mixed custom formats", () => {
      const metadata = {
        "level-one": "Part %r",
        "level-two": "Chapter %n",
        "level-three": "Section %c",
        "level-four": "Subsection %n%c",
        "level-five": "Item %n%c%r",
      };

      const content = `l. Introduction
ll. Overview
lll. Scope
llll. Limitations
lllll. Technical Constraints
l. Main Content
ll. Analysis
lll. Results`;

      const result = processHeaders(content, metadata);

      expect(result).toContain("Part i Introduction");
      expect(result).toContain("  Chapter 1 Overview");
      expect(result).toContain("    Section a Scope");
      expect(result).toContain("      Subsection 1a Limitations");
      expect(result).toContain("        Item 1ai Technical Constraints");
      expect(result).toContain("Part ii Main Content");
      expect(result).toContain("  Chapter 1 Analysis");
      expect(result).toContain("    Section a Results");
    });
  });

  describe("Custom numbering styles", () => {
    it("should support leading zero numbering", () => {
      const metadata = {
        "level-one": "%02n.",
        "level-two": "%02n.%02s",
        "level-three": "(%02n)",
      };

      const content = `l. First
l. Second
l. Third
l. Fourth
l. Fifth
l. Sixth
l. Seventh
l. Eighth
l. Ninth
l. Tenth
l. Eleventh
ll. Sub Eleven
lll. Sub-sub Eleven`;

      const result = processHeaders(content, metadata);

      // Test the implemented leading zero behavior - ensures consistent formatting for document numbering
      expect(result).toContain("01. First");
      expect(result).toContain("11. Eleventh");
      expect(result).toContain("   01.11 Sub Eleven");
      expect(result).toContain("      (01) Sub-sub Eleven");
    });

    it("should handle different bracket styles", () => {
      const metadata = {
        "level-one": "%n)",
        "level-two": "%n.%s)",
        "level-three": "[%n]",
        "level-four": "{%n%c}",
        "level-five": "<%n%c%r>",
      };

      const content = `l. Introduction
ll. Background
lll. Context
llll. Historical
lllll. Ancient Period`;

      const result = processHeaders(content, metadata);

      expect(result).toContain("1) Introduction");
      expect(result).toContain("  1.1) Background");
      expect(result).toContain("    [1] Context");
      expect(result).toContain("      {1a} Historical");
      expect(result).toContain("        <1ai> Ancient Period");
    });

    it("should support outline numbering styles", () => {
      const metadata = {
        "level-one": "%r.",
        "level-two": "%c.",
        "level-three": "%n.",
        "level-four": "%c)",
        "level-five": "(%n)",
      };

      const content = `l. Major Topic One
ll. Subtopic A
lll. Point One
llll. Subpoint A
lllll. Detail One
lllll. Detail Two
llll. Subpoint B
lll. Point Two
ll. Subtopic B
l. Major Topic Two`;

      const result = processHeaders(content, metadata);

      expect(result).toContain("i. Major Topic One");
      expect(result).toContain("  a. Subtopic A");
      expect(result).toContain("    1. Point One");
      expect(result).toContain("      a) Subpoint A");
      expect(result).toContain("        (1) Detail One");
      expect(result).toContain("        (2) Detail Two");
      expect(result).toContain("      b) Subpoint B");
      expect(result).toContain("    2. Point Two");
      expect(result).toContain("  b. Subtopic B");
      expect(result).toContain("ii. Major Topic Two");
    });
  });

  describe("Error handling and validation", () => {
    it("should handle invalid header level gracefully", () => {
      const content = `l. Valid Level 1
ll. Valid Level 2
llllllllll. Invalid Level 10`;

      const result = processHeaders(content, {});

      expect(result).toContain("Article 1. Valid Level 1");
      expect(result).toContain("  Section 1. Valid Level 2");
      // Invalid level should remain unchanged
      expect(result).toContain("l10. Invalid Level 10");
    });

    it("should validate metadata structure", () => {
      const invalidMetadata = {
        "level-one": null,
        "level-two": undefined,
        "level-three": 123,
        "level-four": {},
        "level-five": [],
      };

      const content = `l. Test Level
ll. Another Level
lll. Third Level
llll. Fourth Level
lllll. Fifth Level`;

      const result = processHeaders(content, invalidMetadata);

      // Should fall back to default formats when invalid metadata is provided
      expect(result).toContain("Article 1. Test Level");
      expect(result).toContain("  Section 1. Another Level");
      expect(result).toContain("    (1) Third Level");
    });

    it("should handle complex metadata correctly", () => {
      const metadata = {
        title: "Test Document",
        author: "Test Author",
        "level-one": "Section %n:",
        "level-two": "Subsection %n.%s",
        parties: [
          { name: "Party A", role: "buyer" },
          { name: "Party B", role: "seller" },
        ],
        "level-indent": 2.0,
        custom_field: "custom_value",
      };

      const content = `l. Main Section
ll. First Subsection
ll. Second Subsection
l. Another Main Section`;

      const result = processHeaders(content, metadata);

      expect(result).toContain("Section 1: Main Section");
      expect(result).toContain("    Subsection 1.1 First Subsection");
      expect(result).toContain("    Subsection 2.1 Second Subsection");
      expect(result).toContain("Section 2: Another Main Section");
    });

    /**
     * Integration test combining all major features: YAML front matter, 
     * custom templates, variable substitution, and conditional clauses
     */
    it("should handle processing with all features enabled", () => {
      const content = `---
title: Complete Feature Test
client_name: "Advanced Corp"
include_advanced: true
meta-json-output: "tests/output/advanced-metadata.json"
level-one: "Article %n."
level-two: "Section %n.%s"
level-three: "(%n)"
---

l. Introduction
This document is for |client_name|.

[Advanced features are enabled]{include_advanced}.

ll. Background
lll. Historical Context

l. Terms and Conditions
ll. Payment Terms
[Net 30 payment terms apply]{include_advanced}.`;

      const result = processLegalMarkdown(content, {
        exportMetadata: true,
        exportFormat: "json",
      });

      expect(result.content).toContain("Article 1. Introduction");
      expect(result.content).toContain("This document is for Advanced Corp.");
      expect(result.content).toContain("Advanced features are enabled.");
      expect(result.content).toContain("  Section 1.1 Background");
      expect(result.content).toContain("    (1) Historical Context");
      expect(result.content).toContain("Article 2. Terms and Conditions");
      expect(result.content).toContain("  Section 1.2 Payment Terms");
      expect(result.content).toContain("Net 30 payment terms apply.");

      expect(result.metadata?.title).toBe("Complete Feature Test");
      expect(result.metadata?.client_name).toBe("Advanced Corp");
      expect(result.exportedFiles).toBeDefined();
    });
  });
});
