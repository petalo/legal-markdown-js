---
client:
  name: Main Client
  contact:
    email: main@example.com
policy:
  limits:
    max_users: 10
---

@import imports/nested.md

Client: {{client.name}} Industry: {{client.industry}} Email:
{{client.contact.email}} Phone: {{client.contact.phone}} Max users:
{{policy.limits.max_users}} Storage: {{policy.limits.storage_gb}}
