// Auto-discover all .md files in examples/playground/ at build time.
// Vite inlines each file as a string in the JS bundle via `?raw`.
const modules = import.meta.glob('../../../../examples/playground/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

export interface Example {
  key: string;
  title: string;
  content: string;
}

function extractTitle(content: string): string {
  const match = content.match(/^title:\s*(.+)$/m);
  return match?.[1]?.replace(/^['"]|['"]$/g, '') ?? 'Untitled';
}

function keyFromPath(path: string): string {
  const filename = path.split('/').pop() ?? '';
  return filename.replace(/^\d+-/, '').replace(/\.md$/, '');
}

// Sorted by filename prefix (01-, 02-, etc.)
export const EXAMPLES: Example[] = Object.entries(modules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, content]) => ({
    key: keyFromPath(path),
    title: extractTitle(content),
    content,
  }));

export const DEFAULT_EXAMPLE_KEY = 'master-services-agreement';

// Lookup map for consumers that access by key
export const EXAMPLES_MAP: Record<string, Example> = Object.fromEntries(
  EXAMPLES.map(e => [e.key, e])
);

export const EXAMPLE_OPTIONS = EXAMPLES.map(({ key, title }) => ({
  value: key,
  label: title,
}));
