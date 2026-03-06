/**
 * Unit tests for internal functions in legal-markdown-processor.ts
 *
 * Tests escapeTemplateUnderscores (pure logic) and
 * createLegalMarkdownProcessor (configuration/wiring with mocked deps).
 *
 * @module
 */

// ---------------------------------------------------------------------------
// Mocks - vi.mock calls are hoisted by Vitest
// ---------------------------------------------------------------------------

const mockUse = vi.fn().mockReturnThis();
const mockProcessor = { use: mockUse };

vi.mock('unified', () => ({
  unified: vi.fn(() => mockProcessor),
}));

vi.mock('remark-parse', () => ({ default: vi.fn() }));
vi.mock('remark-stringify', () => ({ default: vi.fn() }));

vi.mock('../../../../src/plugins/remark/index', () => ({
  remarkImports: vi.fn(),
  remarkLegalHeadersParser: vi.fn(),
  remarkMixins: vi.fn(),
  remarkDates: vi.fn(),
  remarkSignatureLines: vi.fn(),
  remarkTemplateFields: vi.fn(),
  remarkCrossReferences: vi.fn(),
  remarkHeaders: vi.fn(),
}));

vi.mock('../../../../src/plugins/remark/plugin-order-validator', () => ({
  PluginOrderValidator: vi.fn().mockImplementation(() => ({
    validate: vi.fn(() => ({ valid: true, errors: [] })),
  })),
}));

vi.mock('../../../../src/plugins/remark/plugin-metadata-registry', () => ({
  GLOBAL_PLUGIN_REGISTRY: {},
}));

vi.mock('../../../../src/extensions/tracking/field-tracker', () => ({
  fieldTracker: { clear: vi.fn(), getFields: vi.fn(), getTotalOccurrences: vi.fn(() => 0) },
}));

vi.mock('../../../../src/core/parsers/yaml-parser', () => ({
  parseYamlFrontMatter: vi.fn(),
}));

vi.mock('../../../../src/core/exporters/metadata-exporter', () => ({
  exportMetadata: vi.fn(),
}));

vi.mock('../../../../src/core/pipeline/string-transformations', () => ({
  applyStringTransformations: vi.fn(),
}));

vi.mock('../../../../src/core/parsers/force-commands-parser', () => ({
  parseForceCommands: vi.fn(),
  applyForceCommands: vi.fn(),
}));

// We do NOT mock template-loops so escapeTemplateUnderscores uses the real detectSyntaxType

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  _escapeTemplateUnderscores as escapeTemplateUnderscores,
  _createLegalMarkdownProcessor as createLegalMarkdownProcessor,
} from '@extensions/remark/legal-markdown-processor';

import {
  remarkImports,
  remarkLegalHeadersParser,
  remarkMixins,
  remarkDates,
  remarkSignatureLines,
  remarkTemplateFields,
  remarkCrossReferences,
  remarkHeaders,
} from '../../../../src/plugins/remark/index';

import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';

// ---------------------------------------------------------------------------
// escapeTemplateUnderscores
// ---------------------------------------------------------------------------

