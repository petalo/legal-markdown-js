/**
 * YAML Front Matter Auto-Population Module for Legal Markdown Documents
 *
 * This module provides functionality to auto-populate YAML front matter with inferred
 * header level patterns and processing properties following the original Legal Markdown
 * specification. It analyzes document structure and generates enhanced metadata.
 *
 * Features:
 * - Document structure analysis for header level inference
 * - Auto-population of missing header level definitions
 * - Properties section generation (no-indent, no-reset, level-style)
 * - YAML front matter enhancement and standardization
 * - Support for both traditional (l., ll., lll.) and alternative syntax
 *
 * @example
 * ```typescript
 * import { autoPopulateYamlFrontMatter } from './yaml-auto-population';
 *
 * const content = `---
 * level-1: "Article 1."
 * level-2: "Section 1."
 * ---
 * l. Introduction
 * ll. Terms`;
 *
 * const enhanced = autoPopulateYamlFrontMatter(content);
 * // Returns document with enhanced YAML front matter including
 * // all level definitions and Properties section
 * ```
 *
 * @module
 */

import { parseYamlFrontMatter, serializeToYaml } from '../parsers/yaml-parser';
import { DEFAULT_HEADER_PATTERNS, DEFAULT_PROPERTIES } from '../../constants/headers';

/**
 * Configuration for YAML auto-population
 */
interface YamlAutoPopulationOptions {
  /** Whether to add Properties section with processing configurations */
  includeProperties?: boolean;
  /** Whether to infer missing header levels from document content */
  inferMissingLevels?: boolean;
  /** Whether to ensure all level definitions are properly quoted */
  ensureQuotedLevels?: boolean;
}

/**
 * Default header level patterns following Legal Markdown conventions
 *
 * For complete documentation on header formats and variable usage, see:
 * @see {@link ../../../docs/headers_numbering.md} - Complete guide to headers and numbering system
 */

/**
 * Auto-populates YAML front matter with inferred header patterns and properties
 *
 * Analyzes the document structure and enhances the YAML front matter with:
 * - Missing header level definitions
 * - Properties section with processing configurations
 * - Properly quoted level definitions
 *
 * @param {string} content - The document content with YAML front matter
 * @param {YamlAutoPopulationOptions} [options={}] - Configuration options
 * @returns {string} Document with enhanced YAML front matter
 * @example
 * ```typescript
 * const input = `---
 * level-1: "Article 1."
 * ---
 * l. Introduction
 * ll. Terms`;
 *
 * const result = autoPopulateYamlFrontMatter(input);
 * // Returns document with complete level definitions and Properties section
 * ```
 */
export function autoPopulateYamlFrontMatter(
  content: string,
  options: YamlAutoPopulationOptions = {}
): string {
  const {
    includeProperties = true,
    inferMissingLevels = true,
    ensureQuotedLevels = true,
  } = options;

  // Parse existing YAML front matter
  const parsed = parseYamlFrontMatter(content);

  if (!content.startsWith('---')) {
    // No YAML front matter exists, create minimal structure
    const enhancedMetadata = createEnhancedMetadata({}, includeProperties, inferMissingLevels);
    const yamlString = formatEnhancedYaml(enhancedMetadata);
    return `---\n${yamlString}---\n\n${content}`;
  }

  // Enhance existing metadata
  const enhancedMetadata = createEnhancedMetadata(
    parsed.metadata,
    includeProperties,
    inferMissingLevels,
    ensureQuotedLevels
  );

  // Serialize enhanced metadata with custom formatting
  const yamlString = formatEnhancedYaml(enhancedMetadata);

  return `---\n${yamlString}---\n\n${parsed.content}`;
}

/**
 * Creates enhanced metadata with structured headers and properties sections
 *
 * @private
 * @param {Record<string, any>} existingMetadata - Current document metadata
 * @param {boolean} includeProperties - Whether to include Properties section
 * @param {boolean} inferMissingLevels - Whether to infer missing levels
 * @param {boolean} ensureQuotedLevels - Whether to ensure levels are quoted
 * @returns {Record<string, any>} Enhanced metadata object
 */
function createEnhancedMetadata(
  existingMetadata: Record<string, any>,
  includeProperties: boolean = true,
  inferMissingLevels: boolean = true,
  ensureQuotedLevels: boolean = true
): Record<string, any> {
  const enhanced: Record<string, any> = {};

  // Add comment for Structured Headers section
  enhanced['# Structured Headers'] = null;

  // Process header levels (level-1 through level-9)
  for (let i = 1; i <= 9; i++) {
    const levelKey = `level-${i}`;
    let levelValue = existingMetadata[levelKey];

    if (!levelValue && inferMissingLevels) {
      // Use default pattern if missing
      levelValue = DEFAULT_HEADER_PATTERNS[levelKey as keyof typeof DEFAULT_HEADER_PATTERNS];
    }

    if (levelValue) {
      // Store the value as-is, formatting will handle quoting
      enhanced[levelKey] = levelValue;
    }
  }

  // Add other existing metadata (excluding level-* keys)
  for (const [key, value] of Object.entries(existingMetadata)) {
    if (!key.startsWith('level-') && !key.startsWith('#')) {
      enhanced[key] = value;
    }
  }

  // Add Properties section if requested
  if (includeProperties) {
    enhanced['# Properties'] = null;

    // Add default properties if not already present
    for (const [propKey, defaultValue] of Object.entries(DEFAULT_PROPERTIES)) {
      if (!(propKey in existingMetadata)) {
        enhanced[propKey] = defaultValue;
      } else {
        enhanced[propKey] = existingMetadata[propKey];
      }
    }
  }

  return enhanced;
}

