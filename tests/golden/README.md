# Golden Fixtures

Golden fixtures provide a stable output baseline for
`processLegalMarkdownAsync`.

## Fixture layout

Each fixture lives in its own directory under `tests/golden/fixtures/` and
follows:

```text
tests/golden/fixtures/NN-category-name/
├── input.md                  # required
├── expected.md               # required
├── config.yaml               # optional
├── expected-metadata.yaml    # optional
└── imports/                  # optional, for @import cases
```

## Naming convention

Use: `NN-category-name`

- `NN` = numeric range by scenario family (e.g. `00`, `10`, `50`, `99`)
- `category-name` = short kebab-case description

Examples:

- `00-noop-passthrough`
- `21-headers-no-indent`
- `51-frontmatter-import-nested`

## `config.yaml` schema

Supported keys:

```yaml
options: # passed to processLegalMarkdownAsync options
  exportMetadata: true
  exportFormat: 'json'
  enableFieldTracking: false
  highlight: false

metadata: # injected as frontmatter override before processing
  key: value

expectedError: # if set, fixture expects a thrown error matching regex
  pattern: 'some regex'

skip: # if true, fixture is skipped
  reason: 'Pending feature X'

async: true # default true (runner uses async API only)
```

Notes:

- Runner always uses `processLegalMarkdownAsync`.
- Runner always passes `basePath: <fixtureDir>` so `@import` resolves within
  that fixture.

## Updating snapshots

Use update mode to regenerate `expected.md` and existing/needed metadata
snapshots:

```bash
UPDATE_GOLDEN=1 npx vitest run tests/golden/
```

Then run normally to verify:

```bash
npx vitest run tests/golden/
```

## Adding a new fixture

1. Create a new `NN-category-name` directory.
2. Add `input.md`.
3. Add optional `config.yaml` and `imports/` files.
4. Run snapshot update mode (`UPDATE_GOLDEN=1 ...`) to generate expected
   outputs.
5. Run golden tests normally and confirm they pass.
