# <span class="legal-field imported-value" data-field="title">Consulting Invoice Calculation Sheet</span>

## Core Calculations

- Subtotal + tax = <span class="legal-field highlight" data-field="add">10164</span>
- Gross - deductions = <span class="legal-field highlight" data-field="subtract">10550</span>
- Unit price × quantity = <span class="legal-field highlight" data-field="multiply">8400</span>
- Installment amount = <span class="legal-field highlight" data-field="divide">2530</span>
- Invoice parity check (mod 2) = <span class="legal-field highlight" data-field="invoice_number">1</span>

## Settlement Analysis

- Absolute balance via conditional: <span class="legal-field highlight" data-field="logic.branch.1" data-logic-helper="if" data-logic-result="true"><span class="legal-field highlight" data-field="balance">920</span></span>
- Best offer value: <span class="legal-field highlight" data-field="logic.branch.2" data-logic-helper="if" data-logic-result="false"><span class="legal-field imported-value" data-field="offer_b">13250</span></span>
- Minimum penalty: <span class="legal-field highlight" data-field="logic.branch.3" data-logic-helper="if" data-logic-result="true"><span class="legal-field imported-value" data-field="penalty_a">900</span></span>
