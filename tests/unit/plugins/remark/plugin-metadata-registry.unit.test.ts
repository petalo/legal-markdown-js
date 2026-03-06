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
  const activePipelinePlugins = [
    'remarkImports',
    'remarkLegalHeadersParser',
    'remarkMixins',
    'remarkDates',
    'remarkSignatureLines',
    'remarkTemplateFields',
    'remarkCrossReferences',
    'remarkHeaders',
  ] as const;

  describe('Registry shape', () => {
    it('contains all active remark pipeline plugins', () => {
      activePipelinePlugins.forEach(name => {
        expect(isPluginRegistered(name)).toBe(true);
      });
    });

    it('does not include inactive/experimental plugins', () => {
      expect(isPluginRegistered('processTemplateLoops')).toBe(false);
      expect(isPluginRegistered('remarkClauses')).toBe(false);
      expect(isPluginRegistered('remarkCrossReferencesAst')).toBe(false);
      expect(isPluginRegistered('remarkFieldTracking')).toBe(false);
      expect(isPluginRegistered('remarkDebugAst')).toBe(false);
    });

    it('returns expected plugin names', () => {
      const names = getAllPluginNames();
      expect(names.sort()).toEqual([...activePipelinePlugins].sort());
    });
  });

  describe('Metadata consistency', () => {
    it('assigns expected phases for core plugins', () => {
      expect(getPluginMetadata('remarkImports')?.phase).toBe(ProcessingPhase.CONTENT_LOADING);
      expect(getPluginMetadata('remarkMixins')?.phase).toBe(ProcessingPhase.VARIABLE_EXPANSION);
      expect(getPluginMetadata('remarkTemplateFields')?.phase).toBe(
        ProcessingPhase.VARIABLE_EXPANSION
      );
      expect(getPluginMetadata('remarkLegalHeadersParser')?.phase).toBe(
        ProcessingPhase.STRUCTURE_PARSING
      );
      expect(getPluginMetadata('remarkHeaders')?.phase).toBe(ProcessingPhase.STRUCTURE_PARSING);
      expect(getPluginMetadata('remarkDates')?.phase).toBe(ProcessingPhase.POST_PROCESSING);
    });

    it('keeps required plugins aligned with runtime processor', () => {
      expect(getPluginMetadata('remarkTemplateFields')?.required).toBe(true);
      expect(getPluginMetadata('remarkLegalHeadersParser')?.required).toBe(true);
      expect(getPluginMetadata('remarkHeaders')?.required).toBe(true);
      expect(getPluginMetadata('remarkImports')?.required).toBe(false);
      expect(getPluginMetadata('remarkMixins')?.required).toBe(false);
      expect(getPluginMetadata('remarkCrossReferences')?.required).toBe(false);
    });

    it('keeps ordering constraints for structural plugins', () => {
      expect(getPluginMetadata('remarkImports')?.runBefore).toContain('remarkLegalHeadersParser');
      expect(getPluginMetadata('remarkMixins')?.runBefore).toContain('remarkTemplateFields');
      expect(getPluginMetadata('remarkCrossReferences')?.runAfter).toContain(
        'remarkLegalHeadersParser'
      );
      expect(getPluginMetadata('remarkCrossReferences')?.runBefore).toContain('remarkHeaders');
    });
  });

  describe('Validator interoperability', () => {
    it('validates the runtime plugin order', () => {
      const validator = new PluginOrderValidator(GLOBAL_PLUGIN_REGISTRY);
      const runtimeOrder = [
        'remarkImports',
        'remarkLegalHeadersParser',
        'remarkMixins',
        'remarkDates',
        'remarkSignatureLines',
        'remarkTemplateFields',
        'remarkCrossReferences',
        'remarkHeaders',
      ];

      const result = validator.validate(runtimeOrder, { throwOnError: false, logWarnings: false });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns undefined for unknown plugins', () => {
      expect(getPluginMetadata('doesNotExist')).toBeUndefined();
      expect(isPluginRegistered('doesNotExist')).toBe(false);
    });
  });
});
