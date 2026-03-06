# Partial Imports

Importing external markdown files into documents using the @import syntax.

## 📋 What this example demonstrates

- Import syntax @import filename
- Modular document construction
- File inclusion and processing
- Partial file management

## 📁 Files

- **main-contract.md** - Main document with import statements
- **partials/** - Directory containing imported files
  - **header.md** - Header section partial
  - **terms.md** - Terms and conditions partial
  - **footer.md** - Footer section partial
- **main-contract.output.md** - Document with imported content
- **main-contract.output.html** - HTML with combined sections

## 🚀 Usage

```bash
./run.sh
```

## 🔍 Key features shown

1. **Import Syntax**: @import for file inclusion
2. **Modular Design**: Breaking documents into reusable parts
3. **Path Resolution**: Relative and absolute import paths
4. **Content Merging**: Seamless integration of imported content

## 💡 Learn more

- [Partial Imports Guide](../../../docs/features/partial-imports.md)
- [Best Practices](../../../docs/advanced/best-practices.md)
