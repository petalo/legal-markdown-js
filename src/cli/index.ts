#!/usr/bin/env node

/**
 * Command Line Interface for Legal Markdown Processing
 *
 * This module provides a comprehensive CLI tool for processing Legal Markdown
 * documents with support for various output formats, processing options, and
 * input/output methods (files, stdin/stdout).
 *
 * Features:
 * - File and stdin input processing
 * - Multiple output formats (Markdown, HTML, PDF)
 * - Comprehensive processing options and flags
 * - Field highlighting and styling options
 * - Metadata export capabilities
 * - Frontmatter merging from imported files
 * - Import tracing and debugging options
 * - Error handling and user feedback
 * - Debug mode support
 *
 * @example
 * ```bash
 * # Process a file
 * legal-md input.md output.md
 *
 * # Generate PDF with highlighting
 * legal-md input.md --pdf --highlight --title "Contract"
 *
 * # Process from stdin
 * cat input.md | legal-md --stdin --stdout
 *
 * # Export metadata
 * legal-md input.md --export-yaml --output-path metadata.yaml
 * ```
 *
 * @module
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { confirm, input as promptInput, select } from '@inquirer/prompts';
import * as yaml from 'js-yaml';
import type { LegalMarkdownOptions } from '../types';
import { CliService } from './service';
import { FileNotFoundError, PdfDependencyError } from '../errors/index';
import { RESOLVED_PATHS } from '../constants/index';
import { getPackageVersion } from './utils/version';
import {
  clearConfigCache,
  DEFAULT_CONFIG,
  getConfig,
  loadConfig,
  SEARCH_PLACES,
  validateConfig,
} from '../config';
import type { PdfConnectorPreference } from '../extensions/generators/pdf-connectors';

const version = getPackageVersion('../../package.json');

/**
 * Helper function to read content from standard input
 *
 * @returns {Promise<string>} A promise that resolves to the stdin content
 * @throws {Error} When stdin reading fails
 */
async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      resolve(data);
    });

    process.stdin.on('error', error => {
      reject(error);
    });
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T extends Record<string, unknown>>(...objects: Array<Partial<T>>): T {
  const result: Record<string, unknown> = {};

  for (const obj of objects) {
    if (!obj || !isRecord(obj)) continue;

    for (const [key, value] of Object.entries(obj)) {
      const existing = result[key];
      if (isRecord(existing) && isRecord(value)) {
        result[key] = deepMerge(existing, value);
      } else if (value !== undefined) {
        result[key] = value;
      }
    }
  }

  return result as T;
}

function parseConfigValue(rawValue: string): unknown {
  if (rawValue === 'true') return true;
  if (rawValue === 'false') return false;
  if (rawValue === 'null') return null;

  const asNumber = Number(rawValue);
  if (!Number.isNaN(asNumber) && rawValue.trim() !== '') {
    return asNumber;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return rawValue;
  }
}

function getByPath(source: Record<string, unknown>, keyPath: string): unknown {
  const segments = keyPath.split('.').filter(Boolean);
  let current: unknown = source;

  for (const segment of segments) {
    if (!isRecord(current) || !(segment in current)) {
      return undefined;
    }
    current = current[segment];
  }

  return current;
}

function setByPath(source: Record<string, unknown>, keyPath: string, value: unknown): void {
  const segments = keyPath.split('.').filter(Boolean);
  if (segments.length === 0) return;

  let current: Record<string, unknown> = source;

  for (const segment of segments.slice(0, -1)) {
    const next = current[segment];
    if (!isRecord(next)) {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
  }

  current[segments[segments.length - 1]] = value;
}

const PDF_CONNECTOR_CHOICES: PdfConnectorPreference[] = [
  'auto',
  'puppeteer',
  'system-chrome',
  'weasyprint',
];

function parsePdfConnectorPreference(value: unknown): PdfConnectorPreference | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  if (PDF_CONNECTOR_CHOICES.includes(value as PdfConnectorPreference)) {
    return value as PdfConnectorPreference;
  }

  throw new Error(
    `Invalid --pdf-connector value: ${value}. Expected one of: ${PDF_CONNECTOR_CHOICES.join(', ')}`
  );
}

function getProjectConfigPath(): string {
  return path.join(process.cwd(), '.legalmdrc.yaml');
}

function getGlobalConfigPath(): string {
  return path.join(os.homedir(), '.config', 'legal-md', 'config.yaml');
}

