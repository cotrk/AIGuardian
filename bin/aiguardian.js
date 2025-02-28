#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const readline = require("readline");
const { logger, LogLevel } = require("../lib/utils/logger");
const ProjectDetector = require("../lib/core/project-detector");
const TaskRunner = require("../lib/core/task-runner");
const { formatHeading } = require("../lib/utils/formatters");

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

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Display ASCII art logo
function displayLogo() {
  console.log(`${Colors.MAGENTA}${Colors.BOLD}
    _    ___ ____                     _ _             
   / \\  |_ _/ ___|_   _  __ _ _ __ __| (_) __ _ _ __  
  / _ \\  | | |  _| | | |/ _\` | '__/ _\` | |/ _\` | '_ \\ 
 / ___ \\ | | |_| | |_| | (_| | | | (_| | | (_| | | | |
/_/   \\_\\___\\____|\\__,_|\\__,_|_|  \\__,_|_|\\__,_|_| |_|
${Colors.RESET}`);
  console.log(`${Colors.MAGENTA}Your AI-powered codebase optimizer and cleaner${Colors.RESET}`);
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
        description: "Converts line endings to LF or CRLF",
        taskFn: commonTasks.lineEndings
      },
      { 
        id: "tempFiles", 
        name: "Clean Temporary Files",
        description: "Removes temporary and cache files",
        taskFn: commonTasks.tempFiles
      },
      { 
        id: "formatCode", 
        name: "Format Code",
        description: "Formats code according to best practices",
        taskFn: commonTasks.formatCode
      }
    ],
    javascript: [
      { 
        id: "js-convertToTs", 
        name: "Convert to TypeScript",
        description: "Converts JavaScript files to TypeScript",
        taskFn: javascriptTasks.convertToTs
      },
      { 
        id: "js-optimizeDeps", 
        name: "Optimize Dependencies",
        description: "Analyzes and optimizes npm dependencies",
        taskFn: javascriptTasks.optimizeDeps
      }
    ],
    python: [
      { 
        id: "py-cleanupPycache", 
        name: "Clean __pycache__",
        description: "Removes Python cache directories",
        taskFn: pythonTasks.cleanupPycache
      },
      { 
        id: "py-optimizeRequirements", 
        name: "Optimize requirements.txt",
        description: "Analyzes and optimizes Python dependencies",
        taskFn: pythonTasks.optimizeRequirements
      }
    ],
    java: [
      { 
        id: "java-cleanupBuild", 
        name: "Clean Build Artifacts",
        description: "Removes Java build directories",
        taskFn: javaTasks.cleanupBuild
      },
      { 
        id: "java-optimizeDeps", 
        name: "Optimize Dependencies",
        description: "Analyzes and optimizes Java dependencies",
        taskFn: javaTasks.optimizeDeps
      }
    ]
  };
  
  const availableTasks = [...tasks.common];
  
  if (projectType.includes("javascript") || projectType.includes("typescript")) {
    availableTasks.push(...tasks.javascript);
  }
  
  if (projectType.includes("python")) {
    availableTasks.push(...tasks.python);
  }
  
  if (projectType.includes("java")) {
    availableTasks.push(...tasks.java);
  }
  
  return availableTasks;
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    path: process.cwd(),
    dryRun: false,
    verbose: false,
    backup: true,
    force: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '-p' || arg === '--path') {
      options.path = args[++i] || options.path;
    } else if (arg === '-d' || arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '-v' || arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '-b' || arg === '--no-backup') {
      options.backup = false;
    } else if (arg === '-f' || arg === '--force') {
      options.force = true;
    } else if (arg === '-h' || arg === '--help') {
      displayHelp();
      process.exit(0);
    } else if (arg === '--version') {
      console.log('1.0.0');
      process.exit(0);
    }
  }
  
  return options;
}

// Display help information
function displayHelp() {
  console.log(`
  Usage: aiguardian [options]
  
  Options:
    -p, --path <path>     Path to project directory (default: current directory)
    -d, --dry-run         Run without making changes
    -v, --verbose         Show detailed logs
    -b, --no-backup       Skip backup creation
    -f, --force           Run without user confirmation
    -h, --help            Display this help information
    --version             Display version information
  `);
}

