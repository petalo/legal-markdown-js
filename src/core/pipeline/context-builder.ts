/**
 * Phase 1: Processing Context Builder
 *
 * This module implements Phase 1 of the 3-phase pipeline architecture.
 * It handles document parsing, force-commands resolution, and creates
 * a unified processing context for subsequent phases.
 *
 * Key responsibilities:
 * - Parse YAML frontmatter
 * - Resolve force-commands templates (using remark-based processor)
 * - Merge CLI options, force-commands, and metadata
 * - Create ProcessingContext for Phase 2
 *
 * @module core/pipeline/context-builder
 */

import { parseYamlFrontMatter } from '../parsers/yaml-parser';
import {
  extractForceCommands,
  parseForceCommands,
  applyForceCommands,
} from '../parsers/force-commands-parser';
import { LegalMarkdownOptions } from '../../types';
import { logger } from '../../utils/logger';

/**
 * Processing context created by Phase 1
 *
 * This object contains all information needed for Phase 2 processing:
 * - Raw content to process
 * - Merged and resolved metadata
 * - Final processing options (CLI + force-commands + defaults)
 * - Base path for file operations
 */
export interface ProcessingContext {
  /** Raw markdown content (after YAML extraction) */
  content: string;

  /** Original raw content including YAML frontmatter */
  rawContent: string;

  /** Merged metadata from YAML + additional sources */
  metadata: Record<string, any>;

  /** Final processing options (CLI + force-commands merged) */
  options: ProcessingOptions;

  /** Base path for resolving relative file paths */
  basePath: string;
}

/**
 * Processing options for the unified pipeline
 *
 * Combines LegalMarkdownOptions with additional CLI-specific options
 */
export interface ProcessingOptions extends LegalMarkdownOptions {
  /** Enable verbose logging */
  verbose?: boolean;

  /** Generate PDF output */
  pdf?: boolean;

  /** Generate HTML output */
  html?: boolean;

  /** Enable field highlighting */
  highlight?: boolean;

  /** Path to custom CSS file */
  css?: string;

  /** Document title */
  title?: string;

  /** Archive source file after processing */
  archiveSource?: string | boolean;

  /** Export to markdown */
  toMarkdown?: boolean;

  /** Export YAML metadata */
  exportYaml?: boolean;

  /** Export JSON metadata */
  exportJson?: boolean;

  /** Custom output path */
  output?: string;

  /** Output path for exports */
  outputPath?: string;

  /** Page format for PDF */
  format?: 'A4' | 'Letter' | 'Legal';

  /** Landscape orientation */
  landscape?: boolean;

  /** Additional metadata to merge */
  additionalMetadata?: Record<string, any>;

  /** Include highlighting in output */
  includeHighlighting?: boolean;

  /** CSS path (internal) */
  cssPath?: string;

  /** Highlight CSS path */
  highlightCssPath?: string;

  /** Silent mode (suppress output) */
  silent?: boolean;

  /** Enable field tracking in markdown */
  enableFieldTrackingInMarkdown?: boolean;

  /** Auto-populate YAML headers */
  autoPopulateHeaders?: boolean;
}

/**
 * Build a processing context from raw content and options
 *
 * This is the entry point for Phase 1. It:
 * 1. Parses YAML frontmatter to extract metadata
 * 2. Extracts and resolves force-commands (if present)
 * 3. Merges all options (CLI + force-commands + defaults)
 * 4. Creates a unified ProcessingContext for Phase 2
 *
 * @param rawContent - Raw markdown content with optional YAML frontmatter
 * @param cliOptions - Options from CLI or API call
 * @param basePath - Base path for file resolution
 * @returns ProcessingContext ready for Phase 2 processing
 *
 * @example
 * ```typescript
 * const context = await buildProcessingContext(
 *   fileContent,
 *   { pdf: true, highlight: true },
 *   '/path/to/input/dir'
 * );
 * // context.options contains merged CLI + force-commands options
 * // context.metadata contains parsed YAML + additional metadata
 * ```
 */
