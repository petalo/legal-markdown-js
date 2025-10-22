/**
 * Template Loops Adapter
 *
 * Wraps the processTemplateLoops string-based preprocessor as a remark plugin
 * using the PreprocessorAdapter pattern.
 *
 * @module template-loops-adapter
 */

import type { PreprocessorAdapter } from './preprocessor-adapter';
import { wrapPreprocessor } from './preprocessor-adapter';
import { processTemplateLoops } from '../../extensions/template-loops';

/**
 * Options for template loops processing
 */
export interface TemplateLoopsOptions {
  /** Enable field tracking HTML spans */
  enableFieldTracking?: boolean;

  /** Document metadata containing loop data */
  metadata?: Record<string, unknown>;

  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Template Loops Preprocessor Adapter
 *
 * Integrates processTemplateLoops into the remark pipeline.
 * Handles {{#variable}}...{{/variable}} syntax for loops and conditionals.
 */
export const templateLoopsAdapter: PreprocessorAdapter<TemplateLoopsOptions> = {
  name: 'processTemplateLoops',

  execute(
    content: string,
    metadata: Record<string, unknown>,
    options: TemplateLoopsOptions
  ): string {
    const enableFieldTracking = options.enableFieldTracking ?? true;

    // Call the original processTemplateLoops function
    return processTemplateLoops(
      content,
      metadata,
      undefined, // context - undefined for top-level call
      enableFieldTracking
    );
  },
};

/**
 * Remark plugin for template loops processing
 *
 * This plugin wraps the template loops preprocessor to work within
 * the remark AST pipeline.
 *
 * @example
 * ```typescript
 * import { remarkTemplateLoops } from './core/pipeline/template-loops-adapter';
 *
 * processor.use(remarkTemplateLoops, {
 *   metadata: {
 *     items: [{ name: 'Item 1' }, { name: 'Item 2' }]
 *   },
 *   enableFieldTracking: true,
 *   debug: false
 * });
 * ```
 */
export const remarkTemplateLoops = wrapPreprocessor(templateLoopsAdapter);
