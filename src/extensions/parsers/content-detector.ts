/**
 * @fileoverview Content Detection Module for Legal Markdown Processing
 *
 * This module provides intelligent content type detection for various document
 * formats including reStructuredText (RST) and LaTeX. It uses pattern matching
 * and heuristics to determine if content requires specific parsers for conversion
 * to Legal Markdown format.
 *
 * Features:
 * - reStructuredText format detection with pattern-based analysis
 * - LaTeX document format detection with command recognition
 * - YAML frontmatter awareness to avoid false positives
 * - Robust pattern matching with configurable thresholds
 * - Support for various RST directives and syntax elements
 * - LaTeX command and environment detection
 *
 * @example
 * ```typescript
 * import { ContentDetector } from './content-detector';
 *
 * // Detect RST content
 * const isRst = ContentDetector.needsRstParser(content);
 * if (isRst) {
 *   content = await convertRstToLegalMarkdown(content);
 * }
 *
 * // Detect LaTeX content
 * const isLatex = ContentDetector.needsLatexParser(content);
 * if (isLatex) {
 *   content = await convertLatexToLegalMarkdown(content);
 * }
 * ```
 */

/**
 * Content detection utility class for identifying document formats
 *
 * Provides static methods to detect different document formats using pattern
 * matching and content analysis. Designed to prevent unnecessary processing
 * of content that doesn't require specific parsers.
 *
 * @class ContentDetector
 * @example
 * ```typescript
 * import { ContentDetector } from './content-detector';
 *
 * // Check if content needs RST processing
 * if (ContentDetector.needsRstParser(content)) {
 *   content = await processRstContent(content);
 * }
 *
 * // Check if content needs LaTeX processing
 * if (ContentDetector.needsLatexParser(content)) {
 *   content = await processLatexContent(content);
 * }
 * ```
 */
