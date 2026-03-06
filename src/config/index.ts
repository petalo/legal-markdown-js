import { cosmiconfig } from 'cosmiconfig';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DEFAULT_CONFIG, LegalMdConfig, validateConfig } from './schema';
import { getRuntimeConfig, setRuntimeConfig } from './runtime';

type ConfigPrimitive = string | number | boolean | null | undefined;
type PartialDeep<T> = {
  [K in keyof T]?: T[K] extends ConfigPrimitive ? T[K] : PartialDeep<T[K]>;
};

const MODULE_NAME = 'legalmd';
// cosmiconfig search order: first match wins. package.json is checked first
// (zero-config projects), followed by dedicated rc files, then full config
// modules. The .ts variant is last to avoid requiring a ts-node environment
// in most cases.
export const SEARCH_PLACES = [
  'package.json',
  '.legalmdrc',
  '.legalmdrc.yaml',
  '.legalmdrc.json',
  'legalmd.config.js',
  'legalmd.config.ts',
];

let cachedConfig: LegalMdConfig | null = null;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T>(...objects: Array<Partial<T>>): T {
  const result: Record<string, unknown> = {};

  for (const obj of objects) {
    if (!obj || !isObject(obj)) continue;

    for (const [key, value] of Object.entries(obj)) {
      const existing = result[key];

      if (isObject(existing) && isObject(value)) {
        result[key] = deepMerge(existing, value);
      } else if (value !== undefined) {
        result[key] = value;
      }
    }
  }

  return result as T;
}

/**
 * Apply process.env overrides for developer convenience.
 * Supports: LOG_LEVEL, DEBUG, IMAGES_DIR, STYLES_DIR, DEFAULT_INPUT_DIR,
 * DEFAULT_OUTPUT_DIR, ARCHIVE_DIR, LEGAL_MD_VALIDATION_MODE, LEGAL_MD_PDF_CONNECTOR
 */
function applyEnvOverrides(config: Partial<LegalMdConfig>): Partial<LegalMdConfig> {
  if (typeof process === 'undefined' || !process.env) return config;
  const env = process.env;
  const overrides: PartialDeep<LegalMdConfig> = {};

  // Logging
  if (env.LOG_LEVEL && ['error', 'warn', 'info', 'debug'].includes(env.LOG_LEVEL)) {
    overrides.logging = {
      ...overrides.logging,
      level: env.LOG_LEVEL as LegalMdConfig['logging']['level'],
    };
  }
  if (env.DEBUG === 'true' || env.DEBUG === '1') {
    overrides.logging = { ...overrides.logging, debug: true };
  }

  // Paths
  if (env.IMAGES_DIR) overrides.paths = { ...overrides.paths, images: env.IMAGES_DIR };
  if (env.STYLES_DIR) overrides.paths = { ...overrides.paths, styles: env.STYLES_DIR };
  if (env.DEFAULT_INPUT_DIR) overrides.paths = { ...overrides.paths, input: env.DEFAULT_INPUT_DIR };
  if (env.DEFAULT_OUTPUT_DIR)
    overrides.paths = { ...overrides.paths, output: env.DEFAULT_OUTPUT_DIR };
  if (env.ARCHIVE_DIR) overrides.paths = { ...overrides.paths, archive: env.ARCHIVE_DIR };

  // Processing
  if (
    env.LEGAL_MD_VALIDATION_MODE &&
    ['strict', 'permissive', 'auto'].includes(env.LEGAL_MD_VALIDATION_MODE)
  ) {
    overrides.processing = {
      ...overrides.processing,
      validationMode: env.LEGAL_MD_VALIDATION_MODE as LegalMdConfig['processing']['validationMode'],
    };
  }

  // PDF
  if (
    env.LEGAL_MD_PDF_CONNECTOR &&
    ['auto', 'puppeteer', 'system-chrome', 'weasyprint'].includes(env.LEGAL_MD_PDF_CONNECTOR)
  ) {
    overrides.pdf = {
      ...overrides.pdf,
      connector: env.LEGAL_MD_PDF_CONNECTOR as LegalMdConfig['pdf']['connector'],
    };
  }

  // `overrides` is PartialDeep<LegalMdConfig> - a stricter subset of
  // Partial<LegalMdConfig>. The cast bridges the two nominal types so deepMerge
  // can accept it; the runtime shape is always valid.
  return Object.keys(overrides).length > 0
    ? deepMerge(config, overrides as unknown as Partial<LegalMdConfig>)
    : config;
}

/**
 * Load and cache Legal Markdown configuration.
 *
 * Reads default config, optional global config, and project config using cosmiconfig,
 * then validates and caches the merged result.
 *
 * @returns Promise resolving to validated runtime configuration.
 * @throws {Error} When discovered configuration fails schema validation.
 * @example
 * ```ts
 * import { loadConfig } from './config';
 *
 * const config = await loadConfig();
 * console.log(config.processing.validationMode);
 * ```
 */
export async function loadConfig(): Promise<LegalMdConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  if (typeof process === 'undefined' || !process.versions?.node) {
    return getRuntimeConfig();
  }

  const explorer = cosmiconfig(MODULE_NAME, {
    searchPlaces: SEARCH_PLACES,
  });

  const globalConfigPath = path.join(os.homedir(), '.config', 'legal-md', 'config.yaml');

  let globalConfig: PartialDeep<LegalMdConfig> = {};
  let projectConfig: PartialDeep<LegalMdConfig> = {};

  if (fs.existsSync(globalConfigPath)) {
    const globalResult = await explorer.load(globalConfigPath);
    globalConfig = (globalResult?.config ?? {}) as PartialDeep<LegalMdConfig>;
  }

  const projectResult = await explorer.search(process.cwd());
  projectConfig = (projectResult?.config ?? {}) as PartialDeep<LegalMdConfig>;

  // DEFAULT_CONFIG is ReadonlyDeep; globalConfig/projectConfig are PartialDeep.
  // Both are structurally compatible with Partial<LegalMdConfig> but TypeScript
  // requires the cast to satisfy deepMerge's generic constraint.
  const merged = deepMerge<LegalMdConfig>(
    DEFAULT_CONFIG as unknown as Partial<LegalMdConfig>,
    globalConfig as unknown as Partial<LegalMdConfig>,
    projectConfig as unknown as Partial<LegalMdConfig>
  );

  // Layer 4: process.env overrides (for devs: LOG_LEVEL=debug npm test)
  const withEnv = applyEnvOverrides(merged) as LegalMdConfig;

  cachedConfig = validateConfig(withEnv);
  setRuntimeConfig(cachedConfig);

  return cachedConfig;
}

/**
 * Return the current runtime config (cached if loaded).
 *
 * @returns The active Legal Markdown configuration object.
 * @example
 * ```ts
 * import { getConfig } from './config';
 *
 * const config = getConfig();
 * console.log(config.paths.output);
 * ```
 */
export function getConfig(): LegalMdConfig {
  return cachedConfig ?? getRuntimeConfig();
}

/**
 * Clear loaded configuration cache and reset runtime config to defaults.
 *
 * @example
 * ```ts
 * import { clearConfigCache, loadConfig } from './config';
 *
 * clearConfigCache();
 * await loadConfig();
 * ```
 */
export function clearConfigCache(): void {
  cachedConfig = null;
  setRuntimeConfig(DEFAULT_CONFIG);
}

export type { LegalMdConfig } from './schema';
export { DEFAULT_CONFIG, validateConfig } from './schema';
