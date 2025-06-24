// Jest setup file
import * as fs from 'fs';
import * as path from 'path';

// Create temporary test directory
const testDir = path.join(__dirname, 'temp');

beforeAll(() => {
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
});

afterAll(() => {
  // Clean up temporary files
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
});

// Global test utilities
(global as any).testDir = testDir;