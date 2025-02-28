const assert = require('assert');
const path = require('path');
const fs = require('fs').promises;
const fileOps = require('../lib/utils/file-ops');

// Test suite for file operations
console.log('Running file operations tests...');

// Test directory for file operations
const TEST_DIR = path.join(__dirname, 'test-files');
const TEST_FILE = path.join(TEST_DIR, 'test-file.txt');
const TEST_CONTENT = 'Hello, AIGuardian!';

// Setup and teardown functions
async function setup() {
  try {
    await fileOps.ensureDirectoryExists(TEST_DIR);
  } catch (error) {
    console.error('Setup failed:', error.message);
    process.exit(1);
  }
}

async function teardown() {
  try {
    await fileOps.deleteDirectory(TEST_DIR);
  } catch (error) {
    console.error('Teardown failed:', error.message);
  }
}

// Test file operations
async function testFileOperations() {
  try {
    // Test file writing
    await fileOps.writeFile(TEST_FILE, TEST_CONTENT);
    
    // Test file existence
    const exists = await fileOps.fileExists(TEST_FILE);
    assert.strictEqual(exists, true, 'File should exist after writing');
    
    // Test file reading
    const content = await fileOps.readFile(TEST_FILE);
    assert.strictEqual(content, TEST_CONTENT, 'File content should match what was written');
    
    // Test file copying
    const COPY_FILE = path.join(TEST_DIR, 'test-file-copy.txt');
    await fileOps.copyFile(TEST_FILE, COPY_FILE);
    
    const copyExists = await fileOps.fileExists(COPY_FILE);
    assert.strictEqual(copyExists, true, 'Copied file should exist');
    
    const copyContent = await fileOps.readFile(COPY_FILE);
    assert.strictEqual(copyContent, TEST_CONTENT, 'Copied file content should match original');
    
    // Test file deletion
    await fileOps.deleteFile(TEST_FILE);
    const fileExistsAfterDelete = await fileOps.fileExists(TEST_FILE);
    assert.strictEqual(fileExistsAfterDelete, false, 'File should not exist after deletion');
    
    console.log('✓ File operations test passed');
  } catch (error) {
    console.error('File operations test failed:', error.message);
    throw error;
  }
}

// Test directory operations
async function testDirectoryOperations() {
  try {
    // Test directory creation
    const NESTED_DIR = path.join(TEST_DIR, 'nested', 'dir');
    await fileOps.ensureDirectoryExists(NESTED_DIR);
    
    // Create a file in the nested directory
    const NESTED_FILE = path.join(NESTED_DIR, 'nested-file.txt');
    await fileOps.writeFile(NESTED_FILE, TEST_CONTENT);
    
    // Test directory copying
    const COPY_DIR = path.join(TEST_DIR, 'copy-dir');
    await fileOps.copyDirectory(path.join(TEST_DIR, 'nested'), COPY_DIR);
    
    const copiedNestedFile = path.join(COPY_DIR, 'dir', 'nested-file.txt');
    const nestedFileExists = await fileOps.fileExists(copiedNestedFile);
    assert.strictEqual(nestedFileExists, true, 'Nested file should exist in copied directory');
    
    // Test directory deletion
    await fileOps.deleteDirectory(path.join(TEST_DIR, 'nested'));
    
    try {
      await fs.access(path.join(TEST_DIR, 'nested'));
      assert.fail('Deleted directory should not be accessible');
    } catch (error) {
      // This is expected
    }
    
    console.log('✓ Directory operations test passed');
  } catch (error) {
    console.error('Directory operations test failed:', error.message);
    throw error;
  }
}

// Run all tests
async function runTests() {
  try {
    await setup();
    await testFileOperations();
    await testDirectoryOperations();
    console.log('All file operations tests passed!');
  } catch (error) {
    console.error('Tests failed:', error);
  } finally {
    await teardown();
  }
}

runTests();
