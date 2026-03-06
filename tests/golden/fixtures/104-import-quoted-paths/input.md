---
party: Acme Corp
---

# Import Path Variations

## Unquoted path

@import imports/simple.md

## Quoted path (double quotes)

@import "imports/quoted.md"

## Path with spaces (must use quotes)

@import "imports/legal docs/spaced file.md"

All three import styles should produce identical behavior.
