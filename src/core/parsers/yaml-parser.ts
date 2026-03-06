/**
 * YAML Front Matter Parser for Legal Markdown Documents
 *
 * This module provides functionality to parse YAML front matter from Legal Markdown
 * documents, extracting metadata and configuration options for document processing.
 * It handles both valid and invalid YAML gracefully, with options for strict error
 * handling when needed.
 *
 * Features:
 * - YAML front matter parsing with js-yaml library
 * - Graceful error handling for malformed YAML
 * - Metadata extraction and validation
 * - Content separation from front matter
 * - YAML serialization utilities
 * - Metadata output configuration extraction
 *
 * @example
 * ```typescript
 * import { parseYamlFrontMatter } from './yaml-parser';
 *
 * const content = `---
 * title: Legal Agreement
 * date: 2024-01-01
 * parties:
 *   - name: Company A
 *     role: Provider
 * ---
 * # Agreement Content
 * This is the document content.`;
 *
 * const result = parseYamlFrontMatter(content);
 * console.log(result.metadata.title); // "Legal Agreement"
 * console.log(result.content); // "# Agreement Content\nThis is the document content."
 * ```
 *
 * @module
 */

import * as yaml from 'js-yaml';
import { YamlParsingResult } from '../../types';
import type { YamlValue } from '../../types';
import { YamlParsingError } from '../../errors';

// ============================================================================
// CUSTOM YAML SCHEMA FOR ISO DATE PARSING
// ============================================================================
// This schema automatically parses ISO date strings (YYYY-MM-DD) as Date objects
// Fixes Issue #142: Allows date helpers to work with YAML date fields without @today
//
// Example:
// ---
// startDate: 2025-01-15  # ← Automatically parsed as Date object
// ---
// {{addYears startDate 2}}  # ← Now works!

/**
 * Custom YAML type for automatic ISO date parsing
 * Converts ISO date strings to Date objects during YAML parsing
 */
