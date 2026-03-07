/**
 * Pipeline Builder
 *
 * Single source of truth for remark plugin ordering. Uses phase-based
 * architecture to ensure deterministic execution order and prevent
 * subtle bugs like variables evaluating after conditionals (Issue #120).
 *
 * @module pipeline-builder
 */

import type {
  ProcessingPhase,
  PluginMetadata,
  PluginOrderValidationResult,
} from '../../plugins/remark/types';
import { PluginOrderValidator } from '../../plugins/remark/plugin-order-validator';
import { PipelineError } from '../../errors';
import { getRuntimeConfig } from '../../config/runtime';
import { logger } from '../../utils/logger';

/**
 * Ordered pipeline result from builder
 *
 * Contains the final plugin execution order, grouped by phase,
 * with validation results and capabilities tracking.
 */
interface OrderedPipeline {
  /** Plugin names in execution order */
  names: string[];

  /** Plugins grouped by phase for visualization and debugging */
  byPhase: Map<ProcessingPhase, string[]>;

  /** Validation result (errors, warnings) */
  validation: PluginOrderValidationResult;

  /** Capabilities provided by this pipeline */
  capabilities: Set<string>;

  /** Timestamp when pipeline was built */
  builtAt: Date;

  /** Configuration used to build this pipeline */
  config: PipelineConfig;
}

/**
 * Pipeline configuration
 *
 * Defines which plugins to enable, metadata, processing options,
 * and validation behavior.
 */
interface PipelineConfig {
  /** Plugins to enable (by name) */
  enabledPlugins: string[];

  /** Metadata for plugin configuration */
  metadata: Record<string, unknown>;

  /** Processing options (debug, field tracking, etc.) */
  options: Record<string, unknown>;

  /**
   * Validation mode:
   * - 'strict': Throw errors on validation failures (dev/CI)
   * - 'warn': Log warnings but continue (production default)
   * - 'silent': No validation output
   */
  validationMode?: 'strict' | 'warn' | 'silent';

  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Validation options for plugin order validation
 */
interface ValidationOptions {
  /** Throw error on critical violations */
  throwOnError?: boolean;

  /** Log warnings to console */
  logWarnings?: boolean;

  /** Enable strict mode (all violations are critical) */
  strictMode?: boolean;

