/**
 * @fileoverview Smoke test: processing pipeline must not write to stdout.
 *
 * All diagnostic output (debug, info, warn, error) must go to stderr.
 * stdout is reserved for intentional program output.
 */
import { vi, describe, it, expect, afterEach } from 'vitest';
import { processLegalMarkdown } from '../../src/extensions/remark/legal-markdown-processor';

describe('stdout cleanliness', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not write to stdout during processing with debug:false', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await processLegalMarkdown('# Hello\n\n{{name}} was here.', {
      additionalMetadata: { name: 'World' },
      debug: false,
    });

    expect(consoleSpy).not.toHaveBeenCalled();
    expect(stdoutSpy).not.toHaveBeenCalled();
  });

  it('does not write to stdout during processing with debug:true', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await processLegalMarkdown('# Hello\n\n{{name}} was here.', {
      additionalMetadata: { name: 'World' },
      debug: true,
    });

    expect(consoleSpy).not.toHaveBeenCalled();
    expect(stdoutSpy).not.toHaveBeenCalled();
  });
});
