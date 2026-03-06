const execFileMock = vi.fn();
const spawnMock = vi.fn();
const mkdirMock = vi.fn().mockResolvedValue(undefined);
const writeFileMock = vi.fn().mockResolvedValue(undefined);
const unlinkMock = vi.fn().mockResolvedValue(undefined);

vi.mock('child_process', () => ({
  execFile: execFileMock,
  spawn: spawnMock,
}));

vi.mock('fs/promises', () => ({
  mkdir: mkdirMock,
  writeFile: writeFileMock,
  unlink: unlinkMock,
}));

function makeExecFileMock(handlers: Record<string, (args: string[]) => [Error | null, string, string]>) {
  execFileMock.mockImplementation((...callArgs: unknown[]) => {
    const [command, rawArgs, maybeCb, maybeCb2] = callArgs as [
      string,
      string[] | string,
      Function | undefined,
      Function | undefined,
    ];
    const cb = maybeCb2 ?? maybeCb;
    const args = Array.isArray(rawArgs) ? rawArgs : [rawArgs];

    if (!cb) return;

    const handler = handlers[command];
    if (handler) {
      const [err, stdout, stderr] = handler(args);
      cb(err, stdout, stderr);
      return;
    }

    cb(new Error('not found'), '', '');
  });
}

function makeWhichFound() {
  return {
    which: (args: string[]) => {
      if (args[0] === 'weasyprint') {
        return [null, '/usr/local/bin/weasyprint\n', ''] as [null, string, string];
      }
      return [new Error('not found'), '', ''] as [Error, string, string];
    },
  };
}

function makeSpawnSuccess() {
  const listeners: Record<string, Function> = {};
  spawnMock.mockReturnValue({
    on: vi.fn((event: string, cb: Function) => {
      listeners[event] = cb;
      if (event === 'exit') {
        // Simulate successful exit on next tick
        Promise.resolve().then(() => cb(0));
      }
    }),
  });
}

function makeSpawnFailure(code: number) {
  spawnMock.mockReturnValue({
    on: vi.fn((event: string, cb: Function) => {
      if (event === 'exit') {
        Promise.resolve().then(() => cb(code));
      }
    }),
  });
}

const defaultOptions = {
  format: 'A4',
  landscape: false,
  margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
};

describe('WeasyprintConnector - getInfo', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns not-installed when weasyprint is not found', async () => {
    makeExecFileMock({});

    const { WeasyprintConnector } = await import(
      '../../../../../src/extensions/generators/pdf-connectors/weasyprint-connector'
    );
    const connector = new WeasyprintConnector();
    const info = await connector.getInfo();

    expect(info).toEqual({
      name: 'weasyprint',
      version: 'not-installed',
    });
  });

  it('extracts version number from weasyprint output', async () => {
    makeExecFileMock({
      ...makeWhichFound(),
      '/usr/local/bin/weasyprint': (args) => {
        if (args[0] === '--version') {
          return [null, 'WeasyPrint version 60.1\n', ''];
        }
        return [new Error('unknown'), '', ''];
      },
    });

    const { WeasyprintConnector } = await import(
      '../../../../../src/extensions/generators/pdf-connectors/weasyprint-connector'
    );
    const connector = new WeasyprintConnector();
    const info = await connector.getInfo();

    expect(info).toEqual({
      name: 'weasyprint',
      version: '60.1',
      executablePath: '/usr/local/bin/weasyprint',
    });
  });

  it('returns unknown when version command fails', async () => {
    makeExecFileMock({
      ...makeWhichFound(),
      '/usr/local/bin/weasyprint': () => {
        throw new Error('command failed');
      },
    });

    const { WeasyprintConnector } = await import(
      '../../../../../src/extensions/generators/pdf-connectors/weasyprint-connector'
    );
    const connector = new WeasyprintConnector();
    const info = await connector.getInfo();

    expect(info).toEqual({
      name: 'weasyprint',
      version: 'unknown',
      executablePath: '/usr/local/bin/weasyprint',
    });
  });

  it('includes executablePath when weasyprint is available', async () => {
    makeExecFileMock({
      ...makeWhichFound(),
      '/usr/local/bin/weasyprint': (args) => {
        if (args[0] === '--version') {
          return [null, 'WeasyPrint version 62.0\n', ''];
        }
        return [new Error('unknown'), '', ''];
      },
    });

    const { WeasyprintConnector } = await import(
      '../../../../../src/extensions/generators/pdf-connectors/weasyprint-connector'
    );
    const connector = new WeasyprintConnector();
    const info = await connector.getInfo();

    expect(info.executablePath).toBe('/usr/local/bin/weasyprint');
  });
});

