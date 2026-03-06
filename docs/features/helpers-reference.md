# Helpers Reference

This page lists the registered template helpers available in Legal Markdown.
Helper names and usage are aligned with the golden fixtures in
`tests/golden/fixtures/92-helpers-string` through
`tests/golden/fixtures/99-integration-all-features`.

> Important: helper names are exact. Use `upper` (not `uppercase`), `lower` (not
> `lowercase`), and `clean` (not `trim`).

## String Helpers

| Helper            | Usage                                  | Example                                                                   |
| ----------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| `upper`           | `{{upper text}}`                       | `"hello" → "HELLO"`                                                       |
| `lower`           | `{{lower text}}`                       | `"MADRID" → "madrid"`                                                     |
| `clean`           | `{{clean text}}`                       | `"  hello  " → "hello"`                                                   |
| `capitalize`      | `{{capitalize text}}`                  | `"processor" → "Processor"`                                               |
| `capitalizeWords` | `{{capitalizeWords text}}`             | `"north atlantic biotech ltd" → "North Atlantic Biotech Ltd"`             |
| `titleCase`       | `{{titleCase text}}`                   | `"notice of customer data handling" → "Notice Of Customer Data Handling"` |
| `truncate`        | `{{truncate text 50}}`                 | Truncates to max length                                                   |
| `pluralize`       | `{{pluralize "item" count}}`           | `count=3 → "items"`                                                       |
| `initials`        | `{{initials "Jean-Claude Van Damme"}}` | `"JCVD"`                                                                  |
| `contains`        | `{{contains text "search"}}`           | `true`/`false`                                                            |
| `replaceAll`      | `{{replaceAll text "-" " "}}`          | `"case-file" → "case file"`                                               |
| `concat`          | `{{concat a " " b}}`                   | Concatenates all arguments                                                |

## Number Helpers

| Helper           | Usage                              | Example                           |
| ---------------- | ---------------------------------- | --------------------------------- |
| `formatCurrency` | `{{formatCurrency 1234.56 "USD"}}` | `"$1,234.56"`                     |
| `formatPercent`  | `{{formatPercent 0.0875}}`         | `"8.8%"`                          |
| `formatInteger`  | `{{formatInteger 1450000}}`        | `"1,450,000"`                     |
| `round`          | `{{round 12.345 2}}`               | `"12.35"`                         |
| `numberToWords`  | `{{numberToWords 125000.5}}`       | Number written in words           |
| `padStart`       | `{{padStart "7" 3}}`               | `"  7"` (or custom pad character) |
| `padEnd`         | `{{padEnd "EU-9X" 10 "."}}`        | `"EU-9X....."`                    |

## Date Helpers

| Helper       | Usage                                 | Example                   |
| ------------ | ------------------------------------- | ------------------------- |
| `formatDate` | `{{formatDate date "MMMM DD, YYYY"}}` | `"June 15, 2025"`         |
| `addMonths`  | `{{addMonths date 12}}`               | Date shifted by 12 months |
| `addDays`    | `{{addDays date 30}}`                 | Date shifted by 30 days   |
| `addYears`   | `{{addYears date 5}}`                 | Date shifted by 5 years   |

## Math Helpers

| Helper     | Usage              | Example                |
| ---------- | ------------------ | ---------------------- |
| `add`      | `{{add a b}}`      | `8400 + 1764 = 10164`  |
| `subtract` | `{{subtract a b}}` | `12000 - 1450 = 10550` |
| `multiply` | `{{multiply a b}}` | `280 * 30 = 8400`      |
| `divide`   | `{{divide a b}}`   | `10120 / 4 = 2530`     |
| `modulo`   | `{{modulo a b}}`   | `3157 % 2 = 1`         |

## Comparison Helpers (for use in `{{#if}}`)

Use these helpers in `if`/`unless` subexpressions:

- `eq`, `neq`
- `gt`, `gte`, `lt`, `lte`
- `and`, `or`, `not`

See [Conditionals](./conditionals.md#comparison-helpers) for full examples and
inline operator conversion behavior.

## Notes on Non-Registered Helpers

The following names are **not** registered helpers and should not be used:

- `ordinal`
- `abs`
- `max`
- `min`

## Golden Fixture Examples

See `tests/golden/fixtures/92-helpers-string` through
`tests/golden/fixtures/99-integration-all-features` for complete working
examples.
