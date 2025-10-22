/**
 * Unit Tests for Plugin Metadata Registry
 *
 * Comprehensive test suite for the plugin metadata registry system,
 * covering phase assignments, capabilities, and metadata retrieval.
 */

import { describe, it, expect } from 'vitest';
import {
  GLOBAL_PLUGIN_REGISTRY,
  getPluginMetadata,
  getAllPluginNames,
  isPluginRegistered,
} from '../../../../src/plugins/remark/plugin-metadata-registry';
import { ProcessingPhase } from '../../../../src/plugins/remark/types';
import { PluginOrderValidator } from '../../../../src/plugins/remark/plugin-order-validator';

describe('Plugin Metadata Registry', () => {
  describe('Registry Initialization', () => {
    it('should have all required plugins registered', () => {
      const requiredPlugins = [
        'remarkTemplateFields',
        'processTemplateLoops',
        'remarkLegalHeadersParser',
        'remarkHeaders',
      ];

      requiredPlugins.forEach((pluginName) => {
        expect(isPluginRegistered(pluginName)).toBe(true);
      });
    });

    it('should have optional plugins registered', () => {
      const optionalPlugins = [
        'remarkImports',
        'remarkMixins',
        'remarkClauses',
        'remarkCrossReferences',
        'remarkCrossReferencesAst',
        'remarkDates',
        'remarkSignatureLines',
        'remarkFieldTracking',
        'remarkDebugAst',
      ];

      optionalPlugins.forEach((pluginName) => {
        expect(isPluginRegistered(pluginName)).toBe(true);
      });
    });

    it('should return all registered plugin names', () => {
      const allNames = getAllPluginNames();
      expect(allNames).toContain('remarkImports');
      expect(allNames).toContain('remarkTemplateFields');
      expect(allNames).toContain('processTemplateLoops');
      expect(allNames).toContain('remarkLegalHeadersParser');
      expect(allNames).toContain('remarkHeaders');
    });
  });

  describe('Phase Assignments', () => {
    it('should assign remarkImports to CONTENT_LOADING phase', () => {
      const metadata = getPluginMetadata('remarkImports');
      expect(metadata).toBeDefined();
      expect(metadata?.phase).toBe(ProcessingPhase.CONTENT_LOADING);
    });

    it('should assign remarkMixins to VARIABLE_EXPANSION phase', () => {
      const metadata = getPluginMetadata('remarkMixins');
      expect(metadata).toBeDefined();
      expect(metadata?.phase).toBe(ProcessingPhase.VARIABLE_EXPANSION);
    });

    it('should assign remarkTemplateFields to VARIABLE_EXPANSION phase', () => {
      const metadata = getPluginMetadata('remarkTemplateFields');
      expect(metadata).toBeDefined();
      expect(metadata?.phase).toBe(ProcessingPhase.VARIABLE_EXPANSION);
    });

    it('should assign processTemplateLoops to CONDITIONAL_EVAL phase', () => {
      const metadata = getPluginMetadata('processTemplateLoops');
      expect(metadata).toBeDefined();
      expect(metadata?.phase).toBe(ProcessingPhase.CONDITIONAL_EVAL);
    });

    it('should assign remarkClauses to CONDITIONAL_EVAL phase', () => {
      const metadata = getPluginMetadata('remarkClauses');
      expect(metadata).toBeDefined();
      expect(metadata?.phase).toBe(ProcessingPhase.CONDITIONAL_EVAL);
    });

    it('should assign remarkLegalHeadersParser to STRUCTURE_PARSING phase', () => {
      const metadata = getPluginMetadata('remarkLegalHeadersParser');
      expect(metadata).toBeDefined();
      expect(metadata?.phase).toBe(ProcessingPhase.STRUCTURE_PARSING);
    });

    it('should assign remarkCrossReferences to STRUCTURE_PARSING phase', () => {
      const metadata = getPluginMetadata('remarkCrossReferences');
      expect(metadata).toBeDefined();
      expect(metadata?.phase).toBe(ProcessingPhase.STRUCTURE_PARSING);
    });

    it('should assign remarkHeaders to STRUCTURE_PARSING phase', () => {
      const metadata = getPluginMetadata('remarkHeaders');
      expect(metadata).toBeDefined();
      expect(metadata?.phase).toBe(ProcessingPhase.STRUCTURE_PARSING);
    });

    it('should assign remarkDates to POST_PROCESSING phase', () => {
      const metadata = getPluginMetadata('remarkDates');
      expect(metadata).toBeDefined();
      expect(metadata?.phase).toBe(ProcessingPhase.POST_PROCESSING);
    });

    it('should assign remarkFieldTracking to POST_PROCESSING phase', () => {
      const metadata = getPluginMetadata('remarkFieldTracking');
      expect(metadata).toBeDefined();
      expect(metadata?.phase).toBe(ProcessingPhase.POST_PROCESSING);
    });
  });

  describe('Capabilities', () => {
    it('should define content:imported capability for remarkImports', () => {
      const metadata = getPluginMetadata('remarkImports');
      expect(metadata?.capabilities).toContain('content:imported');
      expect(metadata?.capabilities).toContain('metadata:merged');
    });

    it('should define mixins:expanded capability for remarkMixins', () => {
      const metadata = getPluginMetadata('remarkMixins');
      expect(metadata?.capabilities).toContain('mixins:expanded');
    });

    it('should define fields:expanded capability for remarkTemplateFields', () => {
      const metadata = getPluginMetadata('remarkTemplateFields');
      expect(metadata?.capabilities).toContain('fields:expanded');
      expect(metadata?.capabilities).toContain('variables:resolved');
    });

    it('should define conditionals:evaluated capability for processTemplateLoops', () => {
      const metadata = getPluginMetadata('processTemplateLoops');
      expect(metadata?.capabilities).toContain('conditionals:evaluated');
    });

    it('should define headers:parsed capability for remarkLegalHeadersParser', () => {
      const metadata = getPluginMetadata('remarkLegalHeadersParser');
      expect(metadata?.capabilities).toContain('headers:parsed');
    });

    it('should define headers:numbered capability for remarkHeaders', () => {
      const metadata = getPluginMetadata('remarkHeaders');
      expect(metadata?.capabilities).toContain('headers:numbered');
    });

    it('should define crossrefs:resolved capability for remarkCrossReferences', () => {
      const metadata = getPluginMetadata('remarkCrossReferences');
      expect(metadata?.capabilities).toContain('crossrefs:resolved');
    });
  });

  describe('Dependency Requirements', () => {
    it('should require CONTENT_LOADING phase for remarkMixins', () => {
      const metadata = getPluginMetadata('remarkMixins');
      expect(metadata?.requiresPhases).toContain(ProcessingPhase.CONTENT_LOADING);
    });

    it('should require metadata:merged capability for remarkMixins when imports are used', () => {
      const metadata = getPluginMetadata('remarkMixins');
      // remarkMixins requires metadata:merged to ensure imported metadata is available
      // This dependency is enforced in the phase-based pipeline
      expect(metadata?.requiresCapabilities).toContain('metadata:merged');
    });

    it('should require VARIABLE_EXPANSION phase for processTemplateLoops', () => {
      const metadata = getPluginMetadata('processTemplateLoops');
      expect(metadata?.requiresPhases).toContain(ProcessingPhase.VARIABLE_EXPANSION);
    });

    it('should require variables:resolved capability for processTemplateLoops', () => {
      const metadata = getPluginMetadata('processTemplateLoops');
      expect(metadata?.requiresCapabilities).toContain('variables:resolved');
    });

    it('should require CONTENT_LOADING phase for remarkLegalHeadersParser', () => {
      const metadata = getPluginMetadata('remarkLegalHeadersParser');
      expect(metadata?.requiresPhases).toContain(ProcessingPhase.CONTENT_LOADING);
    });

    it('should require headers:parsed capability for remarkCrossReferences', () => {
      const metadata = getPluginMetadata('remarkCrossReferences');
      expect(metadata?.requiresCapabilities).toContain('headers:parsed');
    });

    it('should require headers:parsed capability for remarkHeaders', () => {
      const metadata = getPluginMetadata('remarkHeaders');
      expect(metadata?.requiresCapabilities).toContain('headers:parsed');
    });

    it('should require fields:expanded capability for remarkFieldTracking', () => {
      const metadata = getPluginMetadata('remarkFieldTracking');
      expect(metadata?.requiresCapabilities).toContain('fields:expanded');
    });
  });

  describe('Run Order Constraints', () => {
    it('should require remarkImports to run before remarkLegalHeadersParser', () => {
      const metadata = getPluginMetadata('remarkImports');
      expect(metadata?.runBefore).toContain('remarkLegalHeadersParser');
    });

    it('should require remarkImports to run before remarkMixins', () => {
      const metadata = getPluginMetadata('remarkImports');
      expect(metadata?.runBefore).toContain('remarkMixins');
    });

    it('should require remarkMixins to run before remarkTemplateFields', () => {
      const metadata = getPluginMetadata('remarkMixins');
      expect(metadata?.runBefore).toContain('remarkTemplateFields');
    });

    // Note: remarkTemplateFields.runAfter was removed to avoid circular dependencies
    // The dependency is declared via remarkMixins.runBefore instead

    it('should require remarkLegalHeadersParser to run before remarkHeaders', () => {
      const metadata = getPluginMetadata('remarkLegalHeadersParser');
      expect(metadata?.runBefore).toContain('remarkHeaders');
    });

    // Note: We removed redundant runBefore/runAfter declarations to avoid circular dependencies
    // The dependency chain is now: remarkLegalHeadersParser → remarkCrossReferences → remarkHeaders
    // This is achieved with:
    // - remarkCrossReferences.runAfter: ['remarkLegalHeadersParser']
    // - remarkCrossReferences.runBefore: ['remarkHeaders']
    // - remarkLegalHeadersParser.runBefore: ['remarkHeaders']
    // We don't need to declare the same dependency from both sides (e.g., A.runBefore:[B] AND B.runAfter:[A])

    it('should require remarkCrossReferences to run after remarkLegalHeadersParser', () => {
      const metadata = getPluginMetadata('remarkCrossReferences');
      expect(metadata?.runAfter).toContain('remarkLegalHeadersParser');
    });

    it('should require remarkCrossReferences to run before remarkHeaders', () => {
      const metadata = getPluginMetadata('remarkCrossReferences');
      expect(metadata?.runBefore).toContain('remarkHeaders');
    });

    it('should ensure correct plugin order via topological sort within same phase', () => {
      // Verify that the topological sort produces the correct order within a phase
      // Test with just the required plugins (parser and headers) without optional cross-refs
      const validator = new PluginOrderValidator(GLOBAL_PLUGIN_REGISTRY);

      // These are Phase 4 required plugins with declared dependencies:
      // remarkLegalHeadersParser.runBefore: ['remarkHeaders']
      // remarkHeaders.runAfter: ['remarkLegalHeadersParser']
      const plugins = ['remarkLegalHeadersParser', 'remarkHeaders'];
      const sorted = validator.topologicalSort(plugins);

      // Expected order: parser → headers
      expect(sorted).toEqual(['remarkLegalHeadersParser', 'remarkHeaders']);
    });
  });

  describe('Plugin Conflicts', () => {
    it('should mark remarkCrossReferences and remarkCrossReferencesAst as conflicting', () => {
      const crossRefsMetadata = getPluginMetadata('remarkCrossReferences');
      const crossRefsAstMetadata = getPluginMetadata('remarkCrossReferencesAst');

      // One should list the other as a conflict (bidirectional check)
      const hasConflict =
        (crossRefsMetadata?.conflicts?.includes('remarkCrossReferencesAst') ?? false) ||
        (crossRefsAstMetadata?.conflicts?.includes('remarkCrossReferences') ?? false);

      expect(hasConflict).toBe(true);
    });
  });

  describe('Required Plugins', () => {
    it('should mark remarkTemplateFields as required', () => {
      const metadata = getPluginMetadata('remarkTemplateFields');
      expect(metadata?.required).toBe(true);
    });

    it('should mark processTemplateLoops as required in phase-based pipeline', () => {
      const metadata = getPluginMetadata('processTemplateLoops');
      // In the new phase-based pipeline, processTemplateLoops is a required plugin
      // that runs in Phase 3 (CONDITIONAL_EVAL) as a remark plugin via the adapter
      expect(metadata?.required).toBe(true);
    });

    it('should mark remarkLegalHeadersParser as required', () => {
      const metadata = getPluginMetadata('remarkLegalHeadersParser');
      expect(metadata?.required).toBe(true);
    });

    it('should mark remarkHeaders as required', () => {
      const metadata = getPluginMetadata('remarkHeaders');
      expect(metadata?.required).toBe(true);
    });

    it('should mark remarkImports as optional', () => {
      const metadata = getPluginMetadata('remarkImports');
      expect(metadata?.required).toBe(false);
    });

    it('should mark remarkMixins as optional', () => {
      const metadata = getPluginMetadata('remarkMixins');
      expect(metadata?.required).toBe(false);
    });

    it('should mark remarkClauses as optional', () => {
      const metadata = getPluginMetadata('remarkClauses');
      expect(metadata?.required).toBe(false);
    });
  });

  describe('Metadata Retrieval', () => {
    it('should return undefined for non-existent plugins', () => {
      const metadata = getPluginMetadata('nonExistentPlugin');
      expect(metadata).toBeUndefined();
    });

    it('should return false for non-existent plugins in isPluginRegistered', () => {
      expect(isPluginRegistered('nonExistentPlugin')).toBe(false);
    });

    it('should retrieve complete metadata for remarkImports', () => {
      const metadata = getPluginMetadata('remarkImports');

      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('remarkImports');
      expect(metadata?.phase).toBe(ProcessingPhase.CONTENT_LOADING);
      expect(metadata?.description).toBeTruthy();
      expect(metadata?.required).toBe(false);
      expect(metadata?.version).toBe('2.0.0');
    });

    it('should have descriptions for all plugins', () => {
      const allNames = getAllPluginNames();

      allNames.forEach((pluginName) => {
        const metadata = getPluginMetadata(pluginName);
        expect(metadata?.description).toBeTruthy();
        expect(metadata?.description.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Phase Ordering Validation', () => {
    it('should ensure CONTENT_LOADING happens before VARIABLE_EXPANSION', () => {
      const contentLoadingPlugin = getPluginMetadata('remarkImports');
      const variableExpansionPlugin = getPluginMetadata('remarkMixins');

      expect(contentLoadingPlugin?.phase).toBeLessThan(
        variableExpansionPlugin?.phase ?? Infinity
      );
    });

    it('should ensure VARIABLE_EXPANSION happens before CONDITIONAL_EVAL', () => {
      const variableExpansionPlugin = getPluginMetadata('remarkTemplateFields');
      const conditionalEvalPlugin = getPluginMetadata('processTemplateLoops');

      expect(variableExpansionPlugin?.phase).toBeLessThan(
        conditionalEvalPlugin?.phase ?? Infinity
      );
    });

    it('should ensure CONDITIONAL_EVAL happens before STRUCTURE_PARSING', () => {
      const conditionalEvalPlugin = getPluginMetadata('processTemplateLoops');
      const structureParsingPlugin = getPluginMetadata('remarkLegalHeadersParser');

      expect(conditionalEvalPlugin?.phase).toBeLessThan(
        structureParsingPlugin?.phase ?? Infinity
      );
    });

    it('should ensure STRUCTURE_PARSING happens before POST_PROCESSING', () => {
      const structureParsingPlugin = getPluginMetadata('remarkHeaders');
      const postProcessingPlugin = getPluginMetadata('remarkFieldTracking');

      expect(structureParsingPlugin?.phase).toBeLessThan(
        postProcessingPlugin?.phase ?? Infinity
      );
    });
  });

  describe('Critical Path for Issue #120', () => {
    it('should ensure variables expand BEFORE conditionals evaluate', () => {
      const remarkTemplateFields = getPluginMetadata('remarkTemplateFields');
      const processTemplateLoops = getPluginMetadata('processTemplateLoops');

      // remarkTemplateFields expands variables (Phase 2: VARIABLE_EXPANSION)
      expect(remarkTemplateFields?.phase).toBe(ProcessingPhase.VARIABLE_EXPANSION);
      expect(remarkTemplateFields?.capabilities).toContain('variables:resolved');

      // processTemplateLoops evaluates conditionals (Phase 3: CONDITIONAL_EVAL)
      expect(processTemplateLoops?.phase).toBe(ProcessingPhase.CONDITIONAL_EVAL);
      expect(processTemplateLoops?.requiresCapabilities).toContain('variables:resolved');

      // Critical assertion: Phase 2 must come before Phase 3
      expect(remarkTemplateFields?.phase).toBeLessThan(processTemplateLoops?.phase ?? Infinity);
    });

    it('should ensure processTemplateLoops requires variables to be resolved', () => {
      const metadata = getPluginMetadata('processTemplateLoops');

      expect(metadata?.requiresPhases).toContain(ProcessingPhase.VARIABLE_EXPANSION);
      expect(metadata?.requiresCapabilities).toContain('variables:resolved');
    });
  });
});