  /** Enable debug output */
  debug?: boolean;
}

/**
 * Detect appropriate validation mode based on environment
 *
 * Returns 'strict' in development/CI, 'warn' in production
 */
export function detectValidationMode(): 'strict' | 'warn' | 'silent' {
  const configuredMode = getRuntimeConfig().processing.validationMode;
  if (configuredMode === 'strict') {
    return 'strict';
  }

  if (configuredMode === 'permissive') {
    return 'warn';
  }

  if (process.env.CI === 'true') {
    return 'strict';
  }

  if (process.env.NODE_ENV === 'production') {
    return 'warn';
  }

  if (process.env.NODE_ENV === 'test') {
    return 'warn'; // Don't spam test output
  }

  // Default to strict in development
  return 'strict';
}

/**
 * Group plugins by their assigned processing phase
 *
 * @param pluginNames - Array of plugin names to group
 * @param registry - Plugin metadata registry
 * @returns Map of phase → plugin names
 */
export function groupPluginsByPhase(
  pluginNames: string[],
  registry: Map<string, PluginMetadata>
): Map<ProcessingPhase, string[]> {
  const byPhase = new Map<ProcessingPhase, string[]>();

  // Initialize all phases
  for (let phase = 1; phase <= 5; phase++) {
    byPhase.set(phase as ProcessingPhase, []);
  }

  for (const name of pluginNames) {
    const metadata = registry.get(name);
    if (!metadata) {
      throw new PipelineError(
        `[PipelineBuilder] Plugin "${name}" not found in registry. ` +
          `Available plugins: ${Array.from(registry.keys()).join(', ')}`
      );
    }

    if (!metadata.phase) {
      throw new PipelineError(
        `[PipelineBuilder] Plugin "${name}" has no phase assigned. ` +
          `All plugins must have a phase field.`
      );
    }

    const phasePlugins = byPhase.get(metadata.phase) || [];
    phasePlugins.push(name);
    byPhase.set(metadata.phase, phasePlugins);
  }

  return byPhase;
}

/**
 * Validate that required capabilities are provided by the pipeline
 *
 * Throws an error if any plugin requires a capability that is not
 * provided by any earlier plugin in the pipeline.
 *
 * @param orderedPlugins - Plugin names in execution order
 * @param registry - Plugin metadata registry
 * @param debug - Enable debug logging
 */
export function validateCapabilities(
  orderedPlugins: string[],
  registry: Map<string, PluginMetadata>,
  debug: boolean = false
): void {
  const providedCapabilities = new Set<string>();
  const errors: string[] = [];

  for (const pluginName of orderedPlugins) {
    const metadata = registry.get(pluginName);
    if (!metadata) continue;

    // Check if this plugin's required capabilities are available
    if (metadata.requiresCapabilities) {
      for (const requiredCap of metadata.requiresCapabilities) {
        if (!providedCapabilities.has(requiredCap)) {
          errors.push(
            `Plugin "${pluginName}" requires capability "${requiredCap}" ` +
              `but no earlier plugin provides it`
          );
        }
      }
    }

    // Add this plugin's capabilities to the available set
    if (metadata.capabilities) {
      for (const cap of metadata.capabilities) {
        providedCapabilities.add(cap);
        if (debug) {
          logger.debug(`Plugin "${pluginName}" provides capability: ${cap}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new PipelineError(
      '[PipelineBuilder] Capability validation failed:\n' + errors.map(e => `  - ${e}`).join('\n')
    );
  }
}

/**
 * Build a remark plugin pipeline with phase-based ordering
 *
 * This is the single source of truth for plugin ordering. It uses the
 * phase-based architecture to ensure deterministic execution order and
 * prevent subtle bugs like variables evaluating after conditionals (Issue #120).
 *
 * @param config - Pipeline configuration
 * @param registry - Plugin metadata registry
 * @returns Ordered pipeline with validation results
 *
 * @example
 * ```typescript
 * import { buildRemarkPipeline } from './pipeline-builder';
 * import { GLOBAL_PLUGIN_REGISTRY } from '../../plugins/remark/plugin-metadata-registry';
 *
 * const pipeline = buildRemarkPipeline(
 *   {
 *     enabledPlugins: ['remarkImports', 'remarkTemplateFields', 'remarkHeaders'],
 *     metadata: { author: 'John Doe' },
 *     options: { debug: true },
 *     validationMode: 'strict'
 *   },
 *   GLOBAL_PLUGIN_REGISTRY
 * );
 *
 * console.log('Plugin order:', pipeline.names);
 * console.log('By phase:', pipeline.byPhase);
 * ```
 */
export function buildRemarkPipeline(
  config: PipelineConfig,
  registry: Map<string, PluginMetadata>
): OrderedPipeline {
  const startTime = new Date();
  const validator = new PluginOrderValidator(registry);

  // Step 1: Determine validation mode
  const validationMode = config.validationMode || detectValidationMode();

  if (config.debug) {
    logger.debug('Building pipeline with mode', validationMode);
    logger.debug('Requested plugins', config.enabledPlugins);
  }

  // Step 2: Group plugins by phase
  const byPhase = groupPluginsByPhase(config.enabledPlugins, registry);

  if (config.debug) {
    logger.debug('Plugins by phase:');
    for (const [phase, plugins] of byPhase.entries()) {
      if (plugins.length > 0) {
        logger.debug(`  Phase ${phase}: ${plugins.join(', ')}`);
      }
    }
  }

  // Step 3: Topologically sort within each phase
  const orderedNames: string[] = [];
  for (const phase of [1, 2, 3, 4, 5] as ProcessingPhase[]) {
    const phasePlugins = byPhase.get(phase) || [];
    if (phasePlugins.length === 0) continue;

    if (config.debug) {
      logger.debug(`Sorting phase ${phase} plugins`, phasePlugins);
    }

    const sorted = validator.topologicalSort(phasePlugins);
    orderedNames.push(...sorted);

    // Update byPhase with sorted order
    byPhase.set(phase, sorted);

    if (config.debug) {
      logger.debug(`Phase ${phase} sorted order`, sorted);
    }
  }

  // Step 4: Validate the final order
  const validationOptions: ValidationOptions = {
    throwOnError: validationMode === 'strict',
    logWarnings: validationMode === 'warn' || config.debug,
    strictMode: validationMode === 'strict',
    debug: config.debug,
  };

  const validation = validator.validate(orderedNames, validationOptions);

  if (config.debug) {
    if (validation.valid) {
      logger.debug('Validation passed');
    } else {
      logger.debug('Validation failed');
      if (validation.errors.length > 0) {
        logger.debug('Errors', validation.errors);
      }
      if (validation.warnings.length > 0) {
        logger.debug('Warnings', validation.warnings);
      }
    }
  }

  // Step 5: Collect capabilities
  const capabilities = new Set<string>();
  for (const name of orderedNames) {
    const metadata = registry.get(name);
    if (metadata?.capabilities) {
      metadata.capabilities.forEach(cap => capabilities.add(cap));
    }
  }

  // Step 6: Validate capabilities
  validateCapabilities(orderedNames, registry, config.debug);

  if (config.debug) {
    logger.debug('Final order', orderedNames.join(' → '));
    logger.debug('Capabilities provided', Array.from(capabilities));
  }

  return {
    names: orderedNames,
    byPhase,
    validation,
    capabilities,
    builtAt: startTime,
    config,
  };
}
