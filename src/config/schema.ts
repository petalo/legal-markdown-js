/**
 * Canonical configuration schema for Legal Markdown runtime behavior.
 *
 * @example
 * ```ts
 * const cfg: LegalMdConfig = {
 *   ...DEFAULT_CONFIG,
 *   logging: { ...DEFAULT_CONFIG.logging, level: 'info' },
 * };
 * ```
 */
export interface LegalMdConfig {
  paths: {
    images: string;
    styles: string;
    input: string;
    output: string;
    archive: string;
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    debug: boolean;
  };
  processing: {
    highlight: boolean;
    enableFieldTracking: boolean;
    astFieldTracking: boolean;
    logicBranchHighlighting: boolean;
    validationMode: 'strict' | 'permissive' | 'auto';
    locale: string;
  };
  pdf: {
    connector: 'auto' | 'puppeteer' | 'system-chrome' | 'weasyprint';
    format: 'A4' | 'Letter';
    margin: {
      top: string;
      bottom: string;
      left: string;
      right: string;
    };
  };
}

/**
 * Default Legal Markdown configuration values.
 *
 * @example
 * ```ts
 * import { DEFAULT_CONFIG } from './schema';
 *
 * console.log(DEFAULT_CONFIG.pdf.connector); // "auto"
 * ```
 */
export const DEFAULT_CONFIG: LegalMdConfig = {
  paths: {
    images: '.',
    styles: '.',
    input: '.',
    output: '.',
    archive: '.',
  },
  logging: {
    level: 'error',
    debug: false,
  },
  processing: {
    highlight: false,
    enableFieldTracking: false,
    astFieldTracking: false,
    logicBranchHighlighting: false,
    validationMode: 'auto',
    locale: Intl.DateTimeFormat().resolvedOptions().locale,
  },
  pdf: {
    connector: 'auto',
    format: 'A4',
    margin: {
      top: '1in',
      bottom: '1in',
      left: '1in',
      right: '1in',
    },
  },
};

const LOG_LEVELS = new Set<LegalMdConfig['logging']['level']>(['error', 'warn', 'info', 'debug']);
const VALIDATION_MODES = new Set<LegalMdConfig['processing']['validationMode']>([
  'strict',
  'permissive',
  'auto',
]);
const PDF_CONNECTORS = new Set<LegalMdConfig['pdf']['connector']>([
  'auto',
  'puppeteer',
  'system-chrome',
  'weasyprint',
]);
const PDF_FORMATS = new Set<LegalMdConfig['pdf']['format']>(['A4', 'Letter']);

function asNonEmptyString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asEnum<T extends string>(
  value: unknown,
  allowed: Set<T>,
  fallback: T,
  fieldName: string,
  errors: string[]
): T {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !allowed.has(value as T)) {
    errors.push(`${fieldName} must be one of: ${Array.from(allowed).join(', ')}`);
    return fallback;
  }

  return value as T;
}

export function validateConfig(config: unknown): LegalMdConfig {
  const errors: string[] = [];
  const candidate = (config ?? {}) as Partial<LegalMdConfig>;

  const validated: LegalMdConfig = {
    paths: {
      images: asNonEmptyString(candidate.paths?.images, DEFAULT_CONFIG.paths.images),
      styles: asNonEmptyString(candidate.paths?.styles, DEFAULT_CONFIG.paths.styles),
      input: asNonEmptyString(candidate.paths?.input, DEFAULT_CONFIG.paths.input),
      output: asNonEmptyString(candidate.paths?.output, DEFAULT_CONFIG.paths.output),
      archive: asNonEmptyString(candidate.paths?.archive, DEFAULT_CONFIG.paths.archive),
    },
    logging: {
      level: asEnum(
        candidate.logging?.level,
        LOG_LEVELS,
        DEFAULT_CONFIG.logging.level,
        'logging.level',
        errors
      ),
      debug: asBoolean(candidate.logging?.debug, DEFAULT_CONFIG.logging.debug),
    },
    processing: {
      highlight: asBoolean(candidate.processing?.highlight, DEFAULT_CONFIG.processing.highlight),
      enableFieldTracking: asBoolean(
        candidate.processing?.enableFieldTracking,
        DEFAULT_CONFIG.processing.enableFieldTracking
      ),
      astFieldTracking: asBoolean(
        candidate.processing?.astFieldTracking,
        DEFAULT_CONFIG.processing.astFieldTracking
      ),
      logicBranchHighlighting: asBoolean(
        candidate.processing?.logicBranchHighlighting,
        DEFAULT_CONFIG.processing.logicBranchHighlighting
      ),
      validationMode: asEnum(
        candidate.processing?.validationMode,
        VALIDATION_MODES,
        DEFAULT_CONFIG.processing.validationMode,
        'processing.validationMode',
        errors
      ),
      locale: asNonEmptyString(candidate.processing?.locale, DEFAULT_CONFIG.processing.locale),
    },
    pdf: {
      connector: asEnum(
        candidate.pdf?.connector,
        PDF_CONNECTORS,
        DEFAULT_CONFIG.pdf.connector,
        'pdf.connector',
        errors
      ),
      format: asEnum(
        candidate.pdf?.format,
        PDF_FORMATS,
        DEFAULT_CONFIG.pdf.format,
        'pdf.format',
        errors
      ),
      margin: {
        top: asNonEmptyString(candidate.pdf?.margin?.top, DEFAULT_CONFIG.pdf.margin.top),
        bottom: asNonEmptyString(candidate.pdf?.margin?.bottom, DEFAULT_CONFIG.pdf.margin.bottom),
        left: asNonEmptyString(candidate.pdf?.margin?.left, DEFAULT_CONFIG.pdf.margin.left),
        right: asNonEmptyString(candidate.pdf?.margin?.right, DEFAULT_CONFIG.pdf.margin.right),
      },
    },
  };

  if (errors.length > 0) {
    throw new Error(
      `Invalid legal-md configuration:\n${errors.map(error => `- ${error}`).join('\n')}`
    );
  }

  return validated;
}

// Exported for testing - not part of public API
export { asEnum as _asEnum };
