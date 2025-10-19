/**
 * Plugin Order Validator
 *
 * Validates that remark plugins are executed in the correct order based on
 * their declared dependencies. This prevents runtime bugs caused by incorrect
 * plugin ordering.
 *
 * @module plugins/remark/plugin-order-validator
 */

import type {
  PluginMetadata,
  PluginMetadataRegistry,
  PluginOrderValidationResult,
  PluginOrderError,
  PluginOrderWarning,
  PluginOrderValidationOptions,
} from './types';

/**
 * Validator for plugin execution order
 *
 * This class validates that plugins are executed in an order that satisfies
 * all declared dependencies and constraints.
 *
 * @example
 * ```typescript
 * const validator = new PluginOrderValidator(registry);
 * const result = validator.validate(
 *   ['remarkImports', 'remarkTemplateFields', 'remarkLegalHeadersParser']
 * );
 *
 * if (!result.valid) {
 *   console.error('Invalid plugin order:', result.errors);
 *   console.log('Suggested order:', result.suggestedOrder);
 * }
 * ```
 */
export class PluginOrderValidator {
  private registry: PluginMetadataRegistry;

  constructor(registry: PluginMetadataRegistry) {
    this.registry = registry;
  }

  /**
   * Validate plugin execution order
   *
   * @param pluginNames - List of plugin names in execution order
   * @param options - Validation options
   * @returns Validation result with errors and warnings
   */
  validate(
    pluginNames: string[],
    options: PluginOrderValidationOptions = {}
  ): PluginOrderValidationResult {
    const { throwOnError = true, logWarnings = true, strictMode = false, debug = false } = options;

    const errors: PluginOrderError[] = [];
    const warnings: PluginOrderWarning[] = [];

    if (debug) {
      console.log('[PluginOrderValidator] Validating plugin order:', pluginNames);
    }

    // Build a position map for quick lookups
    const positions = new Map<string, number>();
    pluginNames.forEach((name, index) => {
      positions.set(name, index);
    });

    // Check each plugin's constraints
    for (let i = 0; i < pluginNames.length; i++) {
      const pluginName = pluginNames[i];
      const metadata = this.registry.get(pluginName);

      if (!metadata) {
        if (strictMode) {
          warnings.push({
            type: 'unknown-plugin',
            plugin: pluginName,
            message: `Plugin "${pluginName}" has no metadata declaration`,
          });
        }
        continue;
      }

      if (debug) {
        console.log(`[PluginOrderValidator] Checking constraints for ${pluginName}`);
      }

      // Check runBefore constraints
      if (metadata.runBefore) {
        for (const beforePlugin of metadata.runBefore) {
          const beforePos = positions.get(beforePlugin);
          if (beforePos !== undefined && beforePos <= i) {
            errors.push({
              type: 'dependency-violation',
              plugin: pluginName,
              relatedPlugin: beforePlugin,
              message: `"${pluginName}" must run BEFORE "${beforePlugin}", but it appears after it in the pipeline`,
            });
          }
        }
      }

      // Check runAfter constraints
      if (metadata.runAfter) {
        for (const afterPlugin of metadata.runAfter) {
          const afterPos = positions.get(afterPlugin);
          if (afterPos !== undefined && afterPos >= i) {
            errors.push({
              type: 'dependency-violation',
              plugin: pluginName,
              relatedPlugin: afterPlugin,
              message: `"${pluginName}" must run AFTER "${afterPlugin}", but it appears before it in the pipeline`,
            });
          }
        }
      }

      // Check conflicts
      if (metadata.conflicts) {
        for (const conflictPlugin of metadata.conflicts) {
          if (positions.has(conflictPlugin)) {
            errors.push({
              type: 'conflict',
              plugin: pluginName,
              relatedPlugin: conflictPlugin,
              message: `"${pluginName}" conflicts with "${conflictPlugin}" - they cannot be used together`,
            });
          }
        }
      }
    }

    // Check for missing required plugins
    for (const [name, metadata] of this.registry.entries()) {
      if (metadata.required && !positions.has(name)) {
        warnings.push({
          type: 'missing-required',
          plugin: name,
          message: `Required plugin "${name}" is missing from the pipeline`,
        });
      }
    }

    // Check for circular dependencies
    const circularErrors = this.detectCircularDependencies(pluginNames);
    errors.push(...circularErrors);

    // Log warnings if requested
    if (logWarnings && warnings.length > 0) {
      for (const warning of warnings) {
        console.warn(`[PluginOrderValidator] WARNING: ${warning.message}`);
      }
    }

    const valid = errors.length === 0;

    // Generate suggested order if validation failed
    let suggestedOrder: string[] | undefined;
    if (!valid) {
      try {
        suggestedOrder = this.topologicalSort(pluginNames);
        if (debug) {
          console.log('[PluginOrderValidator] Suggested order:', suggestedOrder);
        }
      } catch (error) {
        if (debug) {
          console.error('[PluginOrderValidator] Failed to generate suggested order:', error);
        }
      }
    }

    const result: PluginOrderValidationResult = {
      valid,
      errors,
      warnings,
      suggestedOrder,
    };

    // Throw error if validation failed and throwOnError is true
    if (!valid && throwOnError) {
      const errorMessages = errors.map(e => e.message).join('\n  - ');
      throw new Error(
        `Plugin order validation failed:\n  - ${errorMessages}${
          suggestedOrder ? `\n\nSuggested order: ${suggestedOrder.join(' → ')}` : ''
        }`
      );
    }

    return result;
  }

