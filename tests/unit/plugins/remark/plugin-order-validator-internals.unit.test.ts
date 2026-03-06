import { PluginOrderValidator, createPluginRegistry } from '../../../../src/plugins/remark/plugin-order-validator';
import type { PluginMetadata } from '../../../../src/plugins/remark/types';
import { ProcessingPhase } from '../../../../src/plugins/remark/types';

function makeMetadata(overrides: Partial<PluginMetadata> & { name: string }): PluginMetadata {
  return {
    phase: ProcessingPhase.CONTENT_LOADING,
    description: 'test plugin',
    capabilities: [],
    ...overrides,
  };
}

describe('plugin-order-validator.ts', () => {
  // ── validate ───────────────────────────────────────────────────────

  describe('validate', () => {
    it('returns valid for correct ordering', () => {
      const registry = createPluginRegistry([
        makeMetadata({ name: 'A', runBefore: ['B'] }),
        makeMetadata({ name: 'B' }),
      ]);
      const validator = new PluginOrderValidator(registry);
      const result = validator.validate(['A', 'B'], { throwOnError: false });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('detects runBefore violation', () => {
      const registry = createPluginRegistry([
        makeMetadata({ name: 'A', runBefore: ['B'] }),
        makeMetadata({ name: 'B' }),
      ]);
      const validator = new PluginOrderValidator(registry);
      const result = validator.validate(['B', 'A'], { throwOnError: false });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'dependency-violation')).toBe(true);
    });

    it('detects runAfter violation', () => {
      const registry = createPluginRegistry([
        makeMetadata({ name: 'A' }),
        makeMetadata({ name: 'B', runAfter: ['A'] }),
      ]);
      const validator = new PluginOrderValidator(registry);
      const result = validator.validate(['B', 'A'], { throwOnError: false });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'dependency-violation')).toBe(true);
    });

    it('detects conflict between plugins', () => {
      const registry = createPluginRegistry([
        makeMetadata({ name: 'A', conflicts: ['B'] }),
        makeMetadata({ name: 'B' }),
      ]);
      const validator = new PluginOrderValidator(registry);
      const result = validator.validate(['A', 'B'], { throwOnError: false });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'conflict')).toBe(true);
    });

    it('warns about missing required plugins', () => {
      const registry = createPluginRegistry([
        makeMetadata({ name: 'A', required: true }),
      ]);
      const validator = new PluginOrderValidator(registry);
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = validator.validate([], { throwOnError: false });
      expect(result.warnings.some(w => w.type === 'missing-required')).toBe(true);
      spy.mockRestore();
    });

    it('warns about unknown plugins in strict mode', () => {
      const registry = createPluginRegistry([]);
      const validator = new PluginOrderValidator(registry);
      const result = validator.validate(['unknown'], { throwOnError: false, strictMode: true, logWarnings: false });
      expect(result.warnings.some(w => w.type === 'unknown-plugin')).toBe(true);
    });

    it('throws when throwOnError is true and validation fails', () => {
      const registry = createPluginRegistry([
        makeMetadata({ name: 'A', runBefore: ['B'] }),
        makeMetadata({ name: 'B' }),
      ]);
      const validator = new PluginOrderValidator(registry);
      expect(() => validator.validate(['B', 'A'], { throwOnError: true })).toThrow();
    });

    it('provides suggestedOrder when validation fails', () => {
      const registry = createPluginRegistry([
        makeMetadata({ name: 'A', runBefore: ['B'] }),
        makeMetadata({ name: 'B' }),
      ]);
      const validator = new PluginOrderValidator(registry);
      const result = validator.validate(['B', 'A'], { throwOnError: false });
      expect(result.suggestedOrder).toBeDefined();
      expect(result.suggestedOrder).toContain('A');
      expect(result.suggestedOrder).toContain('B');
    });
  });

  // ── topologicalSort ────────────────────────────────────────────────

  describe('topologicalSort', () => {
    it('sorts based on runBefore constraints', () => {
      const registry = createPluginRegistry([
        makeMetadata({ name: 'A', runBefore: ['B'] }),
        makeMetadata({ name: 'B', runBefore: ['C'] }),
        makeMetadata({ name: 'C' }),
      ]);
      const validator = new PluginOrderValidator(registry);
      const sorted = validator.topologicalSort(['C', 'A', 'B']);
      expect(sorted.indexOf('A')).toBeLessThan(sorted.indexOf('B'));
      expect(sorted.indexOf('B')).toBeLessThan(sorted.indexOf('C'));
    });

    it('sorts based on runAfter constraints', () => {
      const registry = createPluginRegistry([
        makeMetadata({ name: 'A' }),
        makeMetadata({ name: 'B', runAfter: ['A'] }),
      ]);
      const validator = new PluginOrderValidator(registry);
      const sorted = validator.topologicalSort(['B', 'A']);
      expect(sorted.indexOf('A')).toBeLessThan(sorted.indexOf('B'));
    });

    it('throws on circular dependencies', () => {
      const registry = createPluginRegistry([
        makeMetadata({ name: 'A', runAfter: ['B'] }),
        makeMetadata({ name: 'B', runAfter: ['A'] }),
      ]);
      const validator = new PluginOrderValidator(registry);
      expect(() => validator.topologicalSort(['A', 'B'])).toThrow('circular dependencies');
    });

    it('handles plugins with no constraints', () => {
      const registry = createPluginRegistry([
        makeMetadata({ name: 'A' }),
        makeMetadata({ name: 'B' }),
      ]);
      const validator = new PluginOrderValidator(registry);
      const sorted = validator.topologicalSort(['A', 'B']);
      expect(sorted).toHaveLength(2);
    });
  });

  // ── validateCapabilities ───────────────────────────────────────────

  describe('validateCapabilities', () => {
    it('returns no errors when all capabilities are satisfied', () => {
      const registry = createPluginRegistry([
        makeMetadata({ name: 'A', capabilities: ['content:imported'] }),
        makeMetadata({ name: 'B', requiresCapabilities: ['content:imported'] }),
      ]);
      const validator = new PluginOrderValidator(registry);
      const errors = validator.validateCapabilities(['A', 'B']);
      expect(errors).toEqual([]);
    });

    it('returns error when required capability is missing', () => {
      const registry = createPluginRegistry([
        makeMetadata({ name: 'B', requiresCapabilities: ['content:imported'] }),
      ]);
      const validator = new PluginOrderValidator(registry);
      const errors = validator.validateCapabilities(['B']);
      expect(errors.length).toBe(1);
      expect(errors[0].type).toBe('capability-missing');
    });

    it('returns error when capability provider comes after consumer', () => {
      const registry = createPluginRegistry([
        makeMetadata({ name: 'A', requiresCapabilities: ['content:imported'] }),
        makeMetadata({ name: 'B', capabilities: ['content:imported'] }),
      ]);
      const validator = new PluginOrderValidator(registry);
      const errors = validator.validateCapabilities(['A', 'B']);
      expect(errors.some(e => e.type === 'capability-missing')).toBe(true);
    });

    it('detects phase dependency violations', () => {
      const registry = createPluginRegistry([
        makeMetadata({
          name: 'A',
          phase: ProcessingPhase.CONTENT_LOADING,
          requiresPhases: [ProcessingPhase.CONTENT_LOADING],
        }),
      ]);
      const validator = new PluginOrderValidator(registry);
      const errors = validator.validateCapabilities(['A']);
      expect(errors.some(e => e.type === 'phase-dependency')).toBe(true);
    });
  });

  // ── createPluginRegistry ───────────────────────────────────────────

  describe('createPluginRegistry', () => {
    it('creates registry from metadata array', () => {
      const metadataList = [
        makeMetadata({ name: 'A' }),
        makeMetadata({ name: 'B' }),
      ];
      const registry = createPluginRegistry(metadataList);
      expect(registry.size).toBe(2);
      expect(registry.get('A')).toBeDefined();
      expect(registry.get('B')).toBeDefined();
    });

    it('returns empty map for empty array', () => {
      const registry = createPluginRegistry([]);
      expect(registry.size).toBe(0);
    });
  });

  // ── getMetadata / registerPlugin ───────────────────────────────────

  describe('getMetadata and registerPlugin', () => {
    it('getMetadata returns undefined for unknown plugin', () => {
      const validator = new PluginOrderValidator(new Map());
      expect(validator.getMetadata('unknown')).toBeUndefined();
    });

    it('registerPlugin adds metadata that can be retrieved', () => {
      const validator = new PluginOrderValidator(new Map());
      const meta = makeMetadata({ name: 'test' });
      validator.registerPlugin(meta);
      expect(validator.getMetadata('test')).toBe(meta);
    });
  });
});
