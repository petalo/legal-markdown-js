/**
 * Remark Plugin for Mixin Processing
 *
 * This plugin processes mixins in legal documents using AST processing.
 * Mixins provide a way to include reusable content blocks and templates
 * within legal documents, with support for variable substitution and
 * conditional logic.
 *
 * Features:
 * - Mixin inclusion with @include directive
 * - Variable substitution within mixins
 * - Nested mixin support
 * - Template field processing within mixins
 * - File-based mixin imports
 *
 * @example
 * ```typescript
 * import { unified } from 'unified';
 * import remarkParse from 'remark-parse';
 * import remarkStringify from 'remark-stringify';
 * import { remarkMixins } from './mixins';
 *
 * const processor = unified()
 *   .use(remarkParse)
 *   .use(remarkMixins, {
 *     metadata: { client: 'ACME Corp' },
 *     basePath: './mixins'
 *   })
 *   .use(remarkStringify);
 * ```
 *
 * @module
 */

import { Plugin } from 'unified';
import { Root, Paragraph, Text } from 'mdast';
import { visit } from 'unist-util-visit';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Options for the remark mixins plugin
 * @interface RemarkMixinsOptions
 */
export interface RemarkMixinsOptions {
  /** Document metadata for variable substitution */
  metadata: Record<string, any>;

  /** Base path for resolving mixin files */
  basePath?: string;

  /** Enable debug logging */
  debug?: boolean;

  /** Maximum recursion depth for nested mixins */
  maxDepth?: number;

  /** Custom mixin definitions */
  customMixins?: Record<string, string>;
}

/**
 * Mixin inclusion directive
 */
interface MixinDirective {
  /** Name of the mixin to include */
  name: string;

  /** Parameters passed to the mixin */
  parameters?: Record<string, any>;

  /** Start and end positions in the text */
  start: number;
  end: number;

  /** Full match text */
  fullMatch: string;
}

/**
 * Mixin processing context
 */
interface MixinContext {
  /** Current recursion depth */
  depth: number;

  /** Maximum allowed depth */
  maxDepth: number;

  /** Base path for file resolution */
  basePath: string;

  /** Global metadata */
  metadata: Record<string, any>;

  /** Debug mode flag */
  debug: boolean;

  /** Custom mixin definitions */
  customMixins: Record<string, string>;

  /** Cache of loaded mixin files */
  fileCache: Map<string, string>;
}

/**
 * Remark plugin for processing mixins
 *
 * This plugin identifies and processes mixin inclusion directives in markdown text,
 * loading mixin content from files or inline definitions and performing variable
 * substitution within the mixin content.
 *
 * @param options - Configuration options for mixin processing
 * @returns Remark plugin transformer function
 */
export const remarkMixins: Plugin<[RemarkMixinsOptions], Root> = options => {
  const { metadata = {}, basePath = '.', debug = false, maxDepth = 5, customMixins = {} } = options;

  return (tree: Root) => {
    if (debug) {
      console.log('[remarkMixins] Processing mixins with options:', {
        basePath,
        maxDepth,
        customMixinCount: Object.keys(customMixins).length,
      });
    }

    const context: MixinContext = {
      depth: 0,
      maxDepth,
      basePath,
      metadata,
      debug,
      customMixins,
      fileCache: new Map(),
    };

    // Process all text nodes that might contain mixin directives
    visit(tree, node => {
      if (node.type === 'text') {
        processTextNode(node as Text, context);
      } else if (node.type === 'paragraph') {
        processParagraphNode(node as Paragraph, context);
      }
    });
  };
};

/**
 * Process a text node for mixin directives
 */
function processTextNode(node: Text, context: MixinContext) {
  const originalText = node.value;
  const mixinDirectives = extractMixinDirectives(originalText);

  if (mixinDirectives.length === 0) {
    return;
  }

  if (context.debug) {
    console.log(`[remarkMixins] Found ${mixinDirectives.length} mixin directives in text node`);
  }

  // Process directives in reverse order to maintain correct positions
  let processedText = originalText;
  for (let i = mixinDirectives.length - 1; i >= 0; i--) {
    const directive = mixinDirectives[i];
    const result = processMixinDirective(directive, context);

    // Replace the directive with the result
    processedText =
      processedText.substring(0, directive.start) + result + processedText.substring(directive.end);
  }

  node.value = processedText;
}

/**
 * Process a paragraph node for mixin directives
 */
function processParagraphNode(node: Paragraph, context: MixinContext) {
  // Process each text child in the paragraph
  node.children.forEach(child => {
    if (child.type === 'text') {
      processTextNode(child as Text, context);
    }
  });
}

/**
 * Extract mixin directives from text
 */
