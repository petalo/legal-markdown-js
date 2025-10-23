/**
 * Plugin metadata system for remark plugins
 *
 * This module defines interfaces for declaring plugin dependencies and execution order.
 * It helps prevent plugin ordering bugs by making dependencies explicit and validatable.
 *
 * @module plugins/remark/types
 */

/**
 * Processing phases for the Legal Markdown pipeline
 *
 * Plugins execute in phase order (1 → 2 → 3 → 4 → 5).
 * Within each phase, plugins are ordered by dependency constraints.
 *
 * @example
 * ```typescript
 * const plugin: PluginMetadata = {
 *   name: 'remarkMixins',
 *   phase: ProcessingPhase.VARIABLE_EXPANSION,
 *   description: 'Expand variable patterns',
 * };
 * ```
 */
export enum ProcessingPhase {
  /**
   * Phase 1: Content Loading
   * - Load all imports and external content
   * - Merge metadata from imported files
   * - NO transformations, just aggregation
   */
  CONTENT_LOADING = 1,

  /**
   * Phase 2: Variable Expansion
   * - Expand {{variable}} patterns from metadata
   * - Process mixins and template fields
   * - BEFORE conditionals evaluate
   */
  VARIABLE_EXPANSION = 2,

  /**
   * Phase 3: Conditional Evaluation
   * - Evaluate {{#if}}, {{#unless}}, {{#each}}
   * - Process template loops
   * - AFTER variables expanded
   */
  CONDITIONAL_EVAL = 3,

  /**
   * Phase 4: Structure Parsing
   * - Parse legal headers (l., ll., lll.)
   * - Number headers and build cross-references
   * - Structural transformations
   */
  STRUCTURE_PARSING = 4,

  /**
   * Phase 5: Post-Processing
   * - Date formatting
   * - Signature lines
   * - Field tracking and highlighting
   * - Final cleanup
   */
  POST_PROCESSING = 5,
}

/**
 * Metadata for a remark plugin that declares its dependencies and constraints
 *
 * This metadata is used by the PluginOrderValidator to ensure plugins are
 * executed in the correct order and prevent runtime bugs.
 *
 * @example
 * ```typescript
 * export const remarkImportsMetadata: PluginMetadata = {
 *   name: 'remarkImports',
 *   runBefore: ['remarkTemplateFields', 'remarkLegalHeadersParser'],
 *   description: 'Process @import directives and insert AST nodes'
 * };
 * ```
 */
export interface PluginMetadata {
  /**
   * Unique identifier for the plugin
   * Should match the plugin function name (e.g., 'remarkImports')
   */
  name: string;

  /**
   * Human-readable description of what the plugin does
   */
  description: string;

  /**
   * Processing phase where this plugin executes
   *
   * Plugins are grouped and executed by phase (1 → 2 → 3 → 4 → 5).
   * Within each phase, they are ordered by runAfter/runBefore constraints.
   *
   * @example
   * phase: ProcessingPhase.VARIABLE_EXPANSION
   */
  phase: ProcessingPhase;

  /**
   * Phases that must execute before this plugin's phase
   *
   * Used to declare cross-phase dependencies. For example, a plugin in
   * Phase 3 might require Phase 2 to have executed.
   *
   * @example
   * requiresPhases: [ProcessingPhase.VARIABLE_EXPANSION]
   */
  requiresPhases?: ProcessingPhase[];

  /**
   * Capabilities this plugin provides (semantic tags)
   *
   * Capabilities are semantic markers that express what a plugin does,
   * independent of its name. Format: 'namespace:action'
   *
   * @example
   * capabilities: ['fields:expanded', 'variables:resolved']
   */
  capabilities?: string[];

  /**
   * Capabilities this plugin requires from other plugins
   *
   * Used to declare semantic dependencies. The validator will ensure
   * that plugins providing these capabilities are enabled.
   *
   * @example
   * requiresCapabilities: ['metadata:merged']
   */
  requiresCapabilities?: string[];

  /**
   * List of plugin names that this plugin MUST run before (same phase)
   *
   * If any of these plugins are in the pipeline, this plugin
   * must be executed before them.
   *
   * @example
   * // remarkImports must run before remarkTemplateFields
   * runBefore: ['remarkTemplateFields']
   */
  runBefore?: string[];

  /**
   * List of plugin names that this plugin MUST run after (same phase)
   *
   * If any of these plugins are in the pipeline, this plugin
   * must be executed after them.
   *
   * @example
   * // remarkLegalHeadersParser must run after remarkImports
   * runAfter: ['remarkImports']
   */
  runAfter?: string[];

  /**
   * List of plugin names that conflict with this plugin
   *
   * If any of these plugins are in the pipeline together with
   * this plugin, the validator will throw an error.
   *
   * @example
   * conflicts: ['remarkOldLegacyProcessor']
   */
  conflicts?: string[];

  /**
   * Whether this plugin is required for core functionality
   *
   * If true, the validator will warn if the plugin is missing
   * from common pipelines.
   */
  required: boolean;

  /**
   * Version of the plugin (for compatibility checks)
   */
  version?: string;
}

/**
 * Registry of all plugin metadata
 *
 * This maps plugin names to their metadata declarations.
 * Used by the validator to look up dependencies.
 */
export type PluginMetadataRegistry = Map<string, PluginMetadata>;

/**
 * Validation result from plugin order validation
 */
export interface PluginOrderValidationResult {
  /**
   * Whether the plugin order is valid
   */
  valid: boolean;

  /**
   * List of validation errors (if any)
   */
  errors: PluginOrderError[];

  /**
   * List of validation warnings (if any)
   */
  warnings: PluginOrderWarning[];

  /**
   * Suggested order if validation failed
   */
  suggestedOrder?: string[];
}

/**
 * Error in plugin ordering
 */
export interface PluginOrderError {
  /**
   * Type of error
   */
  type:
    | 'dependency-violation'
    | 'conflict'
    | 'circular-dependency'
    | 'capability-missing'
    | 'phase-dependency';

  /**
   * Plugin name that caused the error
   */
  plugin: string;

  /**
   * Related plugin (for dependency violations and conflicts)
   */
  relatedPlugin?: string;

  /**
   * Human-readable error message
   */
  message: string;
}

/**
 * Warning about plugin ordering
 */
export interface PluginOrderWarning {
  /**
   * Type of warning
   */
  type: 'missing-required' | 'suboptimal-order' | 'unknown-plugin';

  /**
   * Plugin name related to the warning
   */
  plugin: string;

  /**
   * Human-readable warning message
   */
  message: string;
}

/**
 * Configuration for plugin order validation
 */
export interface PluginOrderValidationOptions {
  /**
   * Whether to throw errors on validation failure (default: true)
   */
  throwOnError?: boolean;

  /**
   * Whether to log warnings to console (default: true)
   */
  logWarnings?: boolean;

  /**
   * Whether to validate unknown plugins (default: false)
   */
  strictMode?: boolean;

  /**
   * Whether to include debug information in results (default: false)
   */
  debug?: boolean;
}