describe('WeasyprintConnector - generatePdf', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mkdirMock.mockResolvedValue(undefined);
    writeFileMock.mockResolvedValue(undefined);
    unlinkMock.mockResolvedValue(undefined);
  });

  it('throws when weasyprint is not found', async () => {
    makeExecFileMock({});

    const { WeasyprintConnector } = await import(
      '../../../../../src/extensions/generators/pdf-connectors/weasyprint-connector'
    );
    const connector = new WeasyprintConnector();

    await expect(connector.generatePdf('<html></html>', '/tmp/out.pdf', defaultOptions)).rejects.toThrow(
      'weasyprint executable not found'
    );
  });

  it('spawns weasyprint with correct args', async () => {
    makeExecFileMock({ ...makeWhichFound() });
    makeSpawnSuccess();

    const { WeasyprintConnector } = await import(
      '../../../../../src/extensions/generators/pdf-connectors/weasyprint-connector'
    );
    const connector = new WeasyprintConnector();
    await connector.generatePdf('<html></html>', '/tmp/out.pdf', defaultOptions);

    expect(spawnMock).toHaveBeenCalledTimes(1);
    const [execPath, args] = spawnMock.mock.calls[0];
    expect(execPath).toBe('/usr/local/bin/weasyprint');
    expect(args[0]).toBe('--media-type');
    expect(args[1]).toBe('print');
    expect(args[2]).toBe('--stylesheet');
    // args[3] is the temp CSS path
    // args[4] is the temp HTML path
    // args[5] is the resolved output path
    expect(args).toHaveLength(6);
  });

  it('writes HTML and CSS temp files', async () => {
    makeExecFileMock({ ...makeWhichFound() });
    makeSpawnSuccess();

    const { WeasyprintConnector } = await import(
      '../../../../../src/extensions/generators/pdf-connectors/weasyprint-connector'
    );
    const connector = new WeasyprintConnector();
    await connector.generatePdf('<h1>Hello</h1>', '/tmp/out.pdf', defaultOptions);

    // Should write HTML content
    const htmlWrite = writeFileMock.mock.calls.find(
      (call: unknown[]) => typeof call[1] === 'string' && call[1].includes('<h1>Hello</h1>')
    );
    expect(htmlWrite).toBeDefined();

    // Should write CSS content with @page rule
    const cssWrite = writeFileMock.mock.calls.find(
      (call: unknown[]) => typeof call[1] === 'string' && call[1].includes('@page')
    );
    expect(cssWrite).toBeDefined();
  });

  it('cleans up temp files after success', async () => {
    makeExecFileMock({ ...makeWhichFound() });
    makeSpawnSuccess();

    const { WeasyprintConnector } = await import(
      '../../../../../src/extensions/generators/pdf-connectors/weasyprint-connector'
    );
    const connector = new WeasyprintConnector();
    await connector.generatePdf('<html></html>', '/tmp/out.pdf', defaultOptions);

    // Should call unlink twice (HTML + CSS temp files)
    expect(unlinkMock).toHaveBeenCalledTimes(2);
  });

  it('cleans up temp files after spawn failure', async () => {
    makeExecFileMock({ ...makeWhichFound() });
    makeSpawnFailure(1);

    const { WeasyprintConnector } = await import(
      '../../../../../src/extensions/generators/pdf-connectors/weasyprint-connector'
    );
    const connector = new WeasyprintConnector();

    await expect(
      connector.generatePdf('<html></html>', '/tmp/out.pdf', defaultOptions)
    ).rejects.toThrow('weasyprint exited with code 1');

    // Should still clean up temp files
    expect(unlinkMock).toHaveBeenCalledTimes(2);
  });
});
