/**
 * @fileoverview Unit tests for pdf-generator.ts internal/standalone functions
 *
 * Tests: detectLogoFromCSS, loadAndEncodeImage, downloadAndEncodeImage
 * These are standalone functions exported via _-prefixed aliases for testing.
 */

// --- Hoisted mocks (must be before any imports) ---

const mockFsPromises = vi.hoisted(() => ({
  readFile: vi.fn(),
  stat: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  unlink: vi.fn(),
}));

const mockFsSync = vi.hoisted(() => ({
  existsSync: vi.fn().mockReturnValue(false),
  readdirSync: vi.fn().mockReturnValue([]),
}));

vi.mock('fs/promises', () => ({
  ...mockFsPromises,
  default: mockFsPromises,
}));

vi.mock('fs', () => ({
  ...mockFsSync,
  default: mockFsSync,
}));

vi.mock('../../../../src/utils/logger', () => ({
  logger: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('../../../../src/utils/esm-utils.js', () => ({
  getCurrentDir: vi.fn().mockReturnValue('/mocked/dir'),
}));

vi.mock('../../../../src/extensions/generators/html-generator', () => ({
  htmlGenerator: { generateHtml: vi.fn() },
  HtmlGeneratorOptions: {},
}));

vi.mock('../../../../src/extensions/generators/pdf-templates', () => ({
  PdfTemplates: {
    generateHeaderTemplate: vi.fn().mockReturnValue('<div></div>'),
    generateFooterTemplate: vi.fn().mockReturnValue('<div></div>'),
  },
}));

vi.mock('puppeteer', () => ({ launch: vi.fn() }));

// --- Imports ---

import {
  _detectLogoFromCSS as detectLogoFromCSS,
  _loadAndEncodeImage as loadAndEncodeImage,
} from '../../../../src/extensions/generators/pdf-generator';

// --- Helper data ---

/** Valid 16-byte PNG header (magic + IHDR length/type placeholder) */
const VALID_PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
  ...Array(100).fill(0x00), // filler body
]);

const JPEG_BUFFER = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0,
  ...Array(100).fill(0x00),
]);

// --- Tests ---

describe('detectLogoFromCSS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns filename when CSS contains --logo-filename without quotes', async () => {
    mockFsPromises.readFile.mockResolvedValue(
      ':root { --logo-filename: logo.png; }'
    );

    const result = await detectLogoFromCSS('/some/style.css');

    expect(result).toBe('logo.png');
    expect(mockFsPromises.readFile).toHaveBeenCalledWith('/some/style.css', 'utf8');
  });

  it('returns filename with double quotes stripped', async () => {
    mockFsPromises.readFile.mockResolvedValue(
      ':root { --logo-filename: "company-logo.png"; }'
    );

    const result = await detectLogoFromCSS('/path/to/file.css');

    expect(result).toBe('company-logo.png');
  });

  it('returns filename with single quotes stripped', async () => {
    mockFsPromises.readFile.mockResolvedValue(
      ":root { --logo-filename: 'my-logo.png'; }"
    );

    const result = await detectLogoFromCSS('/path/to/file.css');

    expect(result).toBe('my-logo.png');
  });

  it('returns null when --logo-filename property is absent', async () => {
    mockFsPromises.readFile.mockResolvedValue(
      ':root { --color-primary: #333; --spacing: 10px; }'
    );

    const result = await detectLogoFromCSS('/path/to/file.css');

    expect(result).toBeNull();
  });

  it('returns null when file read fails', async () => {
    mockFsPromises.readFile.mockRejectedValue(new Error('ENOENT: no such file'));

    const result = await detectLogoFromCSS('/nonexistent/file.css');

    expect(result).toBeNull();
  });

  it('handles CSS with extra whitespace around the value', async () => {
    mockFsPromises.readFile.mockResolvedValue(
      ':root { --logo-filename:   spaced-logo.png  ; }'
    );

    const result = await detectLogoFromCSS('/path.css');

    expect(result).toBe('spaced-logo.png');
  });
});

describe('loadAndEncodeImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns base64 string for a valid PNG file', async () => {
    mockFsPromises.stat.mockResolvedValue({ size: 108 });
    mockFsPromises.readFile.mockResolvedValue(VALID_PNG_BUFFER);

    const result = await loadAndEncodeImage('/images/logo.png');

    expect(typeof result).toBe('string');
    expect(result).toBe(VALID_PNG_BUFFER.toString('base64'));
  });

  it('throws when file exceeds MAX_LOGO_SIZE (500KB)', async () => {
    const oversizeBytes = 600 * 1024;
    mockFsPromises.stat.mockResolvedValue({ size: oversizeBytes });

    await expect(loadAndEncodeImage('/images/huge.png')).rejects.toThrow(
      /Logo file too large/
    );
  });

  it('throws when file is not a valid PNG (JPEG magic bytes)', async () => {
    mockFsPromises.stat.mockResolvedValue({ size: JPEG_BUFFER.length });
    mockFsPromises.readFile.mockResolvedValue(JPEG_BUFFER);

    await expect(loadAndEncodeImage('/images/photo.jpg')).rejects.toThrow(
      /Invalid logo file format: must be PNG/
    );
  });

  it('throws when file is too short to contain PNG header', async () => {
    const tinyBuffer = Buffer.from([0x89, 0x50]);
    mockFsPromises.stat.mockResolvedValue({ size: tinyBuffer.length });
    mockFsPromises.readFile.mockResolvedValue(tinyBuffer);

    await expect(loadAndEncodeImage('/images/tiny.png')).rejects.toThrow(
      /Invalid logo file format: must be PNG/
    );
  });

  it('throws when stat fails (file not found)', async () => {
    mockFsPromises.stat.mockRejectedValue(new Error('ENOENT: no such file'));

    await expect(loadAndEncodeImage('/missing/logo.png')).rejects.toThrow(
      /ENOENT/
    );
  });

  it('throws when readFile fails after stat succeeds', async () => {
    mockFsPromises.stat.mockResolvedValue({ size: 100 });
    mockFsPromises.readFile.mockRejectedValue(new Error('EACCES: permission denied'));

    await expect(loadAndEncodeImage('/restricted/logo.png')).rejects.toThrow(
      /EACCES/
    );
  });

  it('accepts a file exactly at the size limit', async () => {
    const maxSize = 500 * 1024; // PDF_TEMPLATE_CONSTANTS.MAX_LOGO_SIZE
    mockFsPromises.stat.mockResolvedValue({ size: maxSize });
    mockFsPromises.readFile.mockResolvedValue(VALID_PNG_BUFFER);

    const result = await loadAndEncodeImage('/images/exact-limit.png');

    expect(typeof result).toBe('string');
  });

  it('rejects a file one byte over the size limit', async () => {
    const overLimit = 500 * 1024 + 1;
    mockFsPromises.stat.mockResolvedValue({ size: overLimit });

    await expect(loadAndEncodeImage('/images/just-over.png')).rejects.toThrow(
      /Logo file too large/
    );
  });
});
