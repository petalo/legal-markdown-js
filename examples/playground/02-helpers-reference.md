---
title: Helpers & Handlebars Reference
name: john doe
company: acme corporation
sentence: "  the quick   brown FOX  "
amount: 50000
price: 149.956
quantity: 12
taxRate: 0.085
bigNumber: 1234567
negative: -42
startDate: 2026-01-15
products:
  - name: Alpha
    value: 100
  - name: Beta
    value: 200
  - name: Gamma
    value: 300
names:
  - Alpha
  - Beta
  - Gamma
active: true
premium: false
score: 85
threshold: 70
level-1: "%n."
level-2: "%l1.%n"
level-3: "%l1.%l2.%n"
---

# {{title}}

_A complete reference of every helper available in Legal Markdown JS._

---

l. String Helpers

```yaml
name: john doe
```

ll. Case Conversion

| Helper | Input | Output |
|--------|-------|--------|
| `\{{capitalize name}}` | {{capitalize name}} | first letter upper |
| `\{{capitalizeWords name}}` | {{capitalizeWords name}} | each word upper |
| `\{{upper name}}` | {{upper name}} | all uppercase |
| `\{{lower "HELLO WORLD"}}` | {{lower "HELLO WORLD"}} | all lowercase |
| `\{{titleCase "a tale of two cities"}}` | {{titleCase "a tale of two cities"}} | smart title case |

ll. Case Format Conversion

```yaml
company: acme corporation
```

| Helper | Input | Output |
|--------|-------|--------|
| `\{{camelCase company}}`| {{camelCase company}} | camelCase |
| `\{{pascalCase company}}` | {{pascalCase company}} | PascalCase |
| `\{{kebabCase company}}` | {{kebabCase company}} | kebab-case |
| `\{{snakeCase company}}` | {{snakeCase company}} | snake_case |

ll. String Manipulation

```yaml
name: john doe
company: acme corporation
sentence: "  the quick   brown FOX  "
names:
  - Alpha
  - Beta
  - Gamma
products:
  - name: Alpha
    value: 100
  - name: Beta
    value: 200
  - name: Gamma
    value: 300
premium: false
```

| Helper | Output |
|--------|--------|
| `\{{initials name}}` | {{initials name}} |
| `\{{truncate company 15 "..."}}` | {{truncate company 15 "..."}} |
| `\{{clean sentence}}` | {{clean sentence}} |
| `\{{replaceAll name " " "_"}}` | {{replaceAll name " " "_"}} |
| `\{{padStart "42" 8 "0"}}` | {{padStart "42" 8 "0"}} |
| `\{{padEnd "42" 8 "0"}}` | {{padEnd "42" 8 "0"}} |
| `\{{pluralize "item" 1}}` | {{pluralize "item" 1}} |
| `\{{pluralize "item" 5}}` | {{pluralize "item" 5}} |
| `\{{join names ", "}}` | {{join names ", "}} |
| `\{{length products}}` | {{length products}} items |
| `\{{default premium "N/A"}}` | {{default premium "N/A"}} |
| `\{{concat "REF-" (padStart "42" 4 "0") "-A"}}` | {{concat "REF-" (padStart "42" 4 "0") "-A"}} |

l. Number Helpers

```yaml
amount: 50000
```

ll. Currency Formatting

| Helper | Output |
|--------|--------|
| `\{{formatDollar amount}}` | {{formatDollar amount}} |
| `\{{formatEuro amount}}` | {{formatEuro amount}} |
| `\{{formatPound amount}}` | {{formatPound amount}} |
| `\{{formatCurrency amount "USD"}}` | {{formatCurrency amount "USD"}} |
| `\{{formatCurrency amount "EUR"}}` | {{formatCurrency amount "EUR"}} |

ll. Number Formatting

```yaml
bigNumber: 1234567
taxRate: 0.085
price: 149.956
negative: -42
```

| Helper | Output |
|--------|--------|
| `\{{formatInteger bigNumber}}` | {{formatInteger bigNumber}} |
| `\{{formatInteger bigNumber "."}}` | {{formatInteger bigNumber "."}} |
| `\{{formatPercent taxRate 2}}` | {{formatPercent taxRate 2}} |
| `\{{numberToWords amount}}` | {{numberToWords amount}} |
| `\{{round price 2}}` | {{round price 2}} |
| `\{{round price 0}}` | {{round price 0}} |
| `\{{ordinal 1}}` | {{ordinal 1}} |
| `\{{ordinal 2}}` | {{ordinal 2}} |
| `\{{ordinal 3}}` | {{ordinal 3}} |
| `\{{ordinal 23}}` | {{ordinal 23}} |
| `\{{abs negative}}` | {{abs negative}} |
| `\{{max 10 25}}` | {{max 10 25}} |
| `\{{min 10 25}}` | {{min 10 25}} |

l. Math Helpers

```yaml
price: 149.956
quantity: 12
```

