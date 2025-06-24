#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { processLegalMarkdown } from './index';
import { LegalMarkdownOptions } from './types';

// Create program
const program = new Command();

// Setup CLI information
program
  .name('legal-md')
  .description('Node.js implementation of LegalMarkdown for processing legal documents')
  .version('0.1.0');

// Main command
program
  .argument('[input]', 'Input file path')
  .argument('[output]', 'Output file path')
  .option('-d, --debug', 'Enable debug mode')
  .option('-y, --yaml', 'Process only YAML front matter')
  .option('-h, --headers', 'Process only headers')
  .option('--no-headers', 'Skip header processing')
  .option('--no-clauses', 'Skip optional clause processing')
  .option('--no-references', 'Skip cross-reference processing')
  .option('--no-imports', 'Skip import processing')
  .option('--export-yaml', 'Export metadata as YAML')
  .option('--export-json', 'Export metadata as JSON')
  .option('-o, --output-path <path>', 'Path for metadata export')
  .action((input, output, options) => {
    try {
      // Handle input file
      if (!input) {
        console.error(chalk.red('Error: Input file is required'));
        process.exit(1);
      }
      
      const inputPath = path.resolve(process.cwd(), input);
      
      if (!fs.existsSync(inputPath)) {
        console.error(chalk.red(`Error: Input file not found: ${inputPath}`));
        process.exit(1);
      }
      
      // Read input file
      const content = fs.readFileSync(inputPath, 'utf8');
      
      // Configure processing options
      const processingOptions: LegalMarkdownOptions = {
        basePath: path.dirname(inputPath),
        yamlOnly: options.yaml,
        noHeaders: options.headers === true ? false : (options.headers === false ? true : undefined),
        noClauses: options.headers === true ? true : (options.clauses === false ? true : undefined),
        noReferences: options.headers === true ? true : (options.references === false ? true : undefined),
        noImports: options.headers === true ? true : (options.imports === false ? true : undefined),
        exportMetadata: options.exportYaml || options.exportJson,
        exportFormat: options.exportJson ? 'json' : 'yaml',
        exportPath: options.outputPath,
        debug: options.debug,
        throwOnYamlError: true
      };
      
      // Process the document
      const result = processLegalMarkdown(content, processingOptions);
      
      // Debug output
      if (options.debug) {
        console.log(chalk.blue('Metadata:'));
        console.log(JSON.stringify(result.metadata, null, 2));
        
        if (result.exportedFiles?.length) {
          console.log(chalk.blue('\nExported files:'));
          result.exportedFiles.forEach(file => {
            console.log(`- ${file}`);
          });
        }
      }
      
      // Write output
      if (output) {
        const outputPath = path.resolve(process.cwd(), output);
        fs.writeFileSync(outputPath, result.content, 'utf8');
        
        if (!options.debug) {
          console.log(chalk.green(`Successfully processed ${input} to ${output}`));
        }
      } else {
        // Print to stdout if no output file specified
        console.log(result.content);
      }
    } catch (error) {
      console.error(chalk.red('Error processing document:'));
      console.error(error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();