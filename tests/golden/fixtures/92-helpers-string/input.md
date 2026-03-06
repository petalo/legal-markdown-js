---
title: "Notice of Data Processing Activities"
company_name: "iberia legal systems s.l."
jurisdiction: "MADRID, SPAIN"
party_role: "processor"
document_title: "notice of customer data handling"
long_description: "This notice explains retention schedules, subprocessors, transfer safeguards, and complaint channels for enterprise clients under the master services agreement."
item_count: 3
raw_text: "case-file-2026-draft"
prefix: "Ref"
suffix: "A-77"
padded_text: "   Internal escalation contact list   "
---

# {{titleCase document_title}}

**{{upper company_name}}**

This {{capitalize party_role}} notice applies in {{lower jurisdiction}}.

## Executive Summary

{{truncate long_description 50}}

## Scope of Covered Materials

The Annex includes {{item_count}} {{pluralize "item" item_count}} of processing records.

## Signature Abbreviation

Authorized initials block: {{initials "Jean-Claude Van Damme"}}

## Jurisdiction Check

{{#if (contains jurisdiction "madrid")}}
Local counsel review is mandatory before publication.
{{else}}
Local counsel review is optional.
{{/if}}

## Data Cleanup and Assembly

Raw identifier: {{raw_text}}
Normalized identifier: {{replaceAll raw_text "-" " "}}
Reference label: {{concat prefix " " suffix}}
Trimmed note: {{clean padded_text}}
