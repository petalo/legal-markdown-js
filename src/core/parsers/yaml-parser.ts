import * as yaml from 'js-yaml';
import { YamlParsingResult } from '../../types';

/**
 * Parses YAML Front Matter from a markdown document
 * 
 * @param content - The content of the document
 * @param throwOnError - Whether to throw errors on invalid YAML (default: false)
 * @returns Object containing the content without YAML and the parsed metadata
 */
export function parseYamlFrontMatter(content: string, throwOnError: boolean = false): YamlParsingResult {
  // Default result
  const defaultResult: YamlParsingResult = {
    content,
    metadata: {}
  };
  
  // Check if content starts with YAML delimiter
  if (!content.startsWith('---')) {
    return defaultResult;
  }
  
  // Find the closing delimiter
  const endDelimiterIndex = content.indexOf('---', 3);
  if (endDelimiterIndex === -1) {
    return defaultResult;
  }
  
  // Extract YAML content
  const yamlContent = content.substring(3, endDelimiterIndex).trim();
  const remainingContent = content.substring(endDelimiterIndex + 3).trim();
  
  try {
    // Parse YAML
    const metadata = yaml.load(yamlContent) as Record<string, any>;
    
    // Handle empty YAML
    if (!metadata || typeof metadata !== 'object') {
      return {
        content: remainingContent,
        metadata: {}
      };
    }
    
    return {
      content: remainingContent,
      metadata
    };
  } catch (error) {
    if (throwOnError) {
      // Throw error for CLI to handle
      throw new Error(`Invalid YAML Front Matter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } else {
      // Return original content if YAML parsing fails (graceful handling)
      console.error('Error parsing YAML Front Matter:', error);
      return defaultResult;
    }
  }
}

/**
 * Serializes metadata to YAML format
 * 
 * @param metadata - The metadata to serialize
 * @returns YAML string representation
 */
export function serializeToYaml(metadata: Record<string, any>): string {
  try {
    return yaml.dump(metadata);
  } catch (error) {
    console.error('Error serializing metadata to YAML:', error);
    return '';
  }
}

/**
 * Extracts specific metadata output configuration
 * 
 * @param metadata - The document metadata
 * @returns Configuration for metadata output
 */
export function extractMetadataOutputConfig(metadata: Record<string, any>): {
  yamlOutput?: string;
  jsonOutput?: string;
  outputPath?: string;
  includeOriginal?: boolean;
} {
  return {
    yamlOutput: metadata['meta-yaml-output'] as string,
    jsonOutput: metadata['meta-json-output'] as string,
    outputPath: metadata['meta-output-path'] as string,
    includeOriginal: metadata['meta-include-original'] as boolean
  };
}