// Prompt user to select tasks
async function promptTaskSelection(availableTasks) {
  return new Promise((resolve) => {
    console.log(`${Colors.CYAN}Select optimization tasks to run:${Colors.RESET}`);
    console.log(`(Enter the numbers of the tasks you want to run, separated by spaces, then press Enter)`);
    console.log("");
    
    availableTasks.forEach((task, index) => {
      console.log(`  ${index + 1}. ${Colors.BOLD}${task.name}${Colors.RESET} - ${task.description}`);
    });
    
    rl.question(`\n${Colors.CYAN}Enter task numbers:${Colors.RESET} `, (answer) => {
      const selectedIndices = answer.split(" ")
        .map(num => parseInt(num.trim(), 10) - 1)
        .filter(index => !isNaN(index) && index >= 0 && index < availableTasks.length);
      
      const selectedTaskIds = selectedIndices.map(index => availableTasks[index].id);
      resolve(selectedTaskIds);
    });
  });
}

// Prompt for confirmation
async function promptConfirmation(message) {
  return new Promise((resolve) => {
    rl.question(`${Colors.YELLOW}${message} (y/n)${Colors.RESET} `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Main function
async function main() {
  try {
    // Parse command line arguments
    const options = parseArgs();
    
    // Set up logger based on verbosity
    if (options.verbose) {
      logger.setLevel(LogLevel.DEBUG);
    }
    
    // Display logo
    displayLogo();
    
    const projectPath = path.resolve(options.path);
    logger.info(`Analyzing project at: ${Colors.CYAN}${projectPath}${Colors.RESET}`);
    
    // Detect project type
    const detector = new ProjectDetector();
    const projectType = await detector.detectProjectType(projectPath);
    
    logger.info(`Detected project type: ${Colors.CYAN}${projectType.join(", ")}${Colors.RESET}`);
    
    // Get available tasks for project type
    const availableTasks = getTasksForProjectType(projectType);
    
    // Display task selection
    console.log(formatHeading("Available Tasks"));
    
    // Prompt user to select tasks
    const selectedTaskIds = await promptTaskSelection(availableTasks);
    
    if (selectedTaskIds.length === 0) {
      logger.warn("No tasks selected, exiting.");
      rl.close();
      process.exit(0);
    }
    
    // Filter tasks by selection
    const selectedTasks = availableTasks.filter(task => 
      selectedTaskIds.includes(task.id)
    );
    
    logger.info(`Selected ${selectedTasks.length} tasks to run.`);
    
    // Confirm if not in force mode
    if (!options.force && !options.dryRun) {
      const confirm = await promptConfirmation("Run selected tasks? This will modify your project files.");
      
      if (!confirm) {
        logger.info("Operation cancelled by user.");
        rl.close();
        process.exit(0);
      }
    }
    
    // Create task runner
    const taskRunner = new TaskRunner({
      projectPath,
      dryRun: options.dryRun,
      createBackup: options.backup
    });
    
    // Run selected tasks
    console.log(formatHeading("Running Tasks"));
    
    const results = await taskRunner.runTasks(
      selectedTasks.map(task => task.taskFn)
    );
    
    // Display results
    console.log(formatHeading("Results"));
    
    for (const [index, result] of results.entries()) {
      const task = selectedTasks[index];
      const statusColor = result.success ? Colors.GREEN : Colors.RED;
      const statusSymbol = result.success ? "✓" : "✖";
      
      console.log(`${statusColor}${statusSymbol}${Colors.RESET} ${Colors.BOLD}${task.name}${Colors.RESET}: ${result.message}`);
    }
    
    const successCount = results.filter(r => r.success).length;
    logger.info(`Completed ${successCount}/${results.length} tasks successfully.`);
    
    if (options.dryRun) {
      logger.info(`Dry run completed. No changes were made.`);
    }
    
    rl.close();
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    logger.debug(error.stack);
    rl.close();
    process.exit(1);
  }
}

// Run the program
main().catch(error => {
  logger.error(`Unhandled error: ${error.message}`);
  logger.debug(error.stack);
  rl.close();
  process.exit(1);
});
