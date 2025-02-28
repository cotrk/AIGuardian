/**
 * AIGuardian - AI-powered codebase optimization tool
 * 
 * This file exports the core modules of AIGuardian for programmatic usage.
 * For CLI usage, run the bin/aiguardian.js script directly.
 */

const ProjectDetector = require('./lib/core/project-detector');
const TaskRunner = require('./lib/core/task-runner');
const BackupManager = require('./lib/core/backup-manager');
const taskRegistry = require('./lib/core/task-registry');
const logger = require('./lib/utils/logger').logger;
const fileOps = require('./lib/utils/file-ops');

/**
 * Run AIGuardian programmatically
 * @param {string} projectPath - Path to the project
 * @param {Object} options - Options for the runner
 * @returns {Promise<Object>} - Results of the optimization
 */
async function runAIGuardian(projectPath, options = {}) {
  try {
    // Detect project types
    const detector = new ProjectDetector();
    const projectTypes = await detector.detectProjectTypes(projectPath);
    
    // Get tasks based on project types
    let tasksToRun = [];
    
    if (options.taskIds && options.taskIds.length > 0) {
      // Run specific tasks
      for (const taskId of options.taskIds) {
        const task = taskRegistry.getTaskById(taskId);
        if (task) {
          tasksToRun.push(task);
        }
      }
    } else if (options.all) {
      // Run all tasks
      tasksToRun = taskRegistry.getTasksForProjectTypes(projectTypes);
    } else {
      // Default to common tasks
      tasksToRun = taskRegistry.getTasksByCategory('common');
    }
    
    // Create and run task runner
    const runner = new TaskRunner(projectPath, projectTypes, {
      dryRun: options.dryRun || false,
      verbose: options.verbose || false,
      createBackup: options.createBackup !== false
    });
    
    return await runner.runTasks(tasksToRun);
  } catch (error) {
    logger.error(`Error running AIGuardian: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  runAIGuardian,
  ProjectDetector,
  TaskRunner,
  BackupManager,
  taskRegistry,
  logger,
  fileOps
};
