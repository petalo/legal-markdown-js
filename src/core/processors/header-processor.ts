/**
 * @fileoverview Header Processing Module for Legal Markdown Documents
 *
 * This module provides comprehensive header processing functionality for Legal Markdown
 * documents, supporting both traditional (l., ll., lll.) and alternative (l2., l3.)
 * header syntax. It handles complex numbering schemes, hierarchical structures, and
 * various formatting options including Roman numerals, alphabetic labels, and custom
 * indentation patterns.
 *
 * Features:
 * - Dual header syntax support (traditional and alternative)
 * - Complex hierarchical numbering with automatic level management
 * - Roman numeral and alphabetic label generation
 * - Customizable header formatting templates
 * - Academic and legal document formatting patterns
 * - Automatic indentation and spacing control
 * - Continuous numbering and reset control options
 * - Level-specific formatting with placeholder substitution
 *
 * @example
 * ```typescript
 * import { processHeaders } from './header-processor';
 *
 * const content = `l. Introduction
 * ll. Terms and Conditions
 * lll. Payment Terms
 * l2. Liability`;
 *
 * const metadata = {
 *   'level-one': 'Article %n.',
 *   'level-two': 'Section %n.',
 *   'level-three': '(%n)'
 * };
 *
 * const processed = processHeaders(content, metadata);
 * console.log(processed);
 * // Output:
 * // Article 1. Introduction
 * //   Section 1. Terms and Conditions
 * //     (1) Payment Terms
 * //   Section 2. Liability
 * ```
 */

import { HeaderOptions } from '@types';

/**
 * Processes structured headers in a LegalMarkdown document
 *
 * This is the main function that processes both traditional (l., ll., lll.) and
 * alternative (l1., l2., l3.) header syntax. It maintains proper hierarchical
 * numbering, applies custom formatting templates, and handles complex academic
 * and legal document structures.
 *
 * @param {string} content - The document content containing headers to process
 * @param {Record<string, any>} metadata - Document metadata with potential header formatting options
 * @param {Object} [processingOptions={}] - Additional processing options
 * @param {boolean} [processingOptions.noReset] - Disable header numbering reset (continuous numbering)
 * @param {boolean} [processingOptions.noIndent] - Disable header indentation (flat formatting)
 * @returns {string} Processed content with formatted headers
 * @example
 * ```typescript
 * // Basic header processing
 * const content = `l. First Article
 * ll. First Section
 * lll. Subsection A
 * ll. Second Section
 * l. Second Article`;
 *
 * const metadata = {
 *   'level-one': 'Article %n.',
 *   'level-two': 'Section %n.',
 *   'level-three': '(%c)'
 * };
 *
 * const result = processHeaders(content, metadata);
 * // Output:
 * // Article 1. First Article
 * //   Section 1. First Section
 * //     (a) Subsection A
 * //   Section 2. Second Section
 * // Article 2. Second Article
 *
 * // Alternative syntax
 * const altContent = `l1. Introduction
 * l2. Background
 * l3. Technical Details
 * l2. Implementation
 * l1. Conclusion`;
 *
 * const altResult = processHeaders(altContent, metadata);
 * // Produces similar hierarchical numbering
 * ```
 */
