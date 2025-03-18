/**
 * Optimization Manager
 * Manages the execution of code optimization tasks
 */
const path = require('path');
const { logger } = require('../utils/logger');
const taskRegistry = require('./task-registry');
const BackupManager = require('./backup-manager');
const TaskRunner = require('./task-runner');
const { generateOptimizationReport, saveOptimizationReport } = require('../utils/optimization-reporter');

/**
 * Manages code optimization tasks
 */
class OptimizationManager {
  /**
   * Creates a new OptimizationManager
   * @param {string} projectPath - Path to the project
   * @param {string[]} projectTypes - Detected project types
   * @param {Object} options - Options for the optimization
   */
  constructor(projectPath, projectTypes, options = {}) {
    this.projectPath = projectPath;
    this.projectTypes = projectTypes;
    this.options = options;
    this.backupManager = new BackupManager(projectPath);
    this.taskRunner = new TaskRunner(projectPath);
    this.results = {};
  }
  
  /**
   * Gets all available optimization tasks
   * @returns {Array<Object>} - List of available tasks
   */
  getAvailableTasks() {
    return taskRegistry.getTasksForProjectTypes(this.projectTypes);
  }
  
  /**
   * Runs all optimization tasks
   * @param {boolean} createBackup - Whether to create a backup before running tasks
   * @returns {Promise<Object>} - Optimization results
   */
  async runAllTasks(createBackup = true) {
    logger.info(`Running all optimization tasks for ${this.projectPath}`);
    
    // Create backup if requested
    if (createBackup) {
      logger.info('Creating backup before optimization...');
      try {
        const backupPath = await this.backupManager.createBackup();
        logger.success(`Backup created at ${backupPath}`);
      } catch (error) {
        logger.error(`Failed to create backup: ${error.message}`);
        return { success: false, error: 'Failed to create backup' };
      }
    }
    
    // Get all available tasks
    const tasks = this.getAvailableTasks();
    
    if (tasks.length === 0) {
      logger.warn('No optimization tasks available for the detected project types');
      return { success: true, results: {}, message: 'No tasks available' };
    }
    
    logger.info(`Found ${tasks.length} optimization tasks to run`);
    
    // Run each task
    for (const task of tasks) {
      logger.info(`Running task: ${task.name}`);
      
      try {
        const taskResult = await this.taskRunner.runTask(task, this.projectTypes, this.options);
        
        if (taskResult.success) {
          logger.success(`Task ${task.name} completed successfully`);
        } else {
          logger.error(`Task ${task.name} failed: ${taskResult.error}`);
        }
        
        // Store the result
        this.results[task.id] = taskResult;
      } catch (error) {
        logger.error(`Error running task ${task.name}: ${error.message}`);
        this.results[task.id] = { success: false, error: error.message };
      }
    }
    
    // Generate and save optimization report
    const report = generateOptimizationReport(this.results, this.projectPath);
    const reportPath = await saveOptimizationReport(report, this.projectPath);
    
    return {
      success: true,
      results: this.results,
      reportPath
    };
  }
  
  /**
   * Runs specific optimization tasks
   * @param {string[]} taskIds - IDs of tasks to run
   * @param {boolean} createBackup - Whether to create a backup before running tasks
   * @returns {Promise<Object>} - Optimization results
   */
  async runSpecificTasks(taskIds, createBackup = true) {
    if (!taskIds || taskIds.length === 0) {
      logger.warn('No tasks specified to run');
      return { success: false, error: 'No tasks specified' };
    }
    
    logger.info(`Running ${taskIds.length} optimization tasks for ${this.projectPath}`);
    
    // Create backup if requested
    if (createBackup) {
      logger.info('Creating backup before optimization...');
      try {
        const backupPath = await this.backupManager.createBackup();
        logger.success(`Backup created at ${backupPath}`);
      } catch (error) {
        logger.error(`Failed to create backup: ${error.message}`);
        return { success: false, error: 'Failed to create backup' };
      }
    }
    
    // Get the specified tasks
    const allTasks = this.getAvailableTasks();
    const tasksToRun = allTasks.filter(task => taskIds.includes(task.id));
    
    if (tasksToRun.length === 0) {
      logger.warn('No matching tasks found for the specified IDs');
      return { success: false, error: 'No matching tasks found' };
    }
    
    logger.info(`Found ${tasksToRun.length} tasks to run`);
    
    // Run each task
    for (const task of tasksToRun) {
      logger.info(`Running task: ${task.name}`);
      
      try {
        const taskResult = await this.taskRunner.runTask(task, this.projectTypes, this.options);
        
        if (taskResult.success) {
          logger.success(`Task ${task.name} completed successfully`);
        } else {
          logger.error(`Task ${task.name} failed: ${taskResult.error}`);
        }
        
        // Store the result
        this.results[task.id] = taskResult;
      } catch (error) {
        logger.error(`Error running task ${task.name}: ${error.message}`);
        this.results[task.id] = { success: false, error: error.message };
      }
    }
    
    // Generate and save optimization report
    const report = generateOptimizationReport(this.results, this.projectPath);
    const reportPath = await saveOptimizationReport(report, this.projectPath);
    
    return {
      success: true,
      results: this.results,
      reportPath
    };
  }
  
  /**
   * Runs a single optimization task
   * @param {string} taskId - ID of the task to run
   * @param {boolean} createBackup - Whether to create a backup before running the task
   * @returns {Promise<Object>} - Task result
   */
  async runTask(taskId, createBackup = true) {
    if (!taskId) {
      logger.warn('No task ID specified');
      return { success: false, error: 'No task ID specified' };
    }
    
    // Get the task
    const task = taskRegistry.getTaskById(taskId);
    
    if (!task) {
      logger.warn(`Task with ID ${taskId} not found`);
      return { success: false, error: 'Task not found' };
    }
    
    logger.info(`Running optimization task ${task.name} for ${this.projectPath}`);
    
    // Create backup if requested
    if (createBackup) {
      logger.info('Creating backup before optimization...');
      try {
        const backupPath = await this.backupManager.createBackup();
        logger.success(`Backup created at ${backupPath}`);
      } catch (error) {
        logger.error(`Failed to create backup: ${error.message}`);
        return { success: false, error: 'Failed to create backup' };
      }
    }
    
    // Run the task
    try {
      const taskResult = await this.taskRunner.runTask(task, this.projectTypes, this.options);
      
      if (taskResult.success) {
        logger.success(`Task ${task.name} completed successfully`);
      } else {
        logger.error(`Task ${task.name} failed: ${taskResult.error}`);
      }
      
      // Store the result
      this.results[task.id] = taskResult;
      
      // Generate and save optimization report
      const report = generateOptimizationReport({ [task.id]: taskResult }, this.projectPath);
      const reportPath = await saveOptimizationReport(report, this.projectPath);
      
      return {
        success: taskResult.success,
        result: taskResult,
        reportPath
      };
    } catch (error) {
      logger.error(`Error running task ${task.name}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Gets the results of all optimization tasks
   * @returns {Object} - Task results
   */
  getResults() {
    return this.results;
  }
  
  /**
   * Gets the result of a specific optimization task
   * @param {string} taskId - ID of the task
   * @returns {Object|null} - Task result or null if not found
   */
  getTaskResult(taskId) {
    return this.results[taskId] || null;
  }
}

module.exports = OptimizationManager;
