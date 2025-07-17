# {{title}}

This agreement is entered into on {{contract.signing_date}} in
{{contract.signing_city}}.

## Parties

Between:

**{{lessor.company_name}}**, with registered office at
{{lessor.registered_address}}, and Tax ID {{lessor.tax_id}}, hereinafter
referred to as "THE LESSOR".

Represented by {{lessor.representative.full_name}} with ID
{{lessor.representative.id_number}}.

And:

**{{lessee.company_name}}**, with registered office at
{{lessee.registered_address}}, and Tax ID {{lessee.tax_id}}, hereinafter
referred to as "THE LESSEE".

Represented by {{lessee.representative.full_name}} with ID
{{lessee.representative.id_number ? lessee.representative.id_number : "[ID Required]"}}.

## Property Details

- **Address**: {{property.address}}
- **Area**: {{property.area_sqm}} square meters
- **Parking Spots**: {{property.parking_spots}}
- **Monthly Rent**: {{payment.monthly_rent.text}}
  ({{payment.monthly_rent.number}})
  {{payment.currency ? payment.currency : "USD"}}

[## Late Payment Clause

Late payments will incur a fee of {{payment.late_fee_percentage}}% per
month.]{payment.late_fee_applies}

[## Maintenance

The following maintenance services are included: {{#maintenance_included}}
{{#each maintenance.included_services}}

- {{this}} {{/each}} {{/maintenance_included}}]{maintenance_included}