export function processHeaders(
  content: string,
  metadata: Record<string, any>,
  processingOptions: {
    noReset?: boolean;
    noIndent?: boolean;
    enableFieldTrackingInMarkdown?: boolean;
  } = {}
): string {
  // Extract header options from metadata
  const options = extractHeaderOptions(metadata, processingOptions);

  // Define regex patterns for both header styles
  const traditionalHeaderPattern = /^(l+)\.\s+(.*?)$/gm;
  const alternativeHeaderPattern = /^l(\d+)\.\s+(.*?)$/gm;

  // Track header numbering state
  const headerNumbers: number[] = [0, 0, 0, 0, 0];

  // Process all headers in a single pass to maintain correct numbering
  const matches: Array<{
    match: string;
    level: number;
    text: string;
    index: number;
  }> = [];

  // Collect all traditional header matches
  let match;
  const contentCopy = content.slice();
  traditionalHeaderPattern.lastIndex = 0;

  while ((match = traditionalHeaderPattern.exec(contentCopy)) !== null) {
    matches.push({
      match: match[0],
      level: match[1].length,
      text: match[2],
      index: match.index,
    });
  }

  // Collect all alternative header matches
  alternativeHeaderPattern.lastIndex = 0;
  while ((match = alternativeHeaderPattern.exec(contentCopy)) !== null) {
    matches.push({
      match: match[0],
      level: parseInt(match[1], 10),
      text: match[2],
      index: match.index,
    });
  }

  // Sort matches by their position in the document
  matches.sort((a, b) => a.index - b.index);

  // Process headers in order (document order)
  let result = content;
  let offset = 0;
  let previousLevel = 0;

  for (const m of matches) {
    // Update header numbers based on level
    const level = m.level;

    // Special logic for level 5
    if (level === 5) {
      if (previousLevel === 5) {
        // Consecutive level 5s: just increment level 5
        headerNumbers[4]++;
      } else {
        // Level 5 after something else: reset level 5 to 1
        headerNumbers[4] = 1;
      }
    } else {
      // Standard logic for other levels

      // If we're skipping levels, increment all intermediate levels to 1
      for (let i = previousLevel; i < level - 1; i++) {
        if (headerNumbers[i] === 0) {
          headerNumbers[i] = 1;
        }
      }

      headerNumbers[level - 1]++;

      // Reset all deeper level numbers (unless noReset is enabled)
      if (!options.noReset) {
        for (let i = level; i < headerNumbers.length; i++) {
          headerNumbers[i] = 0;
        }
      }
    }

    // Format the header
    const formattedHeader = formatHeader(level, m.text, [...headerNumbers], options, previousLevel);

    // Calculate adjusted position based on previous replacements
    const startPos = m.index + offset;
    const endPos = startPos + m.match.length;

    // Replace the header in the result string
    result = result.substring(0, startPos) + formattedHeader + result.substring(endPos);

    // Update offset for subsequent replacements
    offset += formattedHeader.length - m.match.length;

    previousLevel = level;
  }

  return result;
}

/**
 * Extracts header formatting options from metadata
 *
 * Parses document metadata to extract header formatting configuration,
 * including level-specific formatting templates, indentation settings,
 * and numbering behavior options. Provides default values for all options.
 *
 * @private
 * @param {Record<string, any>} metadata - Document metadata containing header configuration
 * @param {Object} [processingOptions={}] - Additional processing options that override metadata
 * @param {boolean} [processingOptions.noReset] - Disable header numbering reset
 * @param {boolean} [processingOptions.noIndent] - Disable header indentation
 * @returns {HeaderOptions} Complete header options object with defaults applied
 * @example
 * ```typescript
 * const metadata = {
 *   'level-one': 'Chapter %n.',
 *   'level-two': 'Section %n.%s',
 *   'level-indent': 2.0,
 *   'no-reset': true
 * };
 *
 * const options = extractHeaderOptions(metadata);
 * console.log(options);
 * // Output:
 * // {
 * //   levelOne: 'Chapter %n.',
 * //   levelTwo: 'Section %n.%s',
 * //   levelThree: '(%n)',
 * //   levelFour: '(%n%c)',
 * //   levelFive: '(%n%c%r)',
 * //   levelIndent: 2.0,
 * //   noReset: true,
 * //   noIndent: false
 * // }
 * ```
 */
