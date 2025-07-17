/**
 * Fallback parsers for basic RST and LaTeX conversion when pandoc is not available
 */
export class FallbackParsers {
  /**
   * Basic RST to Markdown conversion
   */
  static convertRstBasic(content: string): string {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('Using basic RST parser - some features may not work correctly');
    }

    let result = content;

    // Convert headers with underlines to markdown headers
    result = result.replace(/^(.+)\n([=]{3,})\s*$/gm, '# $1');
    result = result.replace(/^(.+)\n([-]{3,})\s*$/gm, '## $1');
    result = result.replace(/^(.+)\n([~]{3,})\s*$/gm, '### $1');
    result = result.replace(/^(.+)\n([\^]{3,})\s*$/gm, '#### $1');
    result = result.replace(/^(.+)\n(["]{3,})\s*$/gm, '##### $1');
    result = result.replace(/^(.+)\n([']{3,})\s*$/gm, '###### $1');

    // Convert overlined and underlined headers
    result = result.replace(/^([=]{3,})\n(.+)\n([=]{3,})\s*$/gm, '# $2');
    result = result.replace(/^([-]{3,})\n(.+)\n([-]{3,})\s*$/gm, '## $2');

    // Convert emphasis
    result = result.replace(/\*\*([^*]+)\*\*/g, '**$1**'); // Bold (already markdown)
    result = result.replace(/\*([^*]+)\*/g, '*$1*'); // Italic (already markdown)

    // Convert RST roles
    result = result.replace(/:emphasis:`([^`]+)`/g, '*$1*');
    result = result.replace(/:strong:`([^`]+)`/g, '**$1**');
    result = result.replace(/:literal:`([^`]+)`/g, '`$1`');

    // Convert inline code
    result = result.replace(/``([^`]+)``/g, '`$1`');

    // Convert links
    result = result.replace(/`([^<]+?)\s*<([^>]+?)>`_/g, '[$1]($2)');
    result = result.replace(/`([^`]+)`_/g, '[$1][$1]'); // Reference links

    // Convert bullet lists (RST uses * or -)
    result = result.replace(/^(\s*)\* (.+)/gm, '$1- $2');

    // Convert numbered lists
    result = result.replace(/^(\s*)(\d+)\. (.+)/gm, '$1$2. $3');
    result = result.replace(/^(\s*)(\d+)\) (.+)/gm, '$1$2. $3'); // Parentheses style

    // Convert code blocks FIRST - handle :: at end of line
    result = result.replace(/^(.+)::\s*$/gm, (match, prefix) => {
      return prefix + '\n\n```';
    });
    result = result.replace(/^::\s*$/gm, '```');

    // Check if we have unmatched code blocks and add closing markers
    const codeBlockCount = (result.match(/```/g) || []).length;
    if (codeBlockCount % 2 === 1) {
      result += '\n```';
    }

    // Convert definition lists (but not if they're inside code blocks)
    result = result.replace(/^([^\n]+)\n(\s{4,})(.+)/gm, (match, term, indent, definition) => {
      // Skip if this looks like it's inside a code block
      if (term.includes('```') || definition.includes('```')) {
        return match;
      }
      return `**${term}**\n${indent}${definition}`;
    });

    // Convert directives to blockquotes or comments
    result = result.replace(/^\.\.[ \t]+note::[ \t]*(.*)$/gm, '> **Note:** $1');
    result = result.replace(/^\.\.[ \t]+warning::[ \t]*(.*)$/gm, '> **Warning:** $1');
    result = result.replace(/^\.\.[ \t]+important::[ \t]*(.*)$/gm, '> **Important:** $1');
    result = result.replace(/^\.\.[ \t]+(\w+)::[ \t]*(.*)$/gm, '<!-- $1: $2 -->');

    // Handle simple URLs (but not those already in markdown links)
    result = result.replace(/(?<!\]\()https?:\/\/[^\s<>)]+(?!\))/g, '<$&>');

    // Clean up extra whitespace
    result = result.replace(/\n{3,}/g, '\n\n');

    return result.trim();
  }

  /**
   * Basic LaTeX to Markdown conversion
   */
  static convertLatexBasic(content: string): string {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('Using basic LaTeX parser - some features may not work correctly');
    }

    let result = content;

    // Extract document metadata
    const titleMatch = result.match(/\\title\{([^}]+)\}/);
    const authorMatch = result.match(/\\author\{([^}]+)\}/);
    const dateMatch = result.match(/\\date\{([^}]+)\}/);

    let metadata = '';
    if (titleMatch || authorMatch || dateMatch) {
      metadata = '---\n';
      if (titleMatch) metadata += `title: "${titleMatch[1]}"\n`;
      if (authorMatch) metadata += `author: "${authorMatch[1]}"\n`;
      if (dateMatch) metadata += `date: "${dateMatch[1]}"\n`;
      metadata += '---\n\n';
    }

    // Remove document class and begin/end document
    result = result.replace(/\\documentclass\{[^}]*\}/g, '');
    result = result.replace(/\\usepackage\{[^}]*\}/g, '');
    result = result.replace(/\\title\{[^}]*\}/g, '');
    result = result.replace(/\\author\{[^}]*\}/g, '');
    result = result.replace(/\\date\{[^}]*\}/g, '');
    result = result.replace(/\\maketitle/g, '');
    result = result.replace(/\\begin\{document\}/g, '');
    result = result.replace(/\\end\{document\}/g, '');

    // Convert sections
    result = result.replace(/\\section\*?\{([^}]+)\}/g, '# $1');
    result = result.replace(/\\subsection\*?\{([^}]+)\}/g, '## $1');
    result = result.replace(/\\subsubsection\*?\{([^}]+)\}/g, '### $1');
    result = result.replace(/\\paragraph\*?\{([^}]+)\}/g, '#### $1');
    result = result.replace(/\\subparagraph\*?\{([^}]+)\}/g, '##### $1');

    // Convert emphasis
    result = result.replace(/\\textbf\{([^}]+)\}/g, '**$1**');
    result = result.replace(/\\textit\{([^}]+)\}/g, '*$1*');
    result = result.replace(/\\emph\{([^}]+)\}/g, '*$1*');
    result = result.replace(/\\texttt\{([^}]+)\}/g, '`$1`');
    result = result.replace(/\\underline\{([^}]+)\}/g, '__$1__');

    // Convert inline code
    result = result.replace(/\\verb\|([^|]+)\|/g, '`$1`');

    // Convert links
    result = result.replace(/\\href\{([^}]+)\}\{([^}]+)\}/g, '[$2]($1)');
    result = result.replace(/\\url\{([^}]+)\}/g, '<$1>');
    result = result.replace(/\\cite\{([^}]+)\}/g, '[$1]');
    result = result.replace(/\\ref\{([^}]+)\}/g, '[$1]');
    result = result.replace(/\\label\{([^}]+)\}/g, '<a name="$1"></a>');

    // Convert lists by processing blocks
    result = result.replace(
      /\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g,
      (match, content) => {
        let counter = 1;
        return content.replace(/\\item\s+/g, () => `${counter++}. `);
      }
    );

    result = result.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (match, content) => {
      return content.replace(/\\item\s+/g, '- ');
    });

    result = result.replace(
      /\\begin\{description\}([\s\S]*?)\\end\{description\}/g,
      (match, content) => {
        return content.replace(/\\item\[([^\]]+)\]\s*([^\n\r]*)/g, '**$1**\n  $2');
      }
    );

    // Clean up any remaining list environments
    result = result.replace(/\\begin\{itemize\}/g, '');
    result = result.replace(/\\end\{itemize\}/g, '');
    result = result.replace(/\\begin\{enumerate\}/g, '');
    result = result.replace(/\\end\{enumerate\}/g, '');
    result = result.replace(/\\begin\{description\}/g, '');
    result = result.replace(/\\end\{description\}/g, '');
    result = result.replace(/\\item\s+/g, '- '); // Fallback for any remaining items

    // Convert footnotes
    let footnoteCounter = 1;
    const footnotes: string[] = [];
    result = result.replace(/\\footnote\{([^}]+)\}/g, (match, text) => {
      footnotes.push(`[^${footnoteCounter}]: ${text}`);
      return `[^${footnoteCounter++}]`;
    });

    // Convert quotes
    result = result.replace(/\\begin\{quote\}([\s\S]*?)\\end\{quote\}/g, (match, content) => {
      // Convert content inside quotes to blockquotes
      const lines = content.trim().split('\n');
      return lines.map((line: string) => (line.trim() ? `> ${line}` : '>')).join('\n');
    });

    // Convert LaTeX quotes
    result = result.replace(/``([^']+)''/g, '"$1"');
    // eslint-disable-next-line quotes
    result = result.replace(/\\`([^']+)'/g, "'$1'");

    // Convert code blocks
    result = result.replace(/\\begin\{verbatim\}/g, '```\n');
    result = result.replace(/\\end\{verbatim\}/g, '\n```');
    result = result.replace(/\\begin\{lstlisting\}(\[language=([^\]]+)\])?/g, '```$2\n');
    result = result.replace(/\\end\{lstlisting\}/g, '\n```');
    result = result.replace(/\\begin\{minted\}\{([^}]+)\}/g, '```$1\n');
    result = result.replace(/\\end\{minted\}/g, '\n```');

    // Remove common LaTeX commands
    result = result.replace(/\\tableofcontents/g, '');
    result = result.replace(/\\newpage/g, '');
    result = result.replace(/\\clearpage/g, '');
    result = result.replace(/\\bigskip/g, '');
    result = result.replace(/\\\\/g, '  '); // Line breaks

    // Remove comments
    result = result.replace(/^%.*$/gm, '');
    result = result.replace(/([^\\])%.*$/gm, '$1');

    // Remove remaining backslash commands
    result = result.replace(/\\[a-zA-Z]+(\[[^\]]*\])?(\{[^}]*\})?/g, '');

    // Clean up extra whitespace
    result = result.replace(/\n{3,}/g, '\n\n');
    result = result.replace(/\s{2,}/g, ' ');

    // Add footnotes at the end
    if (footnotes.length > 0) {
      result += '\n\n' + footnotes.join('\n');
    }

    return (metadata + result).trim();
  }
}
