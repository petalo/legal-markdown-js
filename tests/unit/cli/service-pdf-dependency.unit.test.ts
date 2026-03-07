import { describe, expect, it, vi } from 'vitest';
import { PdfDependencyError } from '../../../src/errors';

vi.mock('../../../src/extensions/generators/pdf-connectors', async () => {
  const { PdfDependencyError: PDE } = await import('../../../src/errors');
  return { resolvePdfConnector: vi.fn().mockRejectedValue(new PDE()) };
});

// Dynamic import AFTER mock is set up to avoid circular init
const { CliService } = await import('../../../src/cli/service');

describe('CliService PDF dependency handling', () => {
  it('throws PdfDependencyError when PDF is requested without Puppeteer', async () => {
    const service = new CliService({ pdf: true });

    await expect(
      (service as any).generateFormattedOutputWithOptions('# Test', 'input.md', 'output.pdf', {
        pdf: true,
      })
    ).rejects.toBeInstanceOf(PdfDependencyError);
  });

  it('prints friendly install instructions for PdfDependencyError', () => {
    const service = new CliService({});
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    (service as any).handleError(new PdfDependencyError());

    const output = consoleSpy.mock.calls.flat().join('\n');
    expect(output).toContain('npm install puppeteer');
    expect(output).toContain('--pdf-connector=system-chrome');
    expect(output).toContain('--pdf-connector=weasyprint');

    consoleSpy.mockRestore();
  });
});
