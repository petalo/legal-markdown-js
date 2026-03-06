# Date Processing

## Overview

Legal Markdown supports inline date tokens for template-style documents, with
`@today` as the most common built-in value. Date resolution runs in the async
remark pipeline and can use document metadata for formatting behavior.

## Syntax

Use wrapped tokens in markdown body content:

```markdown
This agreement is effective as of {{@today}}. Renewal date: {{@today+30d[US]}}.
Signed on {{formatDate @today "MMMM Do, YYYY"}}.
```

Supported patterns include:

- `{{@today}}`
- `{{@today[legal]}}`
- `{{@today+30d}}`
- `{{@today-7d[ISO]}}`
- `{{@today+1y}}`

## Configuration

You can control default date formatting through metadata:

```yaml
---
date-format: legal
timezone: America/New_York
---
```

- `date-format`: default format style for date token rendering
- `timezone`: optional timezone hint for formatting helpers/plugins

## Async Pipeline Behavior

Date processing happens in the async remark pipeline, not a legacy sync path. At
a high level:

1. Frontmatter metadata is parsed and merged.
2. Remark plugins run in configured order.
3. Date tokens (including `{{@today}}`) are resolved during plugin execution.
4. Stringify/output stages emit the final markdown/html/pdf content.

`processLegalMarkdown()` is async and returns a `Promise`, so date-resolved
output is available from awaited results.

## Source Files

- `src/plugins/remark/dates.ts`
- `src/extensions/helpers/advanced-date-helpers.ts`
- `src/core/helpers/date-helpers.ts`
