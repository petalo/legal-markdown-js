/**
 * Plugin Metadata Registry
 *
 * Central registry of all remark plugin metadata declarations.
 * This file defines the dependencies and execution order constraints for all plugins.
 *
 * @module plugins/remark/plugin-metadata-registry
 */

import type { PluginMetadata, PluginMetadataRegistry } from './types';
import { ProcessingPhase } from './types';
import { createPluginRegistry } from './plugin-order-validator';

/**
 * Metadata for all remark plugins
 *
 * This array defines the dependencies and constraints for each plugin.
 * Plugins are organized by processing phase (1-5). The validator will determine
 * the correct execution order based on phases and constraints.
 */
const PLUGIN_METADATA_LIST: PluginMetadata[] = [
  // ========== PHASE 1: CONTENT LOADING ==========
  {
    name: 'remarkImports',
    phase: ProcessingPhase.CONTENT_LOADING,
    description: 'Process @import directives and insert content as AST nodes',
    capabilities: ['content:imported', 'metadata:merged'],
    runBefore: ['remarkLegalHeadersParser', 'remarkMixins'],
    required: false,
    version: '2.0.0', // Version 2.0 uses AST-based insertion
  },

  // ========== PHASE 2: VARIABLE EXPANSION ==========
  {
    name: 'remarkMixins',
    phase: ProcessingPhase.VARIABLE_EXPANSION,
    description: 'Expand mixin definitions ({{variable}} patterns)',
    requiresPhases: [ProcessingPhase.CONTENT_LOADING],
    requiresCapabilities: ['metadata:merged'],
    capabilities: ['mixins:expanded'],
    runBefore: ['remarkTemplateFields'],
    required: false,
  },
  {
    name: 'remarkTemplateFields',
    phase: ProcessingPhase.VARIABLE_EXPANSION,
    description: 'Process {{field}} template patterns and resolve values',
    runAfter: ['remarkMixins'],
    capabilities: ['fields:expanded', 'variables:resolved'],
    required: true,
  },

  // ========== PHASE 3: CONDITIONAL EVALUATION ==========
  {
    name: 'processTemplateLoops',
    phase: ProcessingPhase.CONDITIONAL_EVAL,
    description: 'Evaluate {{#if}}, {{#unless}}, {{#each}} conditionals',
    requiresPhases: [ProcessingPhase.VARIABLE_EXPANSION],
    requiresCapabilities: ['variables:resolved'],
    capabilities: ['conditionals:evaluated'],
    required: true,
  },
  {
    name: 'remarkClauses',
    phase: ProcessingPhase.CONDITIONAL_EVAL,
    description: 'Process conditional clauses',
    capabilities: ['clauses:processed'],
    required: false,
  },

  // ========== PHASE 4: STRUCTURE PARSING ==========
  {
    name: 'remarkLegalHeadersParser',
    phase: ProcessingPhase.STRUCTURE_PARSING,
    description: 'Parse legal header markers (l., ll., lll.) into structured headers',
    requiresPhases: [ProcessingPhase.CONTENT_LOADING],
    runBefore: ['remarkHeaders', 'remarkCrossReferences'],
    capabilities: ['headers:parsed'],
    required: true,
  },
  {
    name: 'remarkCrossReferences',
    phase: ProcessingPhase.STRUCTURE_PARSING,
    description: 'Process cross-references between document sections',
    runAfter: ['remarkLegalHeadersParser'],
    runBefore: ['remarkHeaders'],
    requiresCapabilities: ['headers:parsed'],
    capabilities: ['crossrefs:resolved'],
    required: false,
  },
  {
    name: 'remarkCrossReferencesAst',
    phase: ProcessingPhase.STRUCTURE_PARSING,
    description: 'AST-based cross-reference processing (alternative to remarkCrossReferences)',
    runAfter: ['remarkHeaders', 'remarkLegalHeadersParser'],
    requiresCapabilities: ['headers:parsed'],
    capabilities: ['crossrefs:resolved'],
    conflicts: ['remarkCrossReferences'], // Can't use both
    required: false,
  },
  {
    name: 'remarkHeaders',
    phase: ProcessingPhase.STRUCTURE_PARSING,
    description: 'Number headers and add CSS classes',
    // Note: remarkLegalHeadersParser.runBefore already declares the parser→headers dependency,
    // so we don't need to duplicate it here with runAfter: ['remarkLegalHeadersParser'].
    // Declaring dependencies from both sides causes double in-degree increments in topological sort.
    runAfter: ['remarkCrossReferences'],
    requiresCapabilities: ['headers:parsed'],
    capabilities: ['headers:numbered'],
    required: true,
  },

  // ========== PHASE 5: POST-PROCESSING ==========
  {
    name: 'remarkDates',
    phase: ProcessingPhase.POST_PROCESSING,
    description: 'Process date fields and formatting',
    capabilities: ['dates:formatted'],
    required: false,
  },
  {
    name: 'remarkSignatureLines',
    phase: ProcessingPhase.POST_PROCESSING,
    description: 'Process signature line markers',
    capabilities: ['signatures:processed'],
    required: false,
  },
  {
    name: 'remarkFieldTracking',
    phase: ProcessingPhase.POST_PROCESSING,
    description: 'Track template fields for highlighting and analysis',
    requiresPhases: [ProcessingPhase.VARIABLE_EXPANSION],
    requiresCapabilities: ['fields:expanded'],
    capabilities: ['tracking:enabled'],
    required: false,
  },

  // Utility Plugins
  {
    name: 'remarkDebugAst',
    phase: ProcessingPhase.POST_PROCESSING,
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
