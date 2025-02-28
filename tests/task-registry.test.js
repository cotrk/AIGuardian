const assert = require('assert');
const taskRegistry = require('../lib/core/task-registry');

// Test suite for task registry
console.log('Running task registry tests...');

// Test task registration
function testTaskRegistration() {
  // Clear any existing tasks
  taskRegistry.clearTasks();
  
  // Register a test task
  taskRegistry.registerTask({
    id: 'test-task',
    name: 'Test Task',
    description: 'A task for testing',
    projectTypes: ['javascript'],
    run: async () => ({ success: true })
  });
  
  // Get all tasks for JavaScript
  const jsTasks = taskRegistry.getTasksByCategory('javascript');
  
  // Assert that the task was registered
  assert.strictEqual(jsTasks.length, 1, 'Should have registered 1 task');
  assert.strictEqual(jsTasks[0].id, 'test-task', 'Task ID should match');
  
  console.log('✓ Task registration test passed');
}

// Test getting tasks by project type
function testGetTasksByProjectType() {
  // Clear any existing tasks
  taskRegistry.clearTasks();
  
  // Register multiple test tasks
  taskRegistry.registerTask({
    id: 'js-task',
    name: 'JS Task',
    description: 'A JavaScript task',
    projectTypes: ['javascript'],
    run: async () => ({ success: true })
  });
  
  taskRegistry.registerTask({
    id: 'py-task',
    name: 'Python Task',
    description: 'A Python task',
    projectTypes: ['python'],
    run: async () => ({ success: true })
  });
  
  taskRegistry.registerTask({
    id: 'common-task',
    name: 'Common Task',
    description: 'A common task',
    projectTypes: ['javascript', 'python'],
    run: async () => ({ success: true })
  });
  
  // Get tasks for JavaScript projects
  const jsTasks = taskRegistry.getTasksByProjectType(['javascript']);
  
  // Assert that the correct tasks were returned
  assert.strictEqual(jsTasks.length, 2, 'Should have 2 JavaScript tasks');
  assert.ok(jsTasks.some(task => task.id === 'js-task'), 'Should include js-task');
  assert.ok(jsTasks.some(task => task.id === 'common-task'), 'Should include common-task');
  
  // Get tasks for Python projects
  const pyTasks = taskRegistry.getTasksByProjectType(['python']);
  
  // Assert that the correct tasks were returned
  assert.strictEqual(pyTasks.length, 2, 'Should have 2 Python tasks');
  assert.ok(pyTasks.some(task => task.id === 'py-task'), 'Should include py-task');
  assert.ok(pyTasks.some(task => task.id === 'common-task'), 'Should include common-task');
  
  console.log('✓ Get tasks by project type test passed');
}

// Run all tests
function runTests() {
  try {
    testTaskRegistration();
    testGetTasksByProjectType();
    console.log('All task registry tests passed!');
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
