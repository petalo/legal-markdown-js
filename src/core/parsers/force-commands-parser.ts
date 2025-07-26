/**
 * @fileoverview Force Commands Parser for Legal Markdown
 *
 * This module provides functionality to parse and apply forced configuration commands
 * from YAML front matter. It allows documents to specify their own processing options
 * directly in the document metadata, enabling automatic configuration based on document content.
 *
 * Features:
 * - Parse command strings from YAML front matter
 * - Support for template variable resolution in commands
 * - Integration with existing CLI options
 * - Override protection for critical options
 * - Validation and error handling
 *
 * @example
 * ```yaml
 * ---
 * title: Contract
 * client: Acme Corp
 * force_commands: >
 *   --css custom.css
 *   --output-name Contract_{{title}}_{{client}}_{{formatDate(date, "YYYYMMDD")}}.pdf
 *   --pdf --highlight
 * ---
 * ```
 */

import { processMixins } from '../processors/mixin-processor';
import { LegalMarkdownOptions } from '../../types';
import { logger } from '../../utils/logger';

/**
 * Interface for parsed command line arguments
 */
export interface ParsedCommands {
  /** CSS file path */
  css?: string;
  /** Output file name/path (maps to CLI --output) */
  output?: string;
  /** PDF generation flag */
  pdf?: boolean;
  /** HTML generation flag */
  html?: boolean;
  /** Field highlighting flag */
  highlight?: boolean;
  /** Export YAML metadata flag */
  exportYaml?: boolean;
  /** Export JSON metadata flag */
  exportJson?: boolean;
  /** Custom output path for exports */
  outputPath?: string;
  /** Page format for PDF */
  format?: 'A4' | 'letter' | 'legal';
  /** Landscape orientation flag */
  landscape?: boolean;
  /** Debug mode flag */
  debug?: boolean;
  /** Custom title */
  title?: string;
}

/**
 * Commands that are not allowed to be overridden for security reasons
 */
const PROTECTED_COMMANDS = [
  'stdin',
  'stdout',
  'yaml',
  'headers',
  'no-headers',
  'no-clauses',
  'no-references',
  'no-imports',
  'no-mixins',
  'throwOnYamlError',
];

/**
 * Parse a force_commands string into structured options
 *
 * @param commandString - The command string from YAML front matter
 * @param metadata - Document metadata for template resolution
 * @param processingOptions - Current processing options for template context
 * @returns Parsed command options or null if parsing fails
 *
 * @example
 * ```typescript
 * const commands = parseForceCommands(
 *   "--css theme.css --pdf --output-name {{title}}_{{client}}.pdf",
 *   { title: "Contract", client: "Acme" },
 *   {}
 * );
 * // Returns: { css: "theme.css", pdf: true, output: "Contract_Acme.pdf" }
 * ```
 */
export function parseForceCommands(
  commandString: string,
  metadata: Record<string, any> = {},
  processingOptions: Partial<LegalMarkdownOptions> = {}
): ParsedCommands | null {
  if (!commandString || typeof commandString !== 'string') {
    return null;
  }

  logger.debug('Parsing force commands', { commandString, metadataKeys: Object.keys(metadata) });

  try {
    // First, resolve any template variables in the command string
    const resolvedCommandString = processMixins(commandString, metadata, {
      ...processingOptions,
      noMixins: false, // Always allow mixins in force_commands
    });

    logger.debug('Resolved command string', {
      original: commandString,
      resolved: resolvedCommandString,
    });

    // Split command string into arguments, respecting quoted strings
    const args = parseCommandArguments(resolvedCommandString);

    // Parse arguments into structured options
    const commands = parseArgumentsToCommands(args);

    // Validate and filter protected commands
    const safeCommands = validateAndFilterCommands(commands);

    logger.debug('Parsed force commands', { commands: safeCommands });

    return safeCommands;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn('Failed to parse force commands', { error: errorMessage, commandString });
    return null;
  }
}

/**
 * Parse command string into arguments array, respecting quoted strings
 *
 * @param commandString - Raw command string
 * @returns Array of parsed arguments
 *
 * @example
 * ```typescript
 * parseCommandArguments('--css "my file.css" --pdf')
 * // Returns: ['--css', 'my file.css', '--pdf']
 * ```
 */
function parseCommandArguments(commandString: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < commandString.length; i++) {
    const char = commandString[i];

    if ((char === '"' || char === "'") && !inQuotes) {
      // Starting a quoted string
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      // Ending a quoted string
      inQuotes = false;
      quoteChar = '';
    } else if (char === ' ' && !inQuotes) {
      // Space outside quotes - end current argument
      if (current.trim()) {
        args.push(current.trim());
        current = '';
      }
    } else {
      // Regular character
      current += char;
    }
  }

  // Add final argument if exists
  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

/**
 * Convert parsed arguments array into structured command options
 *
 * @param args - Array of command arguments
 * @returns Parsed command options
 */
