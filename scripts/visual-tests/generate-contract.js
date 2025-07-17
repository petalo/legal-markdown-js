#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function generateContract() {
  console.log('📄 Generating contract PDF with legal-markdown-js...\n');

  // Paths
  const projectRoot = path.join(__dirname, '../..');
  const outputDir = path.join(projectRoot, 'examples/output/contract');

  // Input files
  const templatePath = path.join(projectRoot, 'examples/input/office-lease-with-data.md');
  const cssPath = path.join(projectRoot, 'examples/styles/contract.css');

  // Create output directory
  await fs.promises.mkdir(outputDir, { recursive: true });

  // Generate outputs
  const commands = [
    // Generate HTML
    {
      cmd: `node ./dist/cli/index.js "${templatePath}" "${outputDir}/contract.html" --html --css "${cssPath}"`,
      desc: 'Generating HTML...',
    },
    // Generate HTML with highlighting
    {
      cmd: `node ./dist/cli/index.js "${templatePath}" "${outputDir}/contract-highlighted.html" --html --highlight --css "${cssPath}"`,
      desc: 'Generating HTML with highlighting...',
    },
    // Generate PDF
    {
      cmd: `node ./dist/cli/index.js "${templatePath}" "${outputDir}/contract.pdf" --pdf --css "${cssPath}"`,
      desc: 'Generating PDF...',
    },
    // Generate PDF with highlighting
    {
      cmd: `node ./dist/cli/index.js "${templatePath}" "${outputDir}/contract-highlighted.pdf" --pdf --highlight --css "${cssPath}"`,
      desc: 'Generating PDF with highlighting...',
    },
  ];

  for (const { cmd, desc } of commands) {
    console.log(desc);
    try {
      const { stdout, stderr } = await execAsync(cmd, { cwd: projectRoot });
      if (stdout) console.log(stdout);
      if (stderr && !stderr.includes('Generated with Claude Code')) console.error(stderr);
    } catch (error) {
      console.error(`Error executing command: ${error.message}`);
    }
  }

  console.log('\n✅ Contract generation complete!');
  console.log(`📁 Output files in: ${outputDir}`);
  console.log('\nGenerated files:');
  console.log('  - contract.html (normal)');
  console.log('  - contract-highlighted.html (with field highlighting)');
  console.log('  - contract.pdf (normal)');
  console.log('  - contract-highlighted.pdf (with field highlighting)');
  console.log('\nNote: Empty fields are highlighted in red in the highlighted versions');
  console.log('\nView the contract with:');
  console.log(`  open ${outputDir}/contract.pdf`);
}

// Run the script
generateContract().catch(console.error);
