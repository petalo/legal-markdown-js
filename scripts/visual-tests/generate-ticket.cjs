#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function generateTicket() {
  console.log('🎫 Generating ticket PDF with legal-markdown-js...\n');

  // Paths
  const projectRoot = path.join(__dirname, '../..');
  const outputDir = path.join(projectRoot, 'examples/output/ticket');
  
  // Input files
  const templatePath = path.join(projectRoot, 'examples/input/ticket-with-data.md');
  const cssPath = path.join(projectRoot, 'examples/styles/ticket.css');
  const dataPath = path.join(projectRoot, 'examples/data/ticket-data.json');

  // Create output directory
  await fs.promises.mkdir(outputDir, { recursive: true });

  // Generate outputs
  const commands = [
    // Generate HTML
    {
      cmd: `node ./dist/cli/index.js "${templatePath}" "${outputDir}/ticket.html" --html --css "${cssPath}"`,
      desc: 'Generating HTML...'
    },
    // Generate HTML with highlighting
    {
      cmd: `node ./dist/cli/index.js "${templatePath}" "${outputDir}/ticket-highlighted.html" --html --highlight --css "${cssPath}"`,
      desc: 'Generating HTML with highlighting...'
    },
    // Generate PDF
    {
      cmd: `node ./dist/cli/index.js "${templatePath}" "${outputDir}/ticket.pdf" --pdf --css "${cssPath}"`,
      desc: 'Generating PDF...'
    },
    // Generate PDF with highlighting
    {
      cmd: `node ./dist/cli/index.js "${templatePath}" "${outputDir}/ticket-highlighted.pdf" --pdf --highlight --css "${cssPath}"`,
      desc: 'Generating PDF with highlighting...'
    }
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

  console.log('\n✅ Ticket generation complete!');
  console.log(`📁 Output files in: ${outputDir}`);
  console.log('\nGenerated files:');
  console.log('  - ticket.html (normal)');
  console.log('  - ticket-highlighted.html (with field highlighting)');
  console.log('  - ticket.pdf (normal)');
  console.log('  - ticket-highlighted.pdf (with field highlighting)');
  console.log('\nView the ticket with:');
  console.log(`  open ${outputDir}/ticket.pdf`);
}

// Run the script
generateTicket().catch(console.error);