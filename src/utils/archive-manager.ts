/**
 * Archive Manager Utility
 *
 * This module handles moving processed source files to archive directories
 * with conflict resolution, error handling, and directory management.
 * It provides a clean API for organizing files after successful processing.
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateArchivePaths, areContentsIdentical } from './file-naming';

/**
 * Configuration options for archiving operations
 */
export interface ArchiveOptions {
  /** Target directory for archiving files */
  archiveDir: string;
  /** Whether to create the archive directory if it doesn't exist */
  createDirectory?: boolean;
  /** Strategy for handling filename conflicts */
  conflictResolution?: 'overwrite' | 'rename' | 'skip';
}

/**
 * Configuration options for smart archiving with content comparison
 */
export interface SmartArchiveOptions extends ArchiveOptions {
  /** Original file content */
  originalContent: string;
  /** Processed file content */
  processedContent: string;
}

/**
 * Result of an archive operation
 */
export interface ArchiveResult {
  /** Whether the operation was successful */
  success: boolean;
  /** Original file path */
  originalPath: string;
  /** Final archived file path (if successful) */
  archivedPath?: string;
  /** Error message (if unsuccessful) */
  error?: string;
}

/**
 * Result of a smart archive operation
 */
export interface SmartArchiveResult extends ArchiveResult {
  /** Whether contents were identical */
  contentsIdentical: boolean;
  /** Path to archived original file (if different from processed) */
  archivedOriginalPath?: string;
  /** Path to archived processed file (if different from original) */
  archivedProcessedPath?: string;
}

/**
 * Archive Manager class for handling file archiving operations
 */
