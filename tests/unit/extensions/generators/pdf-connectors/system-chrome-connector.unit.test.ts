const mockFs = vi.hoisted(() => ({
  existsSync: vi.fn(),
}));

const mockFsp = vi.hoisted(() => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
}));

const mockExecFile = vi.hoisted(() => vi.fn());
const mockSpawn = vi.hoisted(() => vi.fn());

vi.mock('fs', () => ({ ...mockFs, default: mockFs }));
vi.mock('fs/promises', () => ({ ...mockFsp, default: mockFsp }));
vi.mock('child_process', () => ({
  execFile: mockExecFile,
  spawn: mockSpawn,
}));

import { SystemChromeConnector } from '../../../../../src/extensions/generators/pdf-connectors/system-chrome-connector';
import type { PdfOptions } from '../../../../../src/extensions/generators/pdf-connectors/types';

const DEFAULT_PDF_OPTIONS: PdfOptions = {
  format: 'Letter',
  landscape: false,
  margin: { top: '1in', right: '1in', bottom: '1in', left: '1in' },
};

describe('SystemChromeConnector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // detectExecutablePath (via isAvailable)
  // ---------------------------------------------------------------------------
  describe('detectExecutablePath via isAvailable()', () => {
    it('macOS: returns true when Chrome exists at expected path', async () => {
      mockFs.existsSync.mockImplementation(
        (p: string) =>
          p === '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      );

      const connector = new SystemChromeConnector('darwin');
      await expect(connector.isAvailable()).resolves.toBe(true);
    });

    it('macOS: returns false when no browser found', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const connector = new SystemChromeConnector('darwin');
      await expect(connector.isAvailable()).resolves.toBe(false);
    });

    it('macOS: prefers Chrome over later candidates', async () => {
      mockFs.existsSync.mockImplementation(
        (p: string) =>
          p === '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' ||
          p === '/Applications/Arc.app/Contents/MacOS/Arc'
      );

      const connector = new SystemChromeConnector('darwin');
      await expect(connector.isAvailable()).resolves.toBe(true);

      // Verify via getInfo that Chrome was picked, not Arc
      mockExecFile.mockImplementation(
        (_cmd: string, _args: string[], cb: Function) => {
          cb(null, 'Google Chrome 125.0\n', '');
        }
      );
      const info = await connector.getInfo();
      expect(info.executablePath).toBe(
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      );
    });

    it('linux: returns true when `which google-chrome` succeeds', async () => {
      mockExecFile.mockImplementation(
        (command: string, args: string[], cb: Function) => {
          if (command === 'which' && args[0] === 'google-chrome') {
            cb(null, '/usr/bin/google-chrome\n', '');
            return;
          }
          cb(new Error('not found'), '', '');
        }
      );

      const connector = new SystemChromeConnector('linux');
      await expect(connector.isAvailable()).resolves.toBe(true);
    });

    it('linux: returns false when all `which` calls fail', async () => {
      mockExecFile.mockImplementation(
        (_command: string, _args: string[], cb: Function) => {
          cb(new Error('not found'), '', '');
        }
      );

      const connector = new SystemChromeConnector('linux');
      await expect(connector.isAvailable()).resolves.toBe(false);
    });

    it('caches result on subsequent calls', async () => {
      mockFs.existsSync.mockImplementation(
        (p: string) =>
          p === '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      );

      const connector = new SystemChromeConnector('darwin');
      await connector.isAvailable();
      await connector.isAvailable();

      // existsSync should only have been called during the first detection pass
      const firstCallCount = mockFs.existsSync.mock.calls.length;
      await connector.isAvailable();
      expect(mockFs.existsSync.mock.calls.length).toBe(firstCallCount);
    });
  });

  // ---------------------------------------------------------------------------
  // generatePdf
  // ---------------------------------------------------------------------------
  describe('generatePdf()', () => {
    it('throws when no Chrome executable found', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockExecFile.mockImplementation(
        (_cmd: string, _args: string[], cb: Function) => {
          cb(new Error('not found'), '', '');
        }
      );

      const connector = new SystemChromeConnector('darwin');
      await expect(
        connector.generatePdf('<h1>hi</h1>', '/tmp/out.pdf', DEFAULT_PDF_OPTIONS)
      ).rejects.toThrow('No system Chrome/Chromium/Edge/Brave/Arc executable found.');
    });

    it('spawns Chrome with correct headless args', async () => {
      mockFs.existsSync.mockImplementation(
        (p: string) =>
          p === '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      );

      // Simulate a successful spawn child process
      const fakeChild = {
        on: vi.fn((event: string, handler: Function) => {
          if (event === 'exit') {
            // Schedule the exit callback to fire asynchronously
            setTimeout(() => handler(0), 0);
          }
        }),
      };
      mockSpawn.mockReturnValue(fakeChild);

      const connector = new SystemChromeConnector('darwin');
      await connector.generatePdf('<h1>hi</h1>', '/tmp/out.pdf', DEFAULT_PDF_OPTIONS);

      expect(mockSpawn).toHaveBeenCalledTimes(1);
      const [executable, args] = mockSpawn.mock.calls[0];
      expect(executable).toBe(
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      );
      expect(args).toContain('--headless');
      expect(args).toContain('--disable-gpu');
      expect(args).toContain('--no-sandbox');
      expect(args).toContain('--print-to-pdf-no-header');
      expect(args.find((a: string) => a.startsWith('--print-to-pdf='))).toBeTruthy();
    });

    it('writes HTML to temp file before spawning', async () => {
      mockFs.existsSync.mockImplementation(
        (p: string) =>
          p === '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      );

      const fakeChild = {
        on: vi.fn((event: string, handler: Function) => {
          if (event === 'exit') {
            setTimeout(() => handler(0), 0);
          }
        }),
      };
      mockSpawn.mockReturnValue(fakeChild);

      const html = '<html><head></head><body>Hello</body></html>';
      const connector = new SystemChromeConnector('darwin');
      await connector.generatePdf(html, '/tmp/out.pdf', DEFAULT_PDF_OPTIONS);

      // writeFile should have been called with the HTML (with injected @page CSS)
      expect(mockFsp.writeFile).toHaveBeenCalledTimes(1);
      const [filePath, content, encoding] = mockFsp.writeFile.mock.calls[0];
      expect(filePath).toMatch(/input-.*\.html$/);
      expect(content).toContain('@page');
      expect(content).toContain('Hello');
      expect(encoding).toBe('utf8');

      // writeFile must be called before spawn
      const writeOrder = mockFsp.writeFile.mock.invocationCallOrder[0];
      const spawnOrder = mockSpawn.mock.invocationCallOrder[0];
      expect(writeOrder).toBeLessThan(spawnOrder);
    });

    it('cleans up temp file after generation', async () => {
      mockFs.existsSync.mockImplementation(
        (p: string) =>
          p === '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      );

      const fakeChild = {
        on: vi.fn((event: string, handler: Function) => {
          if (event === 'exit') {
            setTimeout(() => handler(0), 0);
          }
        }),
      };
      mockSpawn.mockReturnValue(fakeChild);

      const connector = new SystemChromeConnector('darwin');
      await connector.generatePdf('<h1>hi</h1>', '/tmp/out.pdf', DEFAULT_PDF_OPTIONS);

      // unlink should be called with the same temp file path that was written
      expect(mockFsp.unlink).toHaveBeenCalledTimes(1);
      const writtenPath = mockFsp.writeFile.mock.calls[0][0];
      expect(mockFsp.unlink).toHaveBeenCalledWith(writtenPath);
    });

    it('cleans up temp file even when spawn fails', async () => {
      mockFs.existsSync.mockImplementation(
        (p: string) =>
          p === '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      );

      const fakeChild = {
        on: vi.fn((event: string, handler: Function) => {
          if (event === 'exit') {
            setTimeout(() => handler(1), 0);
          }
        }),
      };
      mockSpawn.mockReturnValue(fakeChild);

      const connector = new SystemChromeConnector('darwin');
      await expect(
        connector.generatePdf('<h1>hi</h1>', '/tmp/out.pdf', DEFAULT_PDF_OPTIONS)
      ).rejects.toThrow('exited with code 1');

      // unlink should still be called in the finally block
      expect(mockFsp.unlink).toHaveBeenCalledTimes(1);
    });
  });
});