function extractHeaderOptions(
  metadata: Record<string, any>,
  processingOptions: {
    noReset?: boolean;
    noIndent?: boolean;
    enableFieldTrackingInMarkdown?: boolean;
  } = {}
): HeaderOptions {
  return {
    levelOne: metadata['level-one'] || 'Article %n.',
    levelTwo: metadata['level-two'] || 'Section %n.',
    levelThree: metadata['level-three'] || '(%n)',
    levelFour: metadata['level-four'] || '(%n%c)',
    levelFive: metadata['level-five'] || '(%n%c%r)',
    levelIndent: parseFloat(metadata['level-indent'] || '1.5'),
    noReset: processingOptions.noReset || metadata['no-reset'] || false,
    noIndent: processingOptions.noIndent || metadata['no-indent'] || false,
    enableFieldTrackingInMarkdown: processingOptions.enableFieldTrackingInMarkdown || false,
  };
}

/**
 * Formats a header according to level and options
 *
 * Applies formatting templates and numbering schemes to create properly formatted
 * headers. Handles placeholder substitution for various numbering systems including
 * numeric, alphabetic, and Roman numeral formats. Supports both simple and complex
 * hierarchical numbering patterns.
 *
 * @private
 * @param {number} level - Header level (1-5)
 * @param {string} text - Header text content
 * @param {number[]} headerNumbers - Array tracking header numbering state for all levels
 * @param {HeaderOptions} options - Header formatting options and templates
 * @param {number} [previousLevel=0] - Previous header level for context-aware formatting
 * @returns {string} Formatted header string with proper numbering and indentation
 * @example
 * ```typescript
 * const headerNumbers = [1, 2, 3, 0, 0];
 * const options = {
 *   levelOne: 'Article %n.',
 *   levelTwo: 'Section %n.',
 *   levelThree: '(%c)',
 *   levelIndent: 1.5,
 *   noIndent: false
 * };
 *
 * const formatted = formatHeader(3, 'Payment Terms', headerNumbers, options);
 * // Output: '    (c) Payment Terms'
 * ```
 */
