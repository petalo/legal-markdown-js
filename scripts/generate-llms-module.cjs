#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const sourcePath = path.join(rootDir, 'llms.txt');
const outputDir = path.join(rootDir, 'src', 'generated');
const outputPath = path.join(outputDir, 'llms-txt.ts');

const content = fs.readFileSync(sourcePath, 'utf8');
const moduleSource = `/**
 * Generated from ./llms.txt by scripts/generate-llms-module.cjs.
 * Do not edit manually.
 */
export const LLMS_TXT = ${JSON.stringify(content)};
`;

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, moduleSource, 'utf8');
