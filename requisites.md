# Requirements for a LegalMarkdown-Compatible Project

This document details all the necessary requirements to ensure a project is compatible with LegalMarkdown, based on the official documentation: [LegalMarkdown](https://github.com/compleatang/legal-markdown).

## Supported File Formats

- Text-based documents:
  - Markdown (.md) - Most commonly used format for legal documents
  - reStructuredText (.rst) - Alternative markup language with enhanced structure
  - LaTeX (.tex) - For complex document typesetting
  - ASCII (.txt) - Plain text format for maximum compatibility

## Document Structure

### YAML Front Matter (Mandatory)

- Must begin with `---` on the first line of the document
- Uses `field: value` syntax to define metadata
- Ends with `---`
- Common fields include:
  - `title`: Document title
  - `author`: Document creator
  - `date`: Creation or modification date
  - `parties`: List of involved parties
  - `jurisdiction`: Applicable legal jurisdiction
  - `governing-law`: Applicable law
  - `effective-date`: When the document takes effect
  - Custom fields for document-specific variables
- Example:

  ```yaml
  ---
  title: Services Agreement
  author: John Doe
  date: 2023-06-24
  parties:
    - name: ACME Corporation
      type: company
    - name: John Smith
      type: individual
  jurisdiction: Delaware
  governing-law: New York
  effective-date: 2023-07-01
  custom-variable: Custom Value
  ---
  ```

### Structured Headers Syntax

- Primary notation:
  - `l.` - First level header (e.g., "1. DEFINITIONS")
  - `ll.` - Second level header (e.g., "1.1 Term Definition")
  - `lll.` - Third level header (e.g., "1.1.1 Sub-definition")
  - `llll.` - Fourth level header (when needed)
  - `lllll.` - Fifth level header (when needed)

- Alternative syntax:
  - `l1.` - First level header
  - `l2.` - Second level header
  - `l3.` - Third level header
  - `l4.` - Fourth level header
  - `l5.` - Fifth level header

- Header customization options in YAML Front Matter:
  - `level-one`: Customize first level format (default: `Article %n.`)
  - `level-two`: Customize second level format (default: `Section %n.`)
  - `level-three`: Customize third level format (default: `(%n)`)
  - `level-four`: Customize fourth level format (default: `(%n%c)`)
  - `level-five`: Customize fifth level format (default: `(%n%c%r)`)
  - `level-indent`: Specify indentation for each level (e.g., `level-indent: 1.5`)

### Optional Clauses

- Enclosed in square brackets `[...]`
- Can have specific conditions defined in the YAML Front Matter
- Support complex logical operations:
  - Simple toggle: `[This clause will appear if condition is true.]`
  - AND condition: `[This appears if condition1 AND condition2 are true.]`
  - OR condition: `[This appears if condition1 OR condition2 is true.]`
  - Nested conditions possible
- Example with condition in YAML:

  ```yaml
  ---
  include_confidentiality: true
  include_non_compete: false
  jurisdiction: California
  ---
  ```

  Document text:

  ```text
  [The Parties agree to maintain confidentiality as described below.]{include_confidentiality}
  
  [The Consultant shall not engage in competitive activities.]{include_non_compete}
  
  [This clause applies only in California.]{jurisdiction = "California"}
  ```

### Cross-References

- Uses the syntax `|reference_key|`
- The key must be defined in the YAML Front Matter
- Supports various data types:
  - Text strings: `name: John Smith`
  - Dates: `date: 2023-06-24`
  - Numbers: `payment_amount: 5000`
  - Complex structures via YAML
- Examples:

  ```text
  This agreement between |client_name| and |provider_name| establishes...
  
  The payment of $|payment_amount| is due on |due_date|.
  
  The |jurisdiction| laws shall govern this agreement.
  ```

### Partial Imports

- Uses `@import [filename]` to import content from other files
- Useful for modularizing extensive documents
- Supports:
  - Relative paths: `@import relative/path/to/file.md`
  - Absolute paths: `@import /absolute/path/to/file.md`
  - Multiple imports in the same document
- Example structure:

  ```text
  @import boilerplate/header.md
  
  l. TERMS AND CONDITIONS
  
  @import clauses/confidentiality.md
  
  @import clauses/payment_terms.md
  ```

## Metadata Options

### General Metadata

- Uses the `meta:` key in the YAML Front Matter
- Can include document properties, versioning, status information
- Example:

  ```yaml
  meta:
    version: 1.2.3
    status: draft
    category: contract
    template-version: 2.0
    document-id: CONT-2023-001
  ```

### Specific Output Formats

- YAML output: `meta-yaml-output:`
  - Exports processed metadata to separate YAML file
  - Useful for integration with other systems
  - Example:

    ```yaml
    meta-yaml-output: processed_metadata.yaml
    ```

- JSON output: `meta-json-output:`
  - Exports processed metadata to JSON format
  - Ideal for API integrations
  - Example:

    ```yaml
    meta-json-output: processed_metadata.json
    ```

- Additional output options:
  - `meta-output-path:` - Specify output directory
  - `meta-output-extension:` - Customize file extension
  - `meta-include-original:` - Include original fields (true/false)

## Document Processing

### Command Line

- Main command:

  ```bash
  legal2md [input-filename] [output-filename]
  ```

- Additional options:
  - `--debug`: Shows debugging information
  - `--headers`: Processes only the headers
  - `--yaml`: Processes only the YAML Front Matter
  - `--input=FILENAME`: Specify input file
  - `--output=FILENAME`: Specify output file
  - `--to-markdown`: Convert from another format to markdown
  - `--to-json`: Output as JSON
  - `--to-yaml`: Output as YAML
  - `--no-mixins`: Disable template mixins
  - `--no-headers`: Skip header processing
  - `--version`: Display version information
  - `--help`: Display usage instructions
  - `--stdin`: Read from standard input (use "-" as input filename)
  - `--stdout`: Write to standard output (omit output filename)

### Recommended Workflow

1. Create documents using LegalMarkdown syntax
2. Preprocess with `legal2md`
3. Render final output with tools like Pandoc
4. Workflow variations:
   - Draft → Review → Finalize process
   - Integration with CI/CD pipelines
   - Template-based document generation

## Complementary Tools

- **Sublime Text Package**: Facilitates editing with syntax highlighting
- **Visual Studio Code Extensions**: Several markdown extensions compatible
- **Pandoc**: Recommended for final conversion to formats like PDF, DOCX, etc.
- **Markdown Editors**: Specialized editors like Typora, MarkText
- **Git**: Version control for document history
- **Continuous Integration**: Automated document generation with GitHub Actions, GitLab CI

## Advanced Features

### Mixins

- Text substitution mechanism similar to cross-references but for common terms
- Replaces double-curly-braced terms `{{term}}` with values from YAML Front Matter
- Used for consistent terminology across document templates
- Example:

  ```yaml
  ---
  court: Supreme Court of Delaware
  effective_date: January 1, 2023
  ---
  ```

  Document text:

  ```text
  This case is to be heard before the {{court}} on {{effective_date}}.
  ```

### Special Date Handling

- Built-in `@today` variable for automatic date insertion
- Format: `@today[format_string]` where format_string follows date formatting rules
- Example: `@today[%Y-%m-%d]` would insert current date as "2023-06-24"
- Useful for automatically dating documents at generation time

### No-Reset and No-Indent Options

- `no-reset`: Prevents numbering from resetting at each level
  - Example: `{no-reset: true}` ensures continuous numbering
- `no-indent`: Disables automatic indentation for specific sections
  - Example: `{no-indent: true}` for flat formatting of headers

### Precursor References

- Allows referencing parent section numbers in headers
- Uses special syntax to include numbers of parent sections
- Useful for complex legal documents with extensive cross-referencing

## Advanced Considerations

- **Template Customization**: Possibility to create custom templates
  - Header formats
  - Numbering styles
  - Document sections
  - Special clauses

- **Version Control Integration**: Recommended for change tracking
  - Git-friendly format
  - Diff visualization
  - Collaboration features
  - Branch-based document versioning

- **Automation**: Possibility to integrate with workflow scripts
  - Batch processing
  - Automated document generation
  - Integration with CMS systems
  - API-based document workflows

- **Internationalization**:
  - Multi-language support
  - Jurisdiction-specific templates
  - Locale-aware formatting

- **Security**:
  - Encryption options for sensitive documents
  - Digital signature integration
  - Access control through git

## Additional Resources

- [Official Documentation](https://github.com/compleatang/legal-markdown)
- [Practical Examples](https://github.com/compleatang/legal-markdown/tree/master/examples)
- [Detailed Syntax Guide](https://github.com/compleatang/legal-markdown/wiki)
- [Community Templates](https://github.com/compleatang/legal-markdown/tree/master/templates)
- [Integration Tutorials](https://github.com/compleatang/legal-markdown/wiki/Tutorials)
- [API Documentation](https://github.com/compleatang/legal-markdown/wiki/API)
