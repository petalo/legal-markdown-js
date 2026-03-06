/**
 * @fileoverview Unit tests for handlebars-engine internal functions
 *
 * Tests the internal helper function:
 * - resolveLocaleArg: resolves locale from explicit arg, context, or root data
 */

import { _resolveLocaleArg as resolveLocaleArg } from '../../../src/extensions/handlebars-engine';

// Helper to create a minimal Handlebars options-like object
function hbsOptions(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { hash: {}, ...extra };
}

describe('resolveLocaleArg', () => {
  it('returns explicit locale string', () => {
    expect(resolveLocaleArg({}, 'es-ES', undefined)).toBe('es-ES');
  });

  it('strips Handlebars options from localeArg and falls through', () => {
    // localeArg is an options object, no context locale -> undefined
    expect(resolveLocaleArg({}, hbsOptions(), undefined)).toBeUndefined();
  });

  it('falls back to thisArg.locale when localeArg is undefined', () => {
    expect(resolveLocaleArg({ locale: 'fr-FR' }, undefined, undefined)).toBe('fr-FR');
  });

  it('falls back to options.data.root.locale', () => {
    const options = hbsOptions({ data: { root: { locale: 'de-DE' } } });
    expect(resolveLocaleArg({}, undefined, options)).toBe('de-DE');
  });

  it('returns undefined when no locale is found anywhere', () => {
    expect(resolveLocaleArg({}, undefined, undefined)).toBeUndefined();
  });

  it('ignores empty string localeArg', () => {
    expect(resolveLocaleArg({}, '', undefined)).toBeUndefined();
  });

  it('ignores whitespace-only localeArg', () => {
    expect(resolveLocaleArg({}, '   ', undefined)).toBeUndefined();
  });

  it('ignores whitespace-only localeArg but falls back to context locale', () => {
    expect(resolveLocaleArg({ locale: 'ja-JP' }, '   ', undefined)).toBe('ja-JP');
  });

  it('handles localeArg being the Handlebars options object (fewer args passed)', () => {
    // When Handlebars passes fewer args, the options object lands in localeArg
    const options = hbsOptions({ data: { root: { locale: 'pt-BR' } } });
    expect(resolveLocaleArg({}, options, undefined)).toBe('pt-BR');
  });

  it('handles localeArg being Handlebars options with context locale fallback', () => {
    expect(resolveLocaleArg({ locale: 'ko-KR' }, hbsOptions(), undefined)).toBe('ko-KR');
  });

  it('priority: explicit locale > context locale > root locale', () => {
    const options = hbsOptions({ data: { root: { locale: 'de-DE' } } });
    // Explicit wins over context and root
    expect(resolveLocaleArg({ locale: 'fr-FR' }, 'es-ES', options)).toBe('es-ES');
  });

  it('priority: context locale > root locale when no explicit', () => {
    const options = hbsOptions({ data: { root: { locale: 'de-DE' } } });
    expect(resolveLocaleArg({ locale: 'fr-FR' }, undefined, options)).toBe('fr-FR');
  });

  it('ignores whitespace-only context locale and falls to root', () => {
    const options = hbsOptions({ data: { root: { locale: 'zh-CN' } } });
    expect(resolveLocaleArg({ locale: '  ' }, undefined, options)).toBe('zh-CN');
  });
});
