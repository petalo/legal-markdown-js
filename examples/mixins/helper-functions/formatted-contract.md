---
title: Software License Agreement
client_name: Advanced Solutions Inc.
client_type: premium
parties:
  - name: TechCorp Inc.
    type: Corporation
    role: Licensor
  - name: Advanced Solutions Inc.
    type: LLC
    role: Licensee
effective_date: 2024-01-01
payment_days: 30
late_fees_apply: true
late_fee_percentage: 1.5
include_warranty: false
license_type: Enterprise
support_level: 'Premium 24/7 Support'
level-one: 'Article %n.'
level-two: 'Section %n.%s'
---

l. Agreement

This {{title}} ("Agreement") is entered into as of {{effective_date}} between
{{parties.0.name}}, a {{parties.0.type}} ("{{parties.0.role}}"), and
{{parties.1.name}}, a {{parties.1.type}} ("{{parties.1.role}}").

ll. License Grant

{{parties.0.role}} hereby grants to {{parties.1.role}} a {{license_type}}
license to use the Software.

ll. Payment Terms

Payment is due within {{payment_days}} days of invoice date.
{{late_fees_apply ? Late fees of 1.5% per month will apply to overdue amounts : Payments must be made on time}}.

ll. Support

{{parties.1.role}} will receive {{support_level}} as part of this Agreement.

ll. Warranty

{{include_warranty ? The Software is provided with a limited warranty as described in Exhibit A : THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND}}.
