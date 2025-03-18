#!/usr/bin/env node

/**
 * Demo script to run AIGuardian code optimization
 */
const path = require('path');
const { spawnSync } = require('child_process');

console.log('AIGuardian Code Optimization Demo');
console.log('=================================\n');

console.log('This script will demonstrate AIGuardian\'s code optimization features.');
console.log('It will run the optimization tasks on the example files in this directory.\n');

// Get the path to the aiguardian-optimize command
const aiguardianPath = path.resolve(__dirname, '..', '..', 'bin', 'aiguardian-optimize.js');

// Run the optimization command
console.log('Running optimization tasks...\n');

const result = spawnSync('node', [
  aiguardianPath,
  '-p', __dirname,
  '-a',
  '-y'
], {
  stdio: 'inherit'
});

if (result.status !== 0) {
  console.error('\nOptimization failed. Please check the error messages above.');
  process.exit(1);
}

console.log('\nOptimization completed successfully!');
console.log('Check the optimization report for details on the issues found and recommendations.');
console.log('\nThank you for using AIGuardian!');
