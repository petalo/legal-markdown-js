---
title: Helper Tracking Consistency
company_name: acme corporation
negative: -42
a: 10
b: 25
text: abc
items:
  - alpha
  - beta
---

# {{title}}

- camel: {{camelCase company_name}}
- pascal: {{pascalCase company_name}}
- kebab: {{kebabCase company_name}}
- snake: {{snakeCase company_name}}
- abs: {{abs negative}}
- max: {{max a b}}
- min: {{min a b}}
- modulo: {{modulo 17 5}}
- power: {{power 2 10}}
- concat: {{concat "REF-" (padStart "42" 4 "0") "-A"}}

{{#if (contains text "z")}}
- contains z: yes
{{else}}
- contains z: no
{{/if}}

{{#if (length items)}}
- items exist: yes
{{else}}
- items exist: no
{{/if}}
