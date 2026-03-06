/**
 * Browser shim for cosmiconfig.
 * Config file discovery is a Node.js-only concern; this stub satisfies the
 * import without pulling any Node.js APIs into the browser bundle.
 */
export const cosmiconfig = () => ({
  search: async () => null,
  load: async () => null,
  clearLoadCache: () => {},
  clearSearchCache: () => {},
  clearCaches: () => {},
});

export const cosmiconfigSync = () => ({
  search: () => null,
  load: () => null,
  clearLoadCache: () => {},
  clearSearchCache: () => {},
  clearCaches: () => {},
});

export default { cosmiconfig, cosmiconfigSync };
