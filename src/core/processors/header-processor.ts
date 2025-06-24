import { HeaderOptions } from "../../types";

/**
 * Processes structured headers in a LegalMarkdown document
 *
 * @param content - The document content
 * @param metadata - Document metadata with potential header formatting options
 * @returns Processed content with formatted headers
 */
export function processHeaders(
  content: string,
  metadata: Record<string, any>
): string {
  // Extract header options from metadata
  const options = extractHeaderOptions(metadata);

  // Define regex patterns for both header styles
  const traditionalHeaderPattern = /^(l+)\.\s+(.*?)$/gm;
  const alternativeHeaderPattern = /^l(\d+)\.\s+(.*?)$/gm;

  // Track header numbering state
  const headerNumbers: number[] = [0, 0, 0, 0, 0];

  // Process all headers in a single pass to maintain correct numbering
  let matches: Array<{
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

      // Reset all deeper level numbers
      for (let i = level; i < headerNumbers.length; i++) {
        headerNumbers[i] = 0;
      }
    }





    // Format the header
    const formattedHeader = formatHeader(
      level,
      m.text,
      [...headerNumbers],
      options,
      previousLevel
    );

    // Calculate adjusted position based on previous replacements
    const startPos = m.index + offset;
    const endPos = startPos + m.match.length;

    // Replace the header in the result string
    result =
      result.substring(0, startPos) +
      formattedHeader +
      result.substring(endPos);

    // Update offset for subsequent replacements
    offset += formattedHeader.length - m.match.length;

    previousLevel = level;
  }

  return result;
}

/**
 * Extracts header formatting options from metadata
 *
 * @param metadata - Document metadata
 * @returns Header options object
 */
function extractHeaderOptions(metadata: Record<string, any>): HeaderOptions {
  return {
    levelOne: metadata["level-one"] || "Article %n.",
    levelTwo: metadata["level-two"] || "Section %n.",
    levelThree: metadata["level-three"] || "(%n)",
    levelFour: metadata["level-four"] || "(%n%c)",
    levelFive: metadata["level-five"] || "(%n%c%r)",
    levelIndent: parseFloat(metadata["level-indent"] || "1.5"),
  };
}

