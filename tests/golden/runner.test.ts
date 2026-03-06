import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { processLegalMarkdown } from '../../src/index';
import type { LegalMarkdownOptions } from '../../src/types';

type FixtureConfig = {
  options?: LegalMarkdownOptions;
  metadata?: Record<string, unknown>;
  expectedError?: {
    pattern: string;
  };
  skip?: boolean | { reason?: string };
  async?: boolean;
};

type FixtureCase = {
  id: string;
  fixtureDir: string;
  inputPath: string;
  expectedPath: string;
  expectedMetadataPath: string;
  configPath: string;
  config: FixtureConfig;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesRoot = path.join(__dirname, 'fixtures');
const updateGolden = process.env.UPDATE_GOLDEN === '1';
const GOLDEN_FIXED_DATE = new Date('2026-03-04T12:00:00.000Z');

const LEGAL_PROCESSOR_OPTION_KEYS = new Set([
  'basePath',
  'enableFieldTracking',
  'astFieldTracking',
  'logicBranchHighlighting',
  'debug',
  'validatePluginOrder',
  'additionalMetadata',
  'fieldPatterns',
  'disableCrossReferences',
  'disableFieldTracking',
  'exportMetadata',
  'exportFormat',
  'exportPath',
  'yamlOnly',
  'noHeaders',
  'noClauses',
  'noReferences',
  'noImports',
  'noMixins',
  'noReset',
  'noIndent',
  'throwOnYamlError',
  'importTracing',
  'validateImportTypes',
  'logImportOperations',
  'disableFrontmatterMerge',
]);

function normalizeWhitespace(input: string): string {
  return input
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n+$/g, '');
}

function normalizeForYaml(input: unknown): unknown {
  if (input instanceof Map) {
    return Object.fromEntries(
      Array.from(input.entries()).map(([key, nested]) => [key, normalizeForYaml(nested)])
    );
  }

  if (Array.isArray(input)) {
    return input.map(item => normalizeForYaml(item));
  }

  if (input && typeof input === 'object') {
    return Object.fromEntries(
      Object.entries(input as Record<string, unknown>).map(([key, nested]) => [
        key,
        normalizeForYaml(nested),
      ])
    );
  }

  return input;
}

function toYaml(value: unknown): string {
  return yaml.dump(normalizeForYaml(value ?? {}), {
    sortKeys: true,
    lineWidth: -1,
    noRefs: true,
  });
}

function loadFixtureConfig(configPath: string): FixtureConfig {
  if (!fs.existsSync(configPath)) {
    return { async: true };
  }

  const raw = fs.readFileSync(configPath, 'utf8');
  const parsed = yaml.load(raw);

  if (!parsed || typeof parsed !== 'object') {
    return { async: true };
  }

  return {
    async: true,
    ...(parsed as FixtureConfig),
  };
}

function parseLeadingFrontmatter(input: string): {
  metadata: Record<string, unknown>;
  body: string;
} {
  const frontmatterMatch = input.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!frontmatterMatch) {
    return { metadata: {}, body: input };
  }

  const frontmatterRaw = frontmatterMatch[1];
  const loaded = yaml.load(frontmatterRaw);
  const parsed = loaded && typeof loaded === 'object' ? (loaded as Record<string, unknown>) : {};
  const body = input.slice(frontmatterMatch[0].length);

  return { metadata: parsed, body };
}

function applyMetadataOverride(input: string, override?: Record<string, unknown>): string {
  if (!override || Object.keys(override).length === 0) {
    return input;
  }

  const { metadata: existingMetadata, body } = parseLeadingFrontmatter(input);
  const merged = { ...existingMetadata, ...override };
  const serialized = toYaml(merged).replace(/\n+$/g, '');

  return `---\n${serialized}\n---\n${body}`;
}

function fixtureSkipReason(skipValue: FixtureConfig['skip']): string | null {
  if (!skipValue) return null;
  if (skipValue === true) return 'skipped by fixture config';
  return skipValue.reason || 'skipped by fixture config';
}

