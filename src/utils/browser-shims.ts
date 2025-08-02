/**
 * Browser shims for Node.js modules
 *
 * These are minimal implementations to satisfy imports
 * in browser environments. Most functionality is stubbed
 * since file system operations don't apply in browsers.
 */

// fs module shim
export const existsSync = () => false;
export const readFileSync = () => '';
export const writeFileSync = () => {};
export const mkdirSync = () => {};
export const readdirSync = () => [];
export const statSync = () => ({ isFile: () => false, isDirectory: () => false });
export const copyFileSync = () => {};
export const unlinkSync = () => {};
export const renameSync = () => {};

// fs/promises shim
export const promises = {
  readFile: async () => '',
  writeFile: async () => {},
  mkdir: async () => {},
  readdir: async () => [],
  stat: async () => ({ isFile: () => false, isDirectory: () => false }),
  copyFile: async () => {},
  unlink: async () => {},
  rename: async () => {},
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
  promises,
};