/**
 * Analyzes document content to infer header usage patterns
 *
 * Scans the document content to determine which header levels are actually used
 * and what no-indent patterns might be appropriate.
 *
 * @private
 * @param {string} content - The document content to analyze
 * @returns {Object} Analysis results with detected patterns
 */
function analyzeDocumentStructure(content: string): {
  usedLevels: number[];
  noIndentPattern: string;
  hasAlternativeSyntax: boolean;
} {
  const lines = content.split('\n');
  const usedLevels: Set<number> = new Set();
  const noIndentLines: string[] = [];
  let hasAlternativeSyntax = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check for traditional syntax (l., ll., lll., etc.)
    const traditionalMatch = trimmedLine.match(/^(l+)\.\s/);
    if (traditionalMatch) {
      const level = traditionalMatch[1].length;
      usedLevels.add(level);
      noIndentLines.push(traditionalMatch[1] + '.');
    }

    // Check for alternative syntax (l2., l3., etc.)
    const alternativeMatch = trimmedLine.match(/^l(\d+)\.\s/);
    if (alternativeMatch) {
      const level = parseInt(alternativeMatch[1], 10);
      usedLevels.add(level);
      hasAlternativeSyntax = true;
      noIndentLines.push(`l${level}.`);
    }
  }

  return {
    usedLevels: Array.from(usedLevels).sort((a, b) => a - b),
    noIndentPattern: noIndentLines.length > 0 ? noIndentLines.join(', ') : '',
    hasAlternativeSyntax,
  };
}

/**
 * Generates appropriate no-indent pattern based on document analysis
 *
 * @private
 * @param {string} content - Document content to analyze
 * @returns {string} Comma-separated no-indent pattern
 */
export function generateNoIndentPattern(content: string): string {
  const analysis = analyzeDocumentStructure(content);
  return analysis.noIndentPattern;
}

/**
 * Validates and normalizes YAML front matter structure
 *
 * Ensures the YAML front matter follows the expected structure with
 * proper sectioning and formatting.
 *
 * @param {Record<string, any>} metadata - Metadata to validate
 * @returns {Record<string, any>} Normalized metadata
 */
export function normalizeYamlStructure(metadata: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};

  // Ensure Structured Headers section comes first
  normalized['# Structured Headers'] = null;

  // Add level definitions in order
  for (let i = 1; i <= 9; i++) {
    const levelKey = `level-${i}`;
    if (metadata[levelKey]) {
      normalized[levelKey] = metadata[levelKey];
    }
  }

  // Add other metadata (excluding comments and level keys)
  for (const [key, value] of Object.entries(metadata)) {
    if (!key.startsWith('level-') && !key.startsWith('#')) {
      normalized[key] = value;
    }
  }

  // Add Properties section
  if (
    metadata['no-indent'] !== undefined ||
    metadata['no-reset'] !== undefined ||
    metadata['level-style'] !== undefined
  ) {
    normalized['# Properties'] = null;

    if (metadata['no-indent'] !== undefined) {
      normalized['no-indent'] = metadata['no-indent'];
    }
    if (metadata['no-reset'] !== undefined) {
      normalized['no-reset'] = metadata['no-reset'];
    }
    if (metadata['level-style'] !== undefined) {
      normalized['level-style'] = metadata['level-style'];
    }
  }

  return normalized;
}

/**
 * Formats enhanced metadata as YAML with proper comment handling
 *
 * @private
 * @param {Record<string, any>} metadata - Enhanced metadata to format
 * @returns {string} Formatted YAML string
 */
function formatEnhancedYaml(metadata: Record<string, any>): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(metadata)) {
    if (key.startsWith('#')) {
      // Add comment line
      lines.push(key);
    } else if (value === null || value === undefined) {
      // Skip null values (used for comments)
      continue;
    } else if (typeof value === 'string') {
      // Handle string values, preserving existing quotes or adding them
      let formattedValue = value;
      if (value === '') {
        formattedValue = '""';
      } else if (!value.startsWith('"') || !value.endsWith('"')) {
        // Only add quotes if not already quoted
        formattedValue = `"${value}"`;
      }
      lines.push(`${key}: ${formattedValue}`);
    } else if (key.startsWith('level-')) {
      // For level keys, always treat as quoted strings even if they're numbers
      lines.push(`${key}: "${value}"`);
    } else {
      // Handle other values
      lines.push(`${key}: ${JSON.stringify(value)}`);
    }
  }

  return lines.join('\n') + '\n';
}
