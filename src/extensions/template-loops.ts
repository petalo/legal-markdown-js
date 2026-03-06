import { ProcessingError } from '../errors';
import { fieldTracker } from './tracking/field-tracker';
import { fieldSpan } from './tracking/field-span';
import {
  setFieldTrackingEnabled,
  isFieldTrackingEnabled,
  setAstFieldTrackingEnabled,
  isAstFieldTrackingEnabled,
  setLogicBranchHighlightingEnabled,
} from './tracking/field-tracking-state';
import { lmFieldToken } from './tracking/tracking-token';
import { compileHandlebarsTemplate, handlebarsInstance } from './handlebars-engine';
import { unescapeBracketLiteral } from './ast-mixin-processor';
import type { YamlValue } from '../types';

const MAX_LOOP_ITERATIONS = 10_000;
const MAX_NESTING_DEPTH = 10;
const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

function normalizeLeakedEmphasisSegment(segment: string): string {
  return segment.replace(/^\*/g, '_').replace(/\*$/g, '_');
}

function normalizeVariablePath(path: string): string {
  return path.split('.').map(normalizeLeakedEmphasisSegment).join('.');
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export interface LoopContext {
  variable: string;
  item: unknown;
  index: number;
  total: number;
  parent?: LoopContext;
}

export function detectSyntaxType(content: string): 'legacy' | 'handlebars' | 'mixed' {
  const hasLegacy = hasLegacySyntax(content);
  const hasHandlebars =
    /\{\{#(each|if|unless|with)\b/.test(content) ||
    /\{\{\/(each|if|unless|with)\}\}/.test(content) ||
    /\{\{(?!#|\/|@)\w+\s+[^}]+\}\}/.test(content);

  if (hasLegacy && hasHandlebars) return 'mixed';
  if (hasLegacy) return 'legacy';
  return 'handlebars';
}

function hasLegacySyntax(content: string): boolean {
  const hasFunctionStyleHelpers = /\{\{\s*\w+\(/.test(content);
  const hasMathExpressions =
    /\{\{\s*[\w.]+\s+[+\-*/]\s+[\w.]+\s*\}\}/.test(content) ||
    /\{\{\s*[\w.]+\s+[+\-*/]\s+\d+(?:\.\d+)?\s*\}\}/.test(content) ||
    /\{\{\s*\d+(?:\.\d+)?\s+[+\-*/]\s+[\w.]+\s*\}\}/.test(content);
  const hasStringConcatenation =
    /\{\{\s*["'][^"']*["']\s*[+\-*/]\s*[\w.]+\s*\}\}/.test(content) ||
    /\{\{\s*[\w.]+\s*[+\-*/]\s*["'][^"']*["']\s*\}\}/.test(content);

  return hasFunctionStyleHelpers || hasMathExpressions || hasStringConcatenation;
}

/**
 * After `preprocessSimpleVariableMixins` converts `{{.}}` → `{{__lmDot}}`, this pass
 * scans for `{{#each VAR}}` blocks and injects the loop variable name as an argument,
 * producing `{{__lmDot "VAR"}}`. This lets `__lmDot` emit a qualified placeholder like
 * `[[items[2]]]` instead of the generic `[[.]]` when a missing value is encountered.
 *
 * Nested `{{#each}}` blocks are handled by maintaining a stack of variable paths.
 */
function injectLoopVariablePaths(content: string): string {
  const stack: string[] = [];

  return content.replace(/\{\{(?:#each\s+([\w.]+)|\/each|__lmDot)\}\}/g, (match, eachVar) => {
    if (eachVar !== undefined) {
      stack.push(eachVar);
      return match;
    }
    if (match === '{{/each}}') {
      stack.pop();
      return match;
    }
    // match === '{{__lmDot}}'
    if (stack.length > 0) {
      const currentVar = stack[stack.length - 1];
      return `{{__lmDot "${currentVar}"}}`;
    }
    return match;
  });
}

function processWithHandlebars(
  content: string,
  metadata: Record<string, YamlValue>,
  context?: LoopContext,
  enableFieldTracking: boolean = true,
  astFieldTracking: boolean = false,
  logicBranchHighlighting: boolean = false
): string {
  registerVariableFallbackHelper();

  if (context) {
    let depth = 0;
    let currentContext: LoopContext | undefined = context;

    while (currentContext) {
      depth += 1;

      if (depth > MAX_NESTING_DEPTH) {
        throw new ProcessingError(
          `Maximum template nesting depth exceeded (${MAX_NESTING_DEPTH}).`
        );
      }

      if (depth > MAX_LOOP_ITERATIONS) {
        throw new ProcessingError(
          `Maximum loop iteration guard exceeded (${MAX_LOOP_ITERATIONS}) while resolving context depth.`
        );
      }

      currentContext = currentContext.parent;
    }
  }

  const preprocessedContent = injectLoopVariablePaths(
    preprocessSimpleVariableMixins(
      preprocessConditionalComparisons(normalizeTodayVariable(content))
    )
  );

  const handlebarsData: Record<string, YamlValue> = {
    ...metadata,
  };

  if (typeof metadata.locale === 'string' && metadata.locale.trim()) {
    handlebarsData.locale = metadata.locale;
  }

  if (context) {
    handlebarsData['@index'] = context.index;
    handlebarsData['@total'] = context.total;
    handlebarsData['@first'] = context.index === 0;
    handlebarsData['@last'] = context.index === context.total - 1;

    if (context.parent) {
      handlebarsData['@parent'] = {
        ...metadata,
        '@index': context.parent.index,
        '@total': context.parent.total,
      };
    }
  }

  setFieldTrackingEnabled(enableFieldTracking);
  setAstFieldTrackingEnabled(Boolean(astFieldTracking));
  setLogicBranchHighlightingEnabled(Boolean(logicBranchHighlighting));
  const result = compileHandlebarsTemplate(preprocessedContent, handlebarsData);

  if (enableFieldTracking) {
    return applyFieldTrackingToOutput(result, metadata);
  }

  return result;
}

function preprocessConditionalComparisons(content: string): string {
  const tagPattern = /\{\{\s*(#if|#unless|else\s+if)\s+([^}]+?)\s*\}\}/g;

  return content.replace(tagPattern, (match, tagPrefix, rawExpression) => {
    const expression = String(rawExpression).trim();

    if (!expression || expression.startsWith('(')) {
      return match;
    }

    const preprocessedExpression = preprocessConditionalExpression(expression);
    if (!preprocessedExpression) {
      return match;
    }

    return `{{${tagPrefix} ${preprocessedExpression}}}`;
  });
}

function preprocessConditionalExpression(expression: string): string | null {
  const normalized = stripOuterParentheses(expression.trim());
  if (!normalized) return null;

  const orSplit = splitAtTopLevelOperator(normalized, '||');
  if (orSplit) {
    const [left, right] = orSplit;
    return `(or ${toConditionalOperand(left)} ${toConditionalOperand(right)})`;
  }

  const andSplit = splitAtTopLevelOperator(normalized, '&&');
  if (andSplit) {
    const [left, right] = andSplit;
    return `(and ${toConditionalOperand(left)} ${toConditionalOperand(right)})`;
  }

  const comparators: Array<[string, string]> = [
    ['>=', 'gte'],
    ['<=', 'lte'],
    ['==', 'eq'],
    ['!=', 'neq'],
    ['>', 'gt'],
    ['<', 'lt'],
  ];

  for (const [operator, helper] of comparators) {
    const split = splitAtTopLevelOperator(normalized, operator);
    if (!split) continue;

    const [left, right] = split;
    return `(${helper} ${toConditionalOperand(left)} ${toConditionalOperand(right)})`;
  }

  if (normalized.startsWith('!')) {
    return `(not ${toConditionalOperand(normalized.slice(1))})`;
  }

  return null;
}

function toConditionalOperand(operand: string): string {
  const trimmed = stripOuterParentheses(operand.trim());
  const nested = preprocessConditionalExpression(trimmed);
  return nested ?? trimmed;
}

function stripOuterParentheses(value: string): string {
  let current = value.trim();

  while (current.startsWith('(') && current.endsWith(')')) {
    let depth = 0;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let isBalancedWrapper = true;

    for (let i = 0; i < current.length; i++) {
      const char = current[i];
      const previous = i > 0 ? current[i - 1] : '';

      if (char === "'" && previous !== '\\' && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
        continue;
      }

      if (char === '"' && previous !== '\\' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        continue;
      }

      if (inSingleQuote || inDoubleQuote) continue;

      if (char === '(') depth += 1;
      if (char === ')') {
        depth -= 1;
        if (depth === 0 && i < current.length - 1) {
          isBalancedWrapper = false;
          break;
        }
      }
    }

    if (!isBalancedWrapper || depth !== 0) {
      break;
    }

    current = current.slice(1, -1).trim();
  }

  return current;
}

function splitAtTopLevelOperator(expression: string, operator: string): [string, string] | null {
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i <= expression.length - operator.length; i++) {
    const char = expression[i];
    const previous = i > 0 ? expression[i - 1] : '';

    if (char === "'" && previous !== '\\' && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === '"' && previous !== '\\' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (inSingleQuote || inDoubleQuote) continue;

    if (char === '(') {
      depth += 1;
      continue;
    }

    if (char === ')') {
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (depth === 0 && expression.slice(i, i + operator.length) === operator) {
      const left = expression.slice(0, i).trim();
      const right = expression.slice(i + operator.length).trim();
      if (!left || !right) return null;
      return [left, right];
    }
  }

  return null;
}

function normalizeWrappedTodayExpression(expression: string): string | null {
  const toHandlebarsDateFormat = (rawFormat: string | undefined): string => {
    if (!rawFormat) return 'YYYY-MM-DD';
    const normalized = rawFormat.toLowerCase();

    switch (normalized) {
      case 'iso':
      case 'yyyy-mm-dd':
        return 'YYYY-MM-DD';
      case 'us':
      case 'mm/dd/yyyy':
        return 'MM/DD/YYYY';
      case 'eu':
      case 'european':
      case 'dd/mm/yyyy':
        return 'DD/MM/YYYY';
      case 'long':
        return 'MMMM D, YYYY';
      case 'medium':
        return 'MMM D, YYYY';
      case 'short':
        return 'MMM D, YY';
      case 'legal':
        return 'MMMM Do, YYYY';
      default:
        return rawFormat;
    }
  };

  const trimmed = expression.trim();
  const arithmeticMatch = trimmed.match(/^@today((?:[+-]\d+[dmy]?)+)(?:\[([^\]]+)\])?$/);
  if (arithmeticMatch) {
    const [, arithmeticPart, formatOverride] = arithmeticMatch;
    const opPattern = /([+-])(\d+)([dmy]?)/g;
    let opMatch: RegExpExecArray | null;
    let currentExpr = '(today)';

    while ((opMatch = opPattern.exec(arithmeticPart)) !== null) {
      const [, sign, amountRaw, unitRaw] = opMatch;
      const amount = `${sign === '-' ? '-' : ''}${amountRaw}`;
      const unit = unitRaw || 'd';
      const helperName = unit === 'm' ? 'addMonths' : unit === 'y' ? 'addYears' : 'addDays';
      currentExpr = `(${helperName} ${currentExpr} ${amount})`;
    }

    const format = toHandlebarsDateFormat(formatOverride).replace(/"/g, '\\"');
    return `formatDate ${currentExpr} "${format}"`;
  }

  const simpleMatch = trimmed.match(/^@today(?:\[([^\]]+)\])?$/);
  if (!simpleMatch) return null;

  const format = toHandlebarsDateFormat(simpleMatch[1]).replace(/"/g, '\\"');
  return `formatDate (today) "${format}"`;
}

function normalizeTodayVariable(content: string): string {
  return content.replace(/\{\{([^{}]+)\}\}/g, (match, expression) => {
    const wrappedTodayExpression = normalizeWrappedTodayExpression(expression);
    if (wrappedTodayExpression) {
      return `{{${wrappedTodayExpression}}}`;
    }

    const trimmed = expression.trim();
    if (trimmed === 'today') {
      return match;
    }

    const normalized = expression.replace(/(^|\s)@?today(?=\s|$)/g, '$1(today)');
    return `{{${normalized}}}`;
  });
}

let variableFallbackHelperRegistered = false;

interface HandlebarsHelperData {
  index?: number;
  root?: Record<string, YamlValue>;
}

interface HandlebarsHelperOptionsLike {
  data?: HandlebarsHelperData;
}

function registerVariableFallbackHelper(): void {
  if (variableFallbackHelperRegistered) return;

  handlebarsInstance.registerHelper(
    '__lmDot',
    function (
      this: unknown,
      pathOrOptions: string | HandlebarsHelperOptionsLike,
      maybeOptions?: HandlebarsHelperOptionsLike
    ) {
      const hasPath = typeof pathOrOptions === 'string';
      const options = hasPath ? maybeOptions : pathOrOptions;
      const loopVarPath = hasPath ? pathOrOptions : undefined;
      // Handlebars stores loop data as `data.index` (not `data['@index']`);
      // the `@` prefix is template-syntax only, not the data key.
      const loopIndex = options?.data?.index;

      const rawValue = this === null || this === undefined ? '' : String(this);
      if (!isFieldTrackingEnabled()) return unescapeBracketLiteral(rawValue) ?? rawValue;
      const isEmpty = rawValue === '';

      let displayValue: string;
      if (isEmpty) {
        displayValue =
          loopVarPath !== undefined && loopIndex !== undefined
            ? `[[${loopVarPath}[${loopIndex}]]]`
            : '[[.]]';
      } else {
        displayValue = unescapeBracketLiteral(rawValue) ?? rawValue;
      }

      const kind = isEmpty ? 'missing' : 'imported';
      const tokenized = isAstFieldTrackingEnabled();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SafeString not directly importable from instance
      return new (handlebarsInstance as any).SafeString(
        tokenized ? lmFieldToken('.', displayValue, kind) : fieldSpan('.', displayValue, kind)
      );
    }
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Handlebars injects `this` and `options` as untyped context objects
  handlebarsInstance.registerHelper('__lmVar', function (this: any, path: string, options: any) {
    const root = options?.data?.root as Record<string, YamlValue> | undefined;

    const normalizedPath = normalizeVariablePath(path);
    const shouldResolveAtRoot =
      normalizedPath !== path ||
      /^[_*]/.test(path) ||
      /[_*]$/.test(path) ||
      /\.[_*]/.test(path) ||
      /[_*]\./.test(path);

    if (root && this === root && !shouldResolveAtRoot) {
      return `{{${path}}}`;
    }

    const contextValue = resolvePath(this as Record<string, YamlValue>, normalizedPath);
    if (contextValue !== undefined) {
      if (typeof contextValue === 'string') {
        const displayValue = unescapeBracketLiteral(contextValue) ?? contextValue;
        if (isFieldTrackingEnabled()) {
          const tokenized = isAstFieldTrackingEnabled();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SafeString not directly importable from instance
          return new (handlebarsInstance as any).SafeString(
            tokenized
              ? lmFieldToken(path, displayValue, 'imported')
              : fieldSpan(path, displayValue, 'imported')
          );
        }
        return displayValue;
      }
      if (typeof contextValue === 'number' && isFieldTrackingEnabled()) {
        const tokenized = isAstFieldTrackingEnabled();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SafeString not directly importable from instance
        return new (handlebarsInstance as any).SafeString(
          tokenized
            ? lmFieldToken(path, String(contextValue), 'imported')
            : fieldSpan(path, String(contextValue), 'imported')
        );
      }
      return contextValue;
    }

    const rootValue = root ? resolvePath(root, normalizedPath) : undefined;
    if (rootValue !== undefined) {
      if (typeof rootValue === 'string') {
        const displayValue = unescapeBracketLiteral(rootValue) ?? rootValue;
        if (isFieldTrackingEnabled()) {
          const tokenized = isAstFieldTrackingEnabled();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SafeString not directly importable from instance
          return new (handlebarsInstance as any).SafeString(
            tokenized
              ? lmFieldToken(path, displayValue, 'imported')
              : fieldSpan(path, displayValue, 'imported')
          );
        }
        return displayValue;
      }
      if (typeof rootValue === 'number' && isFieldTrackingEnabled()) {
        const tokenized = isAstFieldTrackingEnabled();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SafeString not directly importable from instance
        return new (handlebarsInstance as any).SafeString(
          tokenized
            ? lmFieldToken(path, String(rootValue), 'imported')
            : fieldSpan(path, String(rootValue), 'imported')
        );
      }
      return rootValue;
    }

    return `{{${path}}}`;
  });

  variableFallbackHelperRegistered = true;
}

function preprocessSimpleVariableMixins(content: string): string {
  let iterationCount = 0;

  return content.replace(/\{\{([^{}]+)\}\}/g, (match, expression) => {
    iterationCount += 1;

    if (iterationCount > MAX_LOOP_ITERATIONS) {
      throw new ProcessingError(
        `Maximum template preprocessing iterations exceeded (${MAX_LOOP_ITERATIONS}).`
      );
    }

    const trimmed = expression.trim();

    // {{.}} and {{this}} are loop context references - route through __lmDot
    // so the helper can emit field-tracking spans when enableFieldTracking is on.
    if (trimmed === '.' || trimmed === 'this') {
      return '{{__lmDot}}';
    }

    if (
      !trimmed ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('/') ||
      trimmed === 'else' ||
      trimmed.startsWith('!') ||
      trimmed.startsWith('>') ||
      trimmed.startsWith('&') ||
      /\s/.test(trimmed) ||
      trimmed.startsWith('@') ||
      trimmed.startsWith('../') ||
      trimmed.startsWith('./')
    ) {
      return match;
    }

    if (!/^[A-Za-z0-9_.\-*]+$/.test(trimmed)) {
      return match;
    }

    return `{{__lmVar "${normalizeVariablePath(trimmed).replace(/"/g, '\\"')}"}}`;
  });
}

function applyFieldTrackingToOutput(content: string, metadata: Record<string, YamlValue>): string {
  Object.keys(metadata).forEach(key => {
    const value = metadata[key];
    if (typeof value === 'string' || typeof value === 'number') {
      const valueStr = String(value);
      const escapedValueForAttribute = escapeHtmlAttribute(valueStr);

      if (content.includes(valueStr) || content.includes(escapedValueForAttribute)) {
        fieldTracker.trackField(key, { value, hasLogic: false });
      }
    }
  });

  return content;
}

export function processTemplateLoops(
  content: string,
  metadata: Record<string, YamlValue>,
  context?: LoopContext,
  enableFieldTracking: boolean = true,
  astFieldTracking: boolean = false,
  logicBranchHighlighting: boolean = false
): string {
  if (hasLegacySyntax(content)) {
    throw new ProcessingError(
      'Legacy template syntax detected. Please migrate to Handlebars syntax.\n' +
        '  {{helper(arg1, arg2)}} → {{helper arg1 arg2}}\n' +
        '  {{price * quantity}} → {{multiply price quantity}}\n' +
        '  {{"$" + price}} → {{concat "$" price}}'
    );
  }

  return processWithHandlebars(
    content,
    metadata,
    context,
    enableFieldTracking,
    astFieldTracking,
    logicBranchHighlighting
  );
}

// Exported for testing - not part of public API
export {
  processWithHandlebars as _processWithHandlebars,
  preprocessConditionalComparisons as _preprocessConditionalComparisons,
  preprocessConditionalExpression as _preprocessConditionalExpression,
  stripOuterParentheses as _stripOuterParentheses,
  splitAtTopLevelOperator as _splitAtTopLevelOperator,
  registerVariableFallbackHelper as _registerVariableFallbackHelper,
  preprocessSimpleVariableMixins as _preprocessSimpleVariableMixins,
  applyFieldTrackingToOutput as _applyFieldTrackingToOutput,
};

export function resolvePath(obj: Record<string, YamlValue>, path: string): YamlValue | undefined {
  const keys = normalizeVariablePath(path).split('.');
  let current: YamlValue = obj;

  for (const key of keys) {
    if (BLOCKED_KEYS.has(key)) {
      return undefined;
    }

    if (
      current !== null &&
      typeof current === 'object' &&
      !Array.isArray(current) &&
      Object.prototype.hasOwnProperty.call(current, key)
    ) {
      current = (current as Record<string, YamlValue>)[key];
    } else {
      return undefined;
    }
  }

  return current;
}