const DateType = new yaml.Type('tag:yaml.org,2002:timestamp', {
  kind: 'scalar',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- js-yaml TypeConstructorOptions requires any
  resolve: (data: any) => {
    if (typeof data === 'string') {
      // Match ISO date patterns: YYYY-MM-DD or full ISO datetime
      const isoDatePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
      return isoDatePattern.test(data);
    }
    return false;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- js-yaml TypeConstructorOptions requires any
  construct: (data: any) => {
    // Parse ISO string to Date object
    const date = new Date(data);
    // Validate that the date is valid
    if (isNaN(date.getTime())) {
      throw new YamlParsingError(`Invalid date: ${data}`, { data });
    }
    return date;
  },
  instanceOf: Date,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- js-yaml TypeConstructorOptions requires any
  represent: (data: any) => {
    if (data instanceof Date) {
      return data.toISOString();
    }
    return String(data);
  },
});

/**
 * Custom YAML schema extending default schema with ISO date parsing
 */
const LEGAL_MARKDOWN_SCHEMA = yaml.DEFAULT_SCHEMA.extend([DateType]);

const MAX_YAML_SIZE = 1024 * 1024;
const MAX_YAML_DEPTH = 20;
const MAX_YAML_ALIAS_REFS = 100;

/**
 * Parses YAML Front Matter from a markdown document
 *
 * Extracts and parses YAML metadata from the beginning of a document,
 * separated by triple dashes (---). The parser handles malformed YAML
 * gracefully unless strict error handling is enabled.
 *
 * @param {string} content - The content of the document to parse
 * @param {boolean} [throwOnError=false] - Whether to throw errors on invalid YAML
 * @returns {YamlParsingResult} Object containing the content without YAML and the parsed metadata
 * @throws {Error} When throwOnError is true and YAML parsing fails
 * @example
 * ```typescript
 * // Basic usage with valid YAML
 * const content = `---
 * title: Contract
 * version: 1.0
 * ---
 * # Contract Content`;
 *
 * const result = parseYamlFrontMatter(content);
 * // result.metadata = { title: "Contract", version: 1.0 }
 * // result.content = "# Contract Content"
 *
 * // Usage with error handling
 * const malformedContent = `---
 * title: Contract
 * invalid: yaml: content
 * ---
 * # Content`;
 *
 * const safeResult = parseYamlFrontMatter(malformedContent, false);
 * // Returns original content with empty metadata
 *
 * const strictResult = parseYamlFrontMatter(malformedContent, true);
 * // Throws Error: "Invalid YAML Front Matter: ..."
 * ```
 */
export function parseYamlFrontMatter(
  content: string,
  throwOnError: boolean = false
): YamlParsingResult {
  // Default result
  const defaultResult: YamlParsingResult = {
    content,
    metadata: {},
  };

  // Check if content starts with YAML delimiter
  if (!content.startsWith('---')) {
    return defaultResult;
  }

  // Find the closing delimiter
  const endDelimiterIndex = content.indexOf('---', 3);
  if (endDelimiterIndex === -1) {
    return defaultResult;
  }

  // Extract YAML content
  const rawYamlContent = content.substring(3, endDelimiterIndex).trim();
  let yamlContent = rawYamlContent;
  const remainingContent = content.substring(endDelimiterIndex + 3).trim();

  if (Buffer.byteLength(rawYamlContent, 'utf8') > MAX_YAML_SIZE) {
    throw new YamlParsingError(`YAML frontmatter exceeds maximum size of ${MAX_YAML_SIZE} bytes`, {
      safetyLimit: true,
      limit: 'size',
      max: MAX_YAML_SIZE,
    });
  }

  const aliasReferenceCount = countYamlAliasReferences(rawYamlContent);
  if (aliasReferenceCount > MAX_YAML_ALIAS_REFS) {
    throw new YamlParsingError(
      `YAML frontmatter exceeds maximum alias references (${MAX_YAML_ALIAS_REFS})`,
      { safetyLimit: true, limit: 'aliasRefs', max: MAX_YAML_ALIAS_REFS }
    );
  }

  // Process @today references in YAML content before parsing
  yamlContent = processDateReferencesInYaml(yamlContent);

  try {
    // Parse YAML with custom schema that auto-parses ISO dates
    const metadata = yaml.load(yamlContent, {
      schema: LEGAL_MARKDOWN_SCHEMA,
    }) as Record<string, YamlValue>;

    if (getYamlDepth(metadata) > MAX_YAML_DEPTH) {
      throw new YamlParsingError(`YAML frontmatter exceeds maximum depth of ${MAX_YAML_DEPTH}`, {
        safetyLimit: true,
        limit: 'depth',
        max: MAX_YAML_DEPTH,
      });
    }

    // Handle empty YAML
    if (!metadata || typeof metadata !== 'object') {
      return {
        content: remainingContent,
        metadata: {},
      };
    }

    return {
      content: remainingContent,
      metadata,
    };
  } catch (error) {
    if (error instanceof YamlParsingError && error.context?.safetyLimit === true) {
      throw error;
    }

    if (throwOnError) {
      // Throw error for CLI to handle
      throw new YamlParsingError(
        `Invalid YAML Front Matter: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } else {
      // Even if YAML parsing fails, if we detected frontmatter structure,
      // we should still extract the content that comes after it to avoid
      // treating malformed frontmatter as content
      return {
        content: remainingContent,
        metadata: {},
      };
    }
  }
}

function countYamlAliasReferences(yamlContent: string): number {
  const aliasPattern = /(?:^|[\s[\]{},])\*[A-Za-z0-9_-]+/gm;
  return yamlContent.match(aliasPattern)?.length ?? 0;
}

function getYamlDepth(value: unknown, currentDepth = 0): number {
  if (value === null || value === undefined || typeof value !== 'object') {
    return currentDepth;
  }

  const nextDepth = currentDepth + 1;

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return nextDepth;
    }

    return Math.max(...value.map(item => getYamlDepth(item, nextDepth)));
  }

  const objectValues = Object.values(value);
  if (objectValues.length === 0) {
    return nextDepth;
  }

  return Math.max(...objectValues.map(item => getYamlDepth(item, nextDepth)));
}

/**
 * Serializes metadata to YAML format
 *
 * Converts a JavaScript object to YAML string format using js-yaml library.
 * Handles serialization errors gracefully by returning an empty string and
 * logging the error to the console.
 *
 * @param {Record<string, any>} metadata - The metadata object to serialize
 * @returns {string} YAML string representation of the metadata
 * @example
 * ```typescript
 * const metadata = {
 *   title: "Legal Agreement",
 *   date: "2024-01-01",
 *   parties: [
 *     { name: "Company A", role: "Provider" },
 *     { name: "Company B", role: "Client" }
 *   ]
 * };
 *
 * const yamlString = serializeToYaml(metadata);
 * console.log(yamlString);
 * // Output:
 * // title: Legal Agreement
 * // date: '2024-01-01'
 * // parties:
 * //   - name: Company A
 * //     role: Provider
 * //   - name: Company B
 * //     role: Client
 * ```
 */
export function serializeToYaml(metadata: Record<string, YamlValue>): string {
  try {
    return yaml.dump(metadata);
  } catch (error) {
    console.error('Error serializing metadata to YAML:', error);
    return '';
  }
}

/**
 * Extracts specific metadata output configuration
 *
 * Parses document metadata to extract configuration options for metadata output,
 * including file paths, formats, and inclusion settings. This function looks for
 * specially named metadata fields that control how processed metadata is exported.
 *
 * @param {Record<string, any>} metadata - The document metadata to extract configuration from
 * @returns {Object} Configuration object for metadata output
 * @returns {string} [returns.yamlOutput] - Path for YAML metadata output file
 * @returns {string} [returns.jsonOutput] - Path for JSON metadata output file
 * @returns {string} [returns.outputPath] - General output path for metadata files
 * @returns {boolean} [returns.includeOriginal] - Whether to include original metadata in output
 * @example
 * ```typescript
 * const metadata = {
 *   title: "Contract",
 *   "meta-yaml-output": "contract-metadata.yml",
 *   "meta-json-output": "contract-metadata.json",
 *   "meta-output-path": "./output/",
 *   "meta-include-original": true
 * };
 *
 * const config = extractMetadataOutputConfig(metadata);
 * console.log(config);
 * // Output:
 * // {
 * //   yamlOutput: "contract-metadata.yml",
 * //   jsonOutput: "contract-metadata.json",
 * //   outputPath: "./output/",
 * //   includeOriginal: true
 * // }
 * ```
 */
export function extractMetadataOutputConfig(metadata: Record<string, YamlValue>): {
  yamlOutput?: string;
  jsonOutput?: string;
  outputPath?: string;
  includeOriginal?: boolean;
} {
  return {
    yamlOutput: metadata['meta-yaml-output'] as string,
    jsonOutput: metadata['meta-json-output'] as string,
    outputPath: metadata['meta-output-path'] as string,
    includeOriginal: metadata['meta-include-original'] as boolean,
  };
}

// Date arithmetic functionality is now handled by the remark dates plugin

/**
 * Processes `@today` references in YAML content before parsing.
 *
 * Replaces `@today` references with properly formatted date strings that are valid YAML.
 * Supports arithmetic operations like `@today+365` or `@today-30` and format specifiers.
 * This prevents YAML parsing errors when `@today` is used in frontmatter.
 *
 * @private
 * @param {string} yamlContent - The raw YAML content containing `@today` references.
 * @returns {string} YAML content with `@today` references replaced by actual dates.
 * @example
 * ```typescript
 * const yamlContent = `
 * title: Document
 * date: "@today"
 * deadline: "@today+365"
 * start_date: "@today-30[long]"
 * `;
 *
 * const processed = processDateReferencesInYaml(yamlContent);
 * // Returns:
 * // title: Document
 * // date: "2024-01-15"
 * // deadline: "2025-01-15"
 * // start_date: "December 16, 2023"
 * ```
 */
function processDateReferencesInYaml(yamlContent: string): string {
  // Basic regular expression to match @today references with format specifiers only
  const todayPattern = /@today(?:\[([^\]]+)\])?/g;

  return yamlContent.replace(todayPattern, (match, formatOverride) => {
    try {
      // Use current date
      const date = new Date();

      // Use format override if provided, otherwise use ISO format for YAML compatibility
      const format = formatOverride || 'YYYY-MM-DD';
      const formattedDate = formatDateForYaml(date, format);

      // Quote the date string to ensure it's valid YAML
      return `"${formattedDate}"`;
    } catch (error) {
      console.warn(`Error processing YAML date reference ${match}:`, error);
      return `"${match}"`; // Return quoted original on error for valid YAML
    }
  });
}

/**
 * Formats a date for YAML compatibility
 *
 * @private
 * @param {Date} date - The date to format
 * @param {string} format - Format specification
 * @returns {string} Formatted date string
 */
function formatDateForYaml(date: Date, format: string): string {
  try {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dayNumber = date.getDate();

    // Month names for legal format
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    // Handle different format patterns
    switch (format.toLowerCase()) {
      case 'iso':
      case 'yyyy-mm-dd':
        return `${year}-${month}-${day}`;

      case 'us':
      case 'mm/dd/yyyy':
        return `${month}/${day}/${year}`;

      case 'eu':
      case 'dd/mm/yyyy':
        return `${day}/${month}/${year}`;

      case 'legal':
        return `${monthNames[date.getMonth()]} ${dayNumber}, ${year}`;

      case 'long':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

      case 'medium':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });

      case 'short':
        return date.toLocaleDateString('en-US', {
          year: '2-digit',
          month: 'short',
          day: 'numeric',
        });

      default:
        // For any other format, default to ISO
        return `${year}-${month}-${day}`;
    }
  } catch (_error) {
    // Fallback to ISO format if there's an error
    return date.toISOString().split('T')[0];
  }
}

// Exported for testing - not part of public API
export {
  getYamlDepth as _getYamlDepth,
  processDateReferencesInYaml as _processDateReferencesInYaml,
  formatDateForYaml as _formatDateForYaml,
};
