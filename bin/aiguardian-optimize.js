#!/usr/bin/env node

const path = require('path');
const fs = require('fs').promises;
const readline = require('readline');
const { logger, LogLevel } = require('../lib/utils/logger');
const ProjectDetector = require('../lib/core/project-detector');
const OptimizationManager = require('../lib/core/optimization-manager');
const taskRegistry = require('../lib/core/task-registry');
const { formatHeading, formatSuccess, formatError, formatWarning } = require('../lib/utils/formatters');

// ANSI color codes for terminal output
const Colors = {
  RESET: '\x1b[0m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  GREEN: '\x1b[32m',
  MAGENTA: '\x1b[35m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BOLD: '\x1b[1m',
};

// Create readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Display ASCII art logo
 */
function displayLogo() {
  const logo = `
   █████╗ ██╗ ██████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗ ██╗ █████╗ ███╗   ██╗
  ██╔══██╗██║██╔════╝ ██║   ██║██╔══██╗██╔══██╗██╔══██╗██║██╔══██╗████╗  ██║
  ███████║██║██║  ███╗██║   ██║███████║██████╔╝██║  ██║██║███████║██╔██╗ ██║
  ██╔══██║██║██║   ██║██║   ██║██╔══██║██╔══██╗██║  ██║██║██╔══██║██║╚██╗██║
  ██║  ██║██║╚██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝██║██║  ██║██║ ╚████║
  ╚═╝  ╚═╝╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝
                                                                               
  ${Colors.CYAN}Code Optimization Tool${Colors.RESET}
  `;
  
  console.log(logo);
}

/**
 * Parse command line arguments
 * @returns {Object} - Parsed options
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    path: process.cwd(),
    dryRun: false,
    verbose: false,
    yes: false,
    noBackup: false,
    help: false,
    all: false,
    tasks: []
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '-p':
      case '--path':
        options.path = args[++i] || process.cwd();
        break;
      case '-d':
      case '--dry-run':
        options.dryRun = true;
        break;
      case '-v':
      case '--verbose':
        options.verbose = true;
        break;
      case '-y':
      case '--yes':
        options.yes = true;
        break;
      case '--no-backup':
        options.noBackup = true;
        break;
      case '-a':
      case '--all':
        options.all = true;
        break;
      case '-t':
      case '--task':
        if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          options.tasks.push(args[++i]);
        }
        break;
      case '-h':
      case '--help':
        options.help = true;
        break;
    }
  }
  
  return options;
}

/**
 * Display help information
 */
function displayHelp() {
  console.log(`
${Colors.BOLD}Usage:${Colors.RESET} aiguardian-optimize [options]

${Colors.BOLD}Description:${Colors.RESET}
  Intelligent Code Optimization Tool that analyzes and optimizes your codebase.
  It can detect code duplications, eliminate dead code, format code according to best practices,
  suggest performance improvements, and analyze code complexity.

${Colors.BOLD}Options:${Colors.RESET}
  -p, --path <path>   Path to the project directory (default: current directory)
  -d, --dry-run       Run without making any changes
  -v, --verbose       Enable verbose logging
  -y, --yes           Skip confirmation prompts
  --no-backup         Skip creating backup before changes
  -a, --all           Run all available optimization tasks
  -t, --task <id>     Run specific task (can be used multiple times)
  -h, --help          Display this help message

${Colors.BOLD}Available optimization tasks:${Colors.RESET}
  detect-duplicate-code    Identify duplicated code blocks across the project
  eliminate-dead-code      Detect and suggest removal of unused code
  format-code              Format code according to best practices
  analyze-complexity       Analyze code complexity and provide simplification recommendations
  optimize-performance     Analyze code for performance issues and suggest improvements

${Colors.BOLD}Examples:${Colors.RESET}
  aiguardian-optimize -a                     Run all optimization tasks
  aiguardian-optimize -t detect-duplicate-code   Run only duplicate code detection
  aiguardian-optimize -d -a                  Dry run all optimization tasks
  `);
}

/**
 * Prompt user to select tasks
 * @param {Array<Object>} availableTasks - Available tasks
 * @returns {Promise<Array<string>>} - Selected task IDs
 */
async function promptTaskSelection(availableTasks) {
  console.log(`${Colors.YELLOW}Select optimization tasks to run (enter numbers separated by spaces):${Colors.RESET}`);
  
  // Filter for optimization tasks only
  const optimizationTasks = availableTasks.filter(task => 
    task.id === 'detect-duplicate-code' ||
    task.id === 'eliminate-dead-code' ||
    task.id === 'format-code' ||
    task.id === 'analyze-complexity' ||
    task.id === 'optimize-performance'
  );
  
  optimizationTasks.forEach((task, index) => {
    console.log(`${Colors.GREEN}${index + 1}.${Colors.RESET} ${Colors.BOLD}${task.name}${Colors.RESET}`);
    console.log(`   ${task.description}`);
  });
  
  return new Promise((resolve) => {
    rl.question(`${Colors.YELLOW}Enter your selection:${Colors.RESET} `, (answer) => {
      const selectedIndices = answer.split(/\s+/).map(Number).filter(n => !isNaN(n) && n > 0 && n <= optimizationTasks.length);
      const selectedTaskIds = selectedIndices.map(index => optimizationTasks[index - 1].id);
      resolve(selectedTaskIds);
    });
  });
}

/**
 * Prompt for confirmation
 * @param {string} message - Confirmation message
 * @returns {Promise<boolean>} - User response
 */
async function promptConfirmation(message) {
  return new Promise((resolve) => {
    rl.question(`${Colors.YELLOW}${message} (y/n)${Colors.RESET} `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Main function
 */
async function main() {
  try {
    // Display logo
    displayLogo();
    
    // Parse command line arguments
    const options = parseArgs();
    
    // Set log level
    logger.setLevel(options.verbose ? LogLevel.DEBUG : LogLevel.INFO);
    
    // Display help if requested
    if (options.help) {
      displayHelp();
      process.exit(0);
    }
    
    // Get project path
    const projectPath = path.resolve(options.path || process.cwd());
    
    // Check if directory exists
    try {
      await fs.access(projectPath);
    } catch (error) {
      logger.error(`Project path does not exist: ${projectPath}`);
      process.exit(1);
    }
    
    logger.info(`Analyzing project at: ${projectPath}`);
    
    // Detect project type
    const detector = new ProjectDetector();
    const projectTypes = await detector.detectProjectTypes(projectPath);
    
    if (projectTypes.length === 0) {
      logger.warn('Could not detect project type. Will only run common optimization tasks.');
    } else {
      logger.info(`Detected project types: ${projectTypes.join(', ')}`);
    }
    
    // Get available tasks
    const availableTasks = taskRegistry.getTasksForProjectTypes(projectTypes);
    
    // Filter for optimization tasks only
    const optimizationTasks = availableTasks.filter(task => 
      task.id === 'detect-duplicate-code' ||
      task.id === 'eliminate-dead-code' ||
      task.id === 'format-code' ||
      task.id === 'analyze-complexity' ||
      task.id === 'optimize-performance'
    );
    
    if (optimizationTasks.length === 0) {
      logger.error('No optimization tasks available for this project type');
      process.exit(1);
    }
    
    logger.info(`Found ${optimizationTasks.length} available optimization tasks`);
    
    // Get tasks to run
    let tasksToRun = [];
    
    if (options.all) {
      // Run all tasks
      tasksToRun = optimizationTasks;
      logger.info('Running all available optimization tasks');
    } else if (options.tasks && options.tasks.length > 0) {
      // Run specified tasks
      for (const taskId of options.tasks) {
        const task = optimizationTasks.find(t => t.id === taskId);
        if (task) {
          tasksToRun.push(task);
        } else {
          logger.warn(`Unknown optimization task: ${taskId}`);
        }
      }
      
      if (tasksToRun.length === 0) {
        logger.error('No valid optimization tasks specified');
        process.exit(1);
      }
    } else {
      // Prompt user to select tasks
      logger.info('Please select optimization tasks to run:');
      const selectedTaskIds = await promptTaskSelection(availableTasks);
      
      if (selectedTaskIds.length === 0) {
        logger.info('No tasks selected, exiting');
        process.exit(0);
      }
      
      tasksToRun = optimizationTasks.filter(task => selectedTaskIds.includes(task.id));
    }
    
    // Confirm task execution
    logger.info(`\nSelected ${tasksToRun.length} optimization tasks to run:`);
    tasksToRun.forEach((task, index) => {
      logger.info(`${index + 1}. ${task.name} - ${task.description || ''}`);
    });
    
    const confirmed = options.yes || await promptConfirmation('\nDo you want to continue?');
    
    if (!confirmed) {
      logger.info('Operation cancelled');
      process.exit(0);
    }
    
    // Create optimization manager
    const optimizationManager = new OptimizationManager(projectPath, projectTypes, {
      dryRun: options.dryRun,
      verbose: options.verbose
    });
    
    // Run optimization tasks
    logger.info(formatHeading('Running Optimization Tasks'));
    
    const taskIds = tasksToRun.map(task => task.id);
    const results = await optimizationManager.runSpecificTasks(taskIds, !options.noBackup);
    
    if (results.success) {
      logger.success('Optimization tasks completed successfully');
      
      if (results.reportPath) {
        logger.info(`Optimization report saved to: ${results.reportPath}`);
        
        // Display the report
        const reportContent = await fs.readFile(results.reportPath, 'utf8');
        console.log('\n' + reportContent);
      }
    } else {
      logger.error(`Optimization failed: ${results.error}`);
    }
    
    // Close readline interface
    rl.close();
    
    // Exit with appropriate code
    process.exit(results.success ? 0 : 1);
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    logger.debug(error.stack);
    process.exit(1);
  }
}

// Run the program
main().catch(error => {
  logger.error(`Unhandled error: ${error.message}`);
  logger.debug(error.stack);
  process.exit(1);
});
