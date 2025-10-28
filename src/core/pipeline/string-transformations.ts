/**
 * Phase 2: String-Level Transformations
 *
 * This module contains transformations that MUST run on raw string content
 * BEFORE remark AST parsing. These transformations cannot work as remark plugins
 * because the AST fragments multi-line patterns across multiple nodes.
 *
 * Why String Transformations Exist:
 * ─────────────────────────────────────
 * When remark parses markdown into an AST, it splits content into nodes (paragraphs,
 * text, strong, emphasis, etc.). Multi-line patterns get fragmented across these nodes,
 * making it impossible for AST plugins to match complete patterns.
 *
 * Example: Multi-line Optional Clause
 * ```markdown
 * [l. **Warranties**
 *
 * The seller provides warranties.]{includeWarranties}
 * ```
 *
 * As String (BEFORE remark):
 * ✅ Regex can match: /\[(.*?)\]\{(.*?)\}/s
 *
 * As AST (AFTER remark parsing):
 * ❌ Plugin cannot see complete pattern - it's fragmented across:
 *    - Paragraph with Text "[", Text "l. ", Strong "Warranties", Text "]{", ...
 *
 * Transformation Order:
 * ────────────────────
 * 1. Normalize field patterns: |field| → {{field}}
 *    (Must happen before Handlebars compilation)
 *
 * 2. Process optional clauses: [content]{condition}
 *    (Multi-line content with markdown formatting)
 *
 * 3. Process template loops: {{#each}}, {{#if}}, etc.
 *    (Handlebars blocks that span multiple lines)
 *
 * @module
 * @see docs/architecture/string-transformations.md
 * @see Issue #149 - https://github.com/petalo/legal-markdown-js/issues/149
 */

import { processTemplateLoops } from '../../extensions/template-loops';

/**
 * Options for string-level transformations
 */
export interface StringTransformationOptions {
  /** Document metadata for condition evaluation and variable expansion */
  metadata: Record<string, any>;

  /** Enable debug logging */
  debug?: boolean;

  /** Enable field tracking (passed to template loops) */
  enableFieldTracking?: boolean;

  /** Disable optional clause processing */
  noClauses?: boolean;

  /** Custom field patterns to normalize (e.g., ['<<(.+?)>>', '|(.+?)|']) */
  fieldPatterns?: string[];
}

/**
 * Result of string transformations
 */
export interface StringTransformationResult {
  /** Transformed content ready for remark AST parsing */
  content: string;

  /** Updated metadata (includes field mappings and other tracked data) */
  metadata: Record<string, any>;
}

/**
 * Apply all string-level transformations in the correct order
 *
 * This is the main entry point for Phase 2 string transformations.
 * Transformations are applied in a specific order to ensure dependencies:
 *
 * 1. Field pattern normalization (|field| → {{field}})
 * 2. Optional clauses processing ([content]{condition})
 * 3. Template loops ({{#each}}, {{#if}})
 *
 * @param content - Raw markdown content (without YAML frontmatter)
 * @param options - Transformation options
 * @returns Transformed content and updated metadata
 *
 * @example
 * ```typescript
 * const result = await applyStringTransformations(
 *   content,
 *   {
 *     metadata: { items: [...], includeWarranty: true },
 *     debug: true,
 *     enableFieldTracking: true
 *   }
 * );
 *
 * // result.content is ready for remark AST parsing
 * // result.metadata includes field mappings
 * ```
 */
