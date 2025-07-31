# Development Guidelines

This document outlines the development standards and processes for the Legal
Markdown JS project.

## 📋 Pre-Commit Verification Checklist

When making commits, especially during the remark migration, follow this
comprehensive verification process. Use the command **"verifica"** to trigger
all these steps automatically.

### 1. **Documentation JSDoc**

- ✅ Verify all files have complete JSDoc documentation
- ✅ Check that files use `@module` instead of `@fileoverview` (TypeDoc
  compatibility)
- ✅ **DO NOT use tags `@author`, `@since`, or `@version`** (these are not
  needed for this project)
- ✅ Validate code examples in JSDoc comments
- ✅ Run `npm run docs` and verify no critical warnings

### 2. **Linting and Formatting**

- ✅ Run `npm run lint` and resolve all errors
- ✅ Use `npm run lint:fix` for automatic corrections
- ✅ Verify only acceptable warnings remain (like
  `@typescript-eslint/no-explicit-any`)

### 3. **TypeScript Compilation**

- ✅ Run `npx tsc --noEmit` to verify compilation without errors
- ✅ Verify no type errors in modified files

### 4. **Tests**

- ✅ Run `npm test` to verify entire test suite passes
- ✅ Verify specific tests related to modified files
- ✅ Check that no tests are broken by changes

### 5. **Internal Comments**

- ✅ Review that complex logic has explanatory comments
- ✅ Verify design decisions are documented
- ✅ Check that TODOs or FIXMEs are justified

### 6. **Code Consistency**

- ✅ Verify code follows project conventions
- ✅ Check correct imports (relative vs absolute)
- ✅ Validate exports are well structured

### 7. **Functionality**

- ✅ Verify changes don't break existing functionality
- ✅ Check that business logic is correct
- ✅ Validate maintains compatibility with existing API

## 🎯 JSDoc Standards

### Allowed Tags

- `@module` - For file-level documentation
- `@param` - Parameter descriptions
- `@returns` - Return value descriptions
- `@throws` - Exception descriptions
- `@example` - Code examples
- `@deprecated` - Mark deprecated functions
- `@private` - Mark private functions
- `@protected` - Mark protected functions
- `@readonly` - Mark readonly properties
- `@static` - Mark static methods

### Forbidden Tags

- ❌ `@fileoverview` - Use `@module` instead
- ❌ `@author` - Not needed for this project
- ❌ `@since` - Not needed for this project
- ❌ `@version` - Not needed for this project

### Documentation Structure

````typescript
/**
 * Brief description of the module or function
 *
 * Longer description providing context, usage notes, and important
 * information about the functionality.
 *
 * @param {type} paramName - Description of parameter
 * @returns {type} Description of return value
 * @throws {Error} When this error condition occurs
 * @example
 * ```typescript
 * // Example usage
 * const result = functionName(param);
 * console.log(result);
 * ```
 *
 * @module (for files)
 */
````

## 🏗️ Architecture Standards

### Import Style

- Use **relative imports** for project files
- Use absolute imports for external dependencies
- Import order: external dependencies first, then internal modules

### ESM Compatibility

- All modules must work with both ESM and CommonJS
- Use `import/export` syntax, not `require()`
- Maintain dual build system compatibility

### Field Tracking Logic

- HTML/PDF generation: Field tracking ALWAYS enabled (CSS classes needed)
- Markdown processing: Field tracking optional (user configurable via
  `enableFieldTracking`)
- Both HTML and PDF use `_htmlGeneration` flag for detection

## 🔄 Migration Process

### Commit Strategy

- Individual commits for each logical group of changes
- Preserve full git history (no squashing)
- Comprehensive commit messages with detailed breakdown
- Each commit should be functional and pass all tests

### Quality Gates

- All commits must pass pre-commit verification checklist
- ESLint, TypeScript, and tests must pass
- Documentation must be complete and accurate
- Backward compatibility must be maintained

## 🚀 Quick Commands

```bash
# Full verification suite
npm run lint          # Check linting
npm run lint:fix      # Fix linting issues
npx tsc --noEmit      # Check TypeScript compilation
npm test              # Run all tests
npm run docs          # Generate documentation

# Development workflow
npm run dev           # Development mode
npm run build         # Build the project
npm run build:watch   # Build with watch mode
```

## 📝 Notes

- This document should be updated as development standards evolve
- All team members should follow these guidelines consistently
- When in doubt, prioritize code clarity and maintainability over brevity
