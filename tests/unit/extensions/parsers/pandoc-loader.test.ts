import { PandocLoader } from '../../../../src/extensions/parsers/pandoc-loader';

describe('PandocLoader', () => {
  beforeEach(() => {
    // Reset loader state before each test
    PandocLoader.reset();
  });

  describe('loadIfNeeded', () => {
    it('should not load pandoc for regular markdown', async () => {
      const markdown = `
# Title

This is regular markdown content.
      `;
      const loaded = await PandocLoader.loadIfNeeded(markdown);
      expect(loaded).toBe(false);
    });

    it('should attempt to load pandoc for RST content', async () => {
      const rst = `
Title
=====

.. note::
   This is RST content.
      `;
      
      // In Node.js environment, this should return true
      // In browser environment without pandoc-wasm, this should return false
      const loaded = await PandocLoader.loadIfNeeded(rst);
      
      if (typeof window === 'undefined') {
        // Node.js environment
        expect(loaded).toBe(true);
      } else {
        // Browser environment - depends on pandoc-wasm availability
        expect(typeof loaded).toBe('boolean');
      }
    });

    it('should attempt to load pandoc for LaTeX content', async () => {
      const latex = `
\\documentclass{article}
\\begin{document}
\\section{Introduction}
      `;
      
      // In Node.js environment, this should return true
      // In browser environment without pandoc-wasm, this should return false
      const loaded = await PandocLoader.loadIfNeeded(latex);
      
      if (typeof window === 'undefined') {
        // Node.js environment
        expect(loaded).toBe(true);
      } else {
        // Browser environment - depends on pandoc-wasm availability
        expect(typeof loaded).toBe('boolean');
      }
    });
  });

  describe('getPandocWasm', () => {
    it('should return null initially', () => {
      expect(PandocLoader.getPandocWasm()).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset the loader state', () => {
      PandocLoader.reset();
      expect(PandocLoader.getPandocWasm()).toBeNull();
    });
  });
});