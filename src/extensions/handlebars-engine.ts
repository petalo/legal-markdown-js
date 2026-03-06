/* eslint-disable @typescript-eslint/no-explicit-any -- Handlebars helper registration requires any for untyped callback arguments injected by the Handlebars runtime */
/**
 * Handlebars Template Engine with Custom Helpers
 *
 * This module provides a Handlebars-based template engine with all
 * Legal Markdown helpers registered.
 *
 * @module handlebars-engine
 */

import Handlebars from 'handlebars';
import { extensionHelpers } from './helpers/index';
import { coreHelpers } from '../core/helpers/index';
import { fieldSpan } from './tracking/field-span';
import {
  isFieldTrackingEnabled,
  isAstFieldTrackingEnabled,
  isLogicBranchHighlightingEnabled,
  getHelperInvocationInfo,
  setHelperInvocationInfo,
  clearHelperInvocationInfo,
  resetLogicBranchCounter,
  nextLogicBranchId,
} from './tracking/field-tracking-state';
import { lmFieldToken, lmLogicStartToken, lmLogicEndToken } from './tracking/tracking-token';

// Create Handlebars instance
const handlebarsInstance = Handlebars.create();
const builtinIfHelper = handlebarsInstance.helpers.if;
const builtinUnlessHelper = handlebarsInstance.helpers.unless;

/**
 * Best-effort guard for deciding whether to emit tracking span HTML.
 *
 * Handlebars 4 can provide very similar options objects for top-level calls and
 * subexpressions. We therefore also pass non-options sentinels from some helper
 * wrappers when we must force raw subexpression values.
 */
function isTopLevelHelperCall(options: unknown): boolean {
  return Boolean(
    options &&
    typeof options === 'object' &&
    'hash' in (options as any) &&
    'data' in (options as any)
  );
}

function isSourceFieldPath(path: string): boolean {
  if (!path) return false;
  if (path === '.' || path === 'this') return false;
  if (path.startsWith('@') || path.startsWith('../') || path.startsWith('./')) return false;
  return /^[A-Za-z0-9_.\-[\]]+$/.test(path);
}

function collectSourceFields(expression: unknown, fields: Set<string>): void {
  if (!expression || typeof expression !== 'object') {
    return;
  }

  const node = expression as Record<string, unknown>;
  const type = node['type'];

  if (type === 'PathExpression') {
    const original = node['original'];
    if (typeof original === 'string' && isSourceFieldPath(original)) {
      fields.add(original);
    }
    return;
  }

  if (type === 'SubExpression' || type === 'MustacheStatement' || type === 'BlockStatement') {
    const params = Array.isArray(node['params']) ? (node['params'] as unknown[]) : [];
    for (const param of params) {
      collectSourceFields(param, fields);
    }

    const hash = node['hash'];
    if (
      hash &&
      typeof hash === 'object' &&
      Array.isArray((hash as Record<string, unknown>)['pairs'])
    ) {
      for (const pair of (hash as Record<string, unknown>)['pairs'] as unknown[]) {
        const value = (pair as Record<string, unknown>)['value'];
        collectSourceFields(value, fields);
      }
    }
  }
}

