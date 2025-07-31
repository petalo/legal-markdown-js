#!/usr/bin/env node

const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

/**
 * Check if a port is available
 * @param {number} port - Port number to check
 * @returns {Promise<boolean>} - True if port is available, false otherwise
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Find the next available port starting from a given port
 * @param {number} startPort - Starting port number
 * @param {number} maxTries - Maximum number of ports to try
 * @returns {Promise<number|null>} - Available port number or null if none found
 */
async function findAvailablePort(startPort = 8080, maxTries = 10) {
  for (let i = 0; i < maxTries; i++) {
    const port = startPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  return null;
}

/**
 * Start the web server on an available port
 * @param {string} directory - Directory to serve
 * @param {number} preferredPort - Preferred port to start with
 */
async function startWebServer(directory = 'dist/web', preferredPort = 8080) {
  const webDir = path.resolve(process.cwd(), directory);
  
  console.log(`🔍 Looking for available port starting from ${preferredPort}...`);
  
  const availablePort = await findAvailablePort(preferredPort);
  
  if (!availablePort) {
    console.error(`❌ No available ports found in range ${preferredPort}-${preferredPort + 9}`);
    console.error('Please close some applications using ports in this range and try again.');
    process.exit(1);
  }
  
  if (availablePort !== preferredPort) {
    console.log(`⚠️  Port ${preferredPort} is busy, using port ${availablePort} instead`);
  }
  
  console.log(`🚀 Starting web server on port ${availablePort}...`);
  console.log(`📁 Serving directory: ${webDir}`);
  console.log(`🌐 Open your browser at: http://localhost:${availablePort}`);
  console.log(`⏹️  Press Ctrl+C to stop the server`);
  console.log('');
  
  // Try different server commands in order of preference
  const serverCommands = [
    ['python3', '-m', 'http.server', availablePort.toString(), '--directory', webDir],
    ['python', '-m', 'http.server', availablePort.toString(), '--directory', webDir],
    ['node', '-e', `
      const http = require('http');
      const fs = require('fs');
      const path = require('path');
      const url = require('url');
      
      const server = http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url);
        let pathname = path.join('${webDir}', parsedUrl.pathname);
        
        if (pathname.endsWith('/')) {
          pathname = path.join(pathname, 'index.html');
        }
        
        fs.stat(pathname, (err, stats) => {
          if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
          }
          
          const ext = path.extname(pathname);
          const contentType = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.ico': 'image/x-icon'
          }[ext] || 'text/plain';
          
          res.writeHead(200, { 'Content-Type': contentType });
          fs.createReadStream(pathname).pipe(res);
        });
      });
      
      server.listen(${availablePort}, () => {
        console.log('Server is running...');
      });
    `]
  ];
  
  // Try each server command until one works
  for (const [command, ...args] of serverCommands) {
    try {
      const server = spawn(command, args, {
        stdio: 'inherit',
        shell: process.platform === 'win32'
      });
      
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\\n🛑 Shutting down server...');
        server.kill('SIGINT');
        process.exit(0);
      });
      
      process.on('SIGTERM', () => {
        server.kill('SIGTERM');
        process.exit(0);
      });
      
      server.on('error', (err) => {
        if (err.code === 'ENOENT') {
          console.log(`⚠️  ${command} not found, trying next option...`);
        } else {
          console.error(`❌ Error starting server with ${command}:`, err.message);
        }
      });
      
      server.on('exit', (code) => {
        if (code === 0) {
          console.log('\\n👋 Server stopped gracefully');
        } else if (code !== null) {
          console.log(`\\n⚠️  Server exited with code ${code}`);
        }
      });
      
      // If we get here, the server started successfully
      return;
      
    } catch (error) {
      console.log(`⚠️  Failed to start ${command}, trying next option...`);
      continue;
    }
  }
  
  console.error('❌ Failed to start web server with any available method');
  console.error('Please ensure you have Python 3 or Node.js installed');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const portArg = args.find(arg => arg.startsWith('--port='));
const dirArg = args.find(arg => arg.startsWith('--dir='));

const preferredPort = portArg ? parseInt(portArg.split('=')[1]) : 8080;
const directory = dirArg ? dirArg.split('=')[1] : 'dist/web';

// Validate port
if (isNaN(preferredPort) || preferredPort < 1024 || preferredPort > 65535) {
  console.error('❌ Invalid port number. Please use a port between 1024 and 65535.');
  process.exit(1);
}

// Start the server
startWebServer(directory, preferredPort).catch((error) => {
  console.error('❌ Failed to start web server:', error.message);
  process.exit(1);
});