/**
 * Remark plugins for Legal Markdown processing
 *
 * This module exports all remark plugins used for Legal Markdown document
 * processing. These plugins provide AST-based processing to avoid text
 * contamination issues present in string-based approaches.
 *
 * @module
 */

export { default as remarkCrossReferences } from './cross-references';
export type { CrossReferenceOptions, CrossReferenceDefinition } from './cross-references';

export { default as remarkFieldTracking } from './field-tracking';

export { default as remarkTemplateFields } from './template-fields';
export type { TemplateFieldOptions, TemplateField } from './template-fields';

export { remarkHeaders } from './headers';
export type { RemarkHeadersOptions } from './headers';

export { remarkClauses } from './clauses';
export type { RemarkClausesOptions } from './clauses';

export { remarkMixins } from './mixins';
export type { RemarkMixinsOptions } from './mixins';

export { remarkImports } from './imports';
export type { RemarkImportsOptions, ImportResult } from './imports';