function indexHelperInvocations(template: string): void {
  clearHelperInvocationInfo();
  resetLogicBranchCounter();

  const walkNode = (node: unknown, topLevel: boolean): void => {
    if (!node || typeof node !== 'object') return;
    const typed = node as Record<string, unknown>;
    const type = typed['type'];

    if (type === 'MustacheStatement' || type === 'SubExpression') {
      const path = typed['path'] as Record<string, unknown> | undefined;
      const helperName = path?.['original'];
      const loc = typed['loc'] as { start?: { line?: number; column?: number } } | undefined;

      if (
        typeof helperName === 'string' &&
        typeof loc?.start?.line === 'number' &&
        typeof loc?.start?.column === 'number'
      ) {
        const sourceFields = new Set<string>();
        const params = Array.isArray(typed['params']) ? (typed['params'] as unknown[]) : [];
        for (const param of params) {
          collectSourceFields(param, sourceFields);
          walkNode(param, false);
        }

        setHelperInvocationInfo(helperName, loc.start.line, loc.start.column, {
          topLevel,
          sourceFields: Array.from(sourceFields),
        });
      }
      return;
    }

    if (type === 'BlockStatement') {
      const params = Array.isArray(typed['params']) ? (typed['params'] as unknown[]) : [];
      for (const param of params) {
        walkNode(param, false);
      }

      const program = typed['program'];
      const inverse = typed['inverse'];
      if (program && typeof program === 'object') {
        const body = (program as Record<string, unknown>)['body'];
        if (Array.isArray(body)) {
          for (const item of body) walkNode(item, true);
        }
      }
      if (inverse && typeof inverse === 'object') {
        const body = (inverse as Record<string, unknown>)['body'];
        if (Array.isArray(body)) {
          for (const item of body) walkNode(item, true);
        }
      }
      return;
    }

    const body = typed['body'];
    if (Array.isArray(body)) {
      for (const item of body) walkNode(item, topLevel);
    }
  };

  try {
    const parsed = Handlebars.parse(template, { srcName: '__lm_template__' });
    walkNode(parsed, true);
  } catch {
    clearHelperInvocationInfo();
  }
}

/**
 * A SafeString subclass that also carries the original raw value.
 *
 * When a formatting helper (e.g. formatDate, multiply) is used as a
 * subexpression, `isTopLevelHelperCall` cannot reliably distinguish it from a
 * top-level call (Handlebars 4 passes `data` to both). Rather than suppressing
 * the span, we attach the raw value so comparison helpers can unwrap it.
 */
class TrackedValue extends Handlebars.SafeString {
  readonly rawValue: unknown;
  constructor(html: string, rawValue: unknown) {
    super(html);
    this.rawValue = rawValue;
  }
}

/**
 * Unwraps a TrackedValue/SafeString to its plain comparable value.
 *
 * Comparison helpers (eq, gt, etc.) call this on their operands so they still
 * work correctly when a formatting helper is used as a subexpression.
 */

function unwrapSafeString(value: unknown): any {
  if (value instanceof TrackedValue) return value.rawValue;
  if (value instanceof Handlebars.SafeString) return value.toString();
  return value;
}

/**
 * Wraps a helper's output in a `highlight` field-tracking span when:
 *   1. field tracking is currently enabled, AND
 *   2. the helper was invoked as a top-level expression (not a subexpression).
 *
 * Subexpression calls (used inside block helper conditions or as arguments to
 * other helpers) must return raw values so they can be compared, counted, or
 * passed as arguments without breaking logic.
 */
function wrapTrackedOutput(helperName: string, result: unknown, options: any): unknown {
  if (!isFieldTrackingEnabled()) return result;
  if (result === null || result === undefined || result === '') return result;
  const invocationInfo =
    typeof options?.loc?.start?.line === 'number' && typeof options?.loc?.start?.column === 'number'
      ? getHelperInvocationInfo(helperName, options.loc.start.line, options.loc.start.column)
      : undefined;

  const isTopLevel = invocationInfo ? invocationInfo.topLevel : isTopLevelHelperCall(options);
  if (!isTopLevel) return result; // subexpression: return raw value

  const dataField =
    invocationInfo && invocationInfo.sourceFields.length === 1
      ? invocationInfo.sourceFields[0]
      : helperName;
  const wrapped = isAstFieldTrackingEnabled()
    ? lmFieldToken(dataField, String(result), 'highlight')
    : fieldSpan(dataField, String(result), 'highlight');
  return new TrackedValue(wrapped, result);
}

function stripHandlebarsOptions<T>(value: T): T | undefined {
  // Handlebars always passes an `options` object as the last argument to every
  // helper. That object has a `hash` property. TypeScript cannot statically
  // narrow `T` to a type that has `hash`, so `as any` is required here to
  // perform the duck-type check at runtime.
  if (value && typeof value === 'object' && 'hash' in (value as any)) {
    return undefined;
  }
  return value;
}

