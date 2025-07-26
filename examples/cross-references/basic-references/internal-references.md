---
title: 'Internal Cross-References Example'
client_name: 'ACME Corporation'
service_provider: 'Tech Solutions Inc'
contract_value: 50000
effective_date: '2024-01-01'
level-one: 'Article %n.'
level-two: 'Section %n.'
level-three: '(%n)'
---

# {{title}}

This document demonstrates internal cross-references using pipe syntax.

l. **Contract Parties** |parties|

The client is {{client_name}} and the service provider is {{service_provider}}.
As defined in |parties|, both entities agree to the terms outlined below.

l. **Financial Terms** |financial|

The contract value is {{contract_value}} effective {{effective_date}}. Financial
obligations are detailed in |financial| and referenced throughout.

l. **Contract Details** |details|

This agreement is effective from {{effective_date}} between the parties defined
in |parties|:

ll. **Primary Obligations** |primary|

Primary obligations as outlined in |primary| include delivery and payment terms.

ll. **Secondary Obligations** |secondary|

Secondary obligations per |secondary| include maintenance and support.

l. **Dispute Resolution** |disputes|

Any disputes arising from |financial| or |details| shall be resolved according
to |disputes|.

l. **Summary** |summary|

Contract between parties per |parties| with financial terms in |financial| and
details in |details|. Disputes handled according to |disputes| as summarized in
|summary|.