describe('escapeTemplateUnderscores', () => {
  // Note: detectSyntaxType returns 'legacy' only when content contains
  // function-style helpers like {{fn()}}, math expressions, or string
  // concatenation. Simple {{field}} patterns default to 'handlebars'.

  it('escapes underscores in legacy-syntax template fields', () => {
    // Include a function-style helper to trigger legacy detection
    const input = '{{legal_name}} and {{calc(1)}}';
    expect(escapeTemplateUnderscores(input)).toBe('{{legal\\_name}} and {{calc(1)}}');
  });

  it('escapes multiple underscores in a single field', () => {
    const input = '{{a_b_c}} with {{fn(x)}}';
    expect(escapeTemplateUnderscores(input)).toBe('{{a\\_b\\_c}} with {{fn(x)}}');
  });

  it('escapes underscores in multiple template fields', () => {
    const input = 'Hello {{first_name}}, id={{user_id}}, {{fn(1)}}';
    expect(escapeTemplateUnderscores(input)).toBe(
      'Hello {{first\\_name}}, id={{user\\_id}}, {{fn(1)}}'
    );
  });

  it('returns handlebars syntax unchanged', () => {
    // handlebars: helper with argument -> detected as handlebars
    const input = '{{titleCase section_name}}';
    expect(escapeTemplateUnderscores(input)).toBe(input);
  });

  it('returns simple fields unchanged when no legacy markers present', () => {
    // No legacy syntax markers -> defaults to handlebars -> no escaping
    const input = '{{legal_name}}';
    expect(escapeTemplateUnderscores(input)).toBe(input);
  });

  it('returns mixed syntax unchanged', () => {
    // mixed: has both legacy function helpers and handlebars block helpers
    const input = '{{fn(x)}} and {{#each items}}{{name}}{{/each}}';
    expect(escapeTemplateUnderscores(input)).toBe(input);
  });

  it('does not escape loop markers (#, /, else) in legacy mode', () => {
    // fn() triggers legacy detection; #my_loop and /my_loop are skipped
    const input = '{{#my_loop}} content {{/my_loop}} {{fn(x)}}';
    expect(escapeTemplateUnderscores(input)).toBe(
      '{{#my_loop}} content {{/my_loop}} {{fn(x)}}'
    );
  });

  it('does not escape {{else}} in legacy mode', () => {
    const input = '{{#clause}} yes {{else}} no {{/clause}} {{fn(x)}}';
    expect(escapeTemplateUnderscores(input)).toBe(
      '{{#clause}} yes {{else}} no {{/clause}} {{fn(x)}}'
    );
  });

  it('passes through content with no templates unchanged', () => {
    const input = 'No templates here, just plain text.';
    expect(escapeTemplateUnderscores(input)).toBe(input);
  });

  it('passes through templates without underscores in legacy mode', () => {
    const input = '{{name}} {{fn(x)}}';
    expect(escapeTemplateUnderscores(input)).toBe('{{name}} {{fn(x)}}');
  });
});

// ---------------------------------------------------------------------------
// createLegalMarkdownProcessor
// ---------------------------------------------------------------------------

