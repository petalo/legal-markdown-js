/**
 * Remark plugins for Legal Markdown processing (Phase 3: AST Processing)
 *
 * This module exports all remark plugins used for Legal Markdown document
 * processing. These plugins provide AST-based processing to avoid text
 * contamination issues present in string-based approaches.
 *
 * NOTE: String-level transformations (optional clauses, template loops, field
 * normalization) are handled in Phase 2 before remark AST parsing.
 * See: src/core/pipeline/string-transformations.ts
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

// remarkClauses removed: Optional clauses are now processed in Phase 2 (string transformations)
// See: src/core/pipeline/string-transformations.ts

export { remarkMixins } from './mixins';
export type { RemarkMixinsOptions } from './mixins';

export { remarkImports } from './imports';
export type { RemarkImportsOptions, ImportResult } from './imports';

export { remarkLegalHeadersParser } from './legal-headers-parser';

export { default as remarkDates } from './dates';
export type { DateProcessingOptions } from './dates';
