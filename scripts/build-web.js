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
    const cssExamplesSourcePath = path.join(srcWebDir, 'css-examples.js');
    const cssExamplesTargetPath = path.join(distWebDir, 'css-examples.js');

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

    // Read CSS examples template
    console.log('📄 Reading CSS examples template...');
    if (!fs.existsSync(cssExamplesSourcePath)) {
      throw new Error(`CSS examples file not found: ${cssExamplesSourcePath}`);
    }

    let cssExamplesContent = fs.readFileSync(cssExamplesSourcePath, 'utf8');

    // Inject the default CSS into css-examples.js
    console.log('💉 Injecting default CSS into css-examples.js...');
    const defaultCSSInjection = `'default': \`/**
 * Default Legal Markdown Styles
 *
 * Professional stylesheet for legal documents, optimized for both screen and print media.
 * Features modern typography, clean design, and comprehensive print optimizations.
 */

${escapedCSS}\`,

  `;

    // Replace the placeholder with the actual CSS
    cssExamplesContent = cssExamplesContent.replace(
      '// DEFAULT_CSS_PLACEHOLDER - This will be replaced during build',
      defaultCSSInjection
    );

    // Write processed CSS examples
    fs.writeFileSync(cssExamplesTargetPath, cssExamplesContent, 'utf8');

    // Copy static files from src/web to dist/web
    console.log('📄 Copying web files...');
    const filesToCopy = ['index.html', 'app.js', 'examples.js', 'styles.css'];

    for (const file of filesToCopy) {
      const srcFilePath = path.join(srcWebDir, file);
      const distFilePath = path.join(distWebDir, file);

      if (fs.existsSync(srcFilePath)) {
        console.log(`   → Copying ${file}...`);
        fs.copyFileSync(srcFilePath, distFilePath);
      } else {
        console.warn(`   ⚠️  ${file} not found, skipping...`);
      }
    }

    // Copy browser bundle chunks from dist/ to dist/web/
    console.log('📦 Copying browser bundle chunks...');
    const distDir = path.join(process.cwd(), 'dist');
    const distFiles = fs.readdirSync(distDir);
    let chunkCount = 0;

    for (const file of distFiles) {
      const srcFilePath = path.join(distDir, file);

      // Skip directories
      if (!fs.statSync(srcFilePath).isFile()) continue;

      // Copy all chunk files (with hash pattern) and their source maps
      // Pattern: name-HASH.js or name-HASH.js.map
      if ((file.includes('-') && file.endsWith('.js')) || file.endsWith('.js.map')) {
        const destFile = path.join(distWebDir, file);
        fs.copyFileSync(srcFilePath, destFile);
        chunkCount++;
      }
    }

    console.log(`   → Copied ${chunkCount} bundle chunks`);

    console.log('✅ Web playground build completed successfully!');
    console.log(`   → HTML: ${htmlTargetPath}`);
    console.log(`   → CSS examples: ${cssExamplesTargetPath}`);
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