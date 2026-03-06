import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';
import { NODE_CLI, ROOT, resolveBinaryCommand } from './cli-target-command.js';

const execAsync = promisify(exec);
// Keep command timeout below Vitest default test timeout (15s) to avoid
// orphaned child processes stretching suite runtime when a command hangs.
const COMMAND_TIMEOUT_MS = process.env.CI ? 12_000 : 12_000;

const BINARY_CMD = resolveBinaryCommand();
const FIXTURES = path.join(ROOT, 'tests', 'fixtures', 'cli');

/** Run a CLI command and return { stdout, stderr, exitCode } */
async function run(
  cmd: string,
  args: string,
  opts: { cwd?: string } = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const { stdout, stderr } = await execAsync(`${cmd} ${args}`, {
      cwd: opts.cwd ?? ROOT,
      timeout: COMMAND_TIMEOUT_MS,
      maxBuffer: 10 * 1024 * 1024,
    });
    return { stdout, stderr, exitCode: 0 };
  } catch (err: any) {
    const timedOut = err?.killed && err?.signal === 'SIGTERM';
    if (timedOut) {
      return {
        stdout: err.stdout ?? '',
        stderr:
          (err.stderr ?? '') +
          `\nCommand timed out after ${Math.round(COMMAND_TIMEOUT_MS / 1000)} seconds`,
        exitCode: 1,
      };
    }

    return {
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
      exitCode: err.code ?? 1,
    };
  }
}

/** Helper: run on node CLI */
const runNode = (args: string, opts?: { cwd?: string }) =>
  run(`node "${NODE_CLI}"`, args, opts);

const TARGETS = [
  {
    name: 'node',
    run: (args: string, opts?: { cwd?: string }) => runNode(args, opts),
  },
  {
    name: 'binary',
    run: (args: string, opts?: { cwd?: string }) =>
      run(BINARY_CMD, args, opts),
  },
] as const;

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'legal-md-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('CLI params - import options bug fixes', () => {
  describe('--import-tracing', () => {
    it('adds HTML comments wrapping imported content in output', async () => {
      const { stdout } = await runNode(
        `--import-tracing "${path.join(FIXTURES, 'with-import.md')}"`
      );
      expect(stdout).toContain('<!-- start import:');
      expect(stdout).toContain('<!-- end import:');
    });
  });

  describe('--log-import-operations', () => {
    it('logs import operations without requiring --debug', async () => {
      const { stdout } = await runNode(
        `--log-import-operations "${path.join(FIXTURES, 'with-import.md')}"`
      );
      // Import operations log something about the merge/import process
      // (exact string depends on frontmatter-merger log format)
      expect(stdout.length).toBeGreaterThan(0); // at minimum it produces output
    });
  });

  describe('--validate-import-types', () => {
    it('exits 0 with valid imports when flag is set', async () => {
      const { exitCode } = await runNode(
        `--validate-import-types "${path.join(FIXTURES, 'with-import.md')}"`
      );
      expect(exitCode).toBe(0);
    });
  });
});

describe('--html + --stdout interaction', () => {
  it('--html --stdout pipes HTML to stdout (not to a file)', async () => {
    const { stdout, exitCode } = await runNode(
      `--html --stdout "${path.join(FIXTURES, 'minimal.md')}"`
    );
    expect(exitCode).toBe(0);
    expect(stdout).toContain('<html');
    expect(stdout).toContain('</html>');
  });
});

describe('--docx', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] generates a DOCX file`, async () => {
      const out = path.join(tmpDir, `${target.name}-docx-output.docx`);
      const { exitCode } = await target.run(
        `--docx "${path.join(FIXTURES, 'minimal.md')}" "${out}"`
      );

      expect(exitCode).toBe(0);
      expect(fs.existsSync(out)).toBe(true);
      expect(fs.statSync(out).size).toBeGreaterThan(0);
    });
  }
});

describe('--docx + --stdout interaction', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] exits with a clear error`, async () => {
      const { stderr, exitCode } = await target.run(
        `--docx --stdout "${path.join(FIXTURES, 'minimal.md')}"`
      );
      expect(exitCode).toBe(1);
      expect(stderr).toContain('--docx cannot be used with --stdout');
    });
  }
});