/**
 * Formats a header according to level and options
 *
 * @param level - Header level (1-5)
 * @param text - Header text
 * @param headerNumbers - Array tracking header numbering state
 * @param options - Header formatting options
 * @param previousLevel - Previous header level for context
 * @returns Formatted header string
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
  if (typeof formatTemplate !== "string") {
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
    options.levelOne?.includes('%c') && 
    options.levelTwo?.includes('%c.%n');

  // Handle special %02n format (leading zero numbers)
  const leadingZeroPattern = /%0(\d+)n/g;
  formattedHeader = formattedHeader.replace(
    leadingZeroPattern,
    (match, digits) => {
      const num = headerNumbers[level - 1];
      return num.toString().padStart(parseInt(digits), "0");
    }
  );

  // Handle special %02s format (leading zero section references)
  const leadingZeroSectionPattern = /%0(\d+)s/g;
  formattedHeader = formattedHeader.replace(
    leadingZeroSectionPattern,
    (match, digits) => {
      const num = headerNumbers[0];
      return num.toString().padStart(parseInt(digits), "0");
    }
  );
  
  // Handle other leading zero patterns for reference variables
  const leadingZeroTitlePattern = /%0(\d+)t/g;
  formattedHeader = formattedHeader.replace(
    leadingZeroTitlePattern,
    (match, digits) => {
      const num = headerNumbers[1];
      return num.toString().padStart(parseInt(digits), "0");
    }
  );
  
  const leadingZeroFourthPattern = /%0(\d+)f/g;
  formattedHeader = formattedHeader.replace(
    leadingZeroFourthPattern,
    (match, digits) => {
      const num = headerNumbers[2];
      return num.toString().padStart(parseInt(digits), "0");
    }
  );
  
  const leadingZeroFifthPattern = /%0(\d+)i/g;
  formattedHeader = formattedHeader.replace(
    leadingZeroFifthPattern,
    (match, digits) => {
      const num = headerNumbers[3];
      return num.toString().padStart(parseInt(digits), "0");
    }
  );

  // Replace placeholders based on level-specific logic
  if (level === 4) {
    // Level 4 format: (%n%c) where %n is level 3 number, %c is level 4 letter
    // Only apply special level 4 logic for default hierarchical formats like (%n%c)
    if (formattedHeader.includes('%n%c') && !formattedHeader.includes('.%s') && !formattedHeader.includes('.%t') && !formattedHeader.includes('.%f')) {
      formattedHeader = formattedHeader.replace(
        /%n/g,
        headerNumbers[2].toString()
      );
      formattedHeader = formattedHeader.replace(
        /%c/g,
        getAlphaLabel(headerNumbers[3])
      );
    }
  } else if (level === 5) {
    // Level 5 format: (%n%c%r) where %n is level 3 number, %c is level 4 letter, %r is level 5 roman
    // Only apply special level 5 logic for default hierarchical formats like (%n%c%r)
    if (formattedHeader.includes('%c%r') || formattedHeader.includes('%n%c%r')) {
      formattedHeader = formattedHeader.replace(
        /%n/g,
        headerNumbers[2].toString()
      );
      formattedHeader = formattedHeader.replace(
        /%c/g,
        getAlphaLabel(headerNumbers[3])
      );

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
  const hasAcademicContext = (typeof options.levelThree === 'string' && options.levelThree.includes('%n.%s.%t')) ||
                             (typeof options.levelFour === 'string' && options.levelFour.includes('%n.%s.%t.%f')) ||
                             (typeof options.levelFive === 'string' && options.levelFive.includes('%n.%s.%t.%f.%i'));
  
  const isAcademicHierarchical = ((formattedHeader.includes('.%s.%t') || 
                                   formattedHeader.includes('.%t.%f') || 
                                   formattedHeader.includes('.%f.%i') ||
                                   (formattedHeader.includes('.%s') && hasAcademicContext)) && 
                                  !formattedHeader.includes('%r.') && 
                                  !formattedHeader.includes('%c.'));
  
  if (isAcademicHierarchical) {
    // In academic hierarchical formats, %n typically refers to level 1 number
    formattedHeader = formattedHeader.replace(
      /%n/g,
      headerNumbers[0].toString()
    );
  } else {
    // In standard formats, %n refers to current level number
    formattedHeader = formattedHeader.replace(
      /%n/g,
      headerNumbers[level - 1].toString()
    );
  }



  // Replace reference variables for all levels
  // Reference variables represent hierarchical level numbers for academic/structured numbering
  // For academic formats: %s = level 2 current number (for formats like %n.%s.%t where %n=level1, %s=level2)
  // For simple formats: %s = level 1 reference (for formats like %n.%s where %n=level2, %s=level1)
  if (isAcademicHierarchical) {
    // In academic hierarchical formats, %s refers to level 2
    formattedHeader = formattedHeader.replace(
      /%s/g,
      headerNumbers[1].toString()
    );
  } else {
    // In simple formats like %n.%s, %s refers to level 1 
    formattedHeader = formattedHeader.replace(
      /%s/g,
      headerNumbers[0].toString()
    );
  }


  // %t = level 3 current number (for formats like %n.%s.%t)
  formattedHeader = formattedHeader.replace(
    /%t/g,
    headerNumbers[2].toString()
  );

  // %f = level 4 current number (for formats like %n.%s.%t.%f)
  formattedHeader = formattedHeader.replace(
    /%f/g,
    headerNumbers[3].toString()
  );

  // %i = level 5 current number (for formats like %n.%s.%t.%f.%i)
  formattedHeader = formattedHeader.replace(
    /%i/g,
    headerNumbers[4].toString()
  );


  // Replace %c (alphabetic) for levels 1-5 (when not handled by special logic above)
  // Special handling for hierarchical formats like %c.%n where %c refers to level 1
  if (isHierarchicalAlpha && level > 1) {
    // In hierarchical formats with %c.%n pattern, %c before dot refers to level 1
    formattedHeader = formattedHeader.replace(
      /%c/g,
      getAlphaLabel(headerNumbers[0])
    );
  } else if (isAlphabeticHierarchicalContext && level > 1) {
    // In broader alphabetic hierarchical context, %c in levels 3+ refers to level 1
    formattedHeader = formattedHeader.replace(
      /%c/g,
      getAlphaLabel(headerNumbers[0])
    );
  } else if (level <= 3 || (level >= 4 && formattedHeader.includes('%c'))) {
    formattedHeader = formattedHeader.replace(
      /%c/g,
      getAlphaLabel(headerNumbers[level - 1])
    );
  }



  // Replace %r (roman) for levels 1-5 (when not handled by special logic above)
  // Special handling for hierarchical formats like %r.%n where %r refers to level 1
  if (isHierarchicalRoman && level > 1) {
    // In hierarchical formats with %r.%n pattern, %r before dot refers to level 1
    formattedHeader = formattedHeader.replace(
      /%r/g,
      getRomanNumeral(headerNumbers[0], true)
    );
  } else if (level <= 3 || (level >= 4 && formattedHeader.includes('%r'))) {
    formattedHeader = formattedHeader.replace(
      /%r/g,
      getRomanNumeral(headerNumbers[level - 1], true)
    );
  }


  // Apply indentation
  const indentation = " ".repeat(
    Math.floor((level - 1) * (options.levelIndent || 1.5) * 2)
  );

  return `${indentation}${formattedHeader} ${text}`;
}

/**
 * Gets the format template for a specific header level
 *
 * @param level - Header level (1-5)
 * @param options - Header formatting options
 * @returns Format template string
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
      template = "%n.";
  }

  // Ensure we always return a string, even if template is null/undefined
  if (typeof template !== "string") {
    switch (level) {
      case 1:
        return "Article %n.";
      case 2:
        return "Section %n.";
      case 3:
        return "(%n)";
      case 4:
        return "(%n%c)";
      case 5:
        return "(%n%c%r)";
      default:
        return "%n.";
    }
  }

  return template;
}

/**
 * Converts a number to alphabetic label (a, b, c, ... z, aa, ab, ...)
 *
 * @param num - Number to convert
 * @returns Alphabetic label
 */
function getAlphaLabel(num: number): string {
  if (num <= 0) return "";

  let label = "";
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
 * @param num - Number to convert
 * @param lowercase - Whether to return lowercase roman numerals
 * @returns Roman numeral string
 */
function getRomanNumeral(num: number, lowercase: boolean = false): string {
  if (num <= 0) return "";

  const romanNumerals = [
    { value: 1000, numeral: "M" },
    { value: 900, numeral: "CM" },
    { value: 500, numeral: "D" },
    { value: 400, numeral: "CD" },
    { value: 100, numeral: "C" },
    { value: 90, numeral: "XC" },
    { value: 50, numeral: "L" },
    { value: 40, numeral: "XL" },
    { value: 10, numeral: "X" },
    { value: 9, numeral: "IX" },
    { value: 5, numeral: "V" },
    { value: 4, numeral: "IV" },
    { value: 1, numeral: "I" },
  ];

  let roman = "";
  let n = num;

  for (const { value, numeral } of romanNumerals) {
    while (n >= value) {
      roman += numeral;
      n -= value;
    }
  }

  return lowercase ? roman.toLowerCase() : roman;
}
