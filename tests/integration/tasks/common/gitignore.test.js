/**
 * Integration tests for the gitignore task
 */
const path = require('path');
const fs = require('fs').promises;
const mockFs = require('mock-fs');
const optimizeGitignore = require('../../../../lib/tasks/common/gitignore');

describe('Gitignore Task Integration', () => {
  const testProjectPath = 'test-project';
  
  beforeEach(() => {
    // Set up mock file system for each test
    mockFs({
      [testProjectPath]: {
        // Empty directory
      }
    });
  });
  
  afterEach(() => {
    mockFs.restore();
  });
  
  test('should create .gitignore file if it does not exist', async () => {
    // Run the task
    const result = await optimizeGitignore({
      projectPath: testProjectPath,
      dryRun: false
    });
    
    // Check if .gitignore was created
    const gitignorePath = path.join(testProjectPath, '.gitignore');
    const exists = await fileExists(gitignorePath);
    
    expect(exists).toBe(true);
    expect(result.success).toBe(true);
    expect(result.changes).toBeGreaterThan(0);
  });
  
  test('should add missing patterns to existing .gitignore', async () => {
    // Create a basic .gitignore file
    const gitignorePath = path.join(testProjectPath, '.gitignore');
    await fs.writeFile(gitignorePath, '# Basic gitignore\nnode_modules/\n');
    
    // Run the task
    const result = await optimizeGitignore({
      projectPath: testProjectPath,
      dryRun: false
    });
    
    // Read the updated file
    const content = await fs.readFile(gitignorePath, 'utf8');
    
    expect(content).toContain('node_modules/');
    expect(content).toContain('# OS files');
    expect(result.success).toBe(true);
    expect(result.changes).toBeGreaterThan(0);
  });
  
  test('should not modify .gitignore in dry run mode', async () => {
    // Create a basic .gitignore file
    const gitignorePath = path.join(testProjectPath, '.gitignore');
    const originalContent = '# Basic gitignore\nnode_modules/\n';
    await fs.writeFile(gitignorePath, originalContent);
    
    // Run the task in dry run mode
    const result = await optimizeGitignore({
      projectPath: testProjectPath,
      dryRun: true
    });
    
    // Read the file after task execution
    const content = await fs.readFile(gitignorePath, 'utf8');
    
    expect(content).toBe(originalContent);
    expect(result.success).toBe(true);
    expect(result.dryRun).toBe(true);
  });
  
  test('should handle invalid .gitignore file', async () => {
    // Create a directory instead of a file at .gitignore path
    const gitignorePath = path.join(testProjectPath, '.gitignore');
    await fs.mkdir(gitignorePath);
    
    // Run the task
    const result = await optimizeGitignore({
      projectPath: testProjectPath,
      dryRun: false
    });
    
    // Check if the task failed
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

/**
 * Helper function to check if a file exists
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} - True if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (err) {
    return false;
  }
}
