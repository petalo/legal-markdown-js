import { afterEach, describe, expect, it, vi } from 'vitest';

describe('PDF availability utilities', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('isPdfAvailable returns true when puppeteer can be imported', async () => {
    vi.doMock('puppeteer', () => ({ launch: vi.fn() }), { virtual: true });

    const { isPdfAvailable } = await import('../../../../src/extensions/generators/pdf-generator');

    await expect(isPdfAvailable()).resolves.toBe(true);
  });

  it('isPdfAvailable returns false when puppeteer import fails', async () => {
    vi.doMock(
      'puppeteer',
      () => {
        throw new Error('Cannot find module puppeteer');
      },
      { virtual: true }
    );

    const { isPdfAvailable } = await import('../../../../src/extensions/generators/pdf-generator');

    await expect(isPdfAvailable()).resolves.toBe(false);
  });
});