  /**
   * Detect circular dependencies in plugin metadata
   *
   * @param pluginNames - List of plugin names
   * @returns List of errors for circular dependencies found
   */
  private detectCircularDependencies(pluginNames: string[]): PluginOrderError[] {
    const errors: PluginOrderError[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (plugin: string, path: string[]): boolean => {
      if (recursionStack.has(plugin)) {
        // Found a cycle
        const cyclePath = [...path, plugin].join(' → ');
        errors.push({
          type: 'circular-dependency',
          plugin,
          message: `Circular dependency detected: ${cyclePath}`,
        });
        return true;
      }

      if (visited.has(plugin)) {
        return false;
      }

      visited.add(plugin);
      recursionStack.add(plugin);

      const metadata = this.registry.get(plugin);
      if (metadata) {
        // Check runAfter dependencies (these create forward edges)
        if (metadata.runAfter) {
          for (const dep of metadata.runAfter) {
            if (pluginNames.includes(dep)) {
              if (hasCycle(dep, [...path, plugin])) {
                recursionStack.delete(plugin);
                return true;
              }
            }
          }
        }
      }

      recursionStack.delete(plugin);
      return false;
    };

    // Check each plugin for cycles
    for (const plugin of pluginNames) {
      if (!visited.has(plugin)) {
        hasCycle(plugin, []);
      }
    }

    return errors;
  }

  /**
   * Perform topological sort on plugins to find a valid execution order
   *
   * Uses Kahn's algorithm for topological sorting.
   *
   * @param pluginNames - List of plugin names to sort
   * @returns Sorted list of plugin names
   * @throws Error if plugins have circular dependencies
   */
  private topologicalSort(pluginNames: string[]): string[] {
    // Build adjacency list and in-degree map
    const adjList = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();

    // Initialize
    for (const plugin of pluginNames) {
      adjList.set(plugin, new Set());
      inDegree.set(plugin, 0);
    }

    // Build graph from metadata
    for (const plugin of pluginNames) {
      const metadata = this.registry.get(plugin);
      if (!metadata) continue;

      // runBefore creates edges: plugin -> beforePlugin
      if (metadata.runBefore) {
        for (const beforePlugin of metadata.runBefore) {
          if (pluginNames.includes(beforePlugin)) {
            adjList.get(plugin)!.add(beforePlugin);
            inDegree.set(beforePlugin, inDegree.get(beforePlugin)! + 1);
          }
        }
      }

      // runAfter creates edges: afterPlugin -> plugin
      if (metadata.runAfter) {
        for (const afterPlugin of metadata.runAfter) {
          if (pluginNames.includes(afterPlugin)) {
            adjList.get(afterPlugin)!.add(plugin);
            inDegree.set(plugin, inDegree.get(plugin)! + 1);
          }
        }
      }
    }

    // Kahn's algorithm
    const queue: string[] = [];
    const result: string[] = [];

    // Find all nodes with in-degree 0
    for (const [plugin, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(plugin);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      // Reduce in-degree for neighbors
      for (const neighbor of adjList.get(current)!) {
        const newDegree = inDegree.get(neighbor)! - 1;
        inDegree.set(neighbor, newDegree);

        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    // If result doesn't include all plugins, there's a cycle
    if (result.length !== pluginNames.length) {
      throw new Error('Cannot generate topological sort: circular dependencies detected');
    }

    return result;
  }

  /**
   * Get metadata for a plugin
   *
   * @param pluginName - Name of the plugin
   * @returns Plugin metadata or undefined if not found
   */
  getMetadata(pluginName: string): PluginMetadata | undefined {
    return this.registry.get(pluginName);
  }

  /**
   * Add or update metadata for a plugin
   *
   * @param metadata - Plugin metadata to add/update
   */
  registerPlugin(metadata: PluginMetadata): void {
    this.registry.set(metadata.name, metadata);
  }
}

/**
 * Create a plugin metadata registry from an array of metadata
 *
 * @param metadataList - Array of plugin metadata
 * @returns Plugin metadata registry
 */
export function createPluginRegistry(metadataList: PluginMetadata[]): PluginMetadataRegistry {
  const registry: PluginMetadataRegistry = new Map();

  for (const metadata of metadataList) {
    registry.set(metadata.name, metadata);
  }

  return registry;
}
