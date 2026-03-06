---
storeName: TechMart Store
cashierName: Alice Johnson
ticketNumber: "{{default ticketNumber '00000'}}"
receiptId: RCP-2024-{{ticketNumber}}
taxRate: 8.5
---

# Purchase Ticket - {{ticketNumber}}

**Date:** @today **Store:** {{storeName}}  
**Cashier:** {{cashierName}}

## Purchased Items

{{#items}}

- {{name}} {{#if price}}${{price}}{{else}}[Price Missing]{{/if}}
  {{#if onSale}}(ON SALE!){{/if}} {{/items}}

## Payment Details

- Subtotal: ${{subtotal}}
- Tax ({{taxRate}}%): ${{taxAmount}}
- **Total**: ${{total}}

{{#loyaltyMember}}

## Customer Loyalty

- Member Points Earned: {{pointsEarned}}
- Current Balance: {{pointsBalance}} {{/loyaltyMember}}

---

Thank you for shopping with us!  
Receipt ID: {{receiptId}}