function formatHeader(
  level: number,
  text: string,
  headerNumbers: number[],
  options: HeaderOptions,
  previousLevel: number = 0
): string {
  // Validate level
  if (level < 1 || level > 5) {
    return `l${level}. ${text}`;
  }

  // Get format template for this level
  const formatTemplate = getFormatTemplate(level, options);

  // Ensure formatTemplate is a string
  if (typeof formatTemplate !== 'string') {
    return `l${level}. ${text}`;
  }

  // Create formatted header with the right value based on level
  let formattedHeader = formatTemplate;

  // Detect hierarchical patterns BEFORE any variable replacement
  const isHierarchicalRoman = formatTemplate.includes('%r.%n');
  const isHierarchicalAlpha = formatTemplate.includes('%c.%n');

  // Detect broader hierarchical alphabetic context
  // If level 1 uses %c and level 2 uses %c.%n, then level 3+ %c should also refer to level 1
  const isAlphabeticHierarchicalContext =
    options.levelOne?.includes('%c') && options.levelTwo?.includes('%c.%n');

  // Handle special %02n format (leading zero numbers)
  const leadingZeroPattern = /%0(\d+)n/g;
  formattedHeader = formattedHeader.replace(leadingZeroPattern, (match, digits) => {
    const num = headerNumbers[level - 1];
    return num.toString().padStart(parseInt(digits), '0');
  });

  // Handle special %02s format (leading zero section references)
  const leadingZeroSectionPattern = /%0(\d+)s/g;
  formattedHeader = formattedHeader.replace(leadingZeroSectionPattern, (match, digits) => {
    const num = headerNumbers[0];
    return num.toString().padStart(parseInt(digits), '0');
  });

  // Handle other leading zero patterns for reference variables
  const leadingZeroTitlePattern = /%0(\d+)t/g;
  formattedHeader = formattedHeader.replace(leadingZeroTitlePattern, (match, digits) => {
    const num = headerNumbers[1];
    return num.toString().padStart(parseInt(digits), '0');
  });

  const leadingZeroFourthPattern = /%0(\d+)f/g;
  formattedHeader = formattedHeader.replace(leadingZeroFourthPattern, (match, digits) => {
    const num = headerNumbers[2];
    return num.toString().padStart(parseInt(digits), '0');
  });

  const leadingZeroFifthPattern = /%0(\d+)i/g;
  formattedHeader = formattedHeader.replace(leadingZeroFifthPattern, (match, digits) => {
    const num = headerNumbers[3];
    return num.toString().padStart(parseInt(digits), '0');
  });

  // Replace placeholders based on level-specific logic
  if (level === 4) {
    // Level 4 format: (%n%c) where %n is level 3 number, %c is level 4 letter
    // Only apply special level 4 logic for default hierarchical formats like (%n%c)
    if (
      formattedHeader.includes('%n%c') &&
      !formattedHeader.includes('.%s') &&
      !formattedHeader.includes('.%t') &&
      !formattedHeader.includes('.%f')
    ) {
      formattedHeader = formattedHeader.replace(/%n/g, headerNumbers[2].toString());
      formattedHeader = formattedHeader.replace(/%c/g, getAlphaLabel(headerNumbers[3]));
    }
  } else if (level === 5) {
    // Level 5 format: (%n%c%r) where %n is level 3 number, %c is level 4 letter, %r is level 5 roman
    // Only apply special level 5 logic for default hierarchical formats like (%n%c%r)
    if (formattedHeader.includes('%c%r') || formattedHeader.includes('%n%c%r')) {
      formattedHeader = formattedHeader.replace(/%n/g, headerNumbers[2].toString());
      formattedHeader = formattedHeader.replace(/%c/g, getAlphaLabel(headerNumbers[3]));

      // Always use lowercase roman numerals for level 5
      const useLowercase = true;
      formattedHeader = formattedHeader.replace(
        /%r/g,
        getRomanNumeral(headerNumbers[4], useLowercase)
      );
    }
  }

  // Handle academic/hierarchical formats first (where %n might refer to level 1 instead of current level)
  // Check if format uses academic hierarchical pattern like %n.%s, %n.%s.%t, etc.
  // But NOT formats like %r.%n or %c.%n where %n should be current level
  // Academic context: if any level uses deeper hierarchical patterns, then %n.%s is also academic
  const hasAcademicContext =
    (typeof options.levelThree === 'string' && options.levelThree.includes('%n.%s.%t')) ||
    (typeof options.levelFour === 'string' && options.levelFour.includes('%n.%s.%t.%f')) ||
    (typeof options.levelFive === 'string' && options.levelFive.includes('%n.%s.%t.%f.%i'));

  const isAcademicHierarchical =
    (formattedHeader.includes('.%s.%t') ||
      formattedHeader.includes('.%t.%f') ||
      formattedHeader.includes('.%f.%i') ||
      (formattedHeader.includes('.%s') && hasAcademicContext)) &&
    !formattedHeader.includes('%r.') &&
    !formattedHeader.includes('%c.');

  if (isAcademicHierarchical) {
    // In academic hierarchical formats, %n typically refers to level 1 number
    formattedHeader = formattedHeader.replace(/%n/g, headerNumbers[0].toString());
  } else {
    // In standard formats, %n refers to current level number
    formattedHeader = formattedHeader.replace(/%n/g, headerNumbers[level - 1].toString());
  }

  // Replace reference variables for all levels
  // Reference variables represent hierarchical level numbers for academic/structured numbering
  // For academic formats: %s = level 2 current number (for formats like %n.%s.%t where %n=level1, %s=level2)
  // For simple formats: %s = level 1 reference (for formats like %n.%s where %n=level2, %s=level1)
  if (isAcademicHierarchical) {
    // In academic hierarchical formats, %s refers to level 2
    formattedHeader = formattedHeader.replace(/%s/g, headerNumbers[1].toString());
  } else {
    // In simple formats like %n.%s, %s refers to level 1
    formattedHeader = formattedHeader.replace(/%s/g, headerNumbers[0].toString());
  }

  // %t = level 3 current number (for formats like %n.%s.%t)
  formattedHeader = formattedHeader.replace(/%t/g, headerNumbers[2].toString());

  // %f = level 4 current number (for formats like %n.%s.%t.%f)
  formattedHeader = formattedHeader.replace(/%f/g, headerNumbers[3].toString());

  // %i = level 5 current number (for formats like %n.%s.%t.%f.%i)
  formattedHeader = formattedHeader.replace(/%i/g, headerNumbers[4].toString());

  // Replace %c (alphabetic) for levels 1-5 (when not handled by special logic above)
  // Special handling for hierarchical formats like %c.%n where %c refers to level 1
  if (isHierarchicalAlpha && level > 1) {
    // In hierarchical formats with %c.%n pattern, %c before dot refers to level 1
    formattedHeader = formattedHeader.replace(/%c/g, getAlphaLabel(headerNumbers[0]));
  } else if (isAlphabeticHierarchicalContext && level > 1) {
    // In broader alphabetic hierarchical context, %c in levels 3+ refers to level 1
    formattedHeader = formattedHeader.replace(/%c/g, getAlphaLabel(headerNumbers[0]));
  } else if (level <= 3 || (level >= 4 && formattedHeader.includes('%c'))) {
    formattedHeader = formattedHeader.replace(/%c/g, getAlphaLabel(headerNumbers[level - 1]));
  }

  // Replace %r (roman) for levels 1-5 (when not handled by special logic above)
  // Special handling for hierarchical formats like %r.%n where %r refers to level 1
  if (isHierarchicalRoman && level > 1) {
    // In hierarchical formats with %r.%n pattern, %r before dot refers to level 1
    formattedHeader = formattedHeader.replace(/%r/g, getRomanNumeral(headerNumbers[0], true));
  } else if (level <= 3 || (level >= 4 && formattedHeader.includes('%r'))) {
    formattedHeader = formattedHeader.replace(
      /%r/g,
      getRomanNumeral(headerNumbers[level - 1], true)
    );
  }

  // Apply indentation (unless noIndent is enabled)
  const indentation = options.noIndent
    ? ''
    : ' '.repeat(Math.floor((level - 1) * (options.levelIndent || 1.5) * 2));

  // Check if field tracking is enabled for header styling
  if (options.enableFieldTrackingInMarkdown) {
    // Wrap header in span with CSS classes and data attributes for styling
    const headerClasses = [
      'legal-header',
      `legal-header-level-${level}`,
      getLevelCssClass(level),
    ].join(' ');

    const spanElement =
      `<span class="${headerClasses}" ` +
      `data-level="${level}" data-number="${headerNumbers[level - 1]}">` +
      `${formattedHeader} ${text}</span>`;

    return `${indentation}${spanElement}`;
  }

  return `${indentation}${formattedHeader} ${text}`;
}

