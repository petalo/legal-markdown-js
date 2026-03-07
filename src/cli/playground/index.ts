#!/usr/bin/env node

/**
 * Playground subcommand for the legal-md binary.
 *
 * Serves the dist/web directory as a static HTTP server and opens the
 * browser. Invoked via `legal-md playground`.
 *
 * Path resolution order:
 *   1. Relative to the binary (process.execPath) - works for Homebrew installs
 *      where the binary lives in <prefix>/bin/ and assets in <prefix>/dist/web/
 *   2. Relative to process.cwd() - works during development / npm link
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import net from 'net';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { EMBEDDED_WEB_ASSETS } from './embedded-assets.js';
import type { AssetMap } from './embedded-assets.js';

const DEFAULT_PORT = 7891;
const MAX_TRIES = 10;
const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function resolveWebDir(): string {
  // 1. Relative to the binary (Homebrew / compiled binary)
  const fromBinary = path.resolve(path.dirname(process.execPath), '..', 'dist', 'web');
  if (fs.existsSync(path.join(fromBinary, 'index.html'))) return fromBinary;

  // 2. Relative to cwd (development / npm link)
  const fromCwd = path.resolve(process.cwd(), 'dist', 'web');
  if (fs.existsSync(path.join(fromCwd, 'index.html'))) return fromCwd;

  console.error('Error: playground assets not found.');
  console.error('  Expected at:', fromBinary);
  console.error('  Or at:      ', fromCwd);
  console.error('Run `npm run build:web` to generate them.');
  process.exit(1);
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const s = net.createServer();
    s.listen(port, () => s.close(() => resolve(true)));
    s.on('error', () => resolve(false));
  });
}

async function findPort(start: number): Promise<number> {
  for (let i = 0; i < MAX_TRIES; i++) {
    if (await isPortAvailable(start + i)) return start + i;
  }
  console.error(`No available ports in range ${start}-${start + MAX_TRIES - 1}.`);
  process.exit(1);
}

function openBrowser(url: string): void {
  const cmd =
    process.platform === 'darwin'
      ? `open "${url}"`
      : process.platform === 'win32'
        ? `start "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd);
}

type StaticFileResolution =
  | { ok: true; filePath: string }
  | { ok: false; status: number; message: string };

function resolveStaticFilePath(
  webDir: string,
  requestUrl: string | undefined
): StaticFileResolution {
  const rawUrl = requestUrl === '' || requestUrl === undefined ? '/index.html' : requestUrl;
  const urlPath = rawUrl === '/' ? '/index.html' : rawUrl.split('?')[0];

  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(urlPath);
  } catch {
    return { ok: false, status: 400, message: 'Bad request' };
  }

  const normalizedPath = path.posix.normalize(decodedPath.replace(/\\/g, '/'));
  const relativePath = normalizedPath.replace(/^\/+/, '');
  const absoluteWebDir = path.resolve(webDir);
  const absoluteFilePath = path.resolve(absoluteWebDir, relativePath);

  if (
    absoluteFilePath !== absoluteWebDir &&
    !absoluteFilePath.startsWith(`${absoluteWebDir}${path.sep}`)
  ) {
    return { ok: false, status: 403, message: 'Forbidden' };
  }

  return { ok: true, filePath: absoluteFilePath };
}

export function buildRequestHandler(assetMap: AssetMap, webDir: string): http.RequestListener {
  const isEmbedded = Object.keys(assetMap).length > 0;

  return (req, res) => {
    // Embedded mode: serve from in-memory map
    if (isEmbedded) {
      const rawUrl = req.url ?? '/';
      const rawPath = rawUrl === '/' ? '/index.html' : rawUrl.split('?')[0];
      let urlPath: string;
      try {
        urlPath = decodeURIComponent(rawPath);
      } catch {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Bad request');
        return;
      }

      const entry = assetMap[urlPath];
      if (!entry) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
      }

      const buf = Buffer.from(entry.content, 'base64');
      res.writeHead(200, { 'Content-Type': entry.mime });
      res.end(buf);
      return;
    }

    // Filesystem mode (dev / npm link): existing logic unchanged
    const resolved = resolveStaticFilePath(webDir, req.url);

    if (!resolved.ok) {
      res.writeHead(resolved.status, { 'Content-Type': 'text/plain' });
      res.end(resolved.message);
      return;
    }

    fs.stat(resolved.filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
      }
      const ext = path.extname(resolved.filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'text/plain' });
      fs.createReadStream(resolved.filePath).pipe(res);
    });
  };
}

export async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const portArg = args.find(a => a.startsWith('--port='));
  const preferredPort = portArg ? parseInt(portArg.split('=')[1], 10) : DEFAULT_PORT;

  const isEmbedded = Object.keys(EMBEDDED_WEB_ASSETS).length > 0;
  const webDir = isEmbedded ? '' : resolveWebDir();
  const port = await findPort(preferredPort);
  const url = `http://localhost:${port}`;

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} busy, using ${port} instead.`);
  }

  const server = http.createServer(buildRequestHandler(EMBEDDED_WEB_ASSETS, webDir));

  server.listen(port, () => {
    console.log(`Legal Markdown playground running at ${url}`);
    console.log('Press Ctrl+C to stop.');
    openBrowser(url);
  });

  process.on('SIGINT', () => {
    server.close();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    server.close();
    process.exit(0);
  });
}

// Only run main() when executed directly (not when imported in tests)
const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  void main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
