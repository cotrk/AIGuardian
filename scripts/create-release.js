#!/usr/bin/env node

/**
 * AIGuardian Release Script
 * 
 * This script creates a release package for AIGuardian.
 * It creates a directory containing all necessary files for distribution,
 * excluding development and test files.
 */

const fs = require('fs');
const path = require('path');
const packageJson = require('../package.json');

// Ensure the releases directory exists
const releasesDir = path.join(__dirname, '..', 'releases');
if (!fs.existsSync(releasesDir)) {
  fs.mkdirSync(releasesDir, { recursive: true });
}

// Define the release version from package.json
const version = packageJson.version;
const releaseDirectoryName = `aiguardian-v${version}`;
const releaseDirectoryPath = path.join(releasesDir, releaseDirectoryName);

// Create release directory
if (fs.existsSync(releaseDirectoryPath)) {
  console.log(`Removing existing release directory: ${releaseDirectoryPath}`);
  fs.rmSync(releaseDirectoryPath, { recursive: true, force: true });
}

fs.mkdirSync(releaseDirectoryPath, { recursive: true });
console.log(`Created release directory: ${releaseDirectoryPath}`);

// Files and directories to include in the release
const includePatterns = [
  { source: 'bin', dest: 'bin' },
  { source: 'lib', dest: 'lib' },
  { source: 'docs', dest: 'docs' },
  { source: 'assets', dest: 'assets' },
  { source: 'package.json', dest: 'package.json' },
  { source: 'README.md', dest: 'README.md' },
  { source: 'LICENSE', dest: 'LICENSE' }
];

// Copy files to release directory
console.log(`\nCopying files to release directory...`);
includePatterns.forEach(item => {
  const sourcePath = path.join(__dirname, '..', item.source);
  const destPath = path.join(releaseDirectoryPath, item.dest);
  
  if (fs.existsSync(sourcePath)) {
    if (fs.lstatSync(sourcePath).isDirectory()) {
      // Copy directory recursively
      copyDirectoryRecursive(sourcePath, destPath);
    } else {
      // Copy file
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied: ${item.source} -> ${item.dest}`);
    }
  } else {
    console.warn(`Warning: Source path does not exist: ${sourcePath}`);
  }
});

// Create a release notes file
const releaseNotesPath = path.join(releasesDir, `release-notes-v${version}.md`);
const changelogPath = path.join(__dirname, '..', 'docs', 'CHANGELOG.md');

// Read the changelog to extract the current version's notes
if (fs.existsSync(changelogPath)) {
  const changelog = fs.readFileSync(changelogPath, 'utf8');
  const versionRegex = new RegExp(`## \\[${version}\\].*?(?=## \\[|$)`, 's');
  const versionNotes = changelog.match(versionRegex);

  if (versionNotes) {
    const releaseNotes = `# AIGuardian v${version} Release Notes\n\n${versionNotes[0].trim()}\n`;
    fs.writeFileSync(releaseNotesPath, releaseNotes);
    console.log(`\nRelease notes created: ${releaseNotesPath}`);
  } else {
    console.warn(`\nCould not find release notes for version ${version} in the changelog.`);
  }
} else {
  console.warn(`\nChangelog file not found: ${changelogPath}`);
}

console.log('\nRelease process completed successfully!');
console.log(`\nRelease directory: ${releaseDirectoryPath}`);
console.log('\nNext steps:');
console.log('1. Create a git tag for this release:');
console.log(`   git tag -a v${version} -m "Release v${version}"`);
console.log('2. Push the tag to the remote repository:');
console.log('   git push origin --tags');
console.log('3. Create a GitHub release using the generated release notes');

/**
 * Helper function to copy a directory recursively
 */
function copyDirectoryRecursive(source, destination) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }
  
  // Get all files and directories in the source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });
  
  // Process each entry
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);
    
    // Skip node_modules, .git, and other directories we don't want to include
    if (entry.name === 'node_modules' || entry.name === '.git' || 
        entry.name === 'tests' || entry.name === 'scripts' ||
        entry.name === 'releases') {
      continue;
    }
    
    if (entry.isDirectory()) {
      // Recursively copy subdirectory
      copyDirectoryRecursive(sourcePath, destPath);
    } else {
      // Copy file
      fs.copyFileSync(sourcePath, destPath);
    }
  }
  
  console.log(`Copied directory: ${source} -> ${destination}`);
}