export class ContentDetector {
  /**
   * Detects if content requires reStructuredText parsing
   *
   * Uses pattern matching to identify RST-specific syntax elements including
   * directives, header underlines, reference links, code blocks, and other
   * RST constructs. Avoids false positives with YAML frontmatter content.
   *
   * @param {string} content - The content to analyze for RST patterns
   * @returns {boolean} True if content appears to be reStructuredText, false otherwise
   * @example
   * ```typescript
   * const rstContent = `
   * Introduction
   * ============
   *
   * This is a sample RST document.
   *
   * .. note::
   *    This is an RST directive.
   * `;
   *
   * const isRst = ContentDetector.needsRstParser(rstContent);
   * console.log(isRst); // true
   * ```
   */
  static needsRstParser(content: string): boolean {
    // No tratar como RST si empieza con YAML frontmatter
    if (content.startsWith('---')) {
      return false;
    }

    // Patrones específicos para RST
    const rstPatterns = [
      /^\.\.[ \t]+\w+::/m, // Directives
      /^[=~^"'`#*+<>-]{4,}[ \t]*$/m, // Header underlines (4+ chars)
      /`[^`]+`__?/, // Reference links
      /`[^<]+[ \t]*<[^>]+>`_/, // External links
      /::[ \t]*$/m, // Code blocks
      /^\.\.[ \t]+(note|warning|important)::/m, // Admonitions
      /^\*[ \t]+\S/m, // Bullet lists with content
      /^\d+\.[ \t]+\S/m, // Numbered lists with content
    ];

    // Patrones fuertemente indicativos de RST (solo uno necesario)
    const strongRstPatterns = [
      /^\.\.[ \t]+\w+::/m, // Directives
      /`[^<]+[ \t]*<[^>]+>`_/, // External links with RST syntax
      /^\.\.[ \t]+(note|warning|important)::/m, // Admonitions
      /::[ \t]*$/m, // Code blocks
    ];

    // Patrones de header con underline (específico de RST)
    const headerPattern = /^.+\n[=~^"'`#*+<>-]{4,}[ \t]*$/m;

    // Si hay patrones fuertes, es RST
    const strongMatches = strongRstPatterns.filter(pattern => pattern.test(content));
    if (strongMatches.length >= 1) {
      return true;
    }

    // Si hay header underline, es muy probable que sea RST
    if (headerPattern.test(content)) {
      return true;
    }

    // Requiere al menos 2 patrones para confirmar RST
    const matches = rstPatterns.filter(pattern => pattern.test(content));
    return matches.length >= 2;
  }

  /**
   * Detects if content requires LaTeX parsing
   *
   * Uses pattern matching to identify LaTeX-specific commands, environments,
   * and syntax elements including document classes, sections, text formatting
   * commands, and environments. Requires multiple pattern matches to avoid
   * false positives.
   *
   * @param {string} content - The content to analyze for LaTeX patterns
   * @returns {boolean} True if content appears to be LaTeX, false otherwise
   * @example
   * ```typescript
   * const latexContent = `
   * \\documentclass{article}
   * \\begin{document}
   * \\section{Introduction}
   * This is \\textbf{bold} text in LaTeX.
   * \\end{document}
   * `;
   *
   * const isLatex = ContentDetector.needsLatexParser(latexContent);
   * console.log(isLatex); // true
   * ```
   */
  static needsLatexParser(content: string): boolean {
    // No tratar como LaTeX si empieza con YAML frontmatter
    if (content.startsWith('---')) {
      return false;
    }

    // Patrones específicos para LaTeX
    const latexPatterns = [
      /\\documentclass\{/, // Document class
      /\\begin\{document\}/, // Begin document
      /\\section\*?\{/, // Sections
      /\\subsection\*?\{/, // Subsections
      /\\begin\{[^}]+\}/, // Environments
      /\\[a-zA-Z]+\{[^}]*\}/, // Commands with arguments
      /\\textbf\{/, // Bold text
      /\\textit\{/, // Italic text
      /\\emph\{/, // Emphasis
      /\\usepackage\{/, // Package imports
      /\\href\{[^}]*\}\{[^}]*\}/, // Links
      /\\item\b/, // List items
      /\\cite\{/, // Citations
      /\\ref\{/, // References
      /\\label\{/, // Labels
    ];

    // Patrones fuertemente indicativos de LaTeX (solo uno necesario)
    const strongLatexPatterns = [
      /\\documentclass\{/, // Document class
      /\\begin\{document\}/, // Begin document
      /\\section\*?\{/, // Sections
      /\\subsection\*?\{/, // Subsections
      /\\usepackage\{/, // Package imports
      /\\textbf\{/, // Bold text
      /\\textit\{/, // Italic text
      /\\emph\{/, // Emphasis
      /\\item\b/, // List items
      /\\cite\{/, // Citations
      /\\ref\{/, // References
      /\\label\{/, // Labels
    ];

    // Si hay patrones fuertes, es LaTeX
    const strongMatches = strongLatexPatterns.filter(pattern => pattern.test(content));
    if (strongMatches.length >= 1) {
      return true;
    }

    // Requiere al menos 2 patrones para confirmar LaTeX
    const matches = latexPatterns.filter(pattern => pattern.test(content));
    return matches.length >= 2;
  }

  /**
   * Detects if content requires Pandoc processing
   *
   * This is a convenience method that combines RST and LaTeX detection to
   * determine if content needs any form of Pandoc processing for conversion
   * to Legal Markdown format.
   *
   * @param {string} content - The content to analyze for format patterns
   * @returns {boolean} True if content needs Pandoc processing, false otherwise
   * @example
   * ```typescript
   * const needsProcessing = ContentDetector.needsPandoc(content);
   * if (needsProcessing) {
   *   content = await processThroughPandoc(content);
   * }
   * ```
   */
  static needsPandoc(content: string): boolean {
    return this.needsRstParser(content) || this.needsLatexParser(content);
  }
}
