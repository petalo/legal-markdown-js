/**
 * @fileoverview Metadata Export System for Legal Markdown Documents
 *
 * This module provides functionality for exporting document metadata to external
 * files in various formats. It supports YAML and JSON export formats with
 * configurable output paths and metadata filtering.
 *
 * Features:
 * - Metadata export to YAML and JSON formats
 * - Configurable output paths and filenames
 * - Metadata filtering and processing
 * - Internal metadata key removal
 * - Directory creation for output files
 * - Error handling and logging
 * - Support for custom export configurations
 *
 * @example
 * ```typescript
 * import { exportMetadata } from './metadata-exporter';
 *
 * // Export metadata to YAML
 * const result = exportMetadata(metadata, 'yaml', './output');
 * console.log('Exported files:', result.exportedFiles);
 *
 * // Export with custom configuration
 * const metadata = {
 *   title: 'Legal Agreement',
 *   'meta-yaml-output': 'custom-metadata.yaml',
 *   'meta-json-output': 'custom-metadata.json'
 * };
 * const result = exportMetadata(metadata);
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { MetadataExportResult } from '@types';

/**
 * Exports document metadata to external files
 *
 * Processes document metadata and exports it to specified formats (YAML/JSON)
 * with support for custom output paths and metadata filtering. Handles directory
 * creation and provides comprehensive error handling.
 *
 * @function exportMetadata
 * @param {Record<string, any>} metadata - Document metadata to export
 * @param {'yaml' | 'json'} [format] - Export format (yaml or json)
 * @param {string} [outputPath] - Optional path for export files
 * @returns {MetadataExportResult} Result object with list of exported files
 * @example
 * ```typescript
 * import { exportMetadata } from './metadata-exporter';
 *
 * // Basic metadata export
 * const metadata = {
 *   title: 'Service Agreement',
 *   author: 'Legal Team',
 *   version: '1.0',
 *   date: '2023-01-01'
 * };
 *
 * const result = exportMetadata(metadata, 'yaml', './output');
 * console.log('Exported to:', result.exportedFiles);
 *
 * // Export with custom filenames
 * const customMetadata = {
 *   title: 'Contract',
 *   'meta-yaml-output': 'contract-metadata.yaml',
 *   'meta-json-output': 'contract-metadata.json',
 *   'meta-output-path': './custom-output'
 * };
 *
 * const customResult = exportMetadata(customMetadata);
 * ```
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

  // Determine output directory - if outputPath is a file, use its directory
  let outputDir: string;
  if (customOutputPath) {
    outputDir = customOutputPath;
  } else if (outputPath) {
    // Check if outputPath looks like a file (has extension) or directory
    outputDir = path.extname(outputPath) ? path.dirname(outputPath) : outputPath;
  } else {
    outputDir = process.cwd();
  }

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Process metadata for export (remove internal keys)
  const exportedMetadata = filterMetadataForExport(metadata);

  // Process YAML output if specified
  if (yamlOutput || format === 'yaml') {
    let yamlPath: string;
    if (yamlOutput) {
      yamlPath = path.resolve(outputDir, yamlOutput);
    } else if (outputPath && path.extname(outputPath)) {
      // If outputPath is a complete file path, use it directly
      yamlPath = outputPath;
    } else {
      yamlPath = path.resolve(outputDir, 'metadata.yaml');
    }

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
 * Processes metadata to remove internal configuration keys and applies filtering
 * rules based on export settings. This ensures that only relevant metadata is
 * included in the exported files.
 *
 * @function filterMetadataForExport
 * @param {Record<string, any>} metadata - Complete metadata object to filter
 * @returns {Record<string, any>} Filtered metadata object suitable for export
 * @example
 * ```typescript
 * import { filterMetadataForExport } from './metadata-exporter';
 *
 * const metadata = {
 *   title: 'Legal Agreement',
 *   author: 'Legal Team',
 *   'meta-yaml-output': 'output.yaml',
 *   'meta-json-output': 'output.json',
 *   'meta-output-path': './exports',
 *   'meta-include-original': false
 * };
 *
 * const filtered = filterMetadataForExport(metadata);
 * // Result: { title: 'Legal Agreement', author: 'Legal Team' }
 * // Internal meta-* keys are removed
 * ```
 */
export function filterMetadataForExport(metadata: Record<string, any>): Record<string, any> {
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