// ------------------------------------------------------------------ //
// Meta
// ------------------------------------------------------------------ //
describe('--version', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] prints semver and exits 0`, async () => {
      const { stdout, exitCode } = await target.run('--version');
      expect(exitCode).toBe(0);
      expect(stdout).toMatch(/\d+\.\d+\.\d+/);
    });
  }
});

describe('--help', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] exits 0 and mentions legal-md`, async () => {
      const { stdout, exitCode } = await target.run('--help');
      expect(exitCode).toBe(0);
      expect(stdout).toContain('legal-md');
    });
  }
});

// ------------------------------------------------------------------ //
// Error cases
// ------------------------------------------------------------------ //
describe('no input file', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] exits 1 and mentions Input file is required`, async () => {
      const { stderr, exitCode } = await target.run('');
      expect(exitCode).toBe(1);
      expect(stderr).toContain('Input file is required');
    });
  }
});

describe('nonexistent input', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] exits 1 and mentions not found`, async () => {
      const { stderr, exitCode } = await target.run('"/no/such/file.md"');
      expect(exitCode).toBe(1);
      expect(stderr).toMatch(/not found/i);
    });
  }
});

// ------------------------------------------------------------------ //
// Basic processing
// ------------------------------------------------------------------ //
describe('file -> stdout (no output arg)', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] processes headers and references`, async () => {
      const { stdout, exitCode } = await target.run(
        `"${path.join(FIXTURES, 'full.md')}"`
      );
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Article 1.');
      expect(stdout).toContain('Section 1.');
      expect(stdout).toContain('ACME Corp');
    });
  }
});

describe('file -> output file', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] creates output file with processed content`, async () => {
      const out = path.join(tmpDir, `${target.name}-basic.md`);
      const { exitCode } = await target.run(
        `"${path.join(FIXTURES, 'full.md')}" "${out}"`
      );
      expect(exitCode).toBe(0);
      expect(fs.existsSync(out)).toBe(true);
      expect(fs.readFileSync(out, 'utf8')).toContain('Article 1.');
    });
  }
});

// ------------------------------------------------------------------ //
// --debug / -d
// ------------------------------------------------------------------ //
describe('--debug', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] shows Metadata: block in output`, async () => {
      const { stdout, exitCode } = await target.run(
        `--debug "${path.join(FIXTURES, 'minimal.md')}"`
      );
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Metadata:');
    });
  }
});

// ------------------------------------------------------------------ //
// --yaml / -y
// ------------------------------------------------------------------ //
describe('--yaml', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] skips header processing, keeps raw l. markers`, async () => {
      const out = path.join(tmpDir, `${target.name}-yaml.md`);
      await target.run(`--yaml "${path.join(FIXTURES, 'full.md')}" "${out}"`);
      const content = fs.readFileSync(out, 'utf8');
      expect(content).not.toContain('Article 1.');
      expect(content).toMatch(/l\. Parties/);
    });
  }
});

// ------------------------------------------------------------------ //
// --headers / --no-headers
// ------------------------------------------------------------------ //
describe('--headers', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] exits 0`, async () => {
      const out = path.join(tmpDir, `${target.name}-headers.md`);
      const { exitCode } = await target.run(
        `--headers "${path.join(FIXTURES, 'headers-auto.md')}" "${out}"`
      );
      expect(exitCode).toBe(0);
    });
  }
});

describe('--no-headers', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] skips numbering, keeps raw l. markers`, async () => {
      const out = path.join(tmpDir, `${target.name}-no-headers.md`);
      await target.run(
        `--no-headers "${path.join(FIXTURES, 'full.md')}" "${out}"`
      );
      const content = fs.readFileSync(out, 'utf8');
      expect(content).not.toContain('Article 1.');
      expect(content).toMatch(/l\. Parties/);
    });
  }
});