| Helper | Expression | Output |
|--------|-----------|--------|
| `\{{add 10 5}}` | 10 + 5 | {{add 10 5}} |
| `\{{subtract 10 3}}` | 10 - 3 | {{subtract 10 3}} |
| `\{{multiply 12 8}}` | 12 x 8 | {{multiply 12 8}} |
| `\{{divide 100 4}}` | 100 / 4 | {{divide 100 4}} |
| `\{{modulo 17 5}}` | 17 mod 5 | {{modulo 17 5}} |
| `\{{power 2 10}}` | 2^10 | {{power 2 10}} |

**Chained math:** Price x Qty = {{formatDollar (multiply price quantity)}}

l. Date Helpers

```yaml
startDate: 2026-01-15
```

ll. Wrapped @today Syntax

| Format | Output |
|--------|--------|
| `\{{@today}}` | {{@today}} |
| `\{{@today[ISO]}}` | {{@today[ISO]}} |
| `\{{@today[long]}}` | {{@today[long]}} |
| `\{{@today[legal]}}` | {{@today[legal]}} |
| `\{{@today[EU]}}` | {{@today[EU]}} |
| `\{{@today[medium]}}` | {{@today[medium]}} |
| `\{{@today+30d}}` | {{@today+30d}} |
| `\{{@today+1y}}` | {{@today+1y}} |
| `\{{@today+6m}}` | {{@today+6m}} |
| `\{{@today-90d}}` | {{@today-90d}} |

ll. Date Helpers with Variables

```yaml
startDate: 2026-01-15
```

| Helper | Output |
|--------|--------|
| `\{{formatDate startDate "YYYY-MM-DD"}}` | {{formatDate startDate "YYYY-MM-DD"}} |
| `\{{formatDate startDate "MMMM D, YYYY"}}` | {{formatDate startDate "MMMM D, YYYY"}} |
| `\{{formatDate startDate "dddd, MMMM Do, YYYY"}}` | {{formatDate startDate "dddd, MMMM Do, YYYY"}} |
| `\{{formatDate startDate "DD/MM/YYYY"}}` | {{formatDate startDate "DD/MM/YYYY"}} |
| `\{{formatDate startDate "MMMM YYYY"}}` | {{formatDate startDate "MMMM YYYY"}} |
| `\{{formatDate (addYears startDate 2) "MMMM D, YYYY"}}` | {{formatDate (addYears startDate 2) "MMMM D, YYYY"}} |
| `\{{formatDate (addMonths startDate 6) "MMMM D, YYYY"}}` | {{formatDate (addMonths startDate 6) "MMMM D, YYYY"}} |
| `\{{formatDate (addDays startDate 30) "MMMM D, YYYY"}}` | {{formatDate (addDays startDate 30) "MMMM D, YYYY"}} |
| `\{{formatDate (addDays startDate -90) "MMMM D, YYYY"}}` | {{formatDate (addDays startDate -90) "MMMM D, YYYY"}} |

l. Logic and Conditionals

```yaml
score: 85
threshold: 70
active: true
premium: false
```

ll. Comparison Helpers (used inside #if)

Score is {{score}}, threshold is {{threshold}}:
{{#if (gt score threshold)}}

- Score **exceeds** the threshold (gt = true)
{{/if}}
{{#if (gte score threshold)}}
- Score **meets or exceeds** the threshold (gte = true)
{{/if}}
{{#if (neq score threshold)}}
- Score **differs from** the threshold (neq = true)
{{/if}}

ll. Boolean Logic

{{#if (and active (not premium))}}

- Active AND not premium: **both conditions met**
{{/if}}
{{#if (or active premium)}}
- Active OR premium: **at least one is true**
{{/if}}

ll. Conditional Block: #if / #else

{{#if premium}}
Premium features are enabled.
{{else}}
Standard features only. Upgrade to premium for more.
{{/if}}

ll. Inverse Conditional: #unless

{{#unless premium}}
This text appears because premium is **false** (unless = inverse of if).
{{/unless}}

ll. Optional Clause Syntax

[This clause appears because active is **true**.]{active}
[This clause is hidden because premium is **false**.]{premium}

l. Loops and Iteration

```yaml
title: Helpers & Handlebars Reference
products:
  - name: Alpha
    value: 100
  - name: Beta
    value: 200
  - name: Gamma
    value: 300
```

ll. Basic #each Loop

{{#each products}}

- {{ordinal (add @index 1)}}: **{{name}}** = {{formatDollar value}}
{{/each}}

ll. Loop Variables

{{#each products}}
{{#if @first}}_First item:_ {{/if}}{{#if @last}}_Last item:_ {{/if}}{{name}} (index: {{@index}})
{{/each}}

ll. Nested Context Access

{{#each products}}

- {{name}} (from list "{{../title}}")
{{/each}}

l. Signature Lines

```yaml
vars_used: none
```

Signature lines are auto-detected (10+ underscores):

Signature: ____________________________

Date: ____________________
