import * as path from 'path';
import { describe, expect, it, beforeEach } from 'vitest';
import { PATHS, RESOLVED_PATHS } from '../../../src/constants/paths';
import { DEFAULT_CONFIG } from '../../../src/config/schema';
import { setRuntimeConfig } from '../../../src/config/runtime';

describe('Path Constants', () => {
  beforeEach(() => {
    setRuntimeConfig(DEFAULT_CONFIG);
  });

  it('uses configured path values', () => {
    setRuntimeConfig({
      ...DEFAULT_CONFIG,
      paths: {
        ...DEFAULT_CONFIG.paths,
        images: 'custom/images',
        styles: 'custom/styles',
        input: 'custom/input',
        output: 'custom/output',
        archive: 'custom/archive',
      },
    });

    expect(PATHS.IMAGES_DIR).toBe('custom/images');
    expect(PATHS.STYLES_DIR).toBe('custom/styles');
    expect(PATHS.DEFAULT_INPUT_DIR).toBe('custom/input');
    expect(PATHS.DEFAULT_OUTPUT_DIR).toBe('custom/output');
    expect(PATHS.ARCHIVE_DIR).toBe('custom/archive');
  });

  it('uses defaults when runtime config is default', () => {
    expect(PATHS.IMAGES_DIR).toBe('.');
    expect(PATHS.STYLES_DIR).toBe('.');
    expect(PATHS.DEFAULT_INPUT_DIR).toBe('.');
    expect(PATHS.DEFAULT_OUTPUT_DIR).toBe('.');
    expect(PATHS.ARCHIVE_DIR).toBe('.');
  });

  it('resolves absolute paths from configured relative values', () => {
    setRuntimeConfig({
      ...DEFAULT_CONFIG,
      paths: {
        ...DEFAULT_CONFIG.paths,
        images: 'assets/img',
        styles: './styles',
        input: '../input',
        output: 'out',
        archive: 'processed/final',
      },
    });

    expect(RESOLVED_PATHS.IMAGES_DIR).toBe(path.resolve(process.cwd(), 'assets/img'));
    expect(RESOLVED_PATHS.STYLES_DIR).toBe(path.resolve(process.cwd(), './styles'));
    expect(RESOLVED_PATHS.DEFAULT_INPUT_DIR).toBe(path.resolve(process.cwd(), '../input'));
    expect(RESOLVED_PATHS.DEFAULT_OUTPUT_DIR).toBe(path.resolve(process.cwd(), 'out'));
    expect(RESOLVED_PATHS.ARCHIVE_DIR).toBe(path.resolve(process.cwd(), 'processed/final'));
  });
});