export class ArchiveManager {
  /**
   * Archive a file to the specified directory
   *
   * @param sourcePath Path to the source file to archive
   * @param options Archive configuration options
   * @returns Promise resolving to the archive result
   */
  async archiveFile(sourcePath: string, options: ArchiveOptions): Promise<ArchiveResult> {
    try {
      // Validate source file exists
      if (!fs.existsSync(sourcePath)) {
        return {
          success: false,
          originalPath: sourcePath,
          error: 'Source file does not exist',
        };
      }

      // Ensure source is a file, not a directory
      const sourceStats = fs.statSync(sourcePath);
      if (!sourceStats.isFile()) {
        return {
          success: false,
          originalPath: sourcePath,
          error: 'Source path is not a file',
        };
      }

      // Resolve absolute paths
      const absoluteSourcePath = path.resolve(sourcePath);
      const absoluteArchiveDir = path.resolve(options.archiveDir);

      // Create archive directory if needed
      if (options.createDirectory !== false) {
        this.ensureDirectoryExists(absoluteArchiveDir);
      }

      // Determine target file path
      const fileName = path.basename(absoluteSourcePath);
      let targetPath = path.join(absoluteArchiveDir, fileName);

      // Handle conflicts
      if (fs.existsSync(targetPath)) {
        const resolvedPath = this.handleConflicts(
          targetPath,
          options.conflictResolution || 'rename'
        );

        if (!resolvedPath) {
          return {
            success: false,
            originalPath: sourcePath,
            error: 'File already exists and conflict resolution is set to skip',
          };
        }

        targetPath = resolvedPath;
      }

      // Move the file
      fs.renameSync(absoluteSourcePath, targetPath);

      return {
        success: true,
        originalPath: sourcePath,
        archivedPath: targetPath,
      };
    } catch (error) {
      return {
        success: false,
        originalPath: sourcePath,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate a unique filename by adding a numeric suffix
   *
   * @param targetPath The original target path
   * @returns A unique file path that doesn't conflict with existing files
   */
  private generateUniqueFilename(targetPath: string): string {
    const dir = path.dirname(targetPath);
    const ext = path.extname(targetPath);
    const baseName = path.basename(targetPath, ext);

    let counter = 1;
    let uniquePath: string;

    do {
      uniquePath = path.join(dir, `${baseName}_${counter}${ext}`);
      counter++;
    } while (fs.existsSync(uniquePath));

    return uniquePath;
  }

  /**
   * Ensure a directory exists, creating it recursively if necessary
   *
   * @param dirPath Path to the directory to create
   * @throws Error if directory creation fails
   */
  private ensureDirectoryExists(dirPath: string): void {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create archive directory: ${dirPath}. ${errorMessage}`);
    }
  }

  /**
   * Smart archive that compares original and processed content
   *
   * If contents are identical, archives only the original file.
   * If contents are different, archives both with .ORIGINAL and .PROCESSED suffixes.
   *
   * @param sourcePath Path to the source file
   * @param options Smart archive configuration options
   * @returns Promise resolving to the smart archive result
   */
  async smartArchiveFile(
    sourcePath: string,
    options: SmartArchiveOptions
  ): Promise<SmartArchiveResult> {
    try {
      // Compare contents
      const contentsIdentical = areContentsIdentical(
        options.originalContent,
        options.processedContent
      );

      // Resolve absolute paths
      const absoluteSourcePath = path.resolve(sourcePath);
      const absoluteArchiveDir = path.resolve(options.archiveDir);
      const fileName = path.basename(absoluteSourcePath);

      // Create archive directory if needed
      if (options.createDirectory !== false) {
        this.ensureDirectoryExists(absoluteArchiveDir);
      }

      if (contentsIdentical) {
        // Contents are identical, just archive the original file
        const targetPath = path.join(absoluteArchiveDir, fileName);
        const resolvedPath = this.handleConflicts(targetPath, options.conflictResolution);

        if (!resolvedPath) {
          return {
            success: false,
            originalPath: sourcePath,
            contentsIdentical: true,
            error: 'File already exists and conflict resolution is set to skip',
          };
        }

        // Move the original file
        fs.renameSync(absoluteSourcePath, resolvedPath);

        return {
          success: true,
          originalPath: sourcePath,
          archivedPath: resolvedPath,
          contentsIdentical: true,
        };
      } else {
        // Contents are different, archive both with suffixes
        const basePath = path.join(absoluteArchiveDir, fileName);
        const archivePaths = generateArchivePaths(basePath);

        // Handle conflicts for both files
        const resolvedOriginalPath = this.handleConflicts(
          archivePaths.original,
          options.conflictResolution
        );
        const resolvedProcessedPath = this.handleConflicts(
          archivePaths.processed,
          options.conflictResolution
        );

        if (!resolvedOriginalPath || !resolvedProcessedPath) {
          return {
            success: false,
            originalPath: sourcePath,
            contentsIdentical: false,
            error: 'One or more archive files already exist and conflict resolution is set to skip',
          };
        }

        // Write both files
        fs.writeFileSync(resolvedOriginalPath, options.originalContent, 'utf8');
        fs.writeFileSync(resolvedProcessedPath, options.processedContent, 'utf8');

        // Remove the original source file
        fs.unlinkSync(absoluteSourcePath);

        return {
          success: true,
          originalPath: sourcePath,
          contentsIdentical: false,
          archivedOriginalPath: resolvedOriginalPath,
          archivedProcessedPath: resolvedProcessedPath,
          archivedPath: resolvedProcessedPath, // Primary path for backward compatibility
        };
      }
    } catch (error) {
      return {
        success: false,
        originalPath: sourcePath,
        contentsIdentical: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Handle filename conflicts using the specified strategy
   *
   * @param targetPath The proposed target file path
   * @param strategy The conflict resolution strategy
   * @returns The resolved file path, or null if skipping
   */
  private handleConflicts(
    targetPath: string,
    strategy: 'overwrite' | 'rename' | 'skip' = 'rename'
  ): string | null {
    if (!fs.existsSync(targetPath)) {
      return targetPath;
    }

    switch (strategy) {
      case 'overwrite':
        return targetPath;
      case 'skip':
        return null;
      case 'rename':
      default:
        return this.generateUniqueFilename(targetPath);
    }
  }

  /**
   * Check if a path can be used as an archive directory
   *
   * @param dirPath Path to check
   * @returns True if the path is valid for archiving
   */
  static isValidArchiveDirectory(dirPath: string): boolean {
    try {
      const resolvedPath = path.resolve(dirPath);

      // Check if it exists and is a directory
      if (fs.existsSync(resolvedPath)) {
        const stats = fs.statSync(resolvedPath);
        return stats.isDirectory();
      }

      // If it doesn't exist, check if we can create it
      const parentDir = path.dirname(resolvedPath);
      if (fs.existsSync(parentDir)) {
        const parentStats = fs.statSync(parentDir);
        return parentStats.isDirectory();
      }

      return false;
    } catch {
      return false;
    }
  }
}
