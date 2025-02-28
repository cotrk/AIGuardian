/**
 * Task Registry
 * Manages and organizes all available tasks for different project types
 */

// Import common tasks
const optimizeGitignore = require('../tasks/common/gitignore');

// Import JavaScript/TypeScript tasks
const detectUnusedDependencies = require('../tasks/javascript/unused-dependencies');

// Import Python tasks
const analyzeRequirements = require('../tasks/python/requirements-analyzer');

/**
 * Task registry that manages all available tasks
 */
class TaskRegistry {
  constructor() {
    this.tasks = {
      // Common tasks (applicable to all project types)
      common: [
        {
          id: 'optimize-gitignore',
          name: 'Optimize .gitignore file',
          description: 'Creates or updates .gitignore file with appropriate entries for the project type',
          taskFn: optimizeGitignore,
          applicableToTypes: ['all']
        }
      ],
      
      // JavaScript/TypeScript tasks
      javascript: [
        {
          id: 'detect-unused-dependencies',
          name: 'Detect unused dependencies',
          description: 'Analyzes the project to find and remove unused npm dependencies',
          taskFn: detectUnusedDependencies,
          applicableToTypes: ['javascript', 'typescript']
        }
      ],
      
      // TypeScript tasks (inherits JavaScript tasks)
      typescript: [],
      
      // Python tasks
      python: [
        {
          id: 'analyze-requirements',
          name: 'Analyze requirements files',
          description: 'Analyzes and optimizes Python requirements files',
          taskFn: analyzeRequirements,
          applicableToTypes: ['python']
        }
      ],
      
      // Java tasks
      java: []
    };
  }
  
  /**
   * Get all available tasks for a specific project type
   * @param {string[]} projectTypes - Detected project types
   * @returns {Array<Object>} - List of applicable tasks
   */
  getTasksForProjectTypes(projectTypes) {
    if (!projectTypes || projectTypes.length === 0) {
      return this.tasks.common;
    }
    
    const applicableTasks = [];
    
    // Add common tasks
    applicableTasks.push(...this.tasks.common);
    
    // Add tasks for each project type
    for (const projectType of projectTypes) {
      if (this.tasks[projectType]) {
        applicableTasks.push(...this.tasks[projectType]);
      }
    }
    
    // Filter out duplicate tasks
    const uniqueTasks = [];
    const taskIds = new Set();
    
    for (const task of applicableTasks) {
      if (!taskIds.has(task.id)) {
        uniqueTasks.push(task);
        taskIds.add(task.id);
      }
    }
    
    return uniqueTasks;
  }
  
  /**
   * Get a specific task by ID
   * @param {string} taskId - ID of the task
   * @returns {Object|null} - Task object or null if not found
   */
  getTaskById(taskId) {
    for (const category in this.tasks) {
      const task = this.tasks[category].find(t => t.id === taskId);
      if (task) {
        return task;
      }
    }
    
    return null;
  }
  
  /**
   * Register a new task
   * @param {Object} task - Task object
   */
  registerTask(task) {
    // If projectTypes is provided, register the task for each project type
    if (task.projectTypes && task.projectTypes.length > 0) {
      for (const projectType of task.projectTypes) {
        if (!this.tasks[projectType]) {
          this.tasks[projectType] = [];
        }
        
        // Check if task already exists in this category
        const existingTaskIndex = this.tasks[projectType].findIndex(t => t.id === task.id);
        if (existingTaskIndex >= 0) {
          // Update existing task
          this.tasks[projectType][existingTaskIndex] = task;
        } else {
          // Add new task
          this.tasks[projectType].push(task);
        }
      }
    } else {
      // If no project types provided, register as common task
      const existingTaskIndex = this.tasks.common.findIndex(t => t.id === task.id);
      if (existingTaskIndex >= 0) {
        // Update existing task
        this.tasks.common[existingTaskIndex] = task;
      } else {
        // Add new task
        this.tasks.common.push(task);
      }
    }
  }
  
  /**
   * Get all available task categories
   * @returns {string[]} - List of task categories
   */
  getCategories() {
    return Object.keys(this.tasks);
  }
  
  /**
   * Get all tasks for a specific category
   * @param {string} category - Task category
   * @returns {Array<Object>} - List of tasks in the category
   */
  getTasksByCategory(category) {
    return this.tasks[category] || [];
  }

  /**
   * Get all tasks
   * @returns {Array<Object>} - List of all tasks
   */
  getAllTasks() {
    const allTasks = [];
    for (const category in this.tasks) {
      allTasks.push(...this.tasks[category]);
    }
    return allTasks;
  }

  /**
   * Get tasks by project type
   * @param {string[]} projectTypes - Project types
   * @returns {Array<Object>} - List of tasks for the project types
   */
  getTasksByProjectType(projectTypes) {
    return this.getTasksForProjectTypes(projectTypes);
  }

  /**
   * Clear all tasks (for testing purposes)
   */
  clearTasks() {
    for (const category in this.tasks) {
      this.tasks[category] = [];
    }
  }
}

module.exports = new TaskRegistry();
