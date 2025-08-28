/**
 * Version utility for CLI applications
 *
 * Provides dynamic version reading from package.json with ESM/CJS compatibility
 * and graceful fallbacks for different runtime environments.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Get the current package version dynamically from package.json
 *
 * This function provides multiple fallback strategies:
 * 1. Try to read from the module's relative path (works when built)
 * 2. Fall back to process.cwd() (works during development)
 * 3. Final fallback to hardcoded version if all else fails
 *
 * @param basePath - Base path to resolve package.json from (CLI-specific)
 * @returns The current package version string
 *
 * @example
 * ```typescript
 * // For main CLI (src/cli/index.ts)
 * const version = getPackageVersion('../../package.json');
 *
 * // For interactive CLI (src/cli/interactive/index.ts)
 * const version = getPackageVersion('../../../package.json');
 * ```
 */
export function getPackageVersion(basePath: string): string {
  try {
    // Try to resolve package.json from the current module's location
    const packageJsonPath = join(__dirname || process.cwd(), basePath);
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
  } catch {
    // Fallback: try from process.cwd()
    try {
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      return packageJson.version;
    } catch {
      return '0.1.0'; // Fallback version
    }
  }
}