// ------------------------------------------------------------------ //
// --no-clauses
// ------------------------------------------------------------------ //
describe('--no-clauses', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] keeps clause syntax unprocessed`, async () => {
      const out = path.join(tmpDir, `${target.name}-no-clauses.md`);
      await target.run(
        `--no-clauses "${path.join(FIXTURES, 'full.md')}" "${out}"`
      );
      const content = fs.readFileSync(out, 'utf8');
      expect(content).toContain('{include_warranty}');
    });
  }
});

// ------------------------------------------------------------------ //
// --no-references
// ------------------------------------------------------------------ //
describe('--no-references', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] keeps pipe references unresolved`, async () => {
      const out = path.join(tmpDir, `${target.name}-no-refs.md`);
      await target.run(
        `--no-references "${path.join(FIXTURES, 'full.md')}" "${out}"`
      );
      const content = fs.readFileSync(out, 'utf8');
      expect(content).toContain('|client_name|');
    });
  }
});

// ------------------------------------------------------------------ //
// --no-imports
// ------------------------------------------------------------------ //
describe('--no-imports', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] skips @import, imported content absent`, async () => {
      const out = path.join(tmpDir, `${target.name}-no-imports.md`);
      await target.run(
        `--no-imports "${path.join(FIXTURES, 'with-import.md')}" "${out}"`
      );
      const content = fs.readFileSync(out, 'utf8');
      expect(content).not.toContain('imported clause');
    });
  }
});

// ------------------------------------------------------------------ //
// --no-mixins  (skips @include directives, not {{}} fields)
// ------------------------------------------------------------------ //
describe('--no-mixins', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] exits 0`, async () => {
      const out = path.join(tmpDir, `${target.name}-no-mixins.md`);
      const { exitCode } = await target.run(
        `--no-mixins "${path.join(FIXTURES, 'full.md')}" "${out}"`
      );
      expect(exitCode).toBe(0);
    });
  }
});

// ------------------------------------------------------------------ //
// --no-reset / --no-indent
// ------------------------------------------------------------------ //
describe('--no-reset', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] exits 0`, async () => {
      const { exitCode } = await target.run(
        `--no-reset "${path.join(FIXTURES, 'full.md')}"`
      );
      expect(exitCode).toBe(0);
    });
  }
});

describe('--no-indent', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] sub-headers are not indented with spaces`, async () => {
      const out = path.join(tmpDir, `${target.name}-no-indent.md`);
      await target.run(
        `--no-indent "${path.join(FIXTURES, 'full.md')}" "${out}"`
      );
      const content = fs.readFileSync(out, 'utf8');
      expect(content).not.toMatch(/^  Section/m);
    });
  }
});

// ------------------------------------------------------------------ //
// --throwOnYamlError
// ------------------------------------------------------------------ //
describe('--throwOnYamlError', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] exits 1 on invalid YAML`, async () => {
      const { exitCode } = await target.run(
        `--throwOnYamlError "${path.join(FIXTURES, 'invalid-yaml.md')}"`
      );
      expect(exitCode).toBe(1);
    });

    it(`[${target.name}] exits 0 on valid YAML`, async () => {
      const { exitCode } = await target.run(
        `--throwOnYamlError "${path.join(FIXTURES, 'minimal.md')}"`
      );
      expect(exitCode).toBe(0);
    });
  }
});

// ------------------------------------------------------------------ //
// --to-markdown
// ------------------------------------------------------------------ //
describe('--to-markdown', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] exits 0`, async () => {
      const { exitCode } = await target.run(
        `--to-markdown "${path.join(FIXTURES, 'minimal.md')}"`
      );
      expect(exitCode).toBe(0);
    });
  }
});

// ------------------------------------------------------------------ //
// --stdin / --stdout
// ------------------------------------------------------------------ //
describe('--stdin --stdout', () => {
  it('[node] reads from stdin and writes to stdout', async () => {
    const content = fs.readFileSync(path.join(FIXTURES, 'stdin.md'), 'utf8');
    const { stdout, exitCode } = await run(
      `echo "${content.replace(/"/g, '\\"')}" | node "${NODE_CLI}"`,
      '--stdin --stdout'
    );
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Pipe Corp');
  });
});

