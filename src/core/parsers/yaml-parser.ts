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
  let yamlContent = content.substring(3, endDelimiterIndex).trim();
  const remainingContent = content.substring(endDelimiterIndex + 3).trim();

  // Process @today references in YAML content before parsing
  yamlContent = processDateReferencesInYaml(yamlContent);

  try {
    // Parse YAML
    const metadata = yaml.load(yamlContent) as Record<string, any>;

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
    if (throwOnError) {
      // Throw error for CLI to handle
      throw new Error(
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
export function serializeToYaml(metadata: Record<string, any>): string {
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
export function extractMetadataOutputConfig(metadata: Record<string, any>): {
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

/**
 * Processes @today references in YAML content before parsing
 *
 * Replaces @today references with properly formatted date strings that are valid YAML.
 * This prevents YAML parsing errors when @today is used in frontmatter.
 *
 * @private
 * @param {string} yamlContent - The raw YAML content containing @today references
 * @returns {string} YAML content with @today references replaced by actual dates
 * @example
 * ```typescript
 * const yamlContent = `
 * title: Document
 * date: @today
 * deadline: @today[long]
 * `;
 *
 * const processed = processDateReferencesInYaml(yamlContent);
 * // Returns:
 * // title: Document
 * // date: "2024-01-15"
 * // deadline: "January 15, 2024"
 * ```
 */
function processDateReferencesInYaml(yamlContent: string): string {
  // Regular expression to match @today references with optional format specifiers
  const todayPattern = /@today(?:\[([^\]]+)\])?/g;

  return yamlContent.replace(todayPattern, (match, formatOverride) => {
    // Use format override if provided, otherwise use ISO format for YAML compatibility
    const format = formatOverride || 'YYYY-MM-DD';
    const formattedDate = formatDateForYaml(new Date(), format);

    // Quote the date string to ensure it's valid YAML
    return `"${formattedDate}"`;
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
    // Handle different format patterns
    switch (format.toLowerCase()) {
      case 'iso':
      case 'yyyy-mm-dd':
        return date.toISOString().split('T')[0];

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
        return date.toISOString().split('T')[0];
    }
  } catch (error) {
    // Fallback to ISO format if there's an error
    return date.toISOString().split('T')[0];
  }
}
