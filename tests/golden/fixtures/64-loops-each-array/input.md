---
signers:
  - name: Alice
    role: CEO
  - name: Bob
    role: CFO
---

Signers:
{{#each signers}}
- {{name}} ({{role}})
{{/each}}