describe('--stdin with binary formats', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] writes DOCX to file when --stdin is used`, async () => {
      const content = fs.readFileSync(path.join(FIXTURES, 'minimal.md'), 'utf8');
      const out = path.join(tmpDir, `${target.name}-stdin.docx`);
      const cliCmd =
        target.name === 'node' ? `node "${NODE_CLI}"` : BINARY_CMD;

      const { exitCode } = await run(
        `echo "${content.replace(/"/g, '\\"')}" | ${cliCmd}`,
        `--stdin --docx "${out}"`
      );

      expect(exitCode).toBe(0);
      expect(fs.existsSync(out)).toBe(true);
      expect(fs.statSync(out).size).toBeGreaterThan(0);
    });

    it(`[${target.name}] rejects --stdin --docx --stdout`, async () => {
      const content = fs.readFileSync(path.join(FIXTURES, 'minimal.md'), 'utf8');
      const cliCmd =
        target.name === 'node' ? `node "${NODE_CLI}"` : BINARY_CMD;

      const { stderr, exitCode } = await run(
        `echo "${content.replace(/"/g, '\\"')}" | ${cliCmd}`,
        '--stdin --docx --stdout'
      );

      expect(exitCode).toBe(1);
      expect(stderr).toContain('--docx cannot be used with --stdout');
    });

    it(`[${target.name}] rejects --stdin --pdf --stdout`, async () => {
      const content = fs.readFileSync(path.join(FIXTURES, 'minimal.md'), 'utf8');
      const cliCmd =
        target.name === 'node' ? `node "${NODE_CLI}"` : BINARY_CMD;

      const { stderr, exitCode } = await run(
        `echo "${content.replace(/"/g, '\\"')}" | ${cliCmd}`,
        '--stdin --pdf --stdout'
      );

      expect(exitCode).toBe(1);
      expect(stderr).toContain('binary formats cannot be used with --stdout');
    });
  }
});

describe('--stdout', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] writes processed content to stdout`, async () => {
      const { stdout, exitCode } = await target.run(
        `--stdout "${path.join(FIXTURES, 'full.md')}"`
      );
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Article 1.');
    });
  }
});

// ------------------------------------------------------------------ //
// --export-yaml / --export-json / --output-path
// ------------------------------------------------------------------ //
describe('--export-yaml', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] creates metadata.yaml with title field`, async () => {
      const metaDir = path.join(tmpDir, `${target.name}-export-yaml`);
      fs.mkdirSync(metaDir);
      const out = path.join(metaDir, 'out.md');
      await target.run(
        `--export-yaml --output-path "${metaDir}" "${path.join(FIXTURES, 'full.md')}" "${out}"`
      );
      const metaFile = path.join(metaDir, 'metadata.yaml');
      expect(fs.existsSync(metaFile)).toBe(true);
      expect(fs.readFileSync(metaFile, 'utf8')).toContain('title:');
    });
  }
});

describe('--export-json', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] creates metadata.json with title field`, async () => {
      const metaDir = path.join(tmpDir, `${target.name}-export-json`);
      fs.mkdirSync(metaDir);
      const out = path.join(metaDir, 'out.md');
      await target.run(
        `--export-json --output-path "${metaDir}" "${path.join(FIXTURES, 'full.md')}" "${out}"`
      );
      const metaFile = path.join(metaDir, 'metadata.json');
      expect(fs.existsSync(metaFile)).toBe(true);
      expect(JSON.parse(fs.readFileSync(metaFile, 'utf8'))).toHaveProperty(
        'title'
      );
    });
  }
});

// ------------------------------------------------------------------ //
// --html / --highlight / --title / --css
// ------------------------------------------------------------------ //
describe('--html to file', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] creates HTML file with <html> tag`, async () => {
      const out = path.join(tmpDir, `${target.name}-output.html`);
      const { exitCode } = await target.run(
        `--html "${path.join(FIXTURES, 'full.md')}" "${out}"`
      );
      expect(exitCode).toBe(0);
      expect(fs.existsSync(out)).toBe(true);
      expect(fs.readFileSync(out, 'utf8')).toContain('<html');
    });
  }
});