function readConfigFile(configPath: string): Record<string, unknown> {
  if (!fs.existsSync(configPath)) {
    return {};
  }

  const content = fs.readFileSync(configPath, 'utf8');
  if (!content.trim()) {
    return {};
  }

  if (configPath.endsWith('.json')) {
    return JSON.parse(content) as Record<string, unknown>;
  }

  const parsed = yaml.load(content);
  return (parsed ?? {}) as Record<string, unknown>;
}

function writeConfigFile(configPath: string, config: Record<string, unknown>): void {
  fs.mkdirSync(path.dirname(configPath), { recursive: true });

  if (configPath.endsWith('.json')) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    return;
  }

  fs.writeFileSync(configPath, yaml.dump(config, { lineWidth: 120 }), 'utf8');
}

// Create program
const program = new Command();

// Setup CLI information
program
  .name('legal-md')
  .description('Node.js implementation of LegalMarkdown for processing legal documents')
  .version(version);

program
  .command('init')
  .description('Create a legal-md configuration file')
  .option('-g, --global', 'Write to global config (~/.config/legal-md/config.yaml)')
  .action(async options => {
    await loadConfig();
    const current = getConfig();

    const scope = options.global
      ? 'global'
      : await select({
          message: 'Where should configuration be saved?',
          choices: [
            { name: 'Project (.legalmdrc.yaml)', value: 'project' },
            { name: 'Global (~/.config/legal-md/config.yaml)', value: 'global' },
          ],
        });

    const configPath = scope === 'global' ? getGlobalConfigPath() : getProjectConfigPath();

    const images = await promptInput({
      message: 'Images directory',
      default: current.paths.images,
    });
    const styles = await promptInput({
      message: 'Styles directory',
      default: current.paths.styles,
    });
    const inputDir = await promptInput({
      message: 'Default input directory',
      default: current.paths.input,
    });
    const outputDir = await promptInput({
      message: 'Default output directory',
      default: current.paths.output,
    });
    const archiveDir = await promptInput({
      message: 'Archive directory',
      default: current.paths.archive,
    });

    const logLevel = await select({
      message: 'Log level',
      default: current.logging.level,
      choices: [
        { name: 'error', value: 'error' },
        { name: 'warn', value: 'warn' },
        { name: 'info', value: 'info' },
        { name: 'debug', value: 'debug' },
      ],
    });

    const debug = await confirm({
      message: 'Enable debug logging?',
      default: current.logging.debug,
    });

    const validationMode = await select({
      message: 'Validation mode',
      default: current.processing.validationMode,
      choices: [
        { name: 'auto', value: 'auto' },
        { name: 'strict', value: 'strict' },
        { name: 'permissive', value: 'permissive' },
      ],
    });

    const config = validateConfig({
      ...current,
      paths: {
        ...current.paths,
        images,
        styles,
        input: inputDir,
        output: outputDir,
        archive: archiveDir,
      },
      logging: {
        ...current.logging,
        level: logLevel,
        debug,
      },
      processing: {
        ...current.processing,
        validationMode,
      },
    });

    // `writeConfigFile` and `getByPath` accept `Record<string, unknown>`.
    // `LegalMdConfig` is structurally compatible but nominally distinct, so the
    // cast is required to satisfy the utility function's generic signature.
    writeConfigFile(configPath, config as unknown as Record<string, unknown>);
    clearConfigCache();
    await loadConfig();
    console.log(chalk.green(`✅ Configuration written to ${configPath}`));
  });

