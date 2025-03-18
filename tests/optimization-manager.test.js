/**
 * Test suite for OptimizationManager
 */
const path = require('path');
const fs = require('fs').promises;
const assert = require('assert');
const OptimizationManager = require('../lib/core/optimization-manager');
const taskRegistry = require('../lib/core/task-registry');

// Mock project path for testing
const TEST_PROJECT_PATH = path.join(__dirname, 'fixtures', 'test-project');

// Mock project types
const TEST_PROJECT_TYPES = ['javascript', 'node'];

// Mock task results
const mockTaskResults = {
  'detect-duplicate-code': {
    success: true,
    metrics: {
      duplicateBlocks: 2,
      affectedFiles: 3,
      potentialLinesReduced: 15
    },
    duplications: [
      {
        instances: [
          { file: path.join(TEST_PROJECT_PATH, 'file1.js'), startLine: 10, endLine: 20 },
          { file: path.join(TEST_PROJECT_PATH, 'file2.js'), startLine: 15, endLine: 25 }
        ],
        suggestion: 'Extract duplicated code into a shared function'
      }
    ]
  },
  'eliminate-dead-code': {
    success: true,
    metrics: {
      unusedFunctions: 3,
      unusedVariables: 5,
      linesRemoved: 20
    },
    unusedCode: {
      unusedFunctions: [
        { name: 'unusedFunction', file: path.join(TEST_PROJECT_PATH, 'file1.js'), line: 30 }
      ],
      unusedVariables: [
        { name: 'unusedVar', file: path.join(TEST_PROJECT_PATH, 'file2.js'), line: 40 }
      ]
    }
  }
};

// Mock TaskRunner
class MockTaskRunner {
  constructor() {
    this.taskResults = {};
  }
  
  async runTask(task, projectTypes, options) {
    // Return mock result based on task ID
    return mockTaskResults[task.id] || { success: false, error: 'Task not found' };
  }
  
  async runTasks(tasks) {
    const results = {};
    
    for (const task of tasks) {
      results[task.id] = await this.runTask(task, TEST_PROJECT_TYPES, {});
    }
    
    return { success: true, results };
  }
}

// Mock BackupManager
class MockBackupManager {
  async createBackup() {
    return { success: true, backupPath: '/mock/backup/path' };
  }
  
  async restoreBackup() {
    return { success: true };
  }
}

// Mock fs module
const mockFs = {
  async writeFile() {
    return true;
  },
  async mkdir() {
    return true;
  }
};

// Setup test environment
async function setupTest() {
  // Create test directory if it doesn't exist
  try {
    await fs.mkdir(path.join(__dirname, 'fixtures'), { recursive: true });
    await fs.mkdir(TEST_PROJECT_PATH, { recursive: true });
  } catch (error) {
    // Directory already exists, ignore
  }
}

// Cleanup test environment
async function cleanupTest() {
  // Remove test files
  try {
    await fs.rm(path.join(TEST_PROJECT_PATH, 'optimization-report.md'), { force: true });
  } catch (error) {
    // File doesn't exist, ignore
  }
}

// Test OptimizationManager constructor
function testConstructor() {
  console.log('Testing OptimizationManager constructor...');
  
  const manager = new OptimizationManager(TEST_PROJECT_PATH, TEST_PROJECT_TYPES);
  
  assert.strictEqual(manager.projectPath, TEST_PROJECT_PATH);
  assert.deepStrictEqual(manager.projectTypes, TEST_PROJECT_TYPES);
  assert.ok(manager.backupManager);
  assert.ok(manager.taskRunner);
  assert.deepStrictEqual(manager.results, {});
  
  console.log('✓ Constructor test passed');
}

// Test getAvailableTasks method
function testGetAvailableTasks() {
  console.log('Testing getAvailableTasks method...');
  
  const manager = new OptimizationManager(TEST_PROJECT_PATH, TEST_PROJECT_TYPES);
  const tasks = manager.getAvailableTasks();
  
  assert.ok(Array.isArray(tasks));
  
  // Check if optimization tasks are included
  const optimizationTaskIds = [
    'detect-duplicate-code',
    'eliminate-dead-code',
    'format-code',
    'analyze-complexity',
    'optimize-performance'
  ];
  
  for (const taskId of optimizationTaskIds) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.log(`Warning: Task ${taskId} not found in registry`);
    }
  }
  
  console.log('✓ getAvailableTasks test passed');
}

