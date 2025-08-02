/**
 * Simple Browser Entry Point for Testing Vite Build
 *
 * This is a minimal entry point to test if Vite can bundle
 * the remark dependencies properly.
 */

// Import only the essential processor
import { processLegalMarkdownWithRemark } from './extensions/remark/legal-markdown-processor';

/**
 * Process Legal Markdown content
 */
export async function processLegalMarkdown(content: string, options: any = {}): Promise<any> {
  return processLegalMarkdownWithRemark(content, options);
}

// Default export
export default {
  processLegalMarkdown,
  version: '2.16.3',
};
