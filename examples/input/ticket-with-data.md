---
ticketNumber: TKT-12345
purchaseDate: @today
storeName: SuperMart Downtown
cashierName: John Smith
subtotal: 85.50
taxRate: 8.25
taxAmount: 7.05
total: 92.55
isMember: true
pointsEarned: 85
pointsBalance: 340
receiptId: RCP-89234
items:
  - name: Organic Bananas
    price: 4.99
    onSale: false
  - name: Fresh Bread
    price: 3.50
    onSale: true
  - name: Coffee Beans
    price: 15.99
    onSale: false
  - name: Chocolate Bar
    price: 2.99
    onSale: true
  - name: Paper Towels
    price: 8.99
    onSale: false
businessHours:
  - day: Monday
    hours: "9:00 AM - 9:00 PM"
  - day: Tuesday
    hours: "9:00 AM - 9:00 PM"
  - day: Wednesday
    hours: "9:00 AM - 9:00 PM"
  - day: Thursday
    hours: "9:00 AM - 9:00 PM"
  - day: Friday
    hours: "9:00 AM - 10:00 PM"
  - day: Saturday
    hours: "10:00 AM - 8:00 PM"
  - day: Sunday
    hours: "11:00 AM - 6:00 PM"
---

<!-- markdownlint-disable-file -->
<div class="store-info" style="text-align: center">

# Purchase Ticket - {{ticketNumber}}

**Date:** {{purchaseDate}} **Store:** {{storeName}} **Cashier:** {{cashierName}}

</div>

## Purchased Items

<ul class="items-list">
{{#items}}
- {{name}} {{onSale ? "<span class="on-sale" >(ON SALE!)</span>" : ""}} - ${{price}}
{{/items}}
</ul>

## Payment Details

<ul class="payment-details">
<li><span>Subtotal:</span> <span>${{subtotal}}</span></li>
<li><span>Tax ({{taxRate}}%):</span> <span>${{taxAmount}}</span></li>
<li class="total"><span><strong>Total:</strong></span> <span>${{total}}</span></li>
</ul>

## Customer Loyalty

<ul>
{{isMember ? "**Member Status:** Active" : "Not a member yet"}}
{{isMember ? "**Points Earned:** " + pointsEarned : ""}}
{{isMember ? "**Total Points:** " + pointsBalance : ""}}
</ul>

## Receipt Information

**Receipt ID:** {{receiptId}} **Thank you for shopping with us!**

## Store Hours

<ul>
{{#businessHours}}
- <span>{{day}}:</span> <span>{{hours}}</span>
{{/businessHours}}
</ul>

<p class="receipt-footer">Save this receipt for returns and exchanges</p>