function extractMixinDirectives(text: string): MixinDirective[] {
  const directives: MixinDirective[] = [];

  // Regex to match mixin directives: @include mixin_name or @include mixin_name(param1: value1, param2: value2)
  const mixinRegex = /@include\s+([a-zA-Z_][a-zA-Z0-9_-]*)\s*(?:\((.*?)\))?/g;

  let match;
  while ((match = mixinRegex.exec(text)) !== null) {
    const [fullMatch, mixinName, paramString] = match;

    // Parse parameters if present
    let parameters: Record<string, any> = {};
    if (paramString) {
      try {
        parameters = parseParameters(paramString);
      } catch (error) {
        console.warn(`[remarkMixins] Failed to parse parameters for mixin "${mixinName}":`, error);
      }
    }

    directives.push({
      name: mixinName,
      parameters,
      start: match.index,
      end: match.index + fullMatch.length,
      fullMatch,
    });
  }

  return directives;
}

/**
 * Parse parameter string into object
 */
function parseParameters(paramString: string): Record<string, any> {
  const parameters: Record<string, any> = {};

  // Simple parameter parsing: key: value, key: value
  const paramRegex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^,]+)/g;

  let match;
  while ((match = paramRegex.exec(paramString)) !== null) {
    const [, key, value] = match;
    parameters[key.trim()] = parseParameterValue(value.trim());
  }

  return parameters;
}

/**
 * Parse a parameter value (string, number, boolean)
 */
function parseParameterValue(value: string): any {
  // Remove quotes for strings
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  // Parse numbers
  if (/^\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }

  // Parse booleans
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Otherwise return as string
  return value;
}

/**
 * Process a mixin directive
 */
function processMixinDirective(directive: MixinDirective, context: MixinContext): string {
  if (context.depth >= context.maxDepth) {
    console.warn(
      `[remarkMixins] Maximum recursion depth (${context.maxDepth}) reached for mixin "${directive.name}"`
    );
    return directive.fullMatch; // Return original directive
  }

  if (context.debug) {
    console.log(
      `[remarkMixins] Processing mixin "${directive.name}" with parameters:`,
      directive.parameters
    );
  }

  // Load mixin content
  const mixinContent = loadMixinContent(directive.name, context);

  if (!mixinContent) {
    console.warn(`[remarkMixins] Mixin "${directive.name}" not found`);
    return directive.fullMatch; // Return original directive
  }

  // Create context with mixin parameters
  const mixinContext = {
    ...context.metadata,
    ...directive.parameters,
  };

  // Process template fields within the mixin content
  const processedContent = processTemplateFields(mixinContent, mixinContext, context.debug);

  // Process nested mixins (increment depth)
  const nestedContext: MixinContext = {
    ...context,
    depth: context.depth + 1,
  };

  return processNestedMixins(processedContent, nestedContext);
}

/**
 * Load mixin content from custom definitions or files
 */
function loadMixinContent(mixinName: string, context: MixinContext): string | null {
  // Check custom mixins first
  if (context.customMixins[mixinName]) {
    return context.customMixins[mixinName];
  }

  // Try to load from file
  const filePath = path.join(context.basePath, `${mixinName}.md`);

  // Check cache first
  if (context.fileCache.has(filePath)) {
    return context.fileCache.get(filePath)!;
  }

  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      context.fileCache.set(filePath, content);
      return content;
    }
  } catch (error) {
    if (context.debug) {
      console.warn(`[remarkMixins] Failed to load mixin file "${filePath}":`, error);
    }
  }

  return null;
}

/**
 * Process template fields within mixin content
 */
function processTemplateFields(
  content: string,
  metadata: Record<string, any>,
  debug: boolean
): string {
  // Simple template field processing: {{field}}
  return content.replace(/\{\{([^}]+)\}\}/g, (match, fieldName) => {
    const trimmedField = fieldName.trim();

    // Handle nested object access (e.g., client.name)
    const value = getNestedValue(metadata, trimmedField);

    if (value !== undefined && value !== null) {
      if (debug) {
        console.log(`[remarkMixins] Replacing template field "${trimmedField}" with value:`, value);
      }
      return String(value);
    }

    if (debug) {
      console.log(`[remarkMixins] Template field "${trimmedField}" not found, keeping original`);
    }

    return match; // Keep original if not found
  });
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Process nested mixins in content
 */
function processNestedMixins(content: string, context: MixinContext): string {
  const mixinDirectives = extractMixinDirectives(content);

  if (mixinDirectives.length === 0) {
    return content;
  }

  // Process directives in reverse order to maintain correct positions
  let processedContent = content;
  for (let i = mixinDirectives.length - 1; i >= 0; i--) {
    const directive = mixinDirectives[i];
    const result = processMixinDirective(directive, context);

    // Replace the directive with the result
    processedContent =
      processedContent.substring(0, directive.start) +
      result +
      processedContent.substring(directive.end);
  }

  return processedContent;
}

export default remarkMixins;
