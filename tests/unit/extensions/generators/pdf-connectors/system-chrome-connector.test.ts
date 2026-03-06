import { beforeEach, describe, expect, it, vi } from 'vitest';

const existsSyncMock = vi.fn();
const execFileMock = vi.fn();
const mkdirMock = vi.fn();
const writeFileMock = vi.fn();
const unlinkMock = vi.fn();

vi.mock('fs', () => ({
  existsSync: existsSyncMock,
}));

vi.mock('fs/promises', () => ({
  mkdir: mkdirMock,
  writeFile: writeFileMock,
  unlink: unlinkMock,
}));

vi.mock('child_process', () => ({
  execFile: execFileMock,
  spawn: vi.fn(),
}));

describe('SystemChromeConnector', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    execFileMock.mockImplementation((_command: string, _args: string[], cb: Function) => {
      cb(new Error('not found'), '', '');
    });
  });

  it('detects macOS chrome candidates in required order', async () => {
    existsSyncMock.mockImplementation(
      (entry: string) =>
        entry === '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge' ||
        entry === '/Applications/Arc.app/Contents/MacOS/Arc'
    );

    const { SystemChromeConnector } = await import(
      '../../../../../src/extensions/generators/pdf-connectors/system-chrome-connector'
    );
    const connector = new SystemChromeConnector('darwin');

    await expect(connector.isAvailable()).resolves.toBe(true);
    const info = await connector.getInfo();
    expect(info.executablePath).toBe(
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
    );
  });

  it('detects linux browser via which chain', async () => {
    existsSyncMock.mockReturnValue(false);
    execFileMock.mockImplementation((...callArgs: unknown[]) => {
      const [command, rawArgs, maybeCb, maybeCb2] = callArgs as [
        string,
        string[] | string,
        Function | undefined,
        Function | undefined,
      ];
      const cb = maybeCb2 ?? maybeCb;
      const executable = Array.isArray(rawArgs) ? rawArgs[0] : rawArgs;

      if (!cb) {
        return;
      }

      if (command === 'which' && executable === 'chromium') {
        cb(null, '/usr/bin/chromium\n', '');
        return;
      }
      if (command === '/usr/bin/chromium' && executable === '--version') {
        cb(null, 'Chromium 125.0\n', '');
        return;
      }
      cb(new Error('not found'), '', '');
    });

    const { SystemChromeConnector } = await import(
      '../../../../../src/extensions/generators/pdf-connectors/system-chrome-connector'
    );
    const connector = new SystemChromeConnector('linux');

    await expect(connector.isAvailable()).resolves.toBe(true);
    await expect(connector.getInfo()).resolves.toEqual(
      expect.objectContaining({ executablePath: '/usr/bin/chromium' })
    );
  });

  it('caches detected executable for the session', async () => {
    execFileMock.mockImplementation((...callArgs: unknown[]) => {
      const [command, rawArgs, maybeCb, maybeCb2] = callArgs as [
        string,
        string[] | string,
        Function | undefined,
        Function | undefined,
      ];
      const cb = maybeCb2 ?? maybeCb;
      const executable = Array.isArray(rawArgs) ? rawArgs[0] : rawArgs;

      if (!cb) {
        return;
      }

      if (command === 'which' && executable === 'google-chrome') {
        cb(null, '/usr/bin/google-chrome\n', '');
        return;
      }
      cb(new Error('not found'), '', '');
    });

    const { SystemChromeConnector } = await import(
      '../../../../../src/extensions/generators/pdf-connectors/system-chrome-connector'
    );
    const connector = new SystemChromeConnector('linux');

    await expect(connector.isAvailable()).resolves.toBe(true);
    await expect(connector.isAvailable()).resolves.toBe(true);

    expect(execFileMock).toHaveBeenCalledTimes(1);
  });
});