/**
 * Gets the format template for a specific header level
 *
 * Retrieves the appropriate formatting template for a given header level,
 * with fallback to default templates if custom options are not provided
 * or are invalid.
 *
 * @private
 * @param {number} level - Header level (1-5)
 * @param {HeaderOptions} options - Header formatting options containing level templates
 * @returns {string} Format template string with placeholders
 * @example
 * ```typescript
 * const options = {
 *   levelOne: 'Chapter %n.',
 *   levelTwo: 'Section %n.%s',
 *   levelThree: '(%n)'
 * };
 *
 * const template = getFormatTemplate(2, options);
 * // Output: 'Section %n.%s'
 *
 * const fallbackTemplate = getFormatTemplate(4, {});
 * // Output: '(%n%c)' (default for level 4)
 * ```
 */
function getFormatTemplate(level: number, options: HeaderOptions): string {
  let template: string | undefined;

  switch (level) {
    case 1:
      template = options.levelOne;
      break;
    case 2:
      template = options.levelTwo;
      break;
    case 3:
      template = options.levelThree;
      break;
    case 4:
      template = options.levelFour;
      break;
    case 5:
      template = options.levelFive;
      break;
    default:
      template = '%n.';
  }

  // Ensure we always return a string, even if template is null/undefined
  if (typeof template !== 'string') {
    switch (level) {
      case 1:
        return 'Article %n.';
      case 2:
        return 'Section %n.';
      case 3:
        return '(%n)';
      case 4:
        return '(%n%c)';
      case 5:
        return '(%n%c%r)';
      default:
        return '%n.';
    }
  }

  return template;
}

