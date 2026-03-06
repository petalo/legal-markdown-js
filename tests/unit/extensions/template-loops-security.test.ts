import { describe, it, expect } from 'vitest';
import { ProcessingError } from '../../../src/errors';
import {
  processTemplateLoops,
  resolvePath,
  type LoopContext,
} from '../../../src/extensions/template-loops';

describe('Template Loops Security Regressions', () => {
  it('blocks __proto__ prototype pollution path [S3]', () => {
    expect(resolvePath({}, '__proto__')).toBeUndefined();
  });

  it('blocks constructor path [S3]', () => {
    expect(resolvePath({}, 'constructor')).toBeUndefined();
  });

  it('blocks prototype path [S3]', () => {
    expect(resolvePath({}, 'prototype')).toBeUndefined();
  });

  it('still resolves normal nested paths', () => {
    expect(resolvePath({ a: { b: 1 } }, 'a.b')).toBe(1);
  });

  it('returns undefined for non-existent path', () => {
    expect(resolvePath({}, 'nonexistent')).toBeUndefined();
  });

  it('throws when nesting depth exceeds limit [S4]', () => {
    let context: LoopContext = {
      variable: 'level0',
      item: {},
      index: 0,
      total: 1,
    };

    for (let i = 1; i <= 11; i++) {
      context = {
        variable: `level${i}`,
        item: {},
        index: 0,
        total: 1,
        parent: context,
      };
    }

    expect(() => processTemplateLoops('hello', {}, context, false)).toThrow(ProcessingError);
  });

  it('rejects legacy helper function syntax', () => {
    expect(() => processTemplateLoops('{{helper(arg)}}', {}, undefined, false)).toThrow(
      ProcessingError
    );
  });

  it('rejects legacy math expression syntax', () => {
    expect(() => processTemplateLoops('{{a * b}}', { a: 2, b: 3 }, undefined, false)).toThrow(
      ProcessingError
    );
  });
});
