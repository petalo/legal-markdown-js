/**
 * Plugin Metadata Registry
 *
 * Central registry of all remark plugin metadata declarations.
 * This file defines the dependencies and execution order constraints for all plugins.
 *
 * @module plugins/remark/plugin-metadata-registry
 */

import type { PluginMetadata, PluginMetadataRegistry } from './types';
import { createPluginRegistry } from './plugin-order-validator';

/**
 * Metadata for all remark plugins
 *
 * This array defines the dependencies and constraints for each plugin.
 * The order in this array doesn't matter - the validator will determine
 * the correct execution order based on the constraints.
 */
const PLUGIN_METADATA_LIST: PluginMetadata[] = [
  // Phase 1: Import Processing
  {
    name: 'remarkImports',
    description: 'Process @import directives and insert content as AST nodes',
    runBefore: [
      'remarkTemplateFields',
      'remarkLegalHeadersParser',
      'remarkFieldTracking',
      'remarkMixins',
    ],
    required: false,
    version: '2.0.0', // Version 2.0 uses AST-based insertion
  },

  // Phase 2: Mixin and Field Processing
  {
    name: 'remarkMixins',
    description: 'Process mixin definitions and expansions',
    runAfter: ['remarkImports'],
    runBefore: ['remarkTemplateFields'],
    required: false,
  },

  {
    name: 'remarkTemplateFields',
    description: 'Process {{field}} template patterns and resolve values',
    runAfter: ['remarkImports', 'remarkMixins'],
    runBefore: ['remarkFieldTracking'],
    required: true,
  },

  // Phase 3: Header Processing
  {
    name: 'remarkLegalHeadersParser',
    description: 'Parse legal header markers (l., ll., lll.) into structured headers',
    runAfter: ['remarkImports'],
    runBefore: ['remarkHeaders'],
    required: true,
  },

  {
    name: 'remarkHeaders',
    description: 'Process headers and add CSS classes (legal-header-level-X)',
    runAfter: ['remarkLegalHeadersParser'],
    required: true,
  },

  // Phase 4: Field Tracking
  {
    name: 'remarkFieldTracking',
    description: 'Track template fields for highlighting and analysis',
    runAfter: ['remarkTemplateFields'],
    required: false,
  },

  // Phase 5: Cross-References and Clauses
  {
    name: 'remarkCrossReferences',
    description: 'Process cross-references between document sections',
    // Must run BEFORE remarkHeaders to extract |key| patterns before headers removes them
    runBefore: ['remarkHeaders'],
    runAfter: ['remarkLegalHeadersParser'], // After headers are parsed, before they're processed
    required: false,
  },

  {
    name: 'remarkCrossReferencesAst',
    description: 'AST-based cross-reference processing (alternative to remarkCrossReferences)',
    runAfter: ['remarkHeaders', 'remarkLegalHeadersParser'],
    conflicts: ['remarkCrossReferences'], // Can't use both
    required: false,
  },

  {
    name: 'remarkClauses',
    description: 'Process conditional clauses ({{#if}}, {{#unless}})',
    // Note: Can run before or after remarkTemplateFields depending on use case
    required: false,
  },

  // Phase 6: Date Processing
  {
    name: 'remarkDates',
    description: 'Process date fields and formatting',
    // Note: Can run before or after remarkTemplateFields depending on use case
    required: false,
  },

  // Phase 7: Signature Lines
  {
    name: 'remarkSignatureLines',
    description: 'Process signature line markers',
    required: false,
  },

  // Utility Plugins
  {
    name: 'remarkDebugAst',
    description: 'Debug plugin for visualizing AST structure',
    required: false,
  },
];

/**
 * Global plugin metadata registry
 *
 * This registry is used by the PluginOrderValidator to validate plugin order.
 */
export const GLOBAL_PLUGIN_REGISTRY: PluginMetadataRegistry =
  createPluginRegistry(PLUGIN_METADATA_LIST);

/**
 * Get metadata for a specific plugin
 *
 * @param pluginName - Name of the plugin
 * @returns Plugin metadata or undefined if not found
 */
export function getPluginMetadata(pluginName: string): PluginMetadata | undefined {
  return GLOBAL_PLUGIN_REGISTRY.get(pluginName);
}

/**
 * Get all registered plugin names
 *
 * @returns Array of plugin names
 */
export function getAllPluginNames(): string[] {
  return Array.from(GLOBAL_PLUGIN_REGISTRY.keys());
}

/**
 * Check if a plugin is registered
 *
 * @param pluginName - Name of the plugin
 * @returns True if plugin is registered
 */
export function isPluginRegistered(pluginName: string): boolean {
  return GLOBAL_PLUGIN_REGISTRY.has(pluginName);
}
