#!/usr/bin/env node

/**
 * Detects confusable/misleading Unicode characters in source files
 * Similar to VSCode Gremlin extension
 */

const fs = require('fs');
const path = require('path');

// Characters that look similar to ASCII but aren't (using Unicode escapes)
const CONFUSABLES = [
  // Quotes
  { char: '\u201C', name: 'LEFT DOUBLE QUOTATION MARK', correct: '"' },
  { char: '\u201D', name: 'RIGHT DOUBLE QUOTATION MARK', correct: '"' },
  { char: '\u2018', name: 'LEFT SINGLE QUOTATION MARK', correct: "'" },
  { char: '\u2019', name: 'RIGHT SINGLE QUOTATION MARK', correct: "'" },
  { char: '\u201A', name: 'SINGLE LOW-9 QUOTATION MARK', correct: "'" },
  { char: '\u201E', name: 'DOUBLE LOW-9 QUOTATION MARK', correct: '"' },

  // Dashes
  { char: '\u2013', name: 'EN DASH', correct: '-' },
  { char: '\u2014', name: 'EM DASH', correct: '-' },
  { char: '\u2212', name: 'MINUS SIGN', correct: '-' },

  // Spaces
  { char: '\u00A0', name: 'NO-BREAK SPACE', correct: ' ' },
  { char: '\u2003', name: 'EM SPACE', correct: ' ' },
  { char: '\u2009', name: 'THIN SPACE', correct: ' ' },

  // Other problematic characters
  { char: '\uFF0C', name: 'FULLWIDTH COMMA', correct: ',' },
  { char: '\u3002', name: 'IDEOGRAPHIC FULL STOP', correct: '.' },
  { char: '\uFF1A', name: 'FULLWIDTH COLON', correct: ':' },
  { char: '\uFF1B', name: 'FULLWIDTH SEMICOLON', correct: ';' },
];

// File patterns to check
const EXTENSIONS_TO_CHECK = ['.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs', '.json', '.md'];

// Patterns to exclude (where these characters might be intentional)
const EXCLUDE_PATTERNS = [
  /\.test\.(ts|js)/,
  /\.spec\.(ts|js)/,
  /test-fixtures/,
  /examples\//,
];

function shouldCheckFile(filePath) {
  const ext = path.extname(filePath);
  if (!EXTENSIONS_TO_CHECK.includes(ext)) return false;

  return !EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

function checkFile(filePath, fix = false) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const errors = [];
  let fixedContent = content;
  let hasChanges = false;

  lines.forEach((line, lineIndex) => {
    CONFUSABLES.forEach(({ char, name, correct }) => {
      let columnIndex = line.indexOf(char);
      while (columnIndex !== -1) {
        errors.push({
          file: filePath,
          line: lineIndex + 1,
          column: columnIndex + 1,
          char: char,
          name: name,
          correct: correct,
          context: line.trim()
        });
        columnIndex = line.indexOf(char, columnIndex + 1);
      }
    });
  });

  if (fix && errors.length > 0) {
    CONFUSABLES.forEach(({ char, correct }) => {
      if (fixedContent.includes(char)) {
        fixedContent = fixedContent.replaceAll(char, correct);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
    }
  }

  return { errors, fixed: hasChanges };
}

function main() {
  const args = process.argv.slice(2);
  const fixMode = args.includes('--fix');
  const files = args.filter(arg => arg !== '--fix');

  if (files.length === 0) {
    console.log('No files to check');
    process.exit(0);
  }

  let hasErrors = false;
  const allErrors = [];
  const fixedFiles = [];

  files.forEach(file => {
    if (!shouldCheckFile(file)) return;

    if (!fs.existsSync(file)) {
      console.warn(`Warning: File not found: ${file}`);
      return;
    }

    const { errors, fixed } = checkFile(file, fixMode);
    if (errors.length > 0) {
      hasErrors = true;
      allErrors.push(...errors);
      if (fixed) {
        fixedFiles.push(file);
      }
    }
  });

  if (hasErrors) {
    if (fixMode && fixedFiles.length > 0) {
      console.log(`\n✅ Fixed ${allErrors.length} confusable symbol(s) in ${fixedFiles.length} file(s):\n`);
      fixedFiles.forEach(file => {
        console.log(`  ${file}`);
      });
      console.log('');
      process.exit(0);
    } else {
      console.error('\n❌ Confusable/misleading symbols detected:\n');

      allErrors.forEach(({ file, line, column, char, name, correct, context }) => {
        console.error(`  ${file}:${line}:${column}`);
        console.error(`    Found: "${char}" (${name})`);
        console.error(`    Use: "${correct}" instead`);
        console.error(`    Context: ${context}`);
        console.error('');
      });

      console.error(`\n❌ Found ${allErrors.length} confusable symbol(s) in ${files.length} file(s)`);
      console.error('Please replace them with their ASCII equivalents or run with --fix flag.\n');
      process.exit(1);
    }
  }

  console.log('✅ No confusable symbols found');
  process.exit(0);
}

main();
