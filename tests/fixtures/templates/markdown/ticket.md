---
storeName: TechMart Store
cashierName: Alice Johnson
ticketNumber: "{{ticketNumber ? ticketNumber : '00000'}}"
receiptId: RCP-2024-{{ticketNumber}}
taxRate: 8.5
---

# Purchase Ticket - {{ticketNumber}}

**Date:** @today **Store:** {{storeName}}  
**Cashier:** {{cashierName}}

## Purchased Items

{{#items}}

- {{name}} {{price ? "$" + price : "[Price Missing]"}}
  {{onSale ? "(ON SALE!)" : ""}} {{/items}}

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
