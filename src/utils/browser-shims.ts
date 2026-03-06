/**
 * Browser shims for Node.js modules
 *
 * These are minimal implementations to satisfy imports
 * in browser environments. Most functionality is stubbed
 * since file system operations don't apply in browsers.
 */

// fs module shim
const createBrowserUnsupportedError = (api: string): Error => {
  return new Error(
    `${api} is not available in browser builds. ` +
      `This operation requires Node.js filesystem access. ` +
      `If your document uses @import or file-based processing, resolve those files before running in the browser.`
  );
};

const throwBrowserUnsupported = (api: string): never => {
  throw createBrowserUnsupportedError(api);
};

export const existsSync = (..._args: unknown[]): never => throwBrowserUnsupported('fs.existsSync');
export const readFileSync = (..._args: unknown[]): never =>
  throwBrowserUnsupported('fs.readFileSync');
export const writeFileSync = (..._args: unknown[]): never =>
  throwBrowserUnsupported('fs.writeFileSync');
export const mkdirSync = (..._args: unknown[]): never => throwBrowserUnsupported('fs.mkdirSync');
export const readdirSync = (..._args: unknown[]): never =>
  throwBrowserUnsupported('fs.readdirSync');
export const statSync = (..._args: unknown[]): never => throwBrowserUnsupported('fs.statSync');
export const copyFileSync = (..._args: unknown[]): never =>
  throwBrowserUnsupported('fs.copyFileSync');
export const unlinkSync = (..._args: unknown[]): never => throwBrowserUnsupported('fs.unlinkSync');
export const renameSync = (..._args: unknown[]): never => throwBrowserUnsupported('fs.renameSync');

const realpathSyncWithNative = ((..._args: unknown[]) => {
  return throwBrowserUnsupported('fs.realpathSync');
}) as ((...args: unknown[]) => never) & {
  native: (...args: unknown[]) => never;
};

realpathSyncWithNative.native = (..._args: unknown[]) => {
  return throwBrowserUnsupported('fs.realpathSync.native');
};

export const realpathSync = realpathSyncWithNative;

// fs/promises shim
export const readFile = async (..._args: unknown[]): Promise<never> => {
  return throwBrowserUnsupported('fs/promises.readFile');
};

export const writeFile = async (..._args: unknown[]): Promise<never> => {
  return throwBrowserUnsupported('fs/promises.writeFile');
};

export const mkdir = async (..._args: unknown[]): Promise<never> => {
  return throwBrowserUnsupported('fs/promises.mkdir');
};

export const readdir = async (..._args: unknown[]): Promise<never> => {
  return throwBrowserUnsupported('fs/promises.readdir');
};

export const stat = async (..._args: unknown[]): Promise<never> => {
  return throwBrowserUnsupported('fs/promises.stat');
};

export const copyFile = async (..._args: unknown[]): Promise<never> => {
  return throwBrowserUnsupported('fs/promises.copyFile');
};

export const unlink = async (..._args: unknown[]): Promise<never> => {
  return throwBrowserUnsupported('fs/promises.unlink');
};

export const rename = async (..._args: unknown[]): Promise<never> => {
  return throwBrowserUnsupported('fs/promises.rename');
};

export const realpath = async (..._args: unknown[]): Promise<never> => {
  return throwBrowserUnsupported('fs/promises.realpath');
};

export const promises = {
  readFile,
  writeFile,
  mkdir,
  readdir,
  stat,
  copyFile,
  unlink,
  rename,
  realpath,
};

// Default export
export default {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  statSync,
  copyFileSync,
  unlinkSync,
  renameSync,
  realpathSync,
  readFile,
  writeFile,
  mkdir,
  readdir,
  stat,
  copyFile,
  unlink,
  rename,
  realpath,
  promises,
};