program
  .command('config')
  .description('Show, get, or set legal-md configuration values')
  .argument('[action]', 'show | get | set', 'show')
  .argument('[key]', 'dot-path key (e.g. paths.input)')
  .argument('[value]', 'value for set action')
  .option('-g, --global', 'Read/write the global configuration file')
  .action(async (action, key, value, options) => {
    await loadConfig();

    if (action === 'show') {
      const globalPath = getGlobalConfigPath();
      const globalExists = fs.existsSync(globalPath);

      const projectFile = SEARCH_PLACES.filter(f => f !== 'package.json')
        .map(f => path.join(process.cwd(), f))
        .find(f => fs.existsSync(f));

      const globalLabel = globalExists
        ? chalk.green(globalPath.replace(os.homedir(), '~'))
        : chalk.dim(globalPath.replace(os.homedir(), '~'));
      const globalStatus = globalExists ? chalk.green('(active)') : chalk.dim('(not found)');

      const projectLabel = projectFile
        ? chalk.green(path.relative(process.cwd(), projectFile))
        : chalk.dim('.legalmdrc.yaml');
      const projectStatus = projectFile ? chalk.green('(active)') : chalk.dim('(not found)');

      console.log('');
      console.log(chalk.bold('Sources:'));
      console.log(`  Global:  ${globalLabel}  ${globalStatus}`);
      console.log(`  Project: ${projectLabel}  ${projectStatus}`);
      if (!globalExists && !projectFile) {
        console.log(chalk.dim('  Using defaults only.'));
      }
      console.log('');

      const flattenConfig = (obj: Record<string, unknown>, prefix = ''): [string, unknown][] =>
        Object.entries(obj).flatMap(([k, v]) => {
          const key = prefix ? `${prefix}.${k}` : k;
          return v !== null && typeof v === 'object' && !Array.isArray(v)
            ? flattenConfig(v as Record<string, unknown>, key)
            : [[key, v]];
        });

      const entries = flattenConfig(getConfig() as unknown as Record<string, unknown>);
      const defaults = flattenConfig(DEFAULT_CONFIG as unknown as Record<string, unknown>);
      const defaultMap = new Map(defaults.map(([k, v]) => [k, v]));

      const keyWidth = Math.max(...entries.map(([k]) => k.length)) + 2;
      const valWidth = Math.max(...entries.map(([, v]) => String(v).length)) + 2;

      console.log(chalk.bold('Settings:'));
      for (const [k, v] of entries) {
        const isDefault = String(v) === String(defaultMap.get(k));
        const annotation = isDefault ? chalk.dim('(default)') : chalk.green('(set)');
        console.log(
          `  ${chalk.cyan(k.padEnd(keyWidth))}${String(v).padEnd(valWidth)}${annotation}`
        );
      }
      console.log('');
      return;
    }

    if (action === 'get') {
      if (!key) {
        console.error(chalk.red('Error: key is required for config get'));
        process.exit(1);
      }

      const result = getByPath(getConfig() as unknown as Record<string, unknown>, key); // see cast rationale above
      if (result === undefined) {
        console.error(chalk.red(`Error: key not found: ${key}`));
        process.exit(1);
      }

      if (typeof result === 'object') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(String(result));
      }
      return;
    }

    if (action === 'set') {
      if (!key || value === undefined) {
        console.error(chalk.red('Error: key and value are required for config set'));
        process.exit(1);
      }

      const targetPath = options.global ? getGlobalConfigPath() : getProjectConfigPath();
      const fileConfig = readConfigFile(targetPath);

      setByPath(fileConfig, key, parseConfigValue(value));

      validateConfig(
        deepMerge(
          DEFAULT_CONFIG as unknown as Record<string, unknown>, // see cast rationale above
          fileConfig as unknown as Record<string, unknown>
        )
      );

      writeConfigFile(targetPath, fileConfig);
      clearConfigCache();
      await loadConfig();
      console.log(chalk.green(`✅ Updated ${key} in ${targetPath}`));
      return;
    }

    console.error(chalk.red(`Error: unsupported action '${action}'. Use show, get, or set.`));
    process.exit(1);
  });

