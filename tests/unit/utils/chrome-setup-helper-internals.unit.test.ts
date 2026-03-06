const mockExistsSync = vi.fn();
const mockReaddirSync = vi.fn();

vi.mock('fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  readdirSync: (...args: unknown[]) => mockReaddirSync(...args),
}));

import { checkChromeStatus } from '../../../src/utils/chrome-setup-helper';

describe('chrome-setup-helper.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('checkChromeStatus', () => {
    it('returns all false when nothing is found', () => {
      mockExistsSync.mockReturnValue(false);
      const status = checkChromeStatus();
      expect(status.hasSystemChrome).toBe(false);
      expect(status.hasPuppeteerCache).toBe(false);
      expect(status.chromePaths).toEqual([]);
      expect(status.suggestions.length).toBeGreaterThan(0);
    });

    it('detects system Chrome when path exists', () => {
      mockExistsSync.mockImplementation((p: string) => {
        return p.includes('Google Chrome') || p.includes('google-chrome');
      });
      const status = checkChromeStatus();
      expect(status.hasSystemChrome).toBe(true);
      expect(status.chromePaths.length).toBeGreaterThan(0);
    });

    it('detects puppeteer cache when directory has files', () => {
      mockExistsSync.mockImplementation((p: string) => {
        return p.includes('.cache/puppeteer');
      });
      mockReaddirSync.mockReturnValue(['chrome-linux']);

      const status = checkChromeStatus();
      expect(status.hasPuppeteerCache).toBe(true);
    });

    it('ignores empty puppeteer cache directories', () => {
      mockExistsSync.mockImplementation((p: string) => {
        return p.includes('.cache/puppeteer');
      });
      mockReaddirSync.mockReturnValue([]);

      const status = checkChromeStatus();
      expect(status.hasPuppeteerCache).toBe(false);
    });

    it('provides suggestions when no Chrome found', () => {
      mockExistsSync.mockReturnValue(false);
      const status = checkChromeStatus();
      expect(status.suggestions).toContain('npx puppeteer browsers install chrome');
    });

    it('provides no suggestions when system Chrome is found', () => {
      // Make system Chrome path exist
      mockExistsSync.mockImplementation((p: string) => {
        return p === '/usr/bin/google-chrome';
      });
      const status = checkChromeStatus();
      expect(status.suggestions).toEqual([]);
    });

    it('provides no suggestions when puppeteer cache exists', () => {
      mockExistsSync.mockImplementation((p: string) => {
        return p.includes('.cache/puppeteer-global');
      });
      mockReaddirSync.mockReturnValue(['chrome']);

      const status = checkChromeStatus();
      expect(status.suggestions).toEqual([]);
    });

    it('handles readdirSync errors gracefully', () => {
      mockExistsSync.mockImplementation((p: string) => {
        return p.includes('.cache/puppeteer');
      });
      mockReaddirSync.mockImplementation(() => { throw new Error('permission denied'); });

      // Should not throw
      const status = checkChromeStatus();
      expect(status.hasPuppeteerCache).toBe(false);
    });

    it('collects multiple Chrome paths', () => {
      mockExistsSync.mockImplementation((p: string) => {
        return p === '/usr/bin/google-chrome' || p === '/usr/bin/chromium';
      });
      const status = checkChromeStatus();
      expect(status.chromePaths.length).toBe(2);
    });
  });
});
