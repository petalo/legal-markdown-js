/**
 * @fileoverview Pipeline Configuration for Legal Markdown Processing
 *
 * This module provides the default pipeline configuration and factory functions
 * for creating Legal Markdown processing pipelines. It connects existing processors
 * with the new pipeline management system while maintaining full backward compatibility.
 *
 * Features:
 * - Default pipeline configuration matching current processing order
 * - Processor wrapper classes implementing BaseProcessor interface
 * - Factory functions for different processing contexts (HTML, PDF, markdown)
 * - Configuration validation and error handling
 * - Support for custom pipeline configurations
 * - Integration with existing Legal Markdown processors
 *
 * @example
 * ```typescript
 * import { createDefaultPipeline, createHtmlPipeline } from './pipeline-config';
 *
 * // Create standard pipeline
 * const pipeline = createDefaultPipeline();
 *
 * // Create pipeline optimized for HTML generation
 * const htmlPipeline = createHtmlPipeline({
 *   enableFieldTracking: true,
 *   includeHighlighting: true
 * });
 *
 * // Execute processing
 * const result = await pipeline.execute(content, metadata, options);
 * ```
 */

import { BaseProcessor, AbstractProcessor } from '@core';
import { LegalMarkdownOptions } from '@types';
import { parseYamlFrontMatter } from '@core/parsers/yaml-parser';
import { processHeaders } from '@core/processors/header-processor';
import { processOptionalClauses } from '@core/processors/clause-processor';
import { processCrossReferences } from '@core/processors/reference-processor';
import { processPartialImports } from '@core/processors/import-processor';
import { processMixins } from '@extensions/ast-mixin-processor';
import { processTemplateLoops } from '@extensions/template-loops';
import { exportMetadata } from '@core/exporters/metadata-exporter';
import { convertRstToLegalMarkdown, convertRstToLegalMarkdownSync } from '@extensions/rst-parser';
import {
  convertLatexToLegalMarkdown,
  convertLatexToLegalMarkdownSync,
} from '@extensions/latex-parser';
import { fieldTracker } from '../tracking/field-tracker';
import { PipelineManager } from './pipeline-manager';
import { PipelineStep, PipelineConfig } from './types';
import { ConsolePipelineLogger, LogLevel } from './pipeline-logger';

/**
 * Wrapper for RST conversion processor
 */
class RstProcessor extends AbstractProcessor {
  readonly name = 'rst-conversion';

  isEnabled(): boolean {
    return true; // RST conversion is always enabled as a preprocessing step
  }

  protected performProcessing(
    content: string,
    metadata: Record<string, any>,
    options: LegalMarkdownOptions
  ): string {
    try {
      // Use sync version for now to match AbstractProcessor signature
      return convertRstToLegalMarkdownSync(content);
    } catch (error) {
      this.debug('RST conversion failed', (error as Error).message);
      return content; // Return original content if conversion fails
    }
  }
}

/**
 * Wrapper for LaTeX conversion processor
 */
class LatexProcessor extends AbstractProcessor {
  readonly name = 'latex-conversion';

  isEnabled(): boolean {
    return true; // LaTeX conversion is always enabled as a preprocessing step
  }

  protected performProcessing(
    content: string,
    metadata: Record<string, any>,
    options: LegalMarkdownOptions
  ): string {
    try {
      // Use sync version for now to match AbstractProcessor signature
      return convertLatexToLegalMarkdownSync(content);
    } catch (error) {
      this.debug('LaTeX conversion failed', (error as Error).message);
      return content; // Return original content if conversion fails
    }
  }
}

/**
 * Wrapper for YAML front matter parsing processor
 */
class YamlProcessor extends AbstractProcessor {
  readonly name = 'yaml-parsing';

  isEnabled(): boolean {
    return true; // YAML parsing is always enabled
  }

  protected performProcessing(
    content: string,
    metadata: Record<string, any>,
    options: LegalMarkdownOptions
  ): string {
    const result = parseYamlFrontMatter(content, options.throwOnYamlError);

    // Merge parsed metadata into the provided metadata object
    Object.assign(metadata, result.metadata || {});

    // Return content without YAML front matter
    return result.content;
  }
}

