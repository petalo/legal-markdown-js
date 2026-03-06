import { beforeEach, describe, expect, it, vi } from 'vitest';

const execFileMock = vi.fn();

vi.mock('child_process', () => ({
  execFile: execFileMock,
  spawn: vi.fn(),
}));

describe('WeasyprintConnector', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('detects availability when weasyprint exists in PATH', async () => {
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

      if (command === 'which') {
        cb(null, '/usr/local/bin/weasyprint\n', '');
        return;
      }

      if (command === '/usr/local/bin/weasyprint' && executable === '--version') {
        cb(null, 'WeasyPrint version 61.2\n', '');
        return;
      }

      cb(new Error('not found'), '', '');
    });

    const { WeasyprintConnector } = await import(
      '../../../../../src/extensions/generators/pdf-connectors/weasyprint-connector'
    );

    const connector = new WeasyprintConnector();
    await expect(connector.isAvailable()).resolves.toBe(true);
    await expect(connector.getInfo()).resolves.toEqual(
      expect.objectContaining({
        name: 'weasyprint',
        version: '61.2',
        executablePath: '/usr/local/bin/weasyprint',
      })
    );
  });

  it('returns unavailable when weasyprint is missing', async () => {
    execFileMock.mockImplementation((...callArgs: unknown[]) => {
      const [, , maybeCb, maybeCb2] = callArgs as [
        string,
        string[] | string,
        Function | undefined,
        Function | undefined,
      ];
      const cb = maybeCb2 ?? maybeCb;
      if (!cb) {
        return;
      }
      cb(new Error('not found'), '', '');
    });

    const { WeasyprintConnector } = await import(
      '../../../../../src/extensions/generators/pdf-connectors/weasyprint-connector'
    );

    const connector = new WeasyprintConnector();
    await expect(connector.isAvailable()).resolves.toBe(false);
    await expect(connector.getInfo()).resolves.toEqual(
      expect.objectContaining({
        name: 'weasyprint',
        version: 'not-installed',
      })
    );
  });
});