/**
 * Converts a number to alphabetic label (a, b, c, ... z, aa, ab, ...)
 *
 * Generates alphabetic labels for header numbering using a base-26 system.
 * Supports extended sequences beyond 'z' using double letters (aa, ab, etc.).
 *
 * @private
 * @param {number} num - Number to convert (1-based)
 * @returns {string} Alphabetic label in lowercase
 * @example
 * ```typescript
 * console.log(getAlphaLabel(1));  // 'a'
 * console.log(getAlphaLabel(26)); // 'z'
 * console.log(getAlphaLabel(27)); // 'aa'
 * console.log(getAlphaLabel(28)); // 'ab'
 * console.log(getAlphaLabel(52)); // 'az'
 * console.log(getAlphaLabel(53)); // 'ba'
 * ```
 */
function getAlphaLabel(num: number): string {
  if (num <= 0) return '';

  let label = '';
  let n = num;

  while (n > 0) {
    const remainder = (n - 1) % 26;
    label = String.fromCharCode(97 + remainder) + label;
    n = Math.floor((n - 1) / 26);
  }

  return label;
}

/**
 * Converts a number to Roman numeral
 *
 * Generates Roman numerals for header numbering using standard Roman numeral
 * conversion rules. Supports both uppercase and lowercase output formats.
 *
 * @private
 * @param {number} num - Number to convert (positive integer)
 * @param {boolean} [lowercase=false] - Whether to return lowercase roman numerals
 * @returns {string} Roman numeral string
 * @example
 * ```typescript
 * console.log(getRomanNumeral(1));        // 'I'
 * console.log(getRomanNumeral(4));        // 'IV'
 * console.log(getRomanNumeral(9));        // 'IX'
 * console.log(getRomanNumeral(10));       // 'X'
 * console.log(getRomanNumeral(49));       // 'XLIX'
 * console.log(getRomanNumeral(1994));     // 'MCMXCIV'
 * console.log(getRomanNumeral(5, true));  // 'v'
 * ```
 */
function getRomanNumeral(num: number, lowercase: boolean = false): string {
  if (num <= 0) return '';

  const romanNumerals = [
    { value: 1000, numeral: 'M' },
    { value: 900, numeral: 'CM' },
    { value: 500, numeral: 'D' },
    { value: 400, numeral: 'CD' },
    { value: 100, numeral: 'C' },
    { value: 90, numeral: 'XC' },
    { value: 50, numeral: 'L' },
    { value: 40, numeral: 'XL' },
    { value: 10, numeral: 'X' },
    { value: 9, numeral: 'IX' },
    { value: 5, numeral: 'V' },
    { value: 4, numeral: 'IV' },
    { value: 1, numeral: 'I' },
  ];

  let roman = '';
  let n = num;

  for (const { value, numeral } of romanNumerals) {
    while (n >= value) {
      roman += numeral;
      n -= value;
    }
  }

  return lowercase ? roman.toLowerCase() : roman;
}

/**
 * Gets CSS class name for a specific header level
 *
 * Maps header levels to semantic CSS class names for styling purposes.
 * Used when field tracking is enabled to provide consistent styling hooks.
 *
 * @private
 * @param {number} level - Header level (1-5)
 * @returns {string} CSS class name for the level
 */
function getLevelCssClass(level: number): string {
  switch (level) {
    case 1:
      return 'legal-article';
    case 2:
      return 'legal-section';
    case 3:
      return 'legal-subsection';
    case 4:
      return 'legal-sub-subsection';
    case 5:
      return 'legal-paragraph';
    default:
      return 'legal-header-unknown';
  }
}
