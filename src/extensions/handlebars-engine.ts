/**
 * Handlebars Template Engine with Custom Helpers
 *
 * This module provides a Handlebars-based template engine with all
 * Legal Markdown helpers registered. This replaces the legacy custom
 * parsing engine (1,210 lines in template-loops.ts).
 *
 * @module handlebars-engine
 */

import Handlebars from 'handlebars';
import { extensionHelpers } from './helpers/index';
import { coreHelpers } from '../core/helpers/index';

// Create Handlebars instance
const handlebarsInstance = Handlebars.create();

// ============================================================================
// CORE HELPERS REGISTRATION
// ============================================================================

handlebarsInstance.registerHelper('today', coreHelpers.today);
handlebarsInstance.registerHelper('formatBasicDate', coreHelpers.formatBasicDate);
handlebarsInstance.registerHelper('parseToday', coreHelpers.parseToday);

// ============================================================================
// EXTENSION HELPERS REGISTRATION - Date
// ============================================================================

handlebarsInstance.registerHelper('addYears', extensionHelpers.addYears);
handlebarsInstance.registerHelper('addMonths', extensionHelpers.addMonths);
handlebarsInstance.registerHelper('addDays', extensionHelpers.addDays);
handlebarsInstance.registerHelper('formatDate', extensionHelpers.formatDate);

// ============================================================================
// EXTENSION HELPERS REGISTRATION - Number
// ============================================================================

handlebarsInstance.registerHelper('formatCurrency', extensionHelpers.formatCurrency);
handlebarsInstance.registerHelper('formatInteger', extensionHelpers.formatInteger);
handlebarsInstance.registerHelper('formatPercent', extensionHelpers.formatPercent);
handlebarsInstance.registerHelper('formatEuro', extensionHelpers.formatEuro);
handlebarsInstance.registerHelper('formatDollar', extensionHelpers.formatDollar);
handlebarsInstance.registerHelper('formatPound', extensionHelpers.formatPound);
handlebarsInstance.registerHelper('numberToWords', extensionHelpers.numberToWords);
handlebarsInstance.registerHelper('round', extensionHelpers.round);

// ============================================================================
// EXTENSION HELPERS REGISTRATION - String
// ============================================================================

handlebarsInstance.registerHelper('capitalize', extensionHelpers.capitalize);
handlebarsInstance.registerHelper('capitalizeWords', extensionHelpers.capitalizeWords);
handlebarsInstance.registerHelper('upper', extensionHelpers.upper);
handlebarsInstance.registerHelper('lower', extensionHelpers.lower);
handlebarsInstance.registerHelper('titleCase', extensionHelpers.titleCase);
handlebarsInstance.registerHelper('kebabCase', extensionHelpers.kebabCase);
handlebarsInstance.registerHelper('snakeCase', extensionHelpers.snakeCase);
handlebarsInstance.registerHelper('camelCase', extensionHelpers.camelCase);
handlebarsInstance.registerHelper('pascalCase', extensionHelpers.pascalCase);
handlebarsInstance.registerHelper('truncate', extensionHelpers.truncate);
handlebarsInstance.registerHelper('clean', extensionHelpers.clean);
handlebarsInstance.registerHelper('pluralize', extensionHelpers.pluralize);
handlebarsInstance.registerHelper('padStart', extensionHelpers.padStart);
handlebarsInstance.registerHelper('padEnd', extensionHelpers.padEnd);
handlebarsInstance.registerHelper('contains', extensionHelpers.contains);
handlebarsInstance.registerHelper('replaceAll', extensionHelpers.replaceAll);
handlebarsInstance.registerHelper('initials', extensionHelpers.initials);

// ============================================================================
// MATHEMATICAL HELPERS (for migrating legacy expressions)
// ============================================================================
// These helpers replace legacy mathematical expressions like {{price * quantity}}
// Migration: {{price * quantity}} → {{multiply price quantity}}

handlebarsInstance.registerHelper(
  'multiply',
  (a: number | string, b: number | string) => Number(a) * Number(b)
);
handlebarsInstance.registerHelper(
  'divide',
  (a: number | string, b: number | string) => Number(a) / Number(b)
);
handlebarsInstance.registerHelper(
  'add',
  (a: number | string, b: number | string) => Number(a) + Number(b)
);
handlebarsInstance.registerHelper(
  'subtract',
  (a: number | string, b: number | string) => Number(a) - Number(b)
);

// ============================================================================
// STRING CONCATENATION HELPER (for migrating legacy expressions)
// ============================================================================
// Replaces legacy string concatenation like {{"$" + price}}
// Migration: {{"$" + price}} → {{concat "$" price}}

handlebarsInstance.registerHelper('concat', (...args: any[]) => {
  // Handlebars passes options object as last argument
  const values = args.slice(0, -1);
  return values.join('');
});

// ============================================================================
// FIELD TRACKING HELPER
// ============================================================================
// Helper for wrapping content with field tracking spans

handlebarsInstance.registerHelper(
  'trackField',
  function (this: any, fieldName: string, options: any) {
    const value = options.fn(this);
    return `<span class="legal-md-field" data-field="${fieldName}">${value}</span>`;
  }
);

// ============================================================================
// EXPORTS
// ============================================================================

export { handlebarsInstance };

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
  const compiledTemplate = handlebarsInstance.compile(template);
  return compiledTemplate(data);
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
