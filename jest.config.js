/**
 * Jest Configuration for Electron Builder Tests
 * 
 * This configuration is specifically for testing the electron-builder
 * configuration and build process.
 */

module.exports = {
  // Use Node.js environment for testing build configurations
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Coverage collection patterns
  collectCoverageFrom: [
    'scripts/**/*.{js,cjs}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/dist-electron/**',
    '!**/coverage/**'
  ],

  // Module paths
  moduleFileExtensions: ['js', 'json', 'node'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/dist-electron/',
    '/coverage/'
  ],

  // Verbose output
  verbose: true,

  // Timeout for tests (some file operations might take time)
  testTimeout: 10000
};
