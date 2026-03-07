import { describe, it, expect } from 'vitest';
import { createServer } from 'http';
import type { AddressInfo } from 'net';
import { buildRequestHandler } from '../../../src/cli/playground/index.ts';
import type { AssetMap } from '../../../src/cli/playground/embedded-assets.ts';

const MOCK_MAP: AssetMap = {
  '/index.html': {
    content: Buffer.from('<html>playground</html>').toString('base64'),
    mime: 'text/html',
  },
  '/assets/main.js': {
    content: Buffer.from('console.log("hi")').toString('base64'),
    mime: 'text/javascript',
  },
};

async function get(
  port: number,
  path: string
): Promise<{ status: number; body: string; contentType: string | undefined }> {
  const res = await fetch(`http://127.0.0.1:${port}${path}`);
  return {
    status: res.status,
    body: await res.text(),
    contentType: res.headers.get('content-type') ?? undefined,
  };
}

describe('playground server - embedded mode', () => {
  it('serves index.html from the embedded map', async () => {
    const handler = buildRequestHandler(MOCK_MAP, '');
    const server = createServer(handler);
    await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
    const { port } = server.address() as AddressInfo;

    try {
      const res = await get(port, '/');
      expect(res.status).toBe(200);
      expect(res.contentType).toContain('text/html');
      expect(res.body).toBe('<html>playground</html>');
    } finally {
      await new Promise<void>(r => server.close(() => r()));
    }
  });

  it('serves a JS asset with correct content-type', async () => {
    const handler = buildRequestHandler(MOCK_MAP, '');
    const server = createServer(handler);
    await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
    const { port } = server.address() as AddressInfo;

    try {
      const res = await get(port, '/assets/main.js');
      expect(res.status).toBe(200);
      expect(res.contentType).toContain('text/javascript');
    } finally {
      await new Promise<void>(r => server.close(() => r()));
    }
  });

  it('returns 404 for unknown paths in embedded mode', async () => {
    const handler = buildRequestHandler(MOCK_MAP, '');
    const server = createServer(handler);
    await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
    const { port } = server.address() as AddressInfo;

    try {
      const res = await get(port, '/not-there.txt');
      expect(res.status).toBe(404);
    } finally {
      await new Promise<void>(r => server.close(() => r()));
    }
  });
});
