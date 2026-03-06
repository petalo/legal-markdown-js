---
title: "Locale Mixed Contract"
locale: en
day: 21
effective_date: "2025-06-15"
amount: 1234.56
---

# {{title}}

- Default ordinal (config/frontmatter locale): {{ordinal day}}
- Inline French ordinal override: {{ordinal day "fr"}}
- English date: {{formatDate effective_date "MMMM DD, YYYY"}}
- Inline Spanish date: {{formatDate effective_date "DD de MMMM de YYYY" "es"}}
- Inline German currency: {{formatCurrency amount "EUR" 2 "de"}}
