const path = require('path');
const { logger } = require('../utils/logger');
const { formatSuccess, formatError } = require('../utils/formatters');
const BackupManager = require('./backup-manager');

/**
 * Manages the execution of optimization tasks
 */
class TaskRunner {
  /**
   * Creates a new task runner
   * @param {string} projectPath - Path to the project
   * @param {string[]} projectTypes - Detected project types
   * @param {Object} options - Runner options
   */
  constructor(projectPath, projectTypes, options = {}) {
    this.projectPath = projectPath;
    this.projectTypes = projectTypes;
    this.options = {
      dryRun: false,
      verbose: false,
      createBackup: true,
      ...options,
    };
    this.backupManager = new BackupManager(projectPath);
    this.results = {
      success: true,
      tasksRun: 0,
      tasksSucceeded: 0,
      tasksFailed: 0,
      taskResults: {},
    };
  }

  /**
   * Runs a set of tasks
   * @param {Array<Object>} tasks - List of tasks to run
   * @returns {Promise<Object>} - Results of the task execution
   */
  async runTasks(tasks) {
    if (!tasks || tasks.length === 0) {
      logger.warn('No tasks specified to run');
      return { success: false, error: 'No tasks specified' };
    }

    logger.info(`Preparing to run ${tasks.length} optimization tasks...`);

    // Create backup if needed
    if (this.options.createBackup && !this.options.dryRun) {
      try {
        await this.backupManager.createBackup();
      } catch (error) {
        logger.error(formatError(`Failed to create backup: ${error.message}`));
        logger.warn('Continuing without backup...');
      }
    }

    // Run each task
    for (const task of tasks) {
      await this.runTask(task);
    }

    // Log summary
    this.logSummary();

    return this.results;
  }

  /**
   * Runs a single task
   * @param {Object} task - Task to run
   * @returns {Promise<Object>} - Result of the task
   */
  async runTask(task) {
    const { id, name, taskFn } = task;

    if (!taskFn || typeof taskFn !== 'function') {
      logger.error(formatError(`Invalid task function for ${name || id}`));
      this.recordTaskResult(id, {
        success: false,
        error: 'Invalid task function',
      });
      return;
    }

    logger.info(`Running task: ${name || id}...`);

    try {
      // Run the task with options
      const taskResult = await taskFn({
        projectPath: this.projectPath,
        projectTypes: this.projectTypes,
        dryRun: this.options.dryRun,
        verbose: this.options.verbose,
      });

      // Record the result
      this.recordTaskResult(id, taskResult);

      // Log the result
      if (taskResult.success) {
        logger.success(formatSuccess(`Task completed: ${name || id}`));
      } else {
        logger.error(formatError(`Task failed: ${name || id}`));
        if (taskResult.error) {
          logger.error(`Error: ${taskResult.error}`);
        }
      }

      return taskResult;
    } catch (error) {
      logger.error(formatError(`Task threw an exception: ${name || id}`));
      logger.error(`Error: ${error.message}`);

      // Record the error
      this.recordTaskResult(id, {
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Records the result of a task
   * @param {string} taskId - ID of the task
   * @param {Object} result - Result of the task
   */
  recordTaskResult(taskId, result) {
    this.results.tasksRun++;

    if (result.success) {
      this.results.tasksSucceeded++;
    } else {
      this.results.tasksFailed++;
      this.results.success = false;
    }

    this.results.taskResults[taskId] = result;
  }

  /**
   * Logs a summary of the task execution
   */
  logSummary() {
    logger.info('\n===== Task Execution Summary =====');
    logger.info(`Total tasks: ${this.results.tasksRun}`);
    logger.info(`Successful: ${this.results.tasksSucceeded}`);
    logger.info(`Failed: ${this.results.tasksFailed}`);

    if (this.options.dryRun) {
      logger.info('Note: This was a dry run, no actual changes were made');
    }

    if (this.results.success) {
      logger.success(formatSuccess('All tasks completed successfully'));
    } else {
      logger.error(formatError('Some tasks failed'));
    }
    logger.info('=================================\n');
  }
}

module.exports = TaskRunner;