function discoverFixtures(): FixtureCase[] {
  if (!fs.existsSync(fixturesRoot)) {
    return [];
  }

  const entries = fs.readdirSync(fixturesRoot, { withFileTypes: true });

  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const fixtureDir = path.join(fixturesRoot, entry.name);
      const inputPath = path.join(fixtureDir, 'input.md');
      const expectedPath = path.join(fixtureDir, 'expected.md');
      const expectedMetadataPath = path.join(fixtureDir, 'expected-metadata.yaml');
      const configPath = path.join(fixtureDir, 'config.yaml');

      if (!fs.existsSync(inputPath)) {
        throw new Error(`Fixture '${entry.name}' is missing required input.md`);
      }

      if (!fs.existsSync(expectedPath) && !updateGolden) {
        throw new Error(
          `Fixture '${entry.name}' is missing required expected.md (run with UPDATE_GOLDEN=1 to generate)`
        );
      }

      return {
        id: entry.name,
        fixtureDir,
        inputPath,
        expectedPath,
        expectedMetadataPath,
        configPath,
        config: loadFixtureConfig(configPath),
      } satisfies FixtureCase;
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

const fixtures = discoverFixtures();

beforeAll(() => {
  // Keep golden fixtures deterministic across calendar days.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(GOLDEN_FIXED_DATE);
});

afterAll(() => {
  vi.useRealTimers();
});

describe('golden fixture harness', () => {
  it('discovers fixture directories', () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  it('fixture options use only LegalMarkdownProcessorOptions keys', () => {
    const mismatches: Array<{ fixture: string; key: string }> = [];

    for (const fixture of fixtures) {
      const options = fixture.config.options ?? {};
      for (const key of Object.keys(options)) {
        if (!LEGAL_PROCESSOR_OPTION_KEYS.has(key)) {
          mismatches.push({ fixture: fixture.id, key });
        }
      }
    }

    expect(mismatches).toEqual([]);
  });

  describe.each(fixtures)('$id', fixture => {
    const skipReason = fixtureSkipReason(fixture.config.skip);
    const testCase = skipReason ? it.skip : it;

    testCase(`matches expected output${skipReason ? ` (${skipReason})` : ''}`, async () => {
      const rawInput = await fsp.readFile(fixture.inputPath, 'utf8');
      const input = applyMetadataOverride(rawInput, fixture.config.metadata);

      if (fixture.config.expectedError?.pattern) {
        const pattern = new RegExp(fixture.config.expectedError.pattern);
        await expect(
          processLegalMarkdown(input, {
            ...(fixture.config.options ?? {}),
            basePath: fixture.fixtureDir,
          })
        ).rejects.toThrow(pattern);
        return;
      }

      const result = await processLegalMarkdown(input, {
        ...(fixture.config.options ?? {}),
        basePath: fixture.fixtureDir,
      });

      const normalizedOutput = normalizeWhitespace(String(result.content));

      if (updateGolden) {
        await fsp.writeFile(fixture.expectedPath, `${normalizedOutput}\n`, 'utf8');

        const metadata = result.metadata ?? {};
        const metadataShouldExist =
          fs.existsSync(fixture.expectedMetadataPath) || Object.keys(metadata).length > 0;

        if (metadataShouldExist) {
          await fsp.writeFile(
            fixture.expectedMetadataPath,
            `${normalizeWhitespace(toYaml(metadata))}\n`,
            'utf8'
          );
        }
      }

      const expectedOutput = normalizeWhitespace(await fsp.readFile(fixture.expectedPath, 'utf8'));
      expect(normalizedOutput).toBe(expectedOutput);

      if (fs.existsSync(fixture.expectedMetadataPath)) {
        const expectedMetadataRaw = await fsp.readFile(fixture.expectedMetadataPath, 'utf8');
        const expectedMetadata = normalizeForYaml(yaml.load(expectedMetadataRaw) ?? {});
        const actualMetadata = normalizeForYaml(result.metadata ?? {});
        expect(actualMetadata).toEqual(expectedMetadata);
      }
    });
  });
});
