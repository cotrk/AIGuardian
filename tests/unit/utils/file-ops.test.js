/**
 * Unit tests for the file operations utility
 */
const path = require('path');
const mockFs = require('mock-fs');
const fileOps = require('../../../lib/utils/file-ops');

describe('File Operations Utility', () => {
  // Set up mock file system before each test
  beforeEach(() => {
    mockFs({
      'test-dir': {
        'test-file.txt': 'This is a test file',
        'empty-dir': {},
        'nested-dir': {
          'nested-file.txt': 'This is a nested file'
        }
      }
    });
  });
  
  // Restore real file system after each test
  afterEach(() => {
    mockFs.restore();
  });
  
  describe('readFile', () => {
    test('should read file content correctly', async () => {
      const content = await fileOps.readFile('test-dir/test-file.txt');
      expect(content).toBe('This is a test file');
    });
    
    test('should throw error when file does not exist', async () => {
      await expect(fileOps.readFile('test-dir/non-existent-file.txt'))
        .rejects.toThrow();
    });
  });
  
  describe('writeFile', () => {
    test('should write content to file', async () => {
      await fileOps.writeFile('test-dir/new-file.txt', 'New file content');
      const content = await fileOps.readFile('test-dir/new-file.txt');
      expect(content).toBe('New file content');
    });
    
    test('should create directories if they do not exist', async () => {
      await fileOps.writeFile('test-dir/new-dir/new-file.txt', 'New file in new dir');
      const content = await fileOps.readFile('test-dir/new-dir/new-file.txt');
      expect(content).toBe('New file in new dir');
    });
  });
  
  describe('ensureDir', () => {
    test('should create directory if it does not exist', async () => {
      await fileOps.ensureDir('test-dir/new-dir');
      const exists = await fileOps.exists('test-dir/new-dir');
      expect(exists).toBe(true);
    });
    
    test('should not throw if directory already exists', async () => {
      await expect(fileOps.ensureDir('test-dir/empty-dir')).resolves.not.toThrow();
    });
  });
  
  describe('exists', () => {
    test('should return true if file exists', async () => {
      const exists = await fileOps.exists('test-dir/test-file.txt');
      expect(exists).toBe(true);
    });
    
    test('should return true if directory exists', async () => {
      const exists = await fileOps.exists('test-dir/empty-dir');
      expect(exists).toBe(true);
    });
    
    test('should return false if path does not exist', async () => {
      const exists = await fileOps.exists('test-dir/non-existent-path');
      expect(exists).toBe(false);
    });
  });
  
  describe('deleteFile', () => {
    test('should delete file if it exists', async () => {
      await fileOps.deleteFile('test-dir/test-file.txt');
      const exists = await fileOps.exists('test-dir/test-file.txt');
      expect(exists).toBe(false);
    });
    
    test('should not throw if file does not exist', async () => {
      await expect(fileOps.deleteFile('test-dir/non-existent-file.txt'))
        .resolves.not.toThrow();
    });
  });
  
  describe('copyFile', () => {
    test('should copy file to destination', async () => {
      await fileOps.copyFile(
        'test-dir/test-file.txt',
        'test-dir/copy-file.txt'
      );
      
      const exists = await fileOps.exists('test-dir/copy-file.txt');
      expect(exists).toBe(true);
      
      const content = await fileOps.readFile('test-dir/copy-file.txt');
      expect(content).toBe('This is a test file');
    });
    
    test('should create destination directory if it does not exist', async () => {
      await fileOps.copyFile(
        'test-dir/test-file.txt',
        'test-dir/new-dir/copy-file.txt'
      );
      
      const exists = await fileOps.exists('test-dir/new-dir/copy-file.txt');
      expect(exists).toBe(true);
    });
  });
});
