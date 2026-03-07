/**
 * Dev-only debug plugin to inspect AST structure.
 *
 * @module
 */
import { Plugin } from 'unified';
import { Root } from 'mdast';
import { visit } from 'unist-util-visit';

export const remarkDebugAST: Plugin<[], Root> = () => {
  return (tree: Root) => {
    process.stderr.write('\n=== AST DEBUG ===\n');

    let nodeCount = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- unist-util-visit generic node callback
    visit(tree, (node: any, _index, parent) => {
      if (node.type === 'text' || node.type === 'html') {
        const value: string = node.value || '';
        if (value.includes('{{#') || value.includes('{{/')) {
          process.stderr.write(`\nNode #${nodeCount} (${node.type}):\n`);
          process.stderr.write(`Value: ${JSON.stringify(value)}\n`);
          process.stderr.write(`Parent type: ${JSON.stringify(parent?.type)}\n`);
          process.stderr.write(`Full value length: ${JSON.stringify(value.length)}\n`);
        }
      }
      nodeCount++;
    });

    process.stderr.write(`\nTotal nodes visited: ${nodeCount}\n`);
    process.stderr.write('=== END AST DEBUG ===\n\n');
  };
};
