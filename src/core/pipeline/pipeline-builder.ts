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

/**
 * Ordered pipeline result from builder
 *
 * Contains the final plugin execution order, grouped by phase,
 * with validation results and capabilities tracking.
 */
export interface OrderedPipeline {
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
export interface PipelineConfig {
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
export interface ValidationOptions {
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
  // Check for explicit environment variable
  const envMode = process.env.LEGAL_MD_VALIDATION_MODE;
  if (envMode === 'strict' || envMode === 'warn' || envMode === 'silent') {
    return envMode;
  }

  // Check if running in CI
  if (process.env.CI === 'true') {
    return 'strict';
  }

  // Check NODE_ENV
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
      throw new Error(
        `[PipelineBuilder] Plugin "${name}" not found in registry. ` +
          `Available plugins: ${Array.from(registry.keys()).join(', ')}`
      );
    }

    if (!metadata.phase) {
      throw new Error(
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
          console.log(`[PipelineBuilder] Plugin "${pluginName}" provides capability: ${cap}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
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
    console.log('[PipelineBuilder] Building pipeline with mode:', validationMode);
    console.log('[PipelineBuilder] Requested plugins:', config.enabledPlugins);
  }

  // Step 2: Group plugins by phase
  const byPhase = groupPluginsByPhase(config.enabledPlugins, registry);

  if (config.debug) {
    console.log('[PipelineBuilder] Plugins by phase:');
    for (const [phase, plugins] of byPhase.entries()) {
      if (plugins.length > 0) {
        console.log(`  Phase ${phase}: ${plugins.join(', ')}`);
      }
    }
  }

  // Step 3: Topologically sort within each phase
  const orderedNames: string[] = [];
  for (const phase of [1, 2, 3, 4, 5] as ProcessingPhase[]) {
    const phasePlugins = byPhase.get(phase) || [];
    if (phasePlugins.length === 0) continue;

    if (config.debug) {
      console.log(`[PipelineBuilder] Sorting phase ${phase} plugins:`, phasePlugins);
    }

    const sorted = validator.topologicalSort(phasePlugins);
    orderedNames.push(...sorted);

    // Update byPhase with sorted order
    byPhase.set(phase, sorted);

    if (config.debug) {
      console.log(`[PipelineBuilder] Phase ${phase} sorted order:`, sorted);
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
      console.log('[PipelineBuilder] ✓ Validation passed');
    } else {
      console.log('[PipelineBuilder] ✗ Validation failed');
      if (validation.errors.length > 0) {
        console.log('[PipelineBuilder] Errors:', validation.errors);
      }
      if (validation.warnings.length > 0) {
        console.log('[PipelineBuilder] Warnings:', validation.warnings);
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
    console.log('[PipelineBuilder] Final order:', orderedNames.join(' → '));
    console.log('[PipelineBuilder] Capabilities provided:', Array.from(capabilities));
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