function isHandlebarsOptions(value: unknown): value is Handlebars.HelperOptions {
  // Same rationale as stripHandlebarsOptions: duck-typing `hash` to detect the
  // implicit Handlebars options object injected as the final helper argument.
  return Boolean(value && typeof value === 'object' && 'hash' in (value as any));
}

function resolveLocaleArg(thisArg: any, localeArg: any, optionsArg?: any): string | undefined {
  const safeLocale = stripHandlebarsOptions(localeArg);
  if (typeof safeLocale === 'string' && safeLocale.trim()) {
    return safeLocale;
  }

  const options = isHandlebarsOptions(optionsArg)
    ? optionsArg
    : isHandlebarsOptions(localeArg)
      ? localeArg
      : undefined;

  const contextLocale = typeof thisArg?.locale === 'string' ? thisArg.locale : undefined;
  if (contextLocale && contextLocale.trim()) {
    return contextLocale;
  }

  const rootLocale =
    typeof options?.data?.root?.locale === 'string' ? options.data.root.locale : undefined;
  if (rootLocale && rootLocale.trim()) {
    return rootLocale;
  }

  return undefined;
}

function wrapLogicWinnerBranch(
  renderedText: string,
  branchField: string,
  helperName: 'if' | 'unless',
  result: boolean
): Handlebars.SafeString {
  const leadingMatch = renderedText.match(/^\s*/);
  const trailingMatch = renderedText.match(/\s*$/);
  const leadingWhitespace = leadingMatch?.[0] ?? '';
  const trailingWhitespace = trailingMatch?.[0] ?? '';
  const coreStart = leadingWhitespace.length;
  const coreEnd = renderedText.length - trailingWhitespace.length;
  const coreText = renderedText.slice(coreStart, coreEnd);

  if (!coreText) {
    return new Handlebars.SafeString(renderedText);
  }

  const logicStart = lmLogicStartToken(branchField, helperName, result);
  const logicEnd = lmLogicEndToken();
  const lines = coreText.split('\n');
  const hasStructuralMarkdownLine = lines.some(line =>
    /^(?:\s{0,3}#{1,6}\s+|\s*[-*+]\s+|\s*\d+\.\s+|\s*>\s?)/.test(line)
  );

  if (!hasStructuralMarkdownLine) {
    return new Handlebars.SafeString(
      `${leadingWhitespace}${logicStart}${coreText}${logicEnd}${trailingWhitespace}`
    );
  }

  const wrappedCore = lines
    .map(line => {
      if (!line.trim()) return line;
      if (/^\s*(```|~~~)/.test(line)) return line;
      if (/^\s*\|/.test(line)) return line;
      if (/^\s*[-*_]{3,}\s*$/.test(line)) return line;

      const prefixPatterns = [
        /^(\s{0,3}#{1,6}\s+)(.*)$/,
        /^(\s*[-*+]\s+)(.*)$/,
        /^(\s*\d+\.\s+)(.*)$/,
        /^(\s*>\s?)(.*)$/,
      ];

      for (const pattern of prefixPatterns) {
        const match = line.match(pattern);
        if (match) {
          const [, prefix, body] = match;
          if (!body.trim()) return line;
          return `${prefix}${logicStart}${body}${logicEnd}`;
        }
      }

      return `${logicStart}${line}${logicEnd}`;
    })
    .join('\n');

  return new Handlebars.SafeString(`${leadingWhitespace}${wrappedCore}${trailingWhitespace}`);
}

// ============================================================================
// CORE HELPERS REGISTRATION
// ============================================================================

handlebarsInstance.registerHelper('today', coreHelpers.today);
handlebarsInstance.registerHelper('formatBasicDate', coreHelpers.formatBasicDate);
handlebarsInstance.registerHelper('parseToday', coreHelpers.parseToday);

handlebarsInstance.registerHelper('if', function (this: any, condition: any, options: any) {
  const evaluatedCondition = unwrapSafeString(condition);
  const rendered = (builtinIfHelper as any).call(this, evaluatedCondition, options);

  if (!isFieldTrackingEnabled() || !isLogicBranchHighlightingEnabled()) {
    return rendered;
  }
  if (!isAstFieldTrackingEnabled()) return rendered;

  if (!options || typeof options.fn !== 'function' || typeof options.inverse !== 'function') {
    return rendered;
  }

  const renderedText = typeof rendered === 'string' ? rendered : String(rendered ?? '');
  if (!renderedText.trim()) return rendered;

  const branchId = nextLogicBranchId();
  return wrapLogicWinnerBranch(
    renderedText,
    `logic.branch.${branchId}`,
    'if',
    Boolean(evaluatedCondition)
  );
});
handlebarsInstance.registerHelper('unless', function (this: any, condition: any, options: any) {
  const evaluatedCondition = unwrapSafeString(condition);
  const rendered = (builtinUnlessHelper as any).call(this, evaluatedCondition, options);

  if (!isFieldTrackingEnabled() || !isLogicBranchHighlightingEnabled()) {
    return rendered;
  }
  if (!isAstFieldTrackingEnabled()) return rendered;

  if (!options || typeof options.fn !== 'function' || typeof options.inverse !== 'function') {
    return rendered;
  }

  const renderedText = typeof rendered === 'string' ? rendered : String(rendered ?? '');
  if (!renderedText.trim()) return rendered;

  const branchId = nextLogicBranchId();
  return wrapLogicWinnerBranch(
    renderedText,
    `logic.branch.${branchId}`,
    'unless',
    !evaluatedCondition
  );
});

handlebarsInstance.registerHelper('eq', function (a: any, b: any) {
  return unwrapSafeString(a) === unwrapSafeString(stripHandlebarsOptions(b));
});
handlebarsInstance.registerHelper('neq', function (a: any, b: any) {
  return unwrapSafeString(a) !== unwrapSafeString(stripHandlebarsOptions(b));
});
handlebarsInstance.registerHelper('gt', function (a: any, b: any) {
  return (unwrapSafeString(a) as any) > (unwrapSafeString(stripHandlebarsOptions(b)) as any);
});
handlebarsInstance.registerHelper('gte', function (a: any, b: any) {
  return (unwrapSafeString(a) as any) >= (unwrapSafeString(stripHandlebarsOptions(b)) as any);
});
handlebarsInstance.registerHelper('lt', function (a: any, b: any) {
  return (unwrapSafeString(a) as any) < (unwrapSafeString(stripHandlebarsOptions(b)) as any);
});
handlebarsInstance.registerHelper('lte', function (a: any, b: any) {
  return (unwrapSafeString(a) as any) <= (unwrapSafeString(stripHandlebarsOptions(b)) as any);
});
handlebarsInstance.registerHelper('and', function (a: any, b: any) {
  const safeB = stripHandlebarsOptions(b);
  return Boolean(a) && Boolean(safeB);
});
handlebarsInstance.registerHelper('or', function (a: any, b: any) {
  const safeB = stripHandlebarsOptions(b);
  return Boolean(a) || Boolean(safeB);
});
handlebarsInstance.registerHelper('not', function (a: any) {
  return !a;
});

// ============================================================================
// EXTENSION HELPERS REGISTRATION - Date
// ============================================================================

handlebarsInstance.registerHelper('addYears', function (date: any, n: any, options?: any) {
  const safeN = stripHandlebarsOptions(n);
  return wrapTrackedOutput(
    'addYears',
    extensionHelpers.addYears(unwrapSafeString(date), safeN),
    options
  );
});
handlebarsInstance.registerHelper('addMonths', function (date: any, n: any, options?: any) {
  const safeN = stripHandlebarsOptions(n);
  return wrapTrackedOutput(
    'addMonths',
    extensionHelpers.addMonths(unwrapSafeString(date), safeN),
    options
  );
});
handlebarsInstance.registerHelper('addDays', function (date: any, n: any, options?: any) {
  const safeN = stripHandlebarsOptions(n);
  return wrapTrackedOutput(
    'addDays',
    extensionHelpers.addDays(unwrapSafeString(date), safeN),
    options
  );
});
handlebarsInstance.registerHelper(
  'formatDate',
  function (this: any, date: any, format?: any, locale?: any, options?: any) {
    const safeFormat = stripHandlebarsOptions(format);
    const resolvedLocale = resolveLocaleArg(this, locale, options ?? locale ?? format);
    const result = extensionHelpers.formatDate(unwrapSafeString(date), safeFormat, resolvedLocale);
    const topLevelOptions = options ?? locale ?? format;
    return wrapTrackedOutput('formatDate', result, topLevelOptions);
  }
);

// ============================================================================
// EXTENSION HELPERS REGISTRATION - Number
// ============================================================================

handlebarsInstance.registerHelper(
  'formatCurrency',
  function (this: any, value: any, currency?: any, decimals?: any, locale?: any, options?: any) {
    // Capture the Handlebars options before any args are nullified.
    // The options object migrates toward the front when fewer positional args
    // are supplied (e.g. {{formatCurrency amount}} puts options in `currency`).
    const hbsOptions =
      options ??
      (isHandlebarsOptions(locale) ? locale : undefined) ??
      (isHandlebarsOptions(decimals) ? decimals : undefined) ??
      (isHandlebarsOptions(currency) ? currency : undefined);
    if (isHandlebarsOptions(locale)) locale = undefined;
    if (isHandlebarsOptions(decimals)) decimals = undefined;
    if (isHandlebarsOptions(currency)) currency = undefined;
    const resolvedLocale = resolveLocaleArg(this, locale, hbsOptions ?? locale ?? decimals);
    const result = extensionHelpers.formatCurrency(
      unwrapSafeString(value),
      currency,
      decimals,
      resolvedLocale
    );
    return wrapTrackedOutput('formatCurrency', result, hbsOptions);
  }
);
handlebarsInstance.registerHelper(
  'formatInteger',
  function (value: any, separator?: any, options?: any) {
    const safeSeparator = isHandlebarsOptions(separator) ? undefined : separator;
    const result = extensionHelpers.formatInteger(unwrapSafeString(value), safeSeparator);
    return wrapTrackedOutput('formatInteger', result, options ?? separator);
  }
);
handlebarsInstance.registerHelper(
  'formatPercent',
  function (value: any, decimals?: any, symbol?: any, options?: any) {
    const safeSymbol = isHandlebarsOptions(symbol) ? undefined : symbol;
    const safeDecimals = isHandlebarsOptions(decimals) ? undefined : decimals;
    const result = extensionHelpers.formatPercent(
      unwrapSafeString(value),
      safeDecimals,
      safeSymbol
    );
    return wrapTrackedOutput('formatPercent', result, options ?? symbol ?? decimals);
  }
);
handlebarsInstance.registerHelper('formatEuro', function (value: any, options?: any) {
  return wrapTrackedOutput(
    'formatEuro',
    extensionHelpers.formatEuro(unwrapSafeString(value)),
    options
  );
});
handlebarsInstance.registerHelper('formatDollar', function (value: any, options?: any) {
  return wrapTrackedOutput(
    'formatDollar',
    extensionHelpers.formatDollar(unwrapSafeString(value)),
    options
  );
});
handlebarsInstance.registerHelper('formatPound', function (value: any, options?: any) {
  return wrapTrackedOutput(
    'formatPound',
    extensionHelpers.formatPound(unwrapSafeString(value)),
    options
  );
});
handlebarsInstance.registerHelper('numberToWords', function (value: any, options?: any) {
  return wrapTrackedOutput(
    'numberToWords',
    extensionHelpers.numberToWords(unwrapSafeString(value)),
    options
  );
});
handlebarsInstance.registerHelper(
  'ordinal',
  function (this: any, value: any, locale?: any, options?: any) {
    const resolvedLocale = resolveLocaleArg(this, locale, options ?? locale);
    const result = extensionHelpers.ordinal(unwrapSafeString(value), resolvedLocale);
    return wrapTrackedOutput('ordinal', result, options ?? locale);
  }
);
handlebarsInstance.registerHelper('abs', function (value: any, options?: any) {
  return wrapTrackedOutput('abs', extensionHelpers.abs(unwrapSafeString(value)), options);
});
handlebarsInstance.registerHelper('max', function (a: any, b: any, options?: any) {
  if (isHandlebarsOptions(b)) return NaN;
  const result = extensionHelpers.max(unwrapSafeString(a), unwrapSafeString(b));
  return wrapTrackedOutput('max', result, options ?? b);
});
handlebarsInstance.registerHelper('min', function (a: any, b: any, options?: any) {
  if (isHandlebarsOptions(b)) return NaN;
  const result = extensionHelpers.min(unwrapSafeString(a), unwrapSafeString(b));
  return wrapTrackedOutput('min', result, options ?? b);
});
handlebarsInstance.registerHelper('round', function (value: any, decimals?: any, options?: any) {
  const safeDecimals = (stripHandlebarsOptions(decimals) ?? 0) as number;
  const result = extensionHelpers.round(unwrapSafeString(value), safeDecimals);
  return wrapTrackedOutput('round', result, options ?? decimals);
});

// ============================================================================
// EXTENSION HELPERS REGISTRATION - String
// ============================================================================

handlebarsInstance.registerHelper('capitalize', function (str: any, options?: any) {
  return wrapTrackedOutput(
    'capitalize',
    extensionHelpers.capitalize(unwrapSafeString(str) as string),
    options
  );
});
handlebarsInstance.registerHelper('capitalizeWords', function (str: any, options?: any) {
  return wrapTrackedOutput(
    'capitalizeWords',
    extensionHelpers.capitalizeWords(unwrapSafeString(str) as string),
    options
  );
});
handlebarsInstance.registerHelper('upper', function (str: any, options?: any) {
  return wrapTrackedOutput(
    'upper',
    extensionHelpers.upper(unwrapSafeString(str) as string),
    options
  );
});
handlebarsInstance.registerHelper('uppercase', function (str: any, options?: any) {
  return wrapTrackedOutput(
    'uppercase',
    extensionHelpers.upper(unwrapSafeString(str) as string),
    options
  );
});
handlebarsInstance.registerHelper('lower', function (str: any, options?: any) {
  return wrapTrackedOutput(
    'lower',
    extensionHelpers.lower(unwrapSafeString(str) as string),
    options
  );
});
handlebarsInstance.registerHelper('lowercase', function (str: any, options?: any) {
  return wrapTrackedOutput(
    'lowercase',
    extensionHelpers.lower(unwrapSafeString(str) as string),
    options
  );
});
handlebarsInstance.registerHelper('titleCase', function (str: any, options?: any) {
  return wrapTrackedOutput(
    'titleCase',
    extensionHelpers.titleCase(unwrapSafeString(str) as string),
    options
  );
});
handlebarsInstance.registerHelper('kebabCase', function (str: any, options?: any) {
  return wrapTrackedOutput(
    'kebabCase',
    extensionHelpers.kebabCase(unwrapSafeString(str) as string),
    options
  );
});
handlebarsInstance.registerHelper('snakeCase', function (str: any, options?: any) {
  return wrapTrackedOutput(
    'snakeCase',
    extensionHelpers.snakeCase(unwrapSafeString(str) as string),
    options
  );
});
handlebarsInstance.registerHelper('camelCase', function (str: any, options?: any) {
  return wrapTrackedOutput(
    'camelCase',
    extensionHelpers.camelCase(unwrapSafeString(str) as string),
    options
  );
});
handlebarsInstance.registerHelper('pascalCase', function (str: any, options?: any) {
  return wrapTrackedOutput(
    'pascalCase',
    extensionHelpers.pascalCase(unwrapSafeString(str) as string),
    options
  );
});
handlebarsInstance.registerHelper(
  'truncate',
  function (str: any, length: any, suffix?: any, options?: any) {
    const safeSuffix = isHandlebarsOptions(suffix) ? undefined : suffix;
    const result = extensionHelpers.truncate(unwrapSafeString(str), length, safeSuffix);
    return wrapTrackedOutput('truncate', result, options ?? suffix);
  }
);
handlebarsInstance.registerHelper('clean', function (str: any, options?: any) {
  return wrapTrackedOutput(
    'clean',
    extensionHelpers.clean(unwrapSafeString(str) as string),
    options
  );
});
handlebarsInstance.registerHelper('trim', function (str: any, options?: any) {
  return wrapTrackedOutput(
    'trim',
    extensionHelpers.clean(unwrapSafeString(str) as string),
    options
  );
});
handlebarsInstance.registerHelper(
  'pluralize',
  function (count: any, singular: any, plural?: any, options?: any) {
    const safePlural = isHandlebarsOptions(plural) ? undefined : plural;
    const result = extensionHelpers.pluralize(count, singular, safePlural);
    return wrapTrackedOutput('pluralize', result, options ?? plural);
  }
);
handlebarsInstance.registerHelper(
  'padStart',
  function (str: any, length: any, char?: any, options?: any) {
    const safeChar = stripHandlebarsOptions(char) ?? ' ';
    const result = extensionHelpers.padStart(unwrapSafeString(str), length, safeChar);
    return wrapTrackedOutput('padStart', result, options ?? char);
  }
);
handlebarsInstance.registerHelper(
  'padEnd',
  function (str: any, length: any, char?: any, options?: any) {
    const safeChar = stripHandlebarsOptions(char) ?? ' ';
    const result = extensionHelpers.padEnd(unwrapSafeString(str), length, safeChar);
    return wrapTrackedOutput('padEnd', result, options ?? char);
  }
);
handlebarsInstance.registerHelper(
  'contains',
  function (str: any, substring: any, caseSensitive?: any, options?: any) {
    const safeCaseSensitive = stripHandlebarsOptions(caseSensitive) ?? false;
    const result = extensionHelpers.contains(
      unwrapSafeString(str),
      unwrapSafeString(substring),
      safeCaseSensitive
    );
    return wrapTrackedOutput('contains', result, options ?? caseSensitive);
  }
);
handlebarsInstance.registerHelper(
  'replaceAll',
  function (str: any, search: any, replace?: any, options?: any) {
    const safeReplace = stripHandlebarsOptions(replace) ?? '';
    const result = extensionHelpers.replaceAll(
      unwrapSafeString(str),
      unwrapSafeString(search),
      unwrapSafeString(safeReplace)
    );
    return wrapTrackedOutput('replaceAll', result, options ?? replace);
  }
);
handlebarsInstance.registerHelper('initials', function (name: any, options?: any) {
  return wrapTrackedOutput(
    'initials',
    extensionHelpers.initials(unwrapSafeString(name) as string),
    options
  );
});
handlebarsInstance.registerHelper('join', function (arr: any, separator?: any, options?: any) {
  const safeSeparator = (isHandlebarsOptions(separator) ? ', ' : separator) ?? ', ';
  const result = extensionHelpers.join(arr, safeSeparator);
  return wrapTrackedOutput('join', result, options ?? separator);
});
handlebarsInstance.registerHelper('length', function (value: any, options?: any) {
  return wrapTrackedOutput('length', extensionHelpers.length(unwrapSafeString(value)), options);
});
handlebarsInstance.registerHelper('default', function (value: any, fallback?: any, options?: any) {
  const safeFallback = stripHandlebarsOptions(fallback) ?? '';
  const result = extensionHelpers.defaultVal(
    unwrapSafeString(value),
    unwrapSafeString(safeFallback)
  );
  return wrapTrackedOutput('default', result, options ?? fallback);
});

// ============================================================================
// MATHEMATICAL HELPERS
// ============================================================================

handlebarsInstance.registerHelper('multiply', function (a: number | string, b: any, options?: any) {
  if (isHandlebarsOptions(b)) return NaN;
  return wrapTrackedOutput(
    'multiply',
    extensionHelpers.multiply(unwrapSafeString(a), unwrapSafeString(b)),
    options
  );
});
handlebarsInstance.registerHelper('divide', function (a: number | string, b: any, options?: any) {
  if (isHandlebarsOptions(b)) return NaN;
  return wrapTrackedOutput(
    'divide',
    extensionHelpers.divide(unwrapSafeString(a), unwrapSafeString(b)),
    options
  );
});
handlebarsInstance.registerHelper('add', function (a: number | string, b: any, options?: any) {
  if (isHandlebarsOptions(b)) return NaN;
  return wrapTrackedOutput(
    'add',
    extensionHelpers.add(unwrapSafeString(a), unwrapSafeString(b)),
    options
  );
});
handlebarsInstance.registerHelper('subtract', function (a: number | string, b: any, options?: any) {
  if (isHandlebarsOptions(b)) return NaN;
  return wrapTrackedOutput(
    'subtract',
    extensionHelpers.subtract(unwrapSafeString(a), unwrapSafeString(b)),
    options
  );
});
handlebarsInstance.registerHelper('modulo', function (a: number | string, b: any, options?: any) {
  // Filter out Handlebars options if passed as b
  if (isHandlebarsOptions(b)) {
    return NaN;
  }
  return wrapTrackedOutput(
    'modulo',
    extensionHelpers.modulo(unwrapSafeString(a), unwrapSafeString(b)),
    options
  );
});
handlebarsInstance.registerHelper('power', function (a: number | string, b: any, options?: any) {
  // Filter out Handlebars options if passed as b
  if (isHandlebarsOptions(b)) {
    return NaN;
  }
  return wrapTrackedOutput(
    'power',
    extensionHelpers.power(unwrapSafeString(a), unwrapSafeString(b)),
    options
  );
});

// ============================================================================
// STRING CONCATENATION HELPER
// ============================================================================

handlebarsInstance.registerHelper('concat', function (...args: any[]) {
  const options = args[args.length - 1];
  const values = args.slice(0, -1).map((v: any) => {
    const unwrapped = unwrapSafeString(v);
    return unwrapped === null || unwrapped === undefined ? '' : String(unwrapped);
  });
  const result = values.join('');
  return wrapTrackedOutput('concat', result, options);
});

// ============================================================================
// FIELD TRACKING HELPER
// ============================================================================
// Helper for wrapping content with field tracking spans

handlebarsInstance.registerHelper(
  'trackField',
  function (this: any, fieldName: string, options: any) {
    const value = options.fn(this);
    const safeFieldName = String(fieldName);
    const safeValue = String(value);
    return new handlebarsInstance.SafeString(
      isAstFieldTrackingEnabled()
        ? lmFieldToken(safeFieldName, safeValue, 'imported')
        : fieldSpan(safeFieldName, safeValue, 'imported')
    );
  }
);

// ============================================================================
// EXPORTS
// ============================================================================

export { handlebarsInstance };

// Exported for testing - not part of public API
export { resolveLocaleArg as _resolveLocaleArg };

/**
 * Compiles and renders a Handlebars template
 *
 * @param template - The Handlebars template string
 * @param data - The data context for template rendering
 * @returns Rendered template string
 *
 * @example
 * ```typescript
 * const result = compileHandlebarsTemplate(
 *   'Hello {{name}}!',
 *   { name: 'World' }
 * );
 * // result: "Hello World!"
 * ```
 */
export function compileHandlebarsTemplate(template: string, data: Record<string, any>): string {
  indexHelperInvocations(template);
  const compiledTemplate = handlebarsInstance.compile(template);
  try {
    const rendered = compiledTemplate(data);
    return typeof rendered === 'string' ? rendered : String(rendered);
  } finally {
    clearHelperInvocationInfo();
  }
}

/**
 * Registers a custom Handlebars helper
 *
 * @param name - Name of the helper
 * @param helperFn - Helper function implementation
 *
 * @example
 * ```typescript
 * registerCustomHelper('shout', (text: string) => {
 *   return text.toUpperCase() + '!';
 * });
 * ```
 */
export function registerCustomHelper(name: string, helperFn: Handlebars.HelperDelegate): void {
  handlebarsInstance.registerHelper(name, helperFn);
}
