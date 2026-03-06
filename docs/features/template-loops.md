# Template Loops

Template loops allow you to iterate over arrays and objects in your Legal
Markdown documents using Handlebars block syntax.

## Basic Syntax

### Iterating Over Arrays

Use `{{#each}}` to loop over an array defined in your YAML front matter:

```yaml
---
items:
  - Apple
  - Banana
  - Cherry
---
```

```markdown
{{#each items}}

- {{this}} {{/each}}
```

Output:

```
- Apple
- Banana
- Cherry
```

### Object Arrays

When iterating over arrays of objects, access properties by name:

```yaml
---
products:
  - name: Laptop
    price: 999
  - name: Mouse
    price: 29
---
```

```markdown
{{#each products}}

- {{name}}: ${{price}} {{/each}}
```

## Special Variables

Inside an `{{#each}}` block, several special variables are available:

| Variable      | Type         | Description                                         |
| ------------- | ------------ | --------------------------------------------------- |
| `{{this}}`    | current item | The current iteration value (for primitive arrays)  |
| `{{@index}}`  | number       | Zero-based index of the current iteration           |
| `{{@total}}`  | number       | Total number of items in the array                  |
| `{{@first}}`  | boolean      | `true` on the first iteration                       |
| `{{@last}}`   | boolean      | `true` on the last iteration                        |
| `{{@parent}}` | object       | Access to the parent loop context (in nested loops) |

### Example with Special Variables

```markdown
{{#each items}} {{@index}}. {{this}}{{#unless @last}},{{/unless}} {{/each}}
```

## Dot Notation

You can iterate over nested properties using dot notation:

```yaml
---
services:
  included:
    - Water
    - Electricity
    - Internet
---
```

```markdown
{{#each services.included}}

- {{this}} {{/each}}
```

## Nested Loops

Loops can be nested up to 10 levels deep. Use `{{@parent}}` to access the outer
loop context:

```yaml
---
departments:
  - name: Engineering
    members:
      - Alice
      - Bob
  - name: Design
    members:
      - Carol
---
```

```markdown
{{#each departments}}

### {{name}}

{{#each members}}

- {{this}} (Department {{@parent.@index}}) {{/each}} {{/each}}
```

## Conditionals

Use `{{#if}}` and `{{#unless}}` for conditional rendering:

```markdown
{{#if active}} This contract is currently active. {{else}} This contract is
inactive. {{/if}}

{{#unless terminated}} The agreement remains in effect. {{/unless}}
```

## Context Scoping with `{{#with}}`

Use `{{#with}}` to scope into a nested object:

```yaml
---
client:
  name: Acme Corp
  contact:
    email: legal@acme.com
    phone: 555-0100
---
```

```markdown
{{#with client.contact}} Email: {{email}} Phone: {{phone}} {{/with}}
```

## Safety Limits

To prevent runaway processing, the engine enforces:

- **Maximum nesting depth**: 10 levels
- **Maximum iterations**: 10,000 total iterations across all loops

Exceeding these limits raises a `ProcessingError`.