export async function applyStringTransformations(
  content: string,
  options: StringTransformationOptions
): Promise<StringTransformationResult> {
  let processedContent = content;
  const metadata = { ...options.metadata };

  if (options.debug) {
    console.log('[String Transformations] Starting Phase 2 transformations');
    console.log('[String Transformations] Content length:', content.length);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Step 1: Normalize Field Patterns
  // ──────────────────────────────────────────────────────────────────────────
  // Convert custom field patterns (like |field|, <<field>>) to standard {{field}} format
  // This must run BEFORE template loops so Handlebars can process all fields
  const { content: normalized, mappings } = normalizeFieldPatterns(
    processedContent,
    options.fieldPatterns || [],
    options.debug
  );
  processedContent = normalized;
  metadata['_field_mappings'] = mappings;

  if (options.debug && mappings.size > 0) {
    console.log(`[String Transformations] Normalized ${mappings.size} custom field patterns`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Step 2: Process Optional Clauses
  // ──────────────────────────────────────────────────────────────────────────
  // Handle [content]{condition} patterns before remark parsing
  // This allows multi-line content with markdown formatting inside clauses
  if (!options.noClauses) {
    if (options.debug) {
      console.log('[String Transformations] Processing optional clauses');
    }

    processedContent = preprocessOptionalClauses(
      processedContent,
      metadata,
      options.debug || false
    );

    if (options.debug) {
      console.log('[String Transformations] Optional clauses processed');
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Step 3: Process Template Loops
  // ──────────────────────────────────────────────────────────────────────────
  // Handle Handlebars {{#each}}, {{#if}}, etc.
  // This must run AFTER field normalization so all fields use {{}} syntax
  if (options.debug) {
    console.log('[String Transformations] Processing template loops (Handlebars)');
  }

  processedContent = processTemplateLoops(
    processedContent,
    metadata,
    undefined, // context (for nested loops)
    options.enableFieldTracking || false
  );

  if (options.debug) {
    console.log('[String Transformations] Template loops processed');
    console.log('[String Transformations] Final content length:', processedContent.length);
  }

  return {
    content: processedContent,
    metadata,
  };
}

/**
 * Normalize custom field patterns to standard {{field}} format
 *
 * This function converts custom field patterns (e.g., <<field>>, |field|)
 * into the standard {{field}} format so all fields use consistent syntax
 * before Handlebars compilation.
 *
 * @param content - The content to normalize
 * @param fieldPatterns - Array of regex patterns to normalize (e.g., ['<<(.+?)>>', '|(.+?)|'])
 * @param debug - Enable debug logging
 * @returns Normalized content and field mappings
 *
 * @example
 * ```typescript
 * const { content, mappings } = normalizeFieldPatterns(
 *   "Template: {{name1}} and custom: <<name2>>",
 *   ['<<(.+?)>>'],
 *   true
 * );
 * // content: "Template: {{name1}} and custom: {{name2}}"
 * // mappings: Map { "{{name2}}" => "<<name2>>" }
 * ```
 */
function normalizeFieldPatterns(
  content: string,
  fieldPatterns: string[] = [],
  debug: boolean = false
): { content: string; mappings: Map<string, string> } {
  let processedContent = content;
  const fieldMappings = new Map<string, string>();

  // Process each custom field pattern
  if (fieldPatterns && fieldPatterns.length > 0) {
    for (const pattern of fieldPatterns) {
      // Skip the default pattern - it's already in the correct format
      if (pattern === '{{(.+?)}}') {
        continue;
      }

      // Create regex from pattern
      const regex = new RegExp(pattern, 'g');

      // Replace custom patterns with standard {{field}} format
      processedContent = processedContent.replace(regex, (match, fieldName) => {
        const normalizedPattern = `{{${fieldName}}}`;
        fieldMappings.set(normalizedPattern, match);
        return normalizedPattern;
      });
    }
  }

  if (debug && fieldMappings.size > 0) {
    console.log(
      '[normalizeFieldPatterns] Normalized patterns:',
      Array.from(fieldMappings.entries())
    );
  }

  return {
    content: processedContent,
    mappings: fieldMappings,
  };
}

/**
 * Pre-process optional clauses [content]{condition} before remark parsing
 *
 * This function processes optional clauses BEFORE the content is parsed by remark,
 * which allows clauses with multi-line content and markdown formatting to work correctly.
 * Without this pre-processing, remark would split the clause across multiple AST nodes,
 * making it impossible for an AST plugin to find and process them.
 *
 * Why This Cannot Be a Remark Plugin:
 * ───────────────────────────────────
 * Multi-line optional clauses with markdown formatting get fragmented in the AST:
 *
 * Input String:
 * ```
 * [l. **Warranties**
 *
 * The seller provides warranties.]{includeWarranties}
 * ```
 *
 * After Remark Parsing (AST):
 * ```
 * Paragraph {
 *   children: [
 *     Text("["),
 *     Text("l. "),
 *     Strong("Warranties"),
 *     Text("]{"),
 *     Text("includeWarranties"),
 *     Text("}")
 *   ]
 * }
 * Paragraph {
 *   children: [
 *     Text("The seller provides warranties.")
 *   ]
 * }
 * ```
 *
 * The pattern is split across multiple nodes and paragraphs, making it impossible
 * for a plugin to match the complete pattern.
 *
 * @param content - The markdown content with optional clauses
 * @param metadata - Document metadata for evaluating conditions
 * @param debug - Enable debug logging
 * @returns Content with optional clauses processed
 *
 * @example
 * ```typescript
 * const content = "[Optional content]{showThis}";
 * const metadata = { showThis: true };
 * const result = preprocessOptionalClauses(content, metadata);
 * // result: "Optional content"
 * ```
 */
function preprocessOptionalClauses(
  content: string,
  metadata: Record<string, any>,
  debug: boolean = false
): string {
  // Regex to match optional clauses: [content]{condition}
  // Uses dotall mode (s flag) to match across newlines
  // eslint-disable-next-line no-useless-escape
  const clauseRegex = /\[([^\[\]]*(?:\n[^\[\]]*)*?)\]\{([^{}]+?)\}/gs;

  let processedContent = content;
  const matches: Array<{ full: string; content: string; condition: string; index: number }> = [];

  // Collect all matches first (to avoid mutation during iteration)
  let match;
  while ((match = clauseRegex.exec(content)) !== null) {
    matches.push({
      full: match[0],
      content: match[1],
      condition: match[2].trim(),
      index: match.index,
    });
  }

  if (debug && matches.length > 0) {
    console.log(`[preprocessOptionalClauses] Found ${matches.length} optional clauses`);
  }

  // Process matches in reverse order to maintain correct positions
  for (let i = matches.length - 1; i >= 0; i--) {
    const { full, content: clauseContent, condition, index } = matches[i];

    // Evaluate the condition
    const conditionValue = metadata[condition];
    const shouldInclude = Boolean(conditionValue);

    if (debug) {
      console.log(
        `[preprocessOptionalClauses] Condition "${condition}" = ${conditionValue} (include: ${shouldInclude})`
      );
    }

    // Replace the clause with its content if true, or remove it if false
    const replacement = shouldInclude ? clauseContent : '';
    processedContent =
      processedContent.substring(0, index) +
      replacement +
      processedContent.substring(index + full.length);
  }

  return processedContent;
}

/**
 * Synchronous wrapper for string transformations
 *
 * @param content - Raw markdown content
 * @param options - Transformation options
 * @returns Transformed content and metadata
 */
export function applyStringTransformationsSync(
  content: string,
  options: StringTransformationOptions
): StringTransformationResult {
  // All current transformations are synchronous, so we can just
  // unwrap the async function. If async transformations are added
  // in the future, this will need to be updated.
  let result: StringTransformationResult = {
    content,
    metadata: options.metadata,
  };

  // Execute the async function synchronously (safe because all transforms are sync)
  applyStringTransformations(content, options).then(r => {
    result = r;
  });

  return result;
}
