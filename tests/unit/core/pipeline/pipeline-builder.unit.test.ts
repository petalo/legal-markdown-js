/**
 * Unit Tests for Pipeline Builder
 *
 * Comprehensive test suite for the phase-based pipeline builder system.
 * Tests cover basic functionality, phase ordering, capabilities validation,
 * validation modes, and error handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildRemarkPipeline,
  detectValidationMode,
  groupPluginsByPhase,
  validateCapabilities,
} from '../../../../src/core/pipeline/pipeline-builder';
import { ProcessingPhase } from '../../../../src/plugins/remark/types';
import type { PluginMetadata } from '../../../../src/plugins/remark/types';

describe('Pipeline Builder', () => {
  let testRegistry: Map<string, PluginMetadata>;

  beforeEach(() => {
    // Create a test registry with plugins across all 5 phases
    testRegistry = new Map([
      [
        'pluginPhase1A',
        {
          name: 'pluginPhase1A',
          description: 'Phase 1 plugin A',
          phase: ProcessingPhase.CONTENT_LOADING,
          capabilities: ['content:loaded'],
          required: true,
        },
      ],
      [
        'pluginPhase1B',
        {
          name: 'pluginPhase1B',
          description: 'Phase 1 plugin B',
          phase: ProcessingPhase.CONTENT_LOADING,
          capabilities: ['metadata:merged'],
          runAfter: ['pluginPhase1A'],
          required: false,
        },
      ],
      [
        'pluginPhase2A',
        {
          name: 'pluginPhase2A',
          description: 'Phase 2 plugin A',
          phase: ProcessingPhase.VARIABLE_EXPANSION,
          requiresPhases: [ProcessingPhase.CONTENT_LOADING],
          requiresCapabilities: ['content:loaded'],
          capabilities: ['variables:resolved'],
          required: true,
        },
      ],
      [
        'pluginPhase2B',
        {
          name: 'pluginPhase2B',
          description: 'Phase 2 plugin B',
          phase: ProcessingPhase.VARIABLE_EXPANSION,
          capabilities: ['mixins:expanded'],
          runBefore: ['pluginPhase2A'],
          required: false,
        },
      ],
      [
        'pluginPhase3',
        {
          name: 'pluginPhase3',
          description: 'Phase 3 plugin',
          phase: ProcessingPhase.CONDITIONAL_EVAL,
          requiresPhases: [ProcessingPhase.VARIABLE_EXPANSION],
          requiresCapabilities: ['variables:resolved'],
          capabilities: ['conditionals:evaluated'],
          required: true,
        },
      ],
      [
        'pluginPhase4',
        {
          name: 'pluginPhase4',
          description: 'Phase 4 plugin',
          phase: ProcessingPhase.STRUCTURE_PARSING,
          capabilities: ['headers:parsed'],
          required: false,
        },
      ],
      [
        'pluginPhase5',
        {
          name: 'pluginPhase5',
          description: 'Phase 5 plugin',
          phase: ProcessingPhase.POST_PROCESSING,
          requiresCapabilities: ['variables:resolved'],
          capabilities: ['tracking:complete'],
          required: false,
        },
      ],
    ]);
  });

  describe('Basic Functionality', () => {
    it('should build a pipeline with all enabled plugins', () => {
      const pipeline = buildRemarkPipeline(
        {
          enabledPlugins: ['pluginPhase1A', 'pluginPhase2A', 'pluginPhase3'],
          metadata: {},
          options: {},
          validationMode: 'silent',
        },
        testRegistry
      );

      expect(pipeline.names).toEqual(['pluginPhase1A', 'pluginPhase2A', 'pluginPhase3']);
      expect(pipeline.names).toHaveLength(3);
    });

    it('should include configuration in the result', () => {
      const config = {
        enabledPlugins: ['pluginPhase1A'],
        metadata: { test: 'value' },
        options: { debug: true },
        validationMode: 'warn' as const,
      };

      const pipeline = buildRemarkPipeline(config, testRegistry);

      expect(pipeline.config).toEqual(config);
      expect(pipeline.config.metadata).toEqual({ test: 'value' });
      expect(pipeline.config.options).toEqual({ debug: true });
    });

    it('should set builtAt timestamp', () => {
      const before = new Date();
      const pipeline = buildRemarkPipeline(
        {
          enabledPlugins: ['pluginPhase1A'],
          metadata: {},
          options: {},
        },
        testRegistry
      );
      const after = new Date();

      expect(pipeline.builtAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(pipeline.builtAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should collect all capabilities from enabled plugins', () => {
      const pipeline = buildRemarkPipeline(
        {
          enabledPlugins: ['pluginPhase1A', 'pluginPhase2A', 'pluginPhase3'],
          metadata: {},
          options: {},
          validationMode: 'silent',
        },
        testRegistry
      );

      expect(pipeline.capabilities).toContain('content:loaded');
      expect(pipeline.capabilities).toContain('variables:resolved');
      expect(pipeline.capabilities).toContain('conditionals:evaluated');
      expect(pipeline.capabilities.size).toBe(3);
    });

    it('should work with empty plugin list', () => {
      const pipeline = buildRemarkPipeline(
        {
          enabledPlugins: [],
          metadata: {},
          options: {},
          validationMode: 'silent',
        },
        testRegistry
      );

      expect(pipeline.names).toEqual([]);
      expect(pipeline.capabilities.size).toBe(0);
    });
  });

  describe('Phase Ordering', () => {
    it('should order plugins by phase number (1 → 2 → 3 → 4 → 5)', () => {
      const pipeline = buildRemarkPipeline(
        {
          enabledPlugins: [
            'pluginPhase5',
            'pluginPhase3',
            'pluginPhase1A',
            'pluginPhase4',
            'pluginPhase2A',
          ],
          metadata: {},
          options: {},
          validationMode: 'silent',
        },
        testRegistry
      );

      expect(pipeline.names).toEqual([
        'pluginPhase1A',
        'pluginPhase2A',
        'pluginPhase3',
        'pluginPhase4',
        'pluginPhase5',
      ]);
    });

    it('should group plugins by phase correctly', () => {
      const pipeline = buildRemarkPipeline(
        {
          enabledPlugins: ['pluginPhase1A', 'pluginPhase1B', 'pluginPhase2A', 'pluginPhase3'],
          metadata: {},
          options: {},
          validationMode: 'silent',
        },
        testRegistry
      );

      expect(pipeline.byPhase.get(ProcessingPhase.CONTENT_LOADING)).toHaveLength(2);
      expect(pipeline.byPhase.get(ProcessingPhase.VARIABLE_EXPANSION)).toHaveLength(1);
      expect(pipeline.byPhase.get(ProcessingPhase.CONDITIONAL_EVAL)).toHaveLength(1);
      expect(pipeline.byPhase.get(ProcessingPhase.STRUCTURE_PARSING)).toHaveLength(0);
      expect(pipeline.byPhase.get(ProcessingPhase.POST_PROCESSING)).toHaveLength(0);
    });

    it('should respect runBefore/runAfter constraints within phases', () => {
      const pipeline = buildRemarkPipeline(
        {
          enabledPlugins: ['pluginPhase1A', 'pluginPhase2A', 'pluginPhase2B'], // 2B runs before 2A
          metadata: {},
          options: {},
          validationMode: 'silent',
        },
        testRegistry
      );

      const phase2Plugins = pipeline.byPhase.get(ProcessingPhase.VARIABLE_EXPANSION) || [];
      expect(phase2Plugins[0]).toBe('pluginPhase2B');
      expect(phase2Plugins[1]).toBe('pluginPhase2A');
    });

    it('should sort multiple plugins in same phase topologically', () => {
      const pipeline = buildRemarkPipeline(
        {
          enabledPlugins: ['pluginPhase1B', 'pluginPhase1A'], // 1B depends on 1A
          metadata: {},
          options: {},
          validationMode: 'silent',
        },
        testRegistry
      );

      const phase1Plugins = pipeline.byPhase.get(ProcessingPhase.CONTENT_LOADING) || [];
      expect(phase1Plugins[0]).toBe('pluginPhase1A');
      expect(phase1Plugins[1]).toBe('pluginPhase1B');
    });

    it('should ensure Phase 2 always runs after Phase 1', () => {
      const pipeline = buildRemarkPipeline(
        {
          enabledPlugins: ['pluginPhase2A', 'pluginPhase1A'],
          metadata: {},
          options: {},
          validationMode: 'silent',
        },
        testRegistry
      );

      const phase1Index = pipeline.names.indexOf('pluginPhase1A');
      const phase2Index = pipeline.names.indexOf('pluginPhase2A');
      expect(phase1Index).toBeLessThan(phase2Index);
    });

    it('should ensure Phase 3 always runs after Phase 2', () => {
      const pipeline = buildRemarkPipeline(
        {
          enabledPlugins: ['pluginPhase1A', 'pluginPhase3', 'pluginPhase2A'],
          metadata: {},
          options: {},
          validationMode: 'silent',
        },
        testRegistry
      );

      const phase2Index = pipeline.names.indexOf('pluginPhase2A');
      const phase3Index = pipeline.names.indexOf('pluginPhase3');
      expect(phase2Index).toBeLessThan(phase3Index);
    });
  });

  describe('Capabilities Validation', () => {
    it('should validate that required capabilities are provided', () => {
      expect(() => {
        buildRemarkPipeline(
          {
            enabledPlugins: ['pluginPhase2A', 'pluginPhase1A'], // Phase2A requires content:loaded
            metadata: {},
            options: {},
            validationMode: 'silent',
          },
          testRegistry
        );
      }).not.toThrow();
    });

    it('should throw error when required capability is missing', () => {
      expect(() => {
        buildRemarkPipeline(
          {
            enabledPlugins: ['pluginPhase2A'], // Missing pluginPhase1A which provides content:loaded
            metadata: {},
            options: {},
            validationMode: 'silent',
          },
          testRegistry
        );
      }).toThrow(/capability validation failed/i);
    });

    it('should throw error when capability is required but provided later', () => {
      // Create a plugin that requires a capability from a later phase
      const badRegistry = new Map(testRegistry);
      badRegistry.set('badPlugin', {
        name: 'badPlugin',
        description: 'Bad plugin requiring future capability',
        phase: ProcessingPhase.CONTENT_LOADING,
        requiresCapabilities: ['variables:resolved'], // This is provided in Phase 2
        required: false,
      });

      expect(() => {
        buildRemarkPipeline(
          {
            enabledPlugins: ['badPlugin', 'pluginPhase2A'],
            metadata: {},
            options: {},
            validationMode: 'silent',
          },
          badRegistry
        );
      }).toThrow(/capability validation failed/i);
    });

    it('should validate multiple capabilities correctly', () => {
      const multiCapRegistry = new Map(testRegistry);
      multiCapRegistry.set('multiRequire', {
        name: 'multiRequire',
        description: 'Plugin requiring multiple capabilities',
        phase: ProcessingPhase.POST_PROCESSING,
        requiresCapabilities: ['variables:resolved', 'conditionals:evaluated'],
        required: false,
      });

      expect(() => {
        buildRemarkPipeline(
          {
            enabledPlugins: ['pluginPhase1A', 'pluginPhase2A', 'pluginPhase3', 'multiRequire'],
            metadata: {},
            options: {},
            validationMode: 'silent',
          },
          multiCapRegistry
        );
      }).not.toThrow();
    });

    it('should throw when any of multiple required capabilities is missing', () => {
      const multiCapRegistry = new Map(testRegistry);
      multiCapRegistry.set('multiRequire', {
        name: 'multiRequire',
        description: 'Plugin requiring multiple capabilities',
        phase: ProcessingPhase.POST_PROCESSING,
        requiresCapabilities: ['variables:resolved', 'conditionals:evaluated'],
        required: false,
      });

      expect(() => {
        buildRemarkPipeline(
          {
            enabledPlugins: ['pluginPhase2A', 'multiRequire'], // Missing pluginPhase3
            metadata: {},
            options: {},
            validationMode: 'silent',
          },
          multiCapRegistry
        );
      }).toThrow(/capability validation failed/i);
    });
  });

  describe('Validation Modes', () => {
    it('should use strict mode in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const mode = detectValidationMode();
      expect(mode).toBe('strict');

      process.env.NODE_ENV = originalEnv;
    });

    it('should use warn mode in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mode = detectValidationMode();
      expect(mode).toBe('warn');

      process.env.NODE_ENV = originalEnv;
    });

    it('should use strict mode in CI environment', () => {
      const originalCI = process.env.CI;
      const originalEnv = process.env.NODE_ENV;

      process.env.CI = 'true';
      process.env.NODE_ENV = 'production'; // Even in prod, CI should be strict

      const mode = detectValidationMode();
      expect(mode).toBe('strict');

      process.env.CI = originalCI;
      process.env.NODE_ENV = originalEnv;
    });

    it('should respect explicit LEGAL_MD_VALIDATION_MODE environment variable', () => {
      const originalMode = process.env.LEGAL_MD_VALIDATION_MODE;

      process.env.LEGAL_MD_VALIDATION_MODE = 'silent';
      expect(detectValidationMode()).toBe('silent');

      process.env.LEGAL_MD_VALIDATION_MODE = 'warn';
      expect(detectValidationMode()).toBe('warn');

      process.env.LEGAL_MD_VALIDATION_MODE = 'strict';
      expect(detectValidationMode()).toBe('strict');

      process.env.LEGAL_MD_VALIDATION_MODE = originalMode;
    });

    it('should use warn mode in test environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      const mode = detectValidationMode();
      expect(mode).toBe('warn');

      process.env.NODE_ENV = originalEnv;
    });

    it('should allow manual override of validation mode', () => {
      const pipeline = buildRemarkPipeline(
        {
          enabledPlugins: ['pluginPhase1A'],
          metadata: {},
          options: {},
          validationMode: 'silent',
        },
        testRegistry
      );

      expect(pipeline.config.validationMode).toBe('silent');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for non-existent plugin', () => {
      expect(() => {
        buildRemarkPipeline(
          {
            enabledPlugins: ['nonExistentPlugin'],
            metadata: {},
            options: {},
            validationMode: 'silent',
          },
          testRegistry
        );
      }).toThrow(/not found in registry/i);
    });

    it('should throw error for plugin without phase assignment', () => {
      const badRegistry = new Map(testRegistry);
      badRegistry.set('noPhasePlugin', {
        name: 'noPhasePlugin',
        description: 'Plugin without phase',
        phase: undefined as any,
        required: false,
      });

      expect(() => {
        buildRemarkPipeline(
          {
            enabledPlugins: ['noPhasePlugin'],
            metadata: {},
            options: {},
            validationMode: 'silent',
          },
          badRegistry
        );
      }).toThrow(/has no phase assigned/i);
    });

    it('should provide helpful error message with available plugins', () => {
      try {
        buildRemarkPipeline(
          {
            enabledPlugins: ['missingPlugin'],
            metadata: {},
            options: {},
            validationMode: 'silent',
          },
          testRegistry
        );
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Available plugins:');
        expect(error.message).toContain('pluginPhase1A');
      }
    });

    it('should handle circular dependencies gracefully', () => {
      const circularRegistry = new Map<string, PluginMetadata>([
        [
          'pluginA',
          {
            name: 'pluginA',
            description: 'Plugin A',
            phase: ProcessingPhase.CONTENT_LOADING,
            runAfter: ['pluginB'],
            required: false,
          },
        ],
        [
          'pluginB',
          {
            name: 'pluginB',
            description: 'Plugin B',
            phase: ProcessingPhase.CONTENT_LOADING,
            runAfter: ['pluginA'],
            required: false,
          },
        ],
      ]);

      expect(() => {
        buildRemarkPipeline(
          {
            enabledPlugins: ['pluginA', 'pluginB'],
            metadata: {},
            options: {},
            validationMode: 'silent',
          },
          circularRegistry
        );
      }).toThrow(/circular/i);
    });
  });

  describe('Helper Functions', () => {
    describe('groupPluginsByPhase()', () => {
      it('should initialize all 5 phases', () => {
        const grouped = groupPluginsByPhase(['pluginPhase1A'], testRegistry);

        expect(grouped.size).toBe(5);
        expect(grouped.has(ProcessingPhase.CONTENT_LOADING)).toBe(true);
        expect(grouped.has(ProcessingPhase.VARIABLE_EXPANSION)).toBe(true);
        expect(grouped.has(ProcessingPhase.CONDITIONAL_EVAL)).toBe(true);
        expect(grouped.has(ProcessingPhase.STRUCTURE_PARSING)).toBe(true);
        expect(grouped.has(ProcessingPhase.POST_PROCESSING)).toBe(true);
      });

      it('should group plugins correctly by phase', () => {
        const grouped = groupPluginsByPhase(
          ['pluginPhase1A', 'pluginPhase1B', 'pluginPhase2A'],
          testRegistry
        );

        expect(grouped.get(ProcessingPhase.CONTENT_LOADING)).toEqual([
          'pluginPhase1A',
          'pluginPhase1B',
        ]);
        expect(grouped.get(ProcessingPhase.VARIABLE_EXPANSION)).toEqual(['pluginPhase2A']);
      });

      it('should handle empty arrays for unused phases', () => {
        const grouped = groupPluginsByPhase(['pluginPhase1A'], testRegistry);

        expect(grouped.get(ProcessingPhase.VARIABLE_EXPANSION)).toEqual([]);
        expect(grouped.get(ProcessingPhase.CONDITIONAL_EVAL)).toEqual([]);
        expect(grouped.get(ProcessingPhase.STRUCTURE_PARSING)).toEqual([]);
        expect(grouped.get(ProcessingPhase.POST_PROCESSING)).toEqual([]);
      });
    });

    describe('validateCapabilities()', () => {
      it('should not throw when all capabilities are satisfied', () => {
        expect(() => {
          validateCapabilities(['pluginPhase1A', 'pluginPhase2A'], testRegistry);
        }).not.toThrow();
      });

      it('should throw when capability is missing', () => {
        expect(() => {
          validateCapabilities(['pluginPhase2A'], testRegistry); // Missing content:loaded
        }).toThrow(/capability validation failed/i);
      });

      it('should include plugin name and capability in error message', () => {
        try {
          validateCapabilities(['pluginPhase2A'], testRegistry);
          expect.fail('Should have thrown');
        } catch (error: any) {
          expect(error.message).toContain('pluginPhase2A');
          expect(error.message).toContain('content:loaded');
        }
      });
    });
  });

  describe('Critical Path for Issue #120', () => {
    it('should guarantee variables expand before conditionals evaluate', () => {
      // Simulate the real-world scenario from Issue #120
      const issueRegistry = new Map<string, PluginMetadata>([
        [
          'remarkTemplateFields',
          {
            name: 'remarkTemplateFields',
            description: 'Expand template fields',
            phase: ProcessingPhase.VARIABLE_EXPANSION,
            capabilities: ['variables:resolved'],
            required: true,
          },
        ],
        [
          'processTemplateLoops',
          {
            name: 'processTemplateLoops',
            description: 'Process template loops',
            phase: ProcessingPhase.CONDITIONAL_EVAL,
            requiresCapabilities: ['variables:resolved'],
            capabilities: ['conditionals:evaluated'],
            required: true,
          },
        ],
      ]);

      const pipeline = buildRemarkPipeline(
        {
          enabledPlugins: ['processTemplateLoops', 'remarkTemplateFields'], // Deliberately wrong order
          metadata: {},
          options: {},
          validationMode: 'silent',
        },
        issueRegistry
      );

      // Pipeline builder should fix the order automatically
      expect(pipeline.names[0]).toBe('remarkTemplateFields');
      expect(pipeline.names[1]).toBe('processTemplateLoops');

      // Verify phase ordering
      const templateFieldsIndex = pipeline.names.indexOf('remarkTemplateFields');
      const loopsIndex = pipeline.names.indexOf('processTemplateLoops');
      expect(templateFieldsIndex).toBeLessThan(loopsIndex);
    });
  });
});