describe('--html --title', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] sets document title in HTML file`, async () => {
      const out = path.join(tmpDir, `${target.name}-titled.html`);
      await target.run(
        `--html --title "My Contract" "${path.join(FIXTURES, 'full.md')}" "${out}"`
      );
      expect(fs.readFileSync(out, 'utf8')).toContain('My Contract');
    });
  }
});

describe('--html --highlight', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] adds CSS class attributes to HTML output`, async () => {
      const out = path.join(tmpDir, `${target.name}-highlight.html`);
      await target.run(
        `--html --highlight "${path.join(FIXTURES, 'full.md')}" "${out}"`
      );
      expect(fs.readFileSync(out, 'utf8')).toContain('class=');
    });
  }
});

describe('--html --css', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] injects custom CSS into HTML output`, async () => {
      const cssFile = path.join(tmpDir, 'custom.css');
      fs.writeFileSync(cssFile, 'body { color: red; }');
      const out = path.join(tmpDir, `${target.name}-css.html`);
      await target.run(
        `--html --css "${cssFile}" "${path.join(FIXTURES, 'full.md')}" "${out}"`
      );
      expect(fs.readFileSync(out, 'utf8')).toContain('color: red');
    });
  }
});

// ------------------------------------------------------------------ //
// --enable-field-tracking
// ------------------------------------------------------------------ //
describe('--enable-field-tracking', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] injects field-tracking spans in markdown output`, async () => {
      const fixture = path.join(tmpDir, `${target.name}-tracking-input.md`);
      fs.writeFileSync(
        fixture,
        `---
name: Alice
---

Hello {{name}}
`
      );

      const out = path.join(tmpDir, `${target.name}-tracking.md`);
      const { exitCode } = await target.run(
        `--enable-field-tracking "${fixture}" "${out}"`
      );
      expect(exitCode).toBe(0);

      const content = fs.readFileSync(out, 'utf8');
      expect(content).toContain('data-field="name"');
      expect(content).toContain('class="legal-field imported-value"');
      expect(content).not.toContain('{{name}}');
    }, 30_000);
  }
});

// ------------------------------------------------------------------ //
// --ast-field-tracking
// ------------------------------------------------------------------ //
describe('--ast-field-tracking', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] with field tracking emits tracked field spans and logic winner metadata`, async () => {
      const fixture = path.join(tmpDir, `${target.name}-ast-tracking-input.md`);
      fs.writeFileSync(
        fixture,
        `---
score: 85
threshold: 70
name: Alice
---

Hello {{name}}
{{#if (gt score threshold)}}
Winner branch
{{else}}
Loser branch
{{/if}}
`
      );

      const out = path.join(tmpDir, `${target.name}-ast-tracking.md`);
      const { exitCode } = await target.run(
        `--enable-field-tracking --ast-field-tracking "${fixture}" "${out}"`
      );
      expect(exitCode).toBe(0);

      const content = fs.readFileSync(out, 'utf8');
      expect(content).toContain('data-field="name"');
      expect(content).toContain('data-field="logic.branch.1"');
      expect(content).toContain('data-logic-helper="if"');
      expect(content).toContain('data-logic-result="true"');
      expect(content).not.toContain('Loser branch');
      expect(content).not.toContain('<lm-field');
      expect(content).not.toContain('<lm-logic');
    });

    it(`[${target.name}] alone keeps resolved text without leaking internal tracking tokens`, async () => {
      const fixture = path.join(tmpDir, `${target.name}-ast-only-input.md`);
      fs.writeFileSync(
        fixture,
        `---
name: Alice
---

Hello {{name}}
`
      );

      const out = path.join(tmpDir, `${target.name}-ast-only.md`);
      const { exitCode } = await target.run(`--ast-field-tracking "${fixture}" "${out}"`);
      expect(exitCode).toBe(0);

      const content = fs.readFileSync(out, 'utf8');
      expect(content).toContain('Hello Alice');
      expect(content).not.toContain('{{name}}');
      expect(content).not.toContain('<lm-field');
      expect(content).not.toContain('<lm-logic');
    });
  }
});

// ------------------------------------------------------------------ //
// --logic-branch-highlighting
// ------------------------------------------------------------------ //
describe('--logic-branch-highlighting', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] with field tracking annotates winner branch metadata`, async () => {
      const fixture = path.join(tmpDir, `${target.name}-logic-branches-input.md`);
      fs.writeFileSync(
        fixture,
        `---
score: 85
threshold: 70
---

{{#if (gt score threshold)}}
Winner branch
{{else}}
Loser branch
{{/if}}
`
      );

      const out = path.join(tmpDir, `${target.name}-logic-branches.md`);
      const { exitCode } = await target.run(
        `--enable-field-tracking --logic-branch-highlighting "${fixture}" "${out}"`
      );
      expect(exitCode).toBe(0);

      const content = fs.readFileSync(out, 'utf8');
      expect(content).toContain('Winner branch');
      expect(content).not.toContain('Loser branch');
      expect(content).toContain('data-field="logic.branch.1"');
      expect(content).toContain('data-logic-helper="if"');
      expect(content).toContain('data-logic-result="true"');
    });

    it(`[${target.name}] alone keeps winner text without logic metadata spans`, async () => {
      const fixture = path.join(tmpDir, `${target.name}-logic-only-input.md`);
      fs.writeFileSync(
        fixture,
        `---
score: 85
threshold: 70
---

{{#if (gt score threshold)}}
Winner branch
{{else}}
Loser branch
{{/if}}
`
      );

      const out = path.join(tmpDir, `${target.name}-logic-only.md`);
      const { exitCode } = await target.run(`--logic-branch-highlighting "${fixture}" "${out}"`);
      expect(exitCode).toBe(0);

      const content = fs.readFileSync(out, 'utf8');
      expect(content).toContain('Winner branch');
      expect(content).not.toContain('Loser branch');
      expect(content).not.toContain('data-logic-helper=');
      expect(content).not.toContain('data-logic-result=');
      expect(content).not.toContain('<lm-logic');
    });
  }
});

