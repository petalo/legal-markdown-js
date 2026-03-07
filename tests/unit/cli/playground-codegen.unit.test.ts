import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { generateAssetMap } from '../../../scripts/embed-web-assets.ts';

describe('generateAssetMap', () => {
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'test-web-'));
    mkdirSync(join(tmpDir, 'assets'), { recursive: true });
    writeFileSync(join(tmpDir, 'index.html'), '<html>hello</html>', 'utf8');
    writeFileSync(join(tmpDir, 'assets', 'main.js'), 'console.log("hi")', 'utf8');
    writeFileSync(join(tmpDir, 'assets', 'style.css'), 'body { margin: 0; }', 'utf8');
  });

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('produces a key for every file with leading slash', () => {
    const map = generateAssetMap(tmpDir);
    expect(Object.keys(map)).toContain('/index.html');
    expect(Object.keys(map)).toContain('/assets/main.js');
    expect(Object.keys(map)).toContain('/assets/style.css');
  });

  it('assigns correct MIME types', () => {
    const map = generateAssetMap(tmpDir);
    expect(map['/index.html'].mime).toBe('text/html');
    expect(map['/assets/main.js'].mime).toBe('text/javascript');
    expect(map['/assets/style.css'].mime).toBe('text/css');
  });

  it('content is valid base64 that decodes back to the original file', () => {
    const map = generateAssetMap(tmpDir);
    const decoded = Buffer.from(map['/index.html'].content, 'base64').toString('utf8');
    expect(decoded).toBe('<html>hello</html>');
  });

  it('throws if the web directory does not exist', () => {
    expect(() => generateAssetMap('/nonexistent/path')).toThrow(/dist\/web/);
  });
});
