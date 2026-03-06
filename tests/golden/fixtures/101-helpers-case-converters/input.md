---
contract_title: Service Level Agreement
field_name: monthly payment amount
api_endpoint: get user profile data
class_name: purchase order item
---

# Case Converter Helpers

These helpers convert text between common programming/naming conventions,
useful for generating identifiers, slugs, and formatted references in contracts.

## camelCase

API field: {{camelCase field_name}}

Endpoint: {{camelCase api_endpoint}}

## kebabCase

URL slug: {{kebabCase contract_title}}

CSS class: {{kebabCase class_name}}

## pascalCase

Type name: {{pascalCase class_name}}

Component: {{pascalCase api_endpoint}}

## snakeCase

Database column: {{snakeCase field_name}}

Environment var: {{upper (snakeCase contract_title)}}

## Combined usage

The {{pascalCase class_name}} entity (field: `{{camelCase field_name}}`,
column: `{{snakeCase field_name}}`, route: `/{{kebabCase api_endpoint}}`)
is defined in the {{titleCase contract_title}}.