// Main command
program
  .argument('[input]', 'Input file path')
  .argument('[output]', 'Output file path')
  .option('-d, --debug', 'Enable debug mode')
  .option('-y, --yaml', 'Process only YAML front matter')
  .option('--headers', 'Auto-populate YAML front matter with header patterns and properties')
  .option('--no-headers', 'Skip header processing')
  .option('--no-clauses', 'Skip optional clause processing')
  .option('--no-references', 'Skip cross-reference processing')
  .option('--no-imports', 'Skip import processing')
  .option('--no-mixins', 'Skip mixin processing')
  .option('--no-reset', 'Disable header numbering reset (continuous numbering)')
  .option('--no-indent', 'Disable header indentation (flat formatting)')
  .option('--throwOnYamlError', 'Throw error on invalid YAML')
  .option('--to-markdown', 'Convert output to markdown format')
  .option('--stdin', 'Read from standard input')
  .option('--stdout', 'Write to standard output')
  .option('--export-yaml', 'Export metadata as YAML')
  .option('--export-json', 'Export metadata as JSON')
  .option('-o, --output-path <path>', 'Path for metadata export')
  .option('--pdf', 'Generate PDF output')
  .option(
    '--pdf-connector <connector>',
    'PDF backend: auto | puppeteer | system-chrome | weasyprint'
  )
  .option('--html', 'Generate HTML output')
  .option('--docx', 'Generate DOCX output')
  .option('--highlight', 'Enable field highlighting in HTML/PDF/DOCX output')
  .option('--enable-field-tracking', 'Add field tracking spans to markdown output')
  .option('--ast-field-tracking', 'Use AST-first field tracking route (Phase 2 tokens -> Phase 3)')
  .option('--logic-branch-highlighting', 'Annotate winner branches for conditional blocks')
  .option(
    '--disable-frontmatter-merge',
    'Disable automatic frontmatter merging from imported files (enabled by default)'
  )
  .option('--import-tracing', 'Add HTML comments showing imported content boundaries')
  .option('--validate-import-types', 'Validate type compatibility during frontmatter merging')
  .option('--log-import-operations', 'Log detailed frontmatter merge operations')
  .option('--css <path>', 'Path to custom CSS file for HTML/PDF/DOCX')
  .option('--title <title>', 'Document title for HTML/PDF/DOCX')
  .option('--archive-source [dir]', 'Archive source file after successful processing to directory')
  .action(async (input, output, options) => {
    try {
      await loadConfig();

      if (options.docx && options.stdout) {
        console.error(chalk.red('Error: --docx cannot be used with --stdout.'));
        console.error(
          chalk.yellow('DOCX output is a binary format. Provide an output file path instead.')
        );
        process.exit(1);
      }

      // Handle stdin input
      if (options.stdin) {
        const stdinContent = await readStdin();
        const cliOptions: LegalMarkdownOptions & {
          verbose?: boolean;
          pdf?: boolean;
          pdfConnector?: PdfConnectorPreference;
          html?: boolean;
          docx?: boolean;
          highlight?: boolean;
          css?: string;
          title?: string;
          archiveSource?: string | boolean;
          stdout?: boolean;
        } = {
          debug: options.debug,
          yamlOnly: options.yaml,
          autoPopulateHeaders: options.headers === true,
          noHeaders: options.headers === false,
          noClauses: options.clauses === false,
          noReferences: options.references === false,
          noImports: options.imports === false,
          noMixins: options.mixins === false,
          noReset: options.reset === false,
          noIndent: options.indent === false,
          throwOnYamlError: options.throwOnYamlError,
          toMarkdown: options.toMarkdown,
          exportMetadata: options.exportYaml || options.exportJson,
          exportFormat: options.exportYaml ? 'yaml' : 'json',
          exportPath: options.outputPath,
          basePath: RESOLVED_PATHS.DEFAULT_INPUT_DIR,
          verbose: options.debug,
          pdf: options.pdf,
          pdfConnector: parsePdfConnectorPreference(options.pdfConnector),
          html: options.html,
          docx: options.docx,
          highlight: options.highlight,
          enableFieldTracking: options.enableFieldTracking,
          enableFieldTrackingInMarkdown: options.enableFieldTracking,
          astFieldTracking: options.astFieldTracking || options.enableFieldTracking,
          logicBranchHighlighting: options.logicBranchHighlighting || options.enableFieldTracking,
          disableFrontmatterMerge: options.disableFrontmatterMerge,
          importTracing: options.importTracing,
          validateImportTypes: options.validateImportTypes,
          logImportOperations: options.logImportOperations,
          css: options.css,
          title: options.title,
          archiveSource: options.archiveSource,
          stdout: options.stdout,
        };

        const cliService = new CliService(cliOptions);
        // When using stdin, first argument is the output file
        const outputFile = input;
        const isFormattedOutputRequested = Boolean(options.html || options.pdf || options.docx);
        const isBinaryOutputRequested = Boolean(options.pdf || options.docx);

        if (isBinaryOutputRequested && options.stdout) {
          console.error(chalk.red('Error: binary formats cannot be used with --stdout.'));
          console.error(
            chalk.yellow('Use an explicit output file path when using --stdin with PDF/DOCX.')
          );
          process.exit(1);
        }

        if (isFormattedOutputRequested && !options.stdout && !outputFile) {
          console.error(
            chalk.red('Error: Output file is required for formatted output when using --stdin.')
          );
          console.error(chalk.yellow('Provide an output path, or use --stdout with --html.'));
          process.exit(1);
        }

        if (isFormattedOutputRequested) {
          const tempInputPath = path.join(
            os.tmpdir(),
            `legal-md-stdin-${Date.now()}-${Math.random().toString(36).slice(2)}.md`
          );
          fs.writeFileSync(tempInputPath, stdinContent, 'utf8');

          try {
            if (options.stdout) {
              await cliService.processFile(tempInputPath);
            } else {
              await cliService.processFile(tempInputPath, outputFile);
            }
          } finally {
            fs.rmSync(tempInputPath, { force: true });
          }
          return;
        }

        const result = await cliService.processContent(stdinContent);

        if (options.stdout || !outputFile) {
          console.log(result);
        } else {
          fs.writeFileSync(outputFile, result);
          console.error(`✅ Output written to: ${outputFile}`);
        }
        return;
      }

      // Handle input file
      if (!input) {
        console.error(chalk.red('Error: Input file is required\n'));
        console.error(chalk.yellow('Usage examples:'));
        console.error(
          chalk.cyan('  legal-md document.md output.md           ') + '# Process file to file'
        );
        console.error(
          chalk.cyan('  legal-md document.md --stdout            ') + '# Process file to stdout'
        );
        console.error(chalk.cyan('  legal-md document.md --pdf --title "Doc" ') + '# Generate PDF');
        console.error(
          chalk.cyan('  legal-md document.md --html --highlight  ') +
            '# Generate HTML with highlighting'
        );
        console.error(
          chalk.cyan('  legal-md document.md --docx               ') + '# Generate DOCX'
        );
        console.error(
          chalk.cyan('  legal-md doc.md --disable-frontmatter-merge') +
            '# Disable imported frontmatter merging'
        );
        console.error(
          chalk.cyan('  cat document.md | legal-md --stdin       ') + '# Process from stdin'
        );
        console.error(
          chalk.cyan('  legal-md --help                          ') + '# Show all options\n'
        );
        process.exit(1);
      }

      const cliOptions: LegalMarkdownOptions & {
        verbose?: boolean;
        pdf?: boolean;
        pdfConnector?: PdfConnectorPreference;
        html?: boolean;
        docx?: boolean;
        highlight?: boolean;
        css?: string;
        title?: string;
        archiveSource?: string | boolean;
        stdout?: boolean;
      } = {
        debug: options.debug,
        yamlOnly: options.yaml,
        autoPopulateHeaders: options.headers === true,
        noHeaders: options.headers === false,
        noClauses: options.clauses === false,
        noReferences: options.references === false,
        noImports: options.imports === false,
        noMixins: options.mixins === false,
        noReset: options.reset === false,
        noIndent: options.indent === false,
        throwOnYamlError: options.throwOnYamlError,
        toMarkdown: options.toMarkdown,
        exportMetadata: options.exportYaml || options.exportJson,
        exportFormat: options.exportYaml ? 'yaml' : 'json',
        exportPath: options.outputPath,
        basePath: RESOLVED_PATHS.DEFAULT_INPUT_DIR,
        verbose: options.debug,
        pdf: options.pdf,
        pdfConnector: parsePdfConnectorPreference(options.pdfConnector),
        html: options.html,
        docx: options.docx,
        highlight: options.highlight,
        enableFieldTracking: options.enableFieldTracking,
        enableFieldTrackingInMarkdown: options.enableFieldTracking,
        astFieldTracking: options.astFieldTracking || options.enableFieldTracking,
        logicBranchHighlighting: options.logicBranchHighlighting || options.enableFieldTracking,
        disableFrontmatterMerge: options.disableFrontmatterMerge,
        importTracing: options.importTracing,
        validateImportTypes: options.validateImportTypes,
        logImportOperations: options.logImportOperations,
        css: options.css,
        title: options.title,
        archiveSource: options.archiveSource,
        stdout: options.stdout,
      };

      const cliService = new CliService(cliOptions);

      // Force stdout if --stdout flag is used
      if (options.stdout) {
        await cliService.processFile(input);
      } else {
        await cliService.processFile(input, output);
      }
    } catch (error) {
      if (error instanceof FileNotFoundError) {
        const resolvedPath = path.isAbsolute(input)
          ? input
          : path.resolve(RESOLVED_PATHS.DEFAULT_INPUT_DIR, input);
        const configuredInputDir =
          path.relative(process.cwd(), RESOLVED_PATHS.DEFAULT_INPUT_DIR) || '.';
        console.error(chalk.red(`\n❌ File not found: ${input}`));
        console.error(chalk.dim(`   Looked in:         ${resolvedPath}`));
        console.error(
          chalk.yellow(`   Tip: Use an absolute path, or run from the input directory.`)
        );
        console.error(
          chalk.dim(`   Configured input dir: ${configuredInputDir}/`) +
            chalk.gray(`  (change with: legal-md config set paths.input .)`)
        );
        console.error(
          chalk.dim(`   Check all defined paths with: `) + chalk.cyan(`legal-md config show`)
        );
        console.error('');
        process.exit(1);
      }

      if (error instanceof PdfDependencyError) {
        process.exit(1);
      }

      console.error(chalk.red('Error processing document:'));
      console.error(error);
      process.exit(1);
    }
  });

program.addHelpText(
  'after',
  '\nConfiguration: Run "legal-md config show" to inspect active settings and config file paths.'
);

// Parse command line arguments
program.parse();
