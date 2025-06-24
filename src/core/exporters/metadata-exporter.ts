import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { MetadataExportResult } from '../../types';

/**
 * Exports document metadata to external files
 * 
 * @param metadata - Document metadata to export
 * @param format - Export format (yaml or json)
 * @param outputPath - Optional path for export files
 * @returns Result with list of exported files
 */
export function exportMetadata(
  metadata: Record<string, any>,
  format?: 'yaml' | 'json',
  outputPath?: string
): MetadataExportResult {
  const exportedFiles: string[] = [];
  
  // Extract export configuration from metadata
  const yamlOutput = metadata['meta-yaml-output'] as string;
  const jsonOutput = metadata['meta-json-output'] as string;
  const customOutputPath = metadata['meta-output-path'] as string;
  
  // Determine output directory (customOutputPath from metadata takes precedence)
  const outputDir = customOutputPath || outputPath || process.cwd();
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Process metadata for export (remove internal keys)
  const exportedMetadata = filterMetadataForExport(metadata);
  
  // Process YAML output if specified
  if (yamlOutput || format === 'yaml') {
    const yamlPath = yamlOutput
      ? path.resolve(outputDir, yamlOutput)
      : path.resolve(outputDir, 'metadata.yaml');
    
    try {
      const yamlContent = yaml.dump(exportedMetadata);
      fs.writeFileSync(yamlPath, yamlContent, 'utf8');
      exportedFiles.push(yamlPath);
      console.log(`Exported YAML metadata to: ${yamlPath}`);
    } catch (error) {
      console.error('Error exporting YAML metadata:', error);
    }
  }
  
  // Process JSON output if specified
  if (jsonOutput || format === 'json') {
    const jsonPath = jsonOutput
      ? path.resolve(outputDir, jsonOutput)
      : path.resolve(outputDir, 'metadata.json');
    
    try {
      const jsonContent = JSON.stringify(exportedMetadata, null, 2);
      fs.writeFileSync(jsonPath, jsonContent, 'utf8');
      exportedFiles.push(jsonPath);
      console.log(`Exported JSON metadata to: ${jsonPath}`);
    } catch (error) {
      console.error('Error exporting JSON metadata:', error);
    }
  }
  
  return { exportedFiles };
}

/**
 * Filters metadata based on export configuration
 * 
 * @param metadata - Complete metadata object
 * @returns Filtered metadata object for export
 */
export function filterMetadataForExport(
  metadata: Record<string, any>
): Record<string, any> {
  // Deep clone the metadata to avoid modifying original
  const result = JSON.parse(JSON.stringify(metadata));
  
  // Remove internal export configuration keys
  delete result['meta-yaml-output'];
  delete result['meta-json-output'];
  delete result['meta-output-path'];
  delete result['meta-include-original'];
  
  // Check if we should include only keys under 'meta'
  if (metadata['meta-include-original'] === false && metadata['meta']) {
    return { meta: result.meta };
  }
  
  return result;
}