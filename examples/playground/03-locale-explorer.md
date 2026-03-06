---
title: Locale Explorer
locale: en
amount: 125750.50
contractDate: 2026-07-16
level-1: '%n.'
level-2: '%l1.%n'
---

# {{title}}

_Change the \`locale\` field in the YAML frontmatter to see how the **Current** column changes._\
_Try: **en**, **es**, **fr**, **de**, **pt**, **it**_

**Current locale:** {{locale}}

---

l. Date Formatting

ll. Month and Day Names

The **Current** column reflects the \`locale\` frontmatter field. The other columns use an explicit locale argument.

| Format | Current | EN | ES | FR | DE |
| --- | --- | --- | --- | --- | --- |
| Full month | {{formatDate contractDate "MMMM"}} | {{formatDate contractDate "MMMM" "en"}} | {{formatDate contractDate "MMMM" "es"}} | {{formatDate contractDate "MMMM" "fr"}} | {{formatDate contractDate "MMMM" "de"}} |
| Short month | {{formatDate contractDate "MMM"}} | {{formatDate contractDate "MMM" "en"}} | {{formatDate contractDate "MMM" "es"}} | {{formatDate contractDate "MMM" "fr"}} | {{formatDate contractDate "MMM" "de"}} |
| Full date | {{formatDate contractDate "MMMM D, YYYY"}} | {{formatDate contractDate "MMMM D, YYYY" "en"}} | {{formatDate contractDate "MMMM D, YYYY" "es"}} | {{formatDate contractDate "MMMM D, YYYY" "fr"}} | {{formatDate contractDate "MMMM D, YYYY" "de"}} |
| Formal | {{formatDate contractDate "dddd, MMMM Do, YYYY"}} | {{formatDate contractDate "dddd, MMMM Do, YYYY" "en"}} | {{formatDate contractDate "dddd, MMMM Do, YYYY" "es"}} | {{formatDate contractDate "dddd, MMMM Do, YYYY" "fr"}} | {{formatDate contractDate "dddd, MMMM Do, YYYY" "de"}} |
| Day + Month | {{formatDate contractDate "Do MMMM YYYY"}} | {{formatDate contractDate "Do MMMM YYYY" "en"}} | {{formatDate contractDate "Do MMMM YYYY" "es"}} | {{formatDate contractDate "Do MMMM YYYY" "fr"}} | {{formatDate contractDate "Do MMMM YYYY" "de"}} |

ll. Locale-Independent Format Styles

These numeric formats are not affected by locale:

| Style | Output |
| --- | --- |
| ISO | {{formatDate contractDate "YYYY-MM-DD"}} |
| US | {{formatDate contractDate "MM/DD/YYYY"}} |
| EU | {{formatDate contractDate "DD/MM/YYYY"}} |
| Long | {{formatDate contractDate "MMMM D, YYYY"}} |
| Month-Year | {{formatDate contractDate "MMMM YYYY"}} |

ll. Today with Formats

| Syntax | Output |
| --- | --- |
| `\{{@today}}` | {{@today}} |
| `\{{@today[long]}}` | {{@today[long]}} |
| `\{{@today[legal]}}` | {{@today[legal]}} |
| `\{{@today+1y[long]}}` | {{@today+1y[long]}} |

l. Ordinal Numbers

Ordinal suffixes change by locale:

| Number | Current | EN | ES | FR | DE |
| --- | --- | --- | --- | --- | --- |
| 1 | {{ordinal 1}} | {{ordinal 1 "en"}} | {{ordinal 1 "es"}} | {{ordinal 1 "fr"}} | {{ordinal 1 "de"}} |
| 2 | {{ordinal 2}} | {{ordinal 2 "en"}} | {{ordinal 2 "es"}} | {{ordinal 2 "fr"}} | {{ordinal 2 "de"}} |
| 3 | {{ordinal 3}} | {{ordinal 3 "en"}} | {{ordinal 3 "es"}} | {{ordinal 3 "fr"}} | {{ordinal 3 "de"}} |
| 11 | {{ordinal 11}} | {{ordinal 11 "en"}} | {{ordinal 11 "es"}} | {{ordinal 11 "fr"}} | {{ordinal 11 "de"}} |
| 21 | {{ordinal 21}} | {{ordinal 21 "en"}} | {{ordinal 21 "es"}} | {{ordinal 21 "fr"}} | {{ordinal 21 "de"}} |

l. Currency Formatting

Number separators change by locale (`1,234.56` in EN vs `1.234,56` in ES/DE):

| Currency | Current | EN | ES | FR | DE |
| --- | --- | --- | --- | --- | --- |
| EUR | {{formatCurrency amount "EUR"}} | {{formatCurrency amount "EUR" 2 "en"}} | {{formatCurrency amount "EUR" 2 "es"}} | {{formatCurrency amount "EUR" 2 "fr"}} | {{formatCurrency amount "EUR" 2 "de"}} |
| USD | {{formatCurrency amount "USD"}} | {{formatCurrency amount "USD" 2 "en"}} | {{formatCurrency amount "USD" 2 "es"}} | {{formatCurrency amount "USD" 2 "fr"}} | {{formatCurrency amount "USD" 2 "de"}} |
| GBP | {{formatCurrency amount "GBP"}} | {{formatCurrency amount "GBP" 2 "en"}} | {{formatCurrency amount "GBP" 2 "es"}} | {{formatCurrency amount "GBP" 2 "fr"}} | {{formatCurrency amount "GBP" 2 "de"}} |

ll. Fixed-Format Shorthands

These ignore locale completely:

| Syntax | Output |
| --- | --- |
| `\{{formatEuro amount}}` | {{formatEuro amount}} |
| `\{{formatDollar amount}}` | {{formatDollar amount}} |
| `\{{formatPound amount}}` | {{formatPound amount}} |

l. Locale-Aware vs Fixed Helpers

ll. Locale-Aware Helpers

These helpers respond to the \`locale\` frontmatter field:

- **formatDate** - month names, day names (MMMM, MMM, dddd, ddd)
- **ordinal** - suffix conventions (1st / 1.o / 1er / 1.)
- **formatCurrency** - number formatting via Intl (for non-en locales)

To override globally, set \`locale:\` in the YAML frontmatter.\
To override per-expression, pass locale as the last argument: \`\{{formatDate date "MMMM" "es"}}\`.

ll. Fixed Helpers (locale-independent)

These helpers produce the same output regardless of locale:

- **numberToWords** - always English: {{numberToWords 42}}
- **formatDollar / formatEuro / formatPound** - fixed format
- **formatPercent** - fixed format: {{formatPercent 0.085 1}}
- **formatInteger** - fixed separator: {{formatInteger 1234567}}
- **All string helpers** - capitalize, upper, lower, etc.
- **All math helpers** - add, multiply, etc.

l. Sample Legal Clause

This is how a formatted legal clause looks in the current locale:

This Agreement is entered into on the {{ordinal (formatDate contractDate "D")}}
day of {{formatDate contractDate "MMMM"}}, {{formatDate contractDate "YYYY"}},
by and between the parties identified herein. The initial retainer of
{{formatCurrency amount "EUR"}} shall be payable within {{ordinal 30}} days of
the Effective Date. This Agreement shall remain in effect until
{{formatDate (addYears contractDate 2) "MMMM D, YYYY"}}.
