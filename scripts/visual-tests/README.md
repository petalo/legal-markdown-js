# Visual Test Scripts

These scripts generate PDF and HTML documents from real-world templates to
visually test the legal-markdown-js output.

## Available Scripts

### Generate Ticket/Receipt

```bash
npm run test:e2e:ticket
```

Generates a purchase ticket/receipt with:

- Multiple items with prices
- Tax calculations
- Customer loyalty information
- Store details

Output files in `examples/visual-tests/ticket/`:

- `ticket.html` - Basic HTML output
- `ticket-highlighted.html` - HTML with field highlighting
- `ticket.pdf` - Basic PDF output
- `ticket-highlighted.pdf` - PDF with field highlighting (empty fields in red)

### Generate Contract

```bash
npm run test:e2e:contract
```

Generates an office lease agreement with:

- Complex nested data structures
- Multiple parties information
- Payment terms
- Property details
- Some intentionally empty fields to test highlighting

Output files in `examples/visual-tests/contract/`:

- `contract.html` - Basic HTML output
- `contract-highlighted.html` - HTML with field highlighting
- `contract.pdf` - Basic PDF output
- `contract-highlighted.pdf` - PDF with field highlighting (empty fields in red)

### Generate All

```bash
npm run test:e2e:all
```

Runs both ticket and contract generation.

## Field Highlighting

In highlighted versions:

- 🟢 **Green** (imported-value): Fields successfully filled with data
- 🔴 **Red** (missing-value): Empty or missing fields
- 🟡 **Yellow** (highlight): Fields with conditional logic or mixins

## Source Templates

The scripts use real templates from contracts-wizard:

- Ticket template:
  `/Users/diego/Developer/contracts-wizard/templates/markdown/ticket.example.md`
- Contract template:
  `/Users/diego/Developer/contracts-wizard/templates/markdown/office_lease_EN.example.md`
- Ticket CSS:
  `/Users/diego/Developer/contracts-wizard/templates/css/ticket.example.css`
- Contract CSS:
  `/Users/diego/Developer/contracts-wizard/templates/css/contract.example.css`