describe('createLegalMarkdownProcessor', () => {
  beforeEach(() => {
    mockUse.mockClear();
  });

  function getTemplateFieldsOptions() {
    const templateFieldsCall = mockUse.mock.calls.find(
      call => call[0] === remarkTemplateFields
    );
    return templateFieldsCall?.[1];
  }

  it('adds all plugins with default options', () => {
    createLegalMarkdownProcessor({}, {});

    // remarkParse is the first .use() call
    expect(mockUse).toHaveBeenCalledWith(remarkParse);

    // All plugins present
    expect(mockUse).toHaveBeenCalledWith(remarkImports, expect.any(Object));
    expect(mockUse).toHaveBeenCalledWith(remarkLegalHeadersParser, expect.any(Object));
    expect(mockUse).toHaveBeenCalledWith(remarkMixins, expect.any(Object));
    expect(mockUse).toHaveBeenCalledWith(remarkDates, expect.any(Object));
    expect(mockUse).toHaveBeenCalledWith(remarkSignatureLines, expect.any(Object));
    expect(mockUse).toHaveBeenCalledWith(remarkTemplateFields, expect.any(Object));
    expect(mockUse).toHaveBeenCalledWith(remarkCrossReferences, expect.any(Object));
    expect(mockUse).toHaveBeenCalledWith(remarkHeaders, expect.any(Object));
    expect(mockUse).toHaveBeenCalledWith(remarkStringify, expect.any(Object));
  });

  it('skips imports plugin when noImports is true', () => {
    createLegalMarkdownProcessor({}, { noImports: true });

    expect(mockUse).not.toHaveBeenCalledWith(remarkImports, expect.any(Object));
    // Other plugins still present
    expect(mockUse).toHaveBeenCalledWith(remarkTemplateFields, expect.any(Object));
  });

  it('skips legal-headers-parser and headers plugins when noHeaders is true', () => {
    createLegalMarkdownProcessor({}, { noHeaders: true });

    expect(mockUse).not.toHaveBeenCalledWith(remarkLegalHeadersParser, expect.any(Object));
    expect(mockUse).not.toHaveBeenCalledWith(remarkHeaders, expect.any(Object));
    // Other plugins still present
    expect(mockUse).toHaveBeenCalledWith(remarkTemplateFields, expect.any(Object));
  });

  it('skips mixins plugin when noMixins is true', () => {
    createLegalMarkdownProcessor({}, { noMixins: true });

    expect(mockUse).not.toHaveBeenCalledWith(remarkMixins, expect.any(Object));
    expect(mockUse).toHaveBeenCalledWith(remarkTemplateFields, expect.any(Object));
  });

  it('skips cross-references plugin when noReferences is true', () => {
    createLegalMarkdownProcessor({}, { noReferences: true });

    expect(mockUse).not.toHaveBeenCalledWith(remarkCrossReferences, expect.any(Object));
    expect(mockUse).toHaveBeenCalledWith(remarkTemplateFields, expect.any(Object));
  });

  it('skips cross-references plugin when disableCrossReferences is true', () => {
    createLegalMarkdownProcessor({}, { disableCrossReferences: true });

    expect(mockUse).not.toHaveBeenCalledWith(remarkCrossReferences, expect.any(Object));
  });

  it('passes metadata to plugins that need it', () => {
    const metadata = { title: 'Test' };
    createLegalMarkdownProcessor(metadata, {});

    expect(mockUse).toHaveBeenCalledWith(
      remarkMixins,
      expect.objectContaining({ metadata })
    );
    expect(mockUse).toHaveBeenCalledWith(
      remarkTemplateFields,
      expect.objectContaining({ metadata })
    );
    expect(mockUse).toHaveBeenCalledWith(
      remarkHeaders,
      expect.objectContaining({ metadata })
    );
  });

  it('passes basePath to imports and mixins plugins', () => {
    createLegalMarkdownProcessor({}, { basePath: '/docs' });

    expect(mockUse).toHaveBeenCalledWith(
      remarkImports,
      expect.objectContaining({ basePath: '/docs' })
    );
    expect(mockUse).toHaveBeenCalledWith(
      remarkMixins,
      expect.objectContaining({ basePath: '/docs' })
    );
  });

  it('returns the processor object', () => {
    const result = createLegalMarkdownProcessor({}, {});
    expect(result).toBe(mockProcessor);
  });

  it('enables AST + logic tracking when field tracking is enabled', () => {
    createLegalMarkdownProcessor({}, { enableFieldTracking: true });

    expect(getTemplateFieldsOptions()).toEqual(
      expect.objectContaining({
        enableFieldTracking: true,
        astFieldTracking: true,
        logicBranchHighlighting: true,
      })
    );
  });

  it('enables AST tracking implicitly when only logic highlighting is enabled', () => {
    createLegalMarkdownProcessor({}, { logicBranchHighlighting: true });

    expect(getTemplateFieldsOptions()).toEqual(
      expect.objectContaining({
        astFieldTracking: true,
        logicBranchHighlighting: true,
      })
    );
  });

  it('respects explicit AST + logic combinations when both are provided', () => {
    createLegalMarkdownProcessor({}, {
      enableFieldTracking: true,
      astFieldTracking: true,
      logicBranchHighlighting: false,
    });

    expect(getTemplateFieldsOptions()).toEqual(
      expect.objectContaining({
        enableFieldTracking: true,
        astFieldTracking: true,
        logicBranchHighlighting: false,
      })
    );
  });
});
