import { FallbackParsers } from '../../../src/parsers/fallback-parsers';

describe('FallbackParsers', () => {
  describe('convertRstBasic', () => {
    it('should convert RST headers to markdown headers', () => {
      const rst = 'Main Title\n==========\n\nSubtitle\n--------\n\nSub-subtitle\n~~~~~~~~~~~~';
      const result = FallbackParsers.convertRstBasic(rst);
      expect(result).toContain('# Main Title');
      expect(result).toContain('## Subtitle');
      expect(result).toContain('### Sub-subtitle');
    });

    it('should convert RST emphasis to markdown emphasis', () => {
      const rst = 'This is **bold** text.\nThis is *italic* text.';
      const result = FallbackParsers.convertRstBasic(rst);
      expect(result).toContain('**bold**');
      expect(result).toContain('*italic*');
    });

    it('should convert RST inline code', () => {
      const rst = 'Use the ``print()`` function.';
      const result = FallbackParsers.convertRstBasic(rst);
      expect(result).toContain('`print()`');
    });

    it('should convert RST links', () => {
      const rst = 'Visit `Example <https://example.com>`_ for more info.';
      const result = FallbackParsers.convertRstBasic(rst);
      expect(result).toContain('[Example](https://example.com)');
    });

    it('should convert RST bullet lists', () => {
      const rst = '* First item\n* Second item';
      const result = FallbackParsers.convertRstBasic(rst);
      expect(result).toContain('- First item');
      expect(result).toContain('- Second item');
    });

    it('should preserve numbered lists', () => {
      const rst = '1. First item\n2. Second item';
      const result = FallbackParsers.convertRstBasic(rst);
      expect(result).toContain('1. First item');
      expect(result).toContain('2. Second item');
    });

    it('should remove directives', () => {
      const rst = '.. note::\n   This is a note.\n\nRegular content here.';
      const result = FallbackParsers.convertRstBasic(rst);
      expect(result).not.toContain('.. note::');
      expect(result).toContain('Regular content here.');
    });
  });

  describe('convertLatexBasic', () => {
    it('should convert LaTeX sections to markdown headers', () => {
      const latex = '\\section{Introduction}\n\\subsection{Overview}\n\\subsubsection{Details}';
      const result = FallbackParsers.convertLatexBasic(latex);
      expect(result).toContain('# Introduction');
      expect(result).toContain('## Overview');
      expect(result).toContain('### Details');
    });

    it('should convert LaTeX emphasis to markdown emphasis', () => {
      const latex = 'This is \\textbf{bold} text.\nThis is \\textit{italic} text.\nThis is \\emph{emphasized} text.';
      const result = FallbackParsers.convertLatexBasic(latex);
      expect(result).toContain('**bold**');
      expect(result).toContain('*italic*');
      expect(result).toContain('*emphasized*');
    });

    it('should convert LaTeX inline code', () => {
      const latex = 'Use the \\texttt{print()} function.';
      const result = FallbackParsers.convertLatexBasic(latex);
      expect(result).toContain('`print()`');
    });

    it('should convert LaTeX links', () => {
      const latex = 'Visit \\href{https://example.com}{Example} for more info.\nGo to \\url{https://example.com} directly.';
      const result = FallbackParsers.convertLatexBasic(latex);
      expect(result).toContain('[Example](https://example.com)');
      expect(result).toContain('<https://example.com>');
    });

    it('should convert LaTeX quotes', () => {
      const latex = 'This is ``quoted text\'\'.';
      const result = FallbackParsers.convertLatexBasic(latex);
      expect(result).toContain('"quoted text"');
    });

    it('should remove LaTeX document structure', () => {
      const latex = '\\documentclass{article}\n\\begin{document}\nContent here.\n\\end{document}';
      const result = FallbackParsers.convertLatexBasic(latex);
      expect(result).not.toContain('\\documentclass');
      expect(result).not.toContain('\\begin{document}');
      expect(result).not.toContain('\\end{document}');
      expect(result).toContain('Content here.');
    });

    it('should handle list environments', () => {
      const latex = '\\begin{itemize}\n\\item First item\n\\item Second item\n\\end{itemize}';
      const result = FallbackParsers.convertLatexBasic(latex);
      expect(result).toContain('- First item');
      expect(result).toContain('- Second item');
    });

    it('should remove common LaTeX commands', () => {
      const latex = '\\maketitle\n\\tableofcontents\n\\newpage\nContent here.';
      const result = FallbackParsers.convertLatexBasic(latex);
      expect(result).not.toContain('\\maketitle');
      expect(result).not.toContain('\\tableofcontents');
      expect(result).not.toContain('\\newpage');
      expect(result).toContain('Content here.');
    });
  });
});