/**
 * Wrapper for partial imports processor with frontmatter merge support
 */
class ImportsProcessor extends AbstractProcessor {
  readonly name = 'imports';

  isEnabled(options: LegalMarkdownOptions): boolean {
    return !options.noImports;
  }

  protected performProcessing(
    content: string,
    metadata: Record<string, any>,
    options: LegalMarkdownOptions
  ): string {
    // Use enhanced import processor with frontmatter merge support
    const result = processPartialImports(content, options.basePath, metadata, options);

    // Store imported files in metadata for later reporting
    if (result.importedFiles && result.importedFiles.length > 0) {
      metadata._importedFiles = (metadata._importedFiles || []).concat(result.importedFiles);
    }

    // Merge imported frontmatter unless explicitly disabled
    if (options.disableFrontmatterMerge !== true && result.mergedMetadata) {
      // Merge the imported metadata into the current metadata
      // The processPartialImports function already applies "source wins" strategy,
      // so we can safely assign the merged metadata
      Object.assign(metadata, result.mergedMetadata);

      if (options.logImportOperations) {
        this.debug(
          'Pipeline: Integrated merged frontmatter',
          `Added ${Object.keys(result.mergedMetadata).length} metadata fields from imports`
        );
      }
    }

    return result.content;
  }
}

/**
 * Wrapper for optional clauses processor
 */
class ClausesProcessor extends AbstractProcessor {
  readonly name = 'clauses';

  isEnabled(options: LegalMarkdownOptions): boolean {
    return !options.noClauses;
  }

  protected performProcessing(
    content: string,
    metadata: Record<string, any>,
    options: LegalMarkdownOptions
  ): string {
    return processOptionalClauses(content, metadata);
  }
}

/**
 * Wrapper for cross-references processor
 */
class ReferencesProcessor extends AbstractProcessor {
  readonly name = 'references';

  isEnabled(options: LegalMarkdownOptions): boolean {
    return !options.noReferences;
  }

  protected performProcessing(
    content: string,
    metadata: Record<string, any>,
    options: LegalMarkdownOptions
  ): string {
    return processCrossReferences(content, metadata);
  }
}

/**
 * Wrapper for mixins processor (AST-based)
 */
class MixinsProcessor extends AbstractProcessor {
  readonly name = 'mixins';

  isEnabled(options: LegalMarkdownOptions): boolean {
    return !options.noMixins;
  }

  protected performProcessing(
    content: string,
    metadata: Record<string, any>,
    options: LegalMarkdownOptions
  ): string {
    this.debug('Processing mixins with AST processor', {
      contentLength: content.length,
      enableFieldTracking: options.enableFieldTrackingInMarkdown,
    });

    return processMixins(content, metadata, options);
  }
}

/**
 * Wrapper for template loops processor
 */
class TemplateLoopsProcessor extends AbstractProcessor {
  readonly name = 'template-loops';

  isEnabled(): boolean {
    return true; // Template loops are always processed if present
  }

  protected performProcessing(
    content: string,
    metadata: Record<string, any>,
    options: LegalMarkdownOptions
  ): string {
    this.debug('Processing template loops', {
      contentLength: content.length,
      enableFieldTracking: options.enableFieldTrackingInMarkdown,
    });

    const result = processTemplateLoops(
      content,
      metadata,
      undefined,
      options.enableFieldTrackingInMarkdown || false
    );

    // Debug: log result of template loops processing
    if (process.env.NODE_ENV === 'development') {
      console.log('Template loops result:', result.substring(0, 500));
    }

    return result;
  }
}

/**
 * Wrapper for headers processor
 */
class HeadersProcessor extends AbstractProcessor {
  readonly name = 'headers';

  isEnabled(options: LegalMarkdownOptions): boolean {
    return !options.noHeaders;
  }

  protected performProcessing(
    content: string,
    metadata: Record<string, any>,
    options: LegalMarkdownOptions
  ): string {
    return processHeaders(content, metadata, {
      noReset: options.noReset,
      noIndent: options.noIndent,
      enableFieldTrackingInMarkdown: options.enableFieldTrackingInMarkdown,
    });
  }
}

/**
 * Wrapper for metadata export processor
 */
