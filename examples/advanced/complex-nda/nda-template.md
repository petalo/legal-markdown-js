<!-- markdownlint-disable-file -->
<div class="store-info" style="text-align: center">

# Purchase Ticket - {{ ticketNumber }}

**Date:** {{now "DD/MM/YYYY"}} **Store:** {{ storeName }}  
**Cashier:** {{ cashierName }}

</div>

## Purchased Items

<ul class="items-list">
{{#each items}}
<li>
<span>{{name}} {{#if (and (not (eq name "")) (eq onSale "true"))}}<span class="on-sale" >(ON SALE!)</span>{{/if}}</span>
<span>${{price}}</span>
</li>
{{/each}}
</ul>

## Payment Details

<ul class="payment-details">
<li><span>Subtotal:</span> <span>${{ subtotal }}</span></li>
<li><span>Tax ({{ taxRate }}%):</span> <span>${{ taxAmount }}</span></li>
<li class="total"><span><strong>Total:</strong></span> <span>${{ total }}</span></li>
</ul>

## Customer Loyalty

<ul>
<li><span>Member Points Earned:</span> <span>{{ pointsEarned }}</span></li>
<li><span>Current Balance:</span> <span>{{ pointsBalance }}</span></li>
</ul>

## Store Hours

<ul>
{{#each businessHours}}
<li><span>{{day}}:</span> <span>{{hours}}</span></li>
{{/each}}
</ul>

<div class="receipt-footer">

---

Thank you for shopping with us!  
Receipt ID: {{ receiptId }}

</div>