function parseArgumentsToCommands(args: string[]): ParsedCommands {
  const commands: ParsedCommands = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (!arg.startsWith('-')) {
      continue; // Skip non-option arguments
    }

    // Normalize argument (remove leading dashes)
    const option = arg.replace(/^-+/, '');

    switch (option) {
      case 'css':
        commands.css = args[++i]; // Next argument is the CSS file path
        break;

      case 'output-name':
      case 'outputname':
        commands.output = args[++i]; // Map to existing --output CLI option
        break;

      case 'pdf':
        commands.pdf = true;
        break;

      case 'html':
        commands.html = true;
        break;

      case 'highlight':
        commands.highlight = true;
        break;

      case 'export-yaml':
        commands.exportYaml = true;
        break;

      case 'export-json':
        commands.exportJson = true;
        break;

      case 'output-path':
      case 'o':
        commands.outputPath = args[++i]; // Next argument is the output path
        break;

      case 'format': {
        const format = args[++i];
        if (['A4', 'letter', 'legal'].includes(format)) {
          commands.format = format as 'A4' | 'letter' | 'legal';
        }
        break;
      }

      case 'landscape':
        commands.landscape = true;
        break;

      case 'debug':
      case 'd':
        commands.debug = true;
        break;

      case 'title':
        commands.title = args[++i]; // Next argument is the title
        break;

      default:
        logger.debug('Unknown or ignored force command option', { option });
        break;
    }
  }

  return commands;
}

/**
 * Validate commands and filter out protected options
 *
 * @param commands - Raw parsed commands
 * @returns Validated and filtered commands
 */
function validateAndFilterCommands(commands: ParsedCommands): ParsedCommands {
  const safeCommands: ParsedCommands = {};

  // Copy all commands, but validate certain ones
  Object.entries(commands).forEach(([key, value]) => {
    if (PROTECTED_COMMANDS.includes(key)) {
      logger.warn('Protected command ignored in force_commands', { command: key });
      return;
    }

    // Validate file paths
    if ((key === 'css' || key === 'outputPath') && value) {
      const stringValue = String(value);
      if (stringValue.includes('..') || stringValue.startsWith('/')) {
        logger.warn('Potentially unsafe path in force_commands', {
          command: key,
          value: stringValue,
        });
        return;
      }
    }

    safeCommands[key as keyof ParsedCommands] = value;
  });

  return safeCommands;
}

/**
 * Apply parsed force commands to existing options
 *
 * Force commands will override existing options where applicable.
 * Some options (like processing flags) are preserved from original options.
 *
 * @param existingOptions - Current processing options
 * @param forceCommands - Parsed force commands to apply
 * @returns Updated options with force commands applied
 *
 * @example
 * ```typescript
 * const updated = applyForceCommands(
 *   { debug: false, pdf: false },
 *   { debug: true, css: "custom.css" }
 * );
 * // Returns: { debug: true, pdf: false, css: "custom.css" }
 * ```
 */
export function applyForceCommands(
  existingOptions: Partial<LegalMarkdownOptions> & Record<string, any>,
  forceCommands: ParsedCommands
): Partial<LegalMarkdownOptions> & Record<string, any> {
  const updatedOptions = { ...existingOptions };

  // Apply force commands with appropriate mapping to LegalMarkdownOptions
  if (forceCommands.css !== undefined) {
    updatedOptions.cssPath = forceCommands.css;
  }

  if (forceCommands.output !== undefined) {
    updatedOptions.output = forceCommands.output;
  }

  if (forceCommands.pdf !== undefined) {
    updatedOptions.pdf = forceCommands.pdf;
  }

  if (forceCommands.html !== undefined) {
    updatedOptions.html = forceCommands.html;
  }

  if (forceCommands.highlight !== undefined) {
    updatedOptions.highlight = forceCommands.highlight;
    updatedOptions.includeHighlighting = forceCommands.highlight;
  }

  if (forceCommands.exportYaml !== undefined) {
    updatedOptions.exportYaml = forceCommands.exportYaml;
    if (forceCommands.exportYaml) {
      updatedOptions.exportMetadata = true;
      updatedOptions.exportFormat = 'yaml';
    }
  }

  if (forceCommands.exportJson !== undefined) {
    updatedOptions.exportJson = forceCommands.exportJson;
    if (forceCommands.exportJson) {
      updatedOptions.exportMetadata = true;
      updatedOptions.exportFormat = 'json';
    }
  }

  if (forceCommands.outputPath !== undefined) {
    updatedOptions.outputPath = forceCommands.outputPath;
  }

  if (forceCommands.format !== undefined) {
    updatedOptions.format = forceCommands.format;
  }

  if (forceCommands.landscape !== undefined) {
    updatedOptions.landscape = forceCommands.landscape;
  }

  if (forceCommands.debug !== undefined) {
    updatedOptions.debug = forceCommands.debug;
  }

  if (forceCommands.title !== undefined) {
    updatedOptions.title = forceCommands.title;
  }

  logger.debug('Applied force commands to options', {
    original: existingOptions,
    forceCommands,
    updated: updatedOptions,
  });

  return updatedOptions;
}

/**
 * Check if metadata contains force_commands and extract them
 *
 * @param metadata - Document metadata from YAML front matter
 * @returns Force commands string or null if not found
 */
export function extractForceCommands(metadata: Record<string, any>): string | null {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  // Check for force_commands field (various naming conventions)
  const possibleKeys = ['force_commands', 'force-commands', 'forceCommands', 'commands'];

  for (const key of possibleKeys) {
    if (key in metadata && typeof metadata[key] === 'string') {
      logger.debug('Found force commands in metadata', { key, commands: metadata[key] });
      return metadata[key];
    }
  }

  return null;
}
