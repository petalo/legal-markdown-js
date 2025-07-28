#!/usr/bin/env node

/**
 * Setup Configuration Script
 *
 * This script helps users set up their environment configuration by copying
 * the .env.example file to the user's config directory and providing clear
 * instructions on how to customize it.
 *
 * Usage:
 *   npm run setup-config
 *   npx legal-markdown-js setup-config
 *   node scripts/setup-config.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function setupUserConfig() {
  try {
    // Define paths
    const projectRoot = path.resolve(__dirname, '..');
    const envExamplePath = path.join(projectRoot, '.env.example');
    const userConfigDir = path.join(os.homedir(), '.config', 'legal-markdown-js');
    const userEnvPath = path.join(userConfigDir, '.env');

    log('\n🔧 Setting up Legal Markdown configuration...', colors.bold + colors.blue);

    // Check if .env.example exists
    if (!fs.existsSync(envExamplePath)) {
      log('❌ Error: .env.example file not found in project root', colors.red);
      process.exit(1);
    }

    // Create config directory if it doesn't exist
    if (!fs.existsSync(userConfigDir)) {
      log(`📁 Creating config directory: ${userConfigDir}`, colors.cyan);
      fs.mkdirSync(userConfigDir, { recursive: true });
    }

    // Check if user already has a .env file
    if (fs.existsSync(userEnvPath)) {
      log('\n⚠️  Configuration file already exists:', colors.yellow);
      log(`   ${userEnvPath}`, colors.yellow);
      log('\n🔍 You can edit this file to customize your paths.', colors.cyan);
      log('💡 Or delete it and run this script again to get a fresh copy.', colors.cyan);
      return;
    }

    // Copy .env.example to user config directory
    log('📋 Copying configuration template...', colors.cyan);
    const envContent = fs.readFileSync(envExamplePath, 'utf8');

    // Customize the content with a user-friendly header
    const userEnvContent = `# This file was created by the setup script
# Edit the paths below according to your needs
#
# Generated on: ${new Date().toLocaleString()}
# Location: ${userEnvPath}
#
#
#
#

${envContent}`;

    fs.writeFileSync(userEnvPath, userEnvContent, 'utf8');

    // Success message with clear instructions
    log('\n✅ Configuration setup completed successfully!', colors.bold + colors.green);
    log('\n📍 Your configuration file is located at:', colors.cyan);
    log(`   ${colors.bold}${userEnvPath}${colors.reset}`, colors.cyan);

    log('\n📝 Next steps:', colors.bold + colors.blue);
    log('   1. Open the configuration file in your text editor', colors.blue);
    log('   2. Edit the paths to match your file locations', colors.blue);
    log('   3. Save the file', colors.blue);
    log('   4. Start using legal-md-ui!', colors.blue);

    log('\n💡 Tips:', colors.bold + colors.yellow);
    log('   • Use forward slashes (/) in paths on all systems', colors.yellow);
    log('   • Paths can be relative or absolute', colors.yellow);
    log('   • The tool will create directories automatically if needed', colors.yellow);

    log('\n🚀 You can now run:', colors.bold + colors.green);
    log('   legal-md-ui', colors.green);
    log('   (or npx legal-markdown-js legal-md-ui if installed locally)', colors.green);
  } catch (error) {
    log('\n❌ Error setting up configuration:', colors.red);
    log(`   ${error.message}`, colors.red);
    log('\n🔧 You can manually copy .env.example to:', colors.cyan);
    log(`   ${path.join(os.homedir(), '.config', 'legal-markdown-js', '.env')}`, colors.cyan);
    process.exit(1);
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupUserConfig();
}

module.exports = { setupUserConfig };
