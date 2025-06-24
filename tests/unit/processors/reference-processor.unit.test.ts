import { processCrossReferences, formatReferenceValue } from '../../../src/core/processors/reference-processor';

describe('Cross-References', () => {
  describe('Parse pipe notation |reference_key|', () => {
    it('should parse basic pipe notation references', () => {
      const content = `The client is |client_name| and the contract value is |contract_value|.`;
      const metadata = {
        client_name: 'ACME Corporation',
        contract_value: 50000
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe('The client is ACME Corporation and the contract value is 50000.');
    });

    it('should handle multiple references in one line', () => {
      const content = `Party A: |party_a|, Party B: |party_b|, Date: |contract_date|`;
      const metadata = {
        party_a: 'Company A',
        party_b: 'Company B',
        contract_date: '2024-06-24'
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe('Party A: Company A, Party B: Company B, Date: 2024-06-24');
    });

    it('should handle references across multiple lines', () => {
      const content = `Contract between |client_name|
and |service_provider|
effective |effective_date|.`;
      const metadata = {
        client_name: 'Tech Corp',
        service_provider: 'Service Inc',
        effective_date: '2024-01-01'
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe(`Contract between Tech Corp
and Service Inc
effective 2024-01-01.`);
    });

    it('should preserve references when value is undefined', () => {
      const content = `Client: |undefined_client| and Amount: |defined_amount|`;
      const metadata = {
        defined_amount: 1000
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe('Client: |undefined_client| and Amount: $1,000.00');
    });
  });

  describe('Replace references with YAML front matter values', () => {
    it('should replace references with values from YAML metadata', () => {
      const content = `Agreement between |parties.buyer.name| and |parties.seller.name|`;
      const metadata = {
        parties: {
          buyer: { name: 'Buyer Corp', type: 'Corporation' },
          seller: { name: 'Seller LLC', type: 'LLC' }
        }
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe('Agreement between Buyer Corp and Seller LLC');
    });

    it('should handle nested object references', () => {
      const content = `Address: |client.address.street|, |client.address.city|, |client.address.state|`;
      const metadata = {
        client: {
          address: {
            street: '123 Main St',
            city: 'Anytown',
            state: 'CA'
          }
        }
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe('Address: 123 Main St, Anytown, CA');
    });

    it('should handle array references', () => {
      const content = `First party: |parties.0.name|, Second party: |parties.1.name|`;
      const metadata = {
        parties: [
          { name: 'First Company', role: 'buyer' },
          { name: 'Second Company', role: 'seller' }
        ]
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe('First party: First Company, Second party: Second Company');
    });
  });

  describe('Support text string references', () => {
    it('should handle simple text string references', () => {
      const content = `Company: |company_name|, Industry: |industry|, Status: |status|`;
      const metadata = {
        company_name: 'Tech Solutions Inc',
        industry: 'Software Development',
        status: 'Active'
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe('Company: Tech Solutions Inc, Industry: Software Development, Status: Active');
    });

    it('should handle strings with special characters', () => {
      const content = `Company: |company_with_special|, Email: |contact_email|`;
      const metadata = {
        company_with_special: 'A&B Corp (Ltd.)',
        contact_email: 'contact@company.com'
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe('Company: A&B Corp (Ltd.), Email: contact@company.com');
    });

    it('should handle empty strings', () => {
      const content = `Optional field: "|optional_field|"`;
      const metadata = {
        optional_field: ''
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe('Optional field: ""');
    });
  });

  describe('Support date references', () => {
    it('should handle Date objects with default formatting', () => {
      const content = `Contract signed on |signature_date|`;
      const metadata = {
        signature_date: new Date('2024-06-24T10:30:00Z')
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe('Contract signed on 2024-06-24');
    });

    it('should handle date strings', () => {
      const content = `Effective from |start_date| to |end_date|`;
      const metadata = {
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe('Effective from 2024-01-01 to 2024-12-31');
    });

    it('should handle multiple date formats', () => {
      const content = `Created: |created_date|, Modified: |modified_date|, Expires: |expiry_date|`;
      const metadata = {
        created_date: new Date('2024-01-01'),
        modified_date: '2024-06-24',
        expiry_date: new Date('2025-01-01T00:00:00Z')
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toContain('Created: 2024-01-01');
      expect(result).toContain('Modified: 2024-06-24');
      expect(result).toContain('Expires: 2025-01-01');
    });
  });

  describe('Support number references', () => {
    it('should handle basic number references', () => {
      const content = `Quantity: |quantity|, Price: |price|, Total: |total|`;
      const metadata = {
        quantity: 100,
        price: 29.99,
        total: 2999
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe('Quantity: 100, Price: 29.99, Total: 2999');
    });

    it('should handle currency amount formatting', () => {
      const content = `Payment amount: |payment_amount|`;
      const metadata = {
        payment_amount: 1500.50,
        payment_currency: 'USD'
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe('Payment amount: $1,500.50');
    });

    it('should handle large numbers', () => {
      const content = `Budget: |project_budget|, Revenue: |annual_revenue|`;
      const metadata = {
        project_budget: 1000000,
        annual_revenue: 5000000.75
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe('Budget: 1000000, Revenue: 5000000.75');
    });

    it('should handle zero and negative numbers', () => {
      const content = `Balance: |balance|, Adjustment: |adjustment|, Penalty: |penalty|`;
      const metadata = {
        balance: 0,
        adjustment: -100,
        penalty: -50.25
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe('Balance: 0, Adjustment: -100, Penalty: -50.25');
    });
  });

  describe('Advanced reference formatting', () => {
    it('should handle boolean values', () => {
      const content = `Active: |is_active|, Premium: |is_premium|, Verified: |is_verified|`;
      const metadata = {
        is_active: true,
        is_premium: false,
        is_verified: true
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe('Active: true, Premium: false, Verified: true');
    });

    it('should handle null and undefined values', () => {
      const content = `Optional: |optional_field|, Missing: |missing_field|`;
      const metadata = {
        optional_field: null
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe('Optional: null, Missing: |missing_field|');
    });

    it('should handle complex nested references', () => {
      const content = `Primary contact: |contacts.primary.name| (|contacts.primary.email|)
Secondary contact: |contacts.secondary.name| (|contacts.secondary.phone|)`;
      const metadata = {
        contacts: {
          primary: {
            name: 'John Doe',
            email: 'john@company.com',
            phone: '555-1234'
          },
          secondary: {
            name: 'Jane Smith',
            email: 'jane@company.com',
            phone: '555-5678'
          }
        }
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe(`Primary contact: John Doe (john@company.com)
Secondary contact: Jane Smith (555-5678)`);
    });
  });

  describe('formatReferenceValue function', () => {
    it('should format Date objects', () => {
      const date = new Date('2024-06-24T10:30:00Z');
      const result = formatReferenceValue(date);
      
      expect(result).toBe('2024-06-24');
    });

    it('should format currency with custom format', () => {
      const result = formatReferenceValue(1234.56, 'currency:EUR:de-DE');
      
      expect(result).toContain('1.234,56');
      expect(result).toContain('€');
    });

    it('should handle undefined values', () => {
      const result = formatReferenceValue(undefined);
      
      expect(result).toBe('');
    });

    it('should handle null values', () => {
      const result = formatReferenceValue(null);
      
      expect(result).toBe('');
    });

    it('should convert other types to string', () => {
      expect(formatReferenceValue(42)).toBe('42');
      expect(formatReferenceValue(true)).toBe('true');
      expect(formatReferenceValue({ key: 'value' })).toBe('[object Object]');
      expect(formatReferenceValue([1, 2, 3])).toBe('1,2,3');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle content without references', () => {
      const content = `This is regular content without any references.`;
      const metadata = { some_field: 'value' };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe(content);
    });

    it('should handle empty content', () => {
      const result = processCrossReferences('', {});
      
      expect(result).toBe('');
    });

    it('should handle empty metadata', () => {
      const content = `Reference to |some_field| should remain unchanged.`;
      const result = processCrossReferences(content, {});
      
      expect(result).toBe('Reference to |some_field| should remain unchanged.');
    });

    it('should handle malformed references', () => {
      const content = `Normal |reference| and malformed |unclosed_reference and |another_ref|`;
      const metadata = {
        reference: 'valid',
        another_ref: 'also valid'
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe('Normal valid and malformed |unclosed_reference and |another_ref|');
    });

    it('should handle nested pipe characters', () => {
      const content = `|field_with_|_pipe|`;
      const metadata = {
        'field_with_|_pipe': 'nested value'
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe('|field_with_|_pipe|'); // The regex cannot handle pipes inside field names
    });

    it('should handle references with whitespace', () => {
      const content = `Reference with spaces: | spaced_field |`;
      const metadata = {
        spaced_field: 'trimmed value'
      };

      const result = processCrossReferences(content, metadata);
      
      expect(result).toBe('Reference with spaces: trimmed value');
    });
  });
});