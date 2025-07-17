/**
 * Type definitions for 'restructured' package
 */

declare module 'restructured' {
  export interface Node {
    type: string;
    value?: string;
    children?: Node[];
    parent?: Node;
    refuri?: string;
    refname?: string;
    names?: string[];
    [key: string]: any;
  }

  export interface RestructuredParser {
    parse(content: string): Node;
  }

  const parser: RestructuredParser;
  export default parser;
}