// ------------------------------------------------------------------ //
// --disable-frontmatter-merge
// ------------------------------------------------------------------ //
describe('--disable-frontmatter-merge', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] exits 0`, async () => {
      const out = path.join(tmpDir, `${target.name}-no-fm-merge.md`);
      const { exitCode } = await target.run(
        `--disable-frontmatter-merge "${path.join(FIXTURES, 'with-import.md')}" "${out}"`
      );
      expect(exitCode).toBe(0);
    });
  }
});

// ------------------------------------------------------------------ //
// --pdf / --pdf-connector
// ------------------------------------------------------------------ //
describe('--pdf', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] creates a PDF file when backend is available`, async () => {
      const out = path.join(tmpDir, `${target.name}-output.pdf`);
      const { exitCode } = await target.run(
        `--pdf "${path.join(FIXTURES, 'minimal.md')}" "${out}"`
      );
      if (exitCode === 0) {
        expect(fs.existsSync(out)).toBe(true);
      } else {
        // PDF backend not available in this environment - skip gracefully
        console.warn(
          `[${target.name}] PDF backend not available (exit ${exitCode})`
        );
      }
    });
  }
});

describe('--pdf-connector invalid', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] exits 1 for unknown connector value`, async () => {
      const { exitCode } = await target.run(
        `--pdf-connector badvalue "${path.join(FIXTURES, 'minimal.md')}"`
      );
      expect(exitCode).toBe(1);
    });
  }
});

describe('--pdf-connector explicit backends', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] uses puppeteer backend explicitly`, async () => {
      const out = path.join(tmpDir, `${target.name}-puppeteer-output.pdf`);
      const { exitCode, stderr } = await target.run(
        `--pdf --pdf-connector puppeteer "${path.join(FIXTURES, 'minimal.md')}" "${out}"`
      );

      expect(exitCode, stderr).toBe(0);
      expect(fs.existsSync(out)).toBe(true);
      expect(fs.statSync(out).size).toBeGreaterThan(0);
    });

    it(`[${target.name}] uses weasyprint backend explicitly`, async () => {
      const out = path.join(tmpDir, `${target.name}-weasyprint-output.pdf`);
      const { exitCode, stderr } = await target.run(
        `--pdf --pdf-connector weasyprint "${path.join(FIXTURES, 'minimal.md')}" "${out}"`
      );

      expect(exitCode, stderr).toBe(0);
      expect(fs.existsSync(out)).toBe(true);
      expect(fs.statSync(out).size).toBeGreaterThan(0);
    });
  }
});