class MetadataExportProcessor extends AbstractProcessor {
  readonly name = 'metadata-export';

  isEnabled(options: LegalMarkdownOptions): boolean {
    return !!(
      options.exportMetadata ||
      (options as any)['meta-yaml-output'] ||
      (options as any)['meta-json-output']
    );
  }

  protected performProcessing(
    content: string,
    metadata: Record<string, any>,
    options: LegalMarkdownOptions
  ): string {
    const exportResult = exportMetadata(metadata, options.exportFormat, options.exportPath);

    // Store exported files in metadata for later reporting
    if (exportResult.exportedFiles && exportResult.exportedFiles.length > 0) {
      metadata._exportedFiles = (metadata._exportedFiles || []).concat(exportResult.exportedFiles);
    }

    return content; // Metadata export doesn't modify content
  }
}

/**
 * Wrapper for final field tracking processor (centralized mode)
 */
class FieldTrackingProcessor extends AbstractProcessor {
  readonly name = 'field-tracking';

  isEnabled(options: LegalMarkdownOptions): boolean {
    // Only apply centralized field tracking if:
    // 1. Field tracking is enabled
    // 2. Field tracking in markdown is NOT enabled (to avoid double processing)
    return !!(options.enableFieldTracking && !options.enableFieldTrackingInMarkdown);
  }

  protected performProcessing(
    content: string,
    metadata: Record<string, any>,
    options: LegalMarkdownOptions
  ): string {
    this.debug('Applying centralized field tracking', {
      fieldsCount: fieldTracker.getFields().size,
      contentLength: content.length,
    });

    return fieldTracker.applyFieldTracking(content);
  }
}

/**
 * Create the default Legal Markdown processing pipeline
 *
 * This pipeline matches the exact order and behavior of the current processing
 * system, ensuring 100% backward compatibility.
 *
 * @param logger - Optional custom logger
 * @returns Configured pipeline manager
 * @example
 * ```typescript
 * const pipeline = createDefaultPipeline();
 * const result = await pipeline.execute(content, metadata, {
 *   legalMarkdownOptions: { enableFieldTracking: true }
 * });
 * ```
 */
export function createDefaultPipeline(logger?: ConsolePipelineLogger): PipelineManager {
  const pipelineLogger =
    logger ||
    new ConsolePipelineLogger({
      level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.ERROR,
      enableMetrics: process.env.NODE_ENV === 'development',
      enableColors: true,
    });

  const pipeline = new PipelineManager(pipelineLogger);

  // Define steps in the exact order of current processing
  const steps: PipelineStep[] = [
    {
      name: 'rst-conversion',
      processor: new RstProcessor(),
      order: 1,
      enabled: true,
      description: 'Convert RST content to Legal Markdown format',
    },
    {
      name: 'latex-conversion',
      processor: new LatexProcessor(),
      order: 2,
      enabled: true,
      description: 'Convert LaTeX content to Legal Markdown format',
    },
    {
      name: 'yaml-parsing',
      processor: new YamlProcessor(),
      order: 3,
      enabled: true,
      description: 'Parse YAML front matter and extract metadata',
    },
    {
      name: 'imports',
      processor: new ImportsProcessor(),
      order: 4,
      enabled: true,
      description: 'Process partial document imports',
    },
    {
      name: 'clauses',
      processor: new ClausesProcessor(),
      order: 5,
      enabled: true,
      description: 'Process optional clauses and conditional blocks',
    },
    {
      name: 'references',
      processor: new ReferencesProcessor(),
      order: 6,
      enabled: true,
      description: 'Resolve cross-references and internal links',
    },
    {
      name: 'template-loops',
      processor: new TemplateLoopsProcessor(),
      order: 7,
      enabled: true,
      description: 'Process template loops and array iterations',
    },
    {
      name: 'mixins',
      processor: new MixinsProcessor(),
      order: 8,
      enabled: true,
      description: 'Process mixins and variable substitutions (AST-based)',
    },
    {
      name: 'headers',
      processor: new HeadersProcessor(),
      order: 9,
      enabled: true,
      description: 'Process headers, numbering, and formatting',
    },
    {
      name: 'metadata-export',
      processor: new MetadataExportProcessor(),
      order: 10,
      enabled: true,
      description: 'Export metadata to external files if configured',
    },
    {
      name: 'field-tracking',
      processor: new FieldTrackingProcessor(),
      order: 11,
      enabled: true,
      description: 'Apply centralized field tracking and highlighting',
    },
  ];

  // Register all steps
  steps.forEach(step => pipeline.registerStep(step));

  return pipeline;
}