export async function buildProcessingContext(
  rawContent: string,
  cliOptions: Partial<ProcessingOptions> = {},
  basePath: string = '.'
): Promise<ProcessingContext> {
  const startTime = Date.now();

  if (cliOptions.debug) {
    logger.debug('Phase 1: Building processing context', {
      basePath,
      cliOptions: Object.keys(cliOptions),
    });
  }

  // Step 1: Parse YAML frontmatter
  const { content, metadata } = parseYamlFrontMatter(rawContent, false);

  if (cliOptions.debug) {
    logger.debug('Parsed YAML frontmatter', {
      metadataKeys: Object.keys(metadata || {}),
      hasMetadata: !!metadata,
    });
  }

  // Step 2: Start with CLI options as base
  let effectiveOptions: Partial<ProcessingOptions> = {
    ...cliOptions,
    basePath,
    // Enable field tracking if highlight is requested
    enableFieldTracking: cliOptions.enableFieldTracking || cliOptions.highlight,
  };

  // Step 3: Process force-commands if present
  if (metadata) {
    const forceCommandsString = extractForceCommands(metadata);

    if (forceCommandsString) {
      if (cliOptions.debug) {
        logger.debug('Found force commands', { forceCommands: forceCommandsString });
      }

      // Parse force commands (this will use template resolution internally)
      const parsedForceCommands = parseForceCommands(
        forceCommandsString,
        metadata,
        effectiveOptions
      );

      if (parsedForceCommands) {
        // Apply force commands to effective options
        effectiveOptions = applyForceCommands(effectiveOptions, parsedForceCommands);

        if (cliOptions.debug) {
          logger.debug('Applied force commands', {
            commands: Object.keys(parsedForceCommands),
          });
        }
      }
    }
  }

  // Step 3.5: Re-check field tracking after force-commands are applied
  // If force-commands enabled highlight, make sure field tracking is also enabled
  if (effectiveOptions.highlight && !effectiveOptions.enableFieldTracking) {
    effectiveOptions.enableFieldTracking = true;
    if (cliOptions.debug) {
      logger.debug('Auto-enabled field tracking due to highlight option');
    }
  }

  // Step 4: Merge additional metadata if provided
  const finalMetadata = {
    ...(metadata || {}),
    ...(cliOptions.additionalMetadata || {}),
  };

  const processingTime = Date.now() - startTime;

  if (cliOptions.debug) {
    logger.debug('Phase 1 complete', {
      processingTime: `${processingTime}ms`,
      finalOptions: Object.keys(effectiveOptions),
      metadataKeys: Object.keys(finalMetadata),
    });
  }

  return {
    content,
    rawContent,
    metadata: finalMetadata,
    options: effectiveOptions as ProcessingOptions,
    basePath,
  };
}

/**
 * Merge multiple metadata objects with proper handling of nested objects
 *
 * This function is used when combining metadata from multiple sources:
 * - Document YAML frontmatter
 * - Imported file metadata
 * - Additional metadata from API/CLI
 *
 * @param target - Target metadata object to merge into
 * @param source - Source metadata to merge from
 * @returns Merged metadata object
 * @internal
 */
export function mergeMetadata(
  target: Record<string, any>,
  source: Record<string, any>
): Record<string, any> {
  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively merge nested objects
      result[key] = mergeMetadata(result[key] || {}, value);
    } else {
      // Direct assignment for primitives and arrays
      result[key] = value;
    }
  }

  return result;
}

/**
 * Validate processing context for Phase 2
 *
 * Ensures that the context has all required fields and valid values.
 * This helps catch configuration errors early in the pipeline.
 *
 * @param context - Processing context to validate
 * @throws Error if context is invalid
 * @internal
 */
export function validateProcessingContext(context: ProcessingContext): void {
  if (!context) {
    throw new Error('Processing context is null or undefined');
  }

  if (typeof context.content !== 'string') {
    throw new Error('Processing context content must be a string');
  }

  if (!context.metadata || typeof context.metadata !== 'object') {
    throw new Error('Processing context metadata must be an object');
  }

  if (!context.options || typeof context.options !== 'object') {
    throw new Error('Processing context options must be an object');
  }

  if (typeof context.basePath !== 'string') {
    throw new Error('Processing context basePath must be a string');
  }
}