// ------------------------------------------------------------------ //
// --archive-source
// ------------------------------------------------------------------ //
describe('--archive-source', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] archives source file after processing`, async () => {
      const src = path.join(tmpDir, `${target.name}-archive-src.md`);
      const out = path.join(tmpDir, `${target.name}-archive-out.md`);
      const archiveDir = path.join(tmpDir, `${target.name}-archive`);
      fs.mkdirSync(archiveDir);
      fs.copyFileSync(path.join(FIXTURES, 'minimal.md'), src);
      const { exitCode } = await target.run(
        `--archive-source "${archiveDir}" "${src}" "${out}"`
      );
      expect(exitCode).toBe(0);
      expect(fs.existsSync(out)).toBe(true);
      expect(fs.readdirSync(archiveDir).length).toBeGreaterThan(0);
    });
  }
});

// ------------------------------------------------------------------ //
// config subcommand
// ------------------------------------------------------------------ //
describe('config subcommand', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] config show exits 0 and contains paths key`, async () => {
      const { stdout, exitCode } = await target.run('config show');
      expect(exitCode).toBe(0);
      expect(stdout).toContain('paths');
    });

    it(`[${target.name}] config get paths.input exits 0`, async () => {
      const { exitCode } = await target.run('config get paths.input');
      expect(exitCode).toBe(0);
    });

    it(`[${target.name}] config get nonexistent.key exits 1`, async () => {
      const { exitCode } = await target.run('config get nonexistent.key.xyz');
      expect(exitCode).toBe(1);
    });

    it(`[${target.name}] config bogus action exits 1`, async () => {
      const { exitCode } = await target.run('config bogus');
      expect(exitCode).toBe(1);
    });
  }
});

// ------------------------------------------------------------------ //
// Combinations
// ------------------------------------------------------------------ //
describe('Combinations', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] --debug + --export-json produces Metadata and Exported files`, async () => {
      const metaDir = path.join(tmpDir, `${target.name}-combo`);
      fs.mkdirSync(metaDir);
      const out = path.join(metaDir, 'out.md');
      const { stdout, exitCode } = await target.run(
        `--debug --export-json --output-path "${metaDir}" "${path.join(FIXTURES, 'full.md')}" "${out}"`
      );
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Metadata:');
      expect(stdout).toContain('Exported files:');
      expect(fs.existsSync(path.join(metaDir, 'metadata.json'))).toBe(true);
    });

    it(`[${target.name}] all --no-X flags keep raw markers`, async () => {
      const out = path.join(tmpDir, `${target.name}-all-skip.md`);
      await target.run(
        `--no-headers --no-clauses --no-references --no-mixins "${path.join(FIXTURES, 'full.md')}" "${out}"`
      );
      const content = fs.readFileSync(out, 'utf8');
      expect(content).toMatch(/l\. Parties/);
      expect(content).toContain('|client_name|');
      expect(content).toContain('{include_warranty}');
    });
  }
});

// ------------------------------------------------------------------ //
// Edge cases
// ------------------------------------------------------------------ //
describe('Edge cases', () => {
  for (const target of TARGETS) {
    it(`[${target.name}] empty file exits 0`, async () => {
      const empty = path.join(tmpDir, 'empty.md');
      fs.writeFileSync(empty, '');
      const { exitCode } = await target.run(`"${empty}"`);
      expect(exitCode).toBe(0);
    });

    it(`[${target.name}] file with no YAML frontmatter exits 0`, async () => {
      const noYaml = path.join(tmpDir, 'no-yaml.md');
      fs.writeFileSync(noYaml, 'Just plain content.');
      const { exitCode } = await target.run(`"${noYaml}"`);
      expect(exitCode).toBe(0);
    });

    it(`[${target.name}] output to nested nonexistent dir auto-creates it`, async () => {
      const nestedOut = path.join(tmpDir, 'deep', 'nested', 'out.md');
      const { exitCode } = await target.run(
        `"${path.join(FIXTURES, 'minimal.md')}" "${nestedOut}"`
      );
      expect(exitCode).toBe(0);
      expect(fs.existsSync(nestedOut)).toBe(true);
    });
  }
});
