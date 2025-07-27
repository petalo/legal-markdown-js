import { ContentDetector } from '../../../../src/extensions/parsers/content-detector';

describe('ContentDetector', () => {
  describe('needsRstParser', () => {
    it('should detect RST content with header underlines', () => {
      const rst = `
Title
=====

This is a paragraph.

Subtitle
--------

Another paragraph.
      `;
      expect(ContentDetector.needsRstParser(rst)).toBe(true);
    });

    it('should detect RST content with directives', () => {
      const rst = `
.. note::
   This is a note.

.. warning::
   This is a warning.
      `;
      expect(ContentDetector.needsRstParser(rst)).toBe(true);
    });

    it('should detect RST content with code blocks', () => {
      const rst = `
Here is some code::

    def hello():
        print("Hello, world!")
      `;
      expect(ContentDetector.needsRstParser(rst)).toBe(true);
    });

    it('should not detect regular markdown as RST', () => {
      const markdown = `
# Title

This is a paragraph.

## Subtitle

Another paragraph.
      `;
      expect(ContentDetector.needsRstParser(markdown)).toBe(false);
    });

    it('should not detect YAML frontmatter as RST', () => {
      const yamlFrontmatter = `---
title: Test Document
author: Test Author
---

# Title

Content here.
      `;
      expect(ContentDetector.needsRstParser(yamlFrontmatter)).toBe(false);
    });

    it('should require at least 2 patterns for RST detection', () => {
      const singlePattern = `
* First item
      `;
      expect(ContentDetector.needsRstParser(singlePattern)).toBe(false);
    });
  });

  describe('needsLatexParser', () => {
    it('should detect LaTeX content with document structure', () => {
      const latex = `
\\documentclass{article}
\\begin{document}
\\section{Introduction}
This is an introduction.
\\end{document}
      `;
      expect(ContentDetector.needsLatexParser(latex)).toBe(true);
    });

    it('should detect LaTeX content with commands', () => {
      const latex = `
\\section{Title}
This is \\textbf{bold} text.
\\subsection{Subtitle}
This is \\textit{italic} text.
      `;
      expect(ContentDetector.needsLatexParser(latex)).toBe(true);
    });

    it('should detect LaTeX content with environments', () => {
      const latex = `
\\begin{itemize}
\\item First item
\\item Second item
\\end{itemize}
      `;
      expect(ContentDetector.needsLatexParser(latex)).toBe(true);
    });

    it('should not detect regular markdown as LaTeX', () => {
      const markdown = `
# Title

This is a paragraph.

## Subtitle

Another paragraph.
      `;
      expect(ContentDetector.needsLatexParser(markdown)).toBe(false);
    });

    it('should not detect YAML frontmatter as LaTeX', () => {
      const yamlFrontmatter = `---
title: Test Document
author: Test Author
---

# Title

Content here.
      `;
      expect(ContentDetector.needsLatexParser(yamlFrontmatter)).toBe(false);
    });

    it('should require at least 2 patterns for LaTeX detection', () => {
      const singlePattern = `
Some text with \\unknowncommand{arg} here.
      `;
      expect(ContentDetector.needsLatexParser(singlePattern)).toBe(false);
    });
  });

  describe('needsPandoc', () => {
    it('should return true for RST content', () => {
      const rst = `
Title
=====

.. note::
   This is a note.
      `;
      expect(ContentDetector.needsPandoc(rst)).toBe(true);
    });

    it('should return true for LaTeX content', () => {
      const latex = `
\\documentclass{article}
\\begin{document}
\\section{Introduction}
      `;
      expect(ContentDetector.needsPandoc(latex)).toBe(true);
    });

    it('should return false for regular markdown', () => {
      const markdown = `
# Title

This is a paragraph.
      `;
      expect(ContentDetector.needsPandoc(markdown)).toBe(false);
    });

    it('should return false for empty content', () => {
      expect(ContentDetector.needsPandoc('')).toBe(false);
    });
  });
});