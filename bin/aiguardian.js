#!/usr/bin/env node

const path = require("path");
const chalk = require("chalk");
const figlet = require("figlet");
const commander = require("commander");
const inquirer = require("inquirer");
const { logger, LogLevel } = require("../lib/utils/logger");
const ProjectDetector = require("../lib/core/project-detector");
const TaskRunner = require("../lib/core/task-runner");
const { formatHeading } = require("../lib/utils/formatters");

// Task registry - would be imported in real code
const commonTasks = {
  gitignore: require("../lib/tasks/common/gitignore"),
  lineEndings: require("../lib/tasks/common/line-endings"),
  tempFiles: require("../lib/tasks/common/temp-files"),
  formatCode: require("../lib/tasks/common/format-code"),
};

const javascriptTasks = {
  convertToTs: require("../lib/tasks/javascript/convert-to-ts"),
  optimizeDeps: require("../lib/tasks/javascript/optimize-deps")
};

const pythonTasks = {
  cleanupPycache: require("../lib/tasks/python/cleanup-pycache"),
  optimizeRequirements: require("../lib/tasks/python/optimize-requirements")
};

const javaTasks = {
  cleanupBuild: require("../lib/tasks/java/cleanup-build"),
  optimizeDeps: require("../lib/tasks/java/optimize-deps")
};

// Display ASCII art logo
function displayLogo() {
  console.log(
    chalk.magenta(
      figlet.textSync("AIGuardian", {
        font: "Standard",
        horizontalLayout: "default"
      })
    )
  );
  console.log(chalk.magenta("Your AI-powered codebase optimizer and cleaner"));
  console.log("");
}

// Map project type to available tasks
function getTasksForProjectType(projectType) {
  const tasks = {
    common: [
      { 
        id: "gitignore", 
        name: "Optimize .gitignore",
        description: "Creates or improves .gitignore file",
        taskFn: commonTasks.gitignore
      },
      { 
        id: "lineEndings", 
        name: "Normalize Line Endings",
        description: "Ensures consistent line endings across files",
        taskFn: commonTasks.lineEndings
      },
      { 
        id: "tempFiles", 
        name: "Clean Temporary Files",
        description: "Removes temporary and backup files",
        taskFn: commonTasks.tempFiles
      },
      {
        id: "formatCode",
        name: "Format Code",
        description: "Standardizes code formatting",
        taskFn: commonTasks.formatCode
      }
    ],
    javascript: [
      { 
        id: "convertToTs", 
        name: "Convert to TypeScript",
        description: "Helps migrate JavaScript project to TypeScript",
        taskFn: javascriptTasks.convertToTs
      },
      { 
        id: "optimizeDeps", 
        name: "Optimize Dependencies",
        description: "Updates and optimizes npm dependencies",
        taskFn: javascriptTasks.optimizeDeps
      }
    ],
    python: [
      { 
        id: "cleanupPycache", 
        name: "Clean __pycache__",
        description: "Removes Python cache files",
        taskFn: pythonTasks.cleanupPycache
      },
      { 
        id: "optimizeRequirements", 
        name: "Optimize Requirements",
        description: "Updates and optimizes Python dependencies",
        taskFn: pythonTasks.optimizeRequirements
      }
    ],
    java: [
      { 
        id: "cleanupBuild", 
        name: "Clean Build Artifacts",
        description: "Removes build artifacts and temporary files",
        taskFn: javaTasks.cleanupBuild
      },
      { 
        id: "optimizeDeps", 
        name: "Optimize Dependencies",
        description: "Updates and optimizes Maven/Gradle dependencies",
        taskFn: javaTasks.optimizeDeps
      }
    ]
  };
  
  let availableTasks = [...tasks.common];
  
  if (projectType === "javascript" || projectType === "typescript") {
    availableTasks = [...availableTasks, ...tasks.javascript];
  } else if (projectType === "python") {
    availableTasks = [...availableTasks, ...tasks.python];
  } else if (projectType === "java") {
    availableTasks = [...availableTasks, ...tasks.java];
  }
  
  return availableTasks;
}

// Main function
async function main() {
  // Set up command line options
  const program = new commander.Command();
  
  program
    .name("aiguardian")
    .description("AI-powered codebase optimizer and cleaner")
    .version("1.0.0")
    .option("-p, --path <path>", "Path to project directory", process.cwd())
    .option("-d, --dry-run", "Run without making changes", false)
    .option("-v, --verbose", "Show detailed logs", false)
    .option("-b, --no-backup", "Skip backup creation", false)
    .option("-f, --force", "Run without user confirmation", false)
    .parse(process.argv);
  
  const options = program.opts();
  
  // Set up logger based on verbosity
  if (options.verbose) {
    logger.setLevel(LogLevel.DEBUG);
  }
  
  // Display logo
  displayLogo();
  
  const projectPath = path.resolve(options.path);
  logger.info(`Analyzing project at: ${chalk.cyan(projectPath)}`);
  
  // Detect project type
  const detector = new ProjectDetector();
  const projectInfo = await detector.detectProject(projectPath);
  
  if (projectInfo.type === "unknown" || projectInfo.error) {
    logger.error(`Could not detect project type: ${projectInfo.error || "Unknown error"}`);
    process.exit(1);
  }
  
  logger.info(`Project type: ${chalk.cyan(projectInfo.type)}`);
  
  // Get available tasks for this project type
  const availableTasks = getTasksForProjectType(projectInfo.type);
  
  // Prompt user to select tasks
  const { selectedTaskIds } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selectedTaskIds",
      message: "Select optimization tasks to run:",
      choices: availableTasks.map(task => ({
        name: `${task.name} - ${task.description}`,
        value: task.id,
        checked: false
      }))
    }
  ]);
  
  if (selectedTaskIds.length === 0) {
    logger.warn("No tasks selected, exiting.");
    process.exit(0);
  }
  
  // Filter tasks by selection
  const selectedTasks = availableTasks.filter(task => 
    selectedTaskIds.includes(task.id)
  );
  
  logger.info(`Selected ${selectedTasks.length} tasks to run.`);
  
  // Confirm if not in force mode
  if (!options.force && !options.dryRun) {
    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: "Run selected tasks? This will modify your project files.",
        default: false
      }
    ]);
    
    if (!confirm) {
      logger.info("Operation cancelled by user.");
      process.exit(0);
    }
  }
  
  // Show what's going to happen
  console.log(formatHeading("Tasks to Run"));
  selectedTasks.forEach((task, index) => {
    console.log(`${index + 1}. ${chalk.magenta(task.name)}`);
    console.log(`   ${task.description}`);
  });
  console.log("");
  
  if (options.dryRun) {
    logger.info(chalk.yellow("Running in dry-run mode (no changes will be made)"));
  }
  
  // Run tasks
  const taskRunner = new TaskRunner(projectPath, projectInfo, {
    dryRun: options.dryRun,
    verbose: options.verbose,
    createBackup: options.backup
  });
  
  const results = await taskRunner.runTasks(selectedTasks);
  
  // Show final message
  if (results.success) {
    logger.success(chalk.green.bold("All tasks completed successfully!"));
  } else {
    logger.error(chalk.red.bold(`Completed with errors: ${results.tasksFailed} tasks failed`));
  }
}

// Run the program
main().catch(error => {
  logger.error(`Unhandled error: ${error.message}`);
  logger.debug(error.stack);
  process.exit(1);
});