/**
 * Create a pipeline optimized for HTML generation
 *
 * @param options - HTML generation options
 * @returns Configured pipeline manager
 */
export function createHtmlPipeline(
  options: {
    enableFieldTracking?: boolean;
    includeHighlighting?: boolean;
  } = {}
): PipelineManager {
  const pipeline = createDefaultPipeline();

  // Add HTML-specific configuration
  // Always enable field tracking for HTML generation (headers, mixins, etc.)
  pipeline.addListener({
    onPipelineStart: config => {
      config.fieldTrackingMode = 'distributed';
    },
  });

  return pipeline;
}

/**
 * Create a pipeline optimized for PDF generation
 *
 * @param options - PDF generation options
 * @returns Configured pipeline manager
 */
export function createPdfPipeline(
  options: {
    enableFieldTracking?: boolean;
    includeHighlighting?: boolean;
  } = {}
): PipelineManager {
  // PDF generation uses the same pipeline as HTML
  return createHtmlPipeline(options);
}

/**
 * Create a minimal pipeline for basic markdown processing
 *
 * @returns Configured pipeline manager with only essential steps
 */
export function createMinimalPipeline(): PipelineManager {
  const pipeline = new PipelineManager();

  const steps: PipelineStep[] = [
    {
      name: 'yaml-parsing',
      processor: new YamlProcessor(),
      order: 1,
      enabled: true,
      description: 'Parse YAML front matter',
    },
    {
      name: 'mixins',
      processor: new MixinsProcessor(),
      order: 2,
      enabled: true,
      description: 'Process basic variable substitutions',
    },
  ];

  steps.forEach(step => pipeline.registerStep(step));
  return pipeline;
}

/**
 * Validate a pipeline configuration
 *
 * @param config - Pipeline configuration to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validatePipelineConfig(config: PipelineConfig): string[] {
  const errors: string[] = [];

  if (!config.steps || config.steps.length === 0) {
    errors.push('Pipeline configuration must include at least one step');
  }

  // Check for duplicate step names
  const stepNames = new Set<string>();
  for (const step of config.steps || []) {
    if (stepNames.has(step.name)) {
      errors.push(`Duplicate step name: ${step.name}`);
    }
    stepNames.add(step.name);

    // Check for valid processor
    if (!step.processor || typeof step.processor.process !== 'function') {
      errors.push(`Step '${step.name}' has invalid processor`);
    }

    // Check for valid order
    if (typeof step.order !== 'number' || step.order < 0) {
      errors.push(`Step '${step.name}' has invalid order: ${step.order}`);
    }
  }

  // Check for valid field tracking mode
  if (
    config.fieldTrackingMode &&
    !['centralized', 'distributed', 'disabled'].includes(config.fieldTrackingMode)
  ) {
    errors.push(`Invalid field tracking mode: ${config.fieldTrackingMode}`);
  }

  return errors;
}

/**
 * Get processor instance by name for testing or custom configurations
 *
 * @param processorName - Name of the processor to get
 * @returns Processor instance or undefined if not found
 */
export function getProcessorByName(processorName: string): BaseProcessor | undefined {
  const processors: Record<string, () => BaseProcessor> = {
    'rst-conversion': () => new RstProcessor(),
    'latex-conversion': () => new LatexProcessor(),
    'yaml-parsing': () => new YamlProcessor(),
    imports: () => new ImportsProcessor(),
    clauses: () => new ClausesProcessor(),
    references: () => new ReferencesProcessor(),
    mixins: () => new MixinsProcessor(),
    'template-loops': () => new TemplateLoopsProcessor(),
    headers: () => new HeadersProcessor(),
    'metadata-export': () => new MetadataExportProcessor(),
    'field-tracking': () => new FieldTrackingProcessor(),
  };

  const factory = processors[processorName];
  return factory ? factory() : undefined;
}
