/**
 * Debug plugin to inspect AST structure
 */
import { Plugin } from 'unified';
import { Root } from 'mdast';
import { visit } from 'unist-util-visit';

export const remarkDebugAST: Plugin<[], Root> = () => {
  return (tree: Root) => {
    console.log('\n=== AST DEBUG ===');

    let nodeCount = 0;
    visit(tree, (node: any, index, parent) => {
      if (node.type === 'text' || node.type === 'html') {
        const value = node.value || '';
        if (value.includes('{{#') || value.includes('{{/')) {
          console.log(`\nNode #${nodeCount} (${node.type}):`);
          console.log('Value:', JSON.stringify(value));
          console.log('Parent type:', parent?.type);
          console.log('Full value length:', value.length);
        }
      }
      nodeCount++;
    });

    console.log(`\nTotal nodes visited: ${nodeCount}`);
    console.log('=== END AST DEBUG ===\n');
  };
};
