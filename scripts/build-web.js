#!/usr/bin/env node

/**
 * Build script for web playground
 * Automatically injects default CSS styles into the HTML file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Escapes CSS content for safe inclusion in JavaScript template literals.
 * 
 * @param {string} css - The CSS content to escape.
 * @returns {string} - The escaped CSS content.
 * 
 * Example:
 *   Input: "body { background: url('image.png'); }"
 *   Output: "body { background: url('image.png'); }"
 *           (with backslashes added where necessary for safe inclusion in template literals)
 */
function escapeCSSForJS(css) {
  return css
    .replace(/\\/g, '\\\\')      // Escape backslashes
    .replace(/`/g, '\\`')        // Escape backticks
    .replace(/\${/g, '\\${');    // Escape template literal expressions
}

/**
 * Main build function
 */
function buildWeb() {
  try {
    console.log('🏗️  Building web playground...');

    // Define paths
    const srcWebDir = path.join(process.cwd(), 'src/web');
    const distWebDir = path.join(process.cwd(), 'dist/web');
    const defaultCSSPath = path.join(process.cwd(), 'src/styles/default.css');
    const htmlSourcePath = path.join(srcWebDir, 'index.html');
    const htmlTargetPath = path.join(distWebDir, 'index.html');

    // Ensure dist/web directory exists
    if (!fs.existsSync(distWebDir)) {
      fs.mkdirSync(distWebDir, { recursive: true });
    }

    // Read default CSS
    console.log('📄 Reading default CSS...');
    if (!fs.existsSync(defaultCSSPath)) {
      throw new Error(`Default CSS file not found: ${defaultCSSPath}`);
    }
    
    const defaultCSS = fs.readFileSync(defaultCSSPath, 'utf8');
    const escapedCSS = escapeCSSForJS(defaultCSS);

    // Read HTML template
    console.log('📄 Reading HTML template...');
    if (!fs.existsSync(htmlSourcePath)) {
      throw new Error(`HTML source file not found: ${htmlSourcePath}`);
    }
    
    let htmlContent = fs.readFileSync(htmlSourcePath, 'utf8');

    // Inject the default CSS into the HTML
    console.log('💉 Injecting default CSS...');
    const defaultCSSInjection = `'default': \`/**
 * Default Legal Markdown Styles
 *
 * Professional stylesheet for legal documents, optimized for both screen and print media.
 * Features modern typography, clean design, and comprehensive print optimizations.
 */

${escapedCSS}\`,

          `;

    // Replace the placeholder with the actual CSS
    htmlContent = htmlContent.replace(
      '// DEFAULT_CSS_PLACEHOLDER - This will be replaced during build',
      defaultCSSInjection
    );

    // Copy other files from src/web to dist/web (excluding index.html)
    const srcFiles = fs.readdirSync(srcWebDir);
    for (const file of srcFiles) {
      if (file === 'index.html') continue; // Skip index.html, we handle it separately
      
      const srcFilePath = path.join(srcWebDir, file);
      const distFilePath = path.join(distWebDir, file);
      
      if (fs.statSync(srcFilePath).isFile()) {
        console.log(`📄 Copying ${file}...`);
        fs.copyFileSync(srcFilePath, distFilePath);
      }
    }

    // Write the processed HTML
    console.log('💾 Writing processed HTML...');
    fs.writeFileSync(htmlTargetPath, htmlContent, 'utf8');

    console.log('✅ Web playground build completed successfully!');
    console.log(`   → HTML: ${htmlTargetPath}`);
    console.log(`   → Default CSS injected: ${Math.round(defaultCSS.length / 1024)}KB`);
    console.log('   → Ready for deployment');

  } catch (error) {
    console.error('❌ Web build failed:', error.message);
    process.exit(1);
  }
}

// Run the build if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildWeb();
}

export { buildWeb };