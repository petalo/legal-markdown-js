/**
 * @fileoverview Tests for LaTeX parser functionality
 * 
 * Tests the LaTeX parser which converts LaTeX documents to legal markdown:
 * - Document structure parsing (sections, subsections, document metadata)
 * - Text formatting conversion (bold, italic, emphasis, monospace)
 * - List conversion (itemize, enumerate, description lists)
 * - Link and reference conversion (href, url, cite, ref, label)
 * - Code block conversion (verbatim, lstlisting, minted)
 * - Quote and footnote conversion
 * - LaTeX command cleanup and comment removal
 */

import { 
  parseLatex, 
  isLatex, 
  convertLatexToLegalMarkdown 
} from '../../../src/extensions/latex-parser';

describe('LaTeX Parser', () => {
  describe('parseLatex', () => {
    it('should convert LaTeX sections to legal markdown headers', async () => {
      const latex = `\\section{Introduction}
Content here.

\\subsection{Background}
More content.

\\subsubsection{Details}
Detailed content.`;

      const result = await parseLatex(latex);
      
      expect(result).toContain('# Introduction');
      expect(result).toContain('## Background');
      expect(result).toContain('### Details');
    });

    it('should handle document structure and metadata', async () => {
      const latex = `\\documentclass{article}
\\usepackage{hyperref}
\\title{Legal Document}
\\author{John Doe}
\\date{2024-01-01}
\\begin{document}
\\maketitle
Content here.
\\end{document}`;

      // Use fallback parser directly to ensure consistent behavior
      const { FallbackParsers } = await import('../../../src/extensions/parsers/fallback-parsers');
      const result = FallbackParsers.convertLatexBasic(latex);
      
      expect(result).toContain('---');
      expect(result).toContain('title: "Legal Document"');
      expect(result).toContain('author: "John Doe"');
      expect(result).toContain('date: "2024-01-01"');
      expect(result).toContain('Content here.');
      expect(result).not.toContain('\\documentclass');
      expect(result).not.toContain('\\begin{document}');
    });

    it('should convert LaTeX lists', async () => {
      const latex = `\\begin{itemize}
\\item First item
\\item Second item
\\item Third item
\\end{itemize}

\\begin{enumerate}
\\item First numbered
\\item Second numbered
\\end{enumerate}

\\begin{description}
\\item[Term 1] Description of term 1
\\item[Term 2] Description of term 2
\\end{description}`;

      const result = await parseLatex(latex);
      
      expect(result).toContain('- First item');
      expect(result).toContain('- Second item');
      expect(result).toContain('- Third item');
      expect(result).toContain('1. First numbered');
      expect(result).toContain('2. Second numbered');
      expect(result).toContain('**Term 1**');
      expect(result).toContain('Description of term 1');
      expect(result).toContain('**Term 2**');
      expect(result).toContain('Description of term 2');
    });

    it('should convert LaTeX emphasis', async () => {
      const latex = `This is \\textbf{bold} text.
This is \\textit{italic} text.
This is \\emph{emphasized} text.
This is \\texttt{monospace} text.
This is \\underline{underlined} text.
This is \\verb|inline code|.`;

      const result = await parseLatex(latex);
      
      expect(result).toContain('**bold**');
      expect(result).toContain('*italic*');
      expect(result).toContain('*emphasized*');
      expect(result).toContain('`monospace`');
      expect(result).toContain('__underlined__');
      expect(result).toContain('`inline code`');
    });

    it('should convert LaTeX links', async () => {
      const latex = `Visit \\href{https://example.com}{our website} for more info.
See \\url{https://example.com} for details.
As shown in \\cite{source2024}.
See section \\ref{intro} for introduction.
\\label{intro}`;

      const result = await parseLatex(latex);
      
      expect(result).toContain('[our website](https://example.com)');
      expect(result).toContain('<https://example.com>');
      expect(result).toContain('[source2024]');
      expect(result).toContain('[intro]');
      expect(result).toContain('<a name="intro"></a>');
    });

    it('should convert LaTeX code blocks', async () => {
      const latex = `\\begin{verbatim}
def hello():
    print("Hello, World!")
\\end{verbatim}

\\begin{lstlisting}[language=python]
def goodbye():
    print("Goodbye!")
\\end{lstlisting}

\\begin{minted}{python}
def test():
    return True
\\end{minted}`;

      const result = await parseLatex(latex);
      
      expect(result).toContain('```');
      expect(result).toContain('def hello():');
      expect(result).toContain('def goodbye():');
      expect(result).toContain('def test():');
    });

    it('should convert LaTeX quotes', async () => {
      const latex = `\\begin{quote}
This is a quoted text.
It can span multiple lines.
\\end{quote}

He said \`\`Hello'' to me.
She said \\\`Hi' back.`;

      const result = await parseLatex(latex);
      
      expect(result).toContain('> This is a quoted text.');
      expect(result).toContain('> It can span multiple lines.');
      expect(result).toContain('He said "Hello" to me.');
      expect(result).toContain('She said \'Hi\' back.');
    });

    it('should convert LaTeX footnotes', async () => {
      const latex = `This is some text\\footnote{First footnote} with a footnote.
Here is another\\footnote{Second footnote} one.`;

      const result = await parseLatex(latex);
      
      // LaTeX footnotes are converted to markdown footnote syntax
      expect(result).toContain('This is some text[^1] with a footnote.');
      expect(result).toContain('Here is another[^2] one.');
      expect(result).toContain('[^1]: First footnote');
      expect(result).toContain('[^2]: Second footnote');
    });

    it('should handle starred sections', async () => {
      const latex = `\\section*{Unnumbered Section}
\\subsection*{Unnumbered Subsection}`;

      const result = await parseLatex(latex);
      
      expect(result).toContain('# Unnumbered Section');
      expect(result).toContain('## Unnumbered Subsection');
    });

    it('should clean up LaTeX commands', async () => {
      const latex = `\\newpage
Some content here.\\\\
More content.
\\bigskip
Final content.`;

      const result = await parseLatex(latex);
      
      expect(result).not.toContain('\\newpage');
      expect(result).not.toContain('\\\\');
      expect(result).not.toContain('\\bigskip');
      expect(result).toContain('Some content here.');
      expect(result).toContain('More content.');
      expect(result).toContain('Final content.');
    });

    it('should handle LaTeX comments', async () => {
      const latex = `This is visible text.
% This is a comment
This is also visible.
More text % with inline comment`;

      const result = await parseLatex(latex);
      
      expect(result).toContain('This is visible text.');
      expect(result).toContain('This is also visible.');
      expect(result).toContain('More text');
      expect(result).not.toContain('% This is a comment');
      expect(result).not.toContain('with inline comment');
    });

    it('should handle complex LaTeX document', async () => {
      // Tests comprehensive LaTeX document conversion with multiple elements
      const latex = `\\documentclass[12pt]{article}
\\usepackage{hyperref}
\\title{Legal Agreement}
\\author{Law Firm LLC}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Parties}
This agreement is between \\textbf{Company A} and \\textbf{Company B}.

\\subsection{Definitions}
\\begin{itemize}
\\item \\textit{Agreement}: This legal document
\\item \\textit{Parties}: The entities bound by this agreement
\\end{itemize}

\\section{Terms and Conditions}
The parties agree to the following\\footnote{Subject to applicable law}:

\\begin{enumerate}
\\item First term
\\item Second term
\\end{enumerate}

\\section{Signatures}
\\begin{verbatim}
_____________________
Company A

_____________________
Company B
\\end{verbatim}

\\end{document}`;

      const result = await parseLatex(latex);
      
      expect(result).toContain('title: "Legal Agreement"');
      expect(result).toContain('# Parties');
      expect(result).toContain('**Company A**');
      expect(result).toContain('**Company B**');
      expect(result).toContain('## Definitions');
      expect(result).toContain('- *Agreement*: This legal document');
      expect(result).toContain('# Terms and Conditions');
      expect(result).toContain('[^1]');
      expect(result).toContain('1. First term');
      expect(result).toContain('# Signatures');
      expect(result).toContain('```');
      expect(result).toContain('Company A');
    });

    it('should handle empty content', async () => {
      const result = await parseLatex('');
      expect(result).toBe('');
    });

    it('should handle content without LaTeX syntax', async () => {
      const content = 'This is plain text without any LaTeX syntax.';
      const result = await parseLatex(content);
      expect(result).toBe(content);
    });
  });

  describe('isLatex', () => {
    it('should detect LaTeX documents', async () => {
      expect(isLatex('\\documentclass{article}')).toBe(true);
      expect(isLatex('\\begin{document}')).toBe(true);
      expect(isLatex('\\section{Title}')).toBe(true);
      expect(isLatex('\\usepackage{hyperref}')).toBe(true);
    });

    it('should detect LaTeX commands', async () => {
      expect(isLatex('\\textbf{bold}')).toBe(true);
      expect(isLatex('\\emph{text}')).toBe(true);
      expect(isLatex('\\item First')).toBe(true);
      expect(isLatex('\\cite{ref}')).toBe(true);
      expect(isLatex('\\ref{label}')).toBe(true);
      expect(isLatex('\\label{sec:intro}')).toBe(true);
    });

    it('should not detect plain text', async () => {
      expect(isLatex('This is plain text')).toBe(false);
      expect(isLatex('# Markdown header')).toBe(false);
      expect(isLatex('- Markdown list')).toBe(false);
    });

    it('should handle empty content', async () => {
      expect(isLatex('')).toBe(false);
    });
  });

  describe('convertLatexToLegalMarkdown', () => {
    it('should convert LaTeX content to legal markdown', async () => {
      const latex = `\\documentclass{article}
\\begin{document}
\\section{Title}
Content here.
\\end{document}`;

      const result = await convertLatexToLegalMarkdown(latex);
      
      expect(result).toContain('# Title');
      expect(result).toContain('Content here.');
      expect(result).not.toContain('\\documentclass');
      expect(result).not.toContain('\\begin{document}');
    });

    it('should return unchanged content if not LaTeX', async () => {
      const markdown = `# Title

This is markdown content.`;

      const result = await convertLatexToLegalMarkdown(markdown);
      
      expect(result).toBe(markdown);
    });

    it('should handle mixed content', async () => {
      const mixed = `\\section{Legal Section}

This has some \\textbf{LaTeX} mixed with regular text.`;

      const result = await convertLatexToLegalMarkdown(mixed);
      
      expect(result).toContain('# Legal Section');
      expect(result).toContain('**LaTeX**');
    });
  });
});