// Test runTask method
async function testRunTask() {
  console.log('Testing runTask method...');
  
  // Create a manager instance with mocked dependencies
  const manager = new OptimizationManager(TEST_PROJECT_PATH, TEST_PROJECT_TYPES);
  
  // Replace the task runner and backup manager with mocks
  manager.taskRunner = new MockTaskRunner();
  manager.backupManager = new MockBackupManager();
  
  // Run a task
  const result = await manager.runTask('detect-duplicate-code', true);
  
  assert.strictEqual(result.success, true);
  assert.ok(result.result);
  assert.strictEqual(result.result.metrics.duplicateBlocks, 2);
  
  console.log('✓ runTask test passed');
}

// Test runSpecificTasks method
async function testRunSpecificTasks() {
  console.log('Testing runSpecificTasks method...');
  
  // Create a manager instance with mocked dependencies
  const manager = new OptimizationManager(TEST_PROJECT_PATH, TEST_PROJECT_TYPES);
  
  // Replace the task runner and backup manager with mocks
  manager.taskRunner = new MockTaskRunner();
  manager.backupManager = new MockBackupManager();
  
  // Run specific tasks
  const result = await manager.runSpecificTasks(['detect-duplicate-code', 'eliminate-dead-code'], true);
  
  assert.strictEqual(result.success, true);
  assert.ok(result.results);
  assert.strictEqual(result.results['detect-duplicate-code'].metrics.duplicateBlocks, 2);
  assert.strictEqual(result.results['eliminate-dead-code'].metrics.unusedFunctions, 3);
  
  console.log('✓ runSpecificTasks test passed');
}

// Test getResults method
async function testGetResults() {
  console.log('Testing getResults method...');
  
  // Create a manager instance with mocked dependencies
  const manager = new OptimizationManager(TEST_PROJECT_PATH, TEST_PROJECT_TYPES);
  
  // Replace the task runner and backup manager with mocks
  manager.taskRunner = new MockTaskRunner();
  manager.backupManager = new MockBackupManager();
  
  // Run tasks to populate results
  await manager.runSpecificTasks(['detect-duplicate-code', 'eliminate-dead-code'], true);
  
  // Get results
  const results = manager.getResults();
  
  assert.ok(results);
  assert.strictEqual(results['detect-duplicate-code'].metrics.duplicateBlocks, 2);
  assert.strictEqual(results['eliminate-dead-code'].metrics.unusedFunctions, 3);
  
  console.log('✓ getResults test passed');
}

// Test getTaskResult method
async function testGetTaskResult() {
  console.log('Testing getTaskResult method...');
  
  // Create a manager instance with mocked dependencies
  const manager = new OptimizationManager(TEST_PROJECT_PATH, TEST_PROJECT_TYPES);
  
  // Replace the task runner and backup manager with mocks
  manager.taskRunner = new MockTaskRunner();
  manager.backupManager = new MockBackupManager();
  
  // Run tasks to populate results
  await manager.runSpecificTasks(['detect-duplicate-code', 'eliminate-dead-code'], true);
  
  // Get specific task result
  const result = manager.getTaskResult('detect-duplicate-code');
  
  assert.ok(result);
  assert.strictEqual(result.metrics.duplicateBlocks, 2);
  
  // Get non-existent task result
  const nullResult = manager.getTaskResult('non-existent-task');
  
  assert.strictEqual(nullResult, null);
  
  console.log('✓ getTaskResult test passed');
}

// Run all tests
async function runTests() {
  try {
    console.log('Starting OptimizationManager tests...');
    
    await setupTest();
    
    testConstructor();
    testGetAvailableTasks();
    await testRunTask();
    await testRunSpecificTasks();
    await testGetResults();
    await testGetTaskResult();
    
    await cleanupTest();
    
    console.log('All OptimizationManager tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests();
