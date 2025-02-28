# AIGuardian Project Overview

AIGuardian is an AI-powered codebase optimizer and cleaner tool designed to help developers maintain clean, secure, and efficient codebases. The tool is built with Node.js and is intended to be used as a command-line utility.

## Core Architecture

1. **Project Structure**:
   - `bin/`: Contains the entry point scripts (`aiguardian.js` and `aiguardian-all.js`)
   - `lib/`: Core functionality and task implementations
   - `docs/`: Documentation files
   - `assets/`: Logo and visual assets
   - `tests/`: Test directories (currently empty)

2. **Core Components**:
   - **Project Detector**: Automatically identifies the type of project (JavaScript/TypeScript, Python, Java, etc.) by analyzing files and directory structures.
   - **Task Runner**: Manages the execution of optimization tasks, handling errors, and reporting results.
   - **Backup Manager**: Creates backups of projects before making changes to ensure safety.

3. **Task-Based Architecture**:
   - Tasks are organized by project type (common, JavaScript, Python, Java)
   - Each task is implemented as a standalone module with a consistent interface
   - Tasks can be run individually or as part of a complete optimization suite

## Key Features

1. **Universal Detection**: The tool automatically identifies project types and adapts to different codebases.

2. **Smart Optimization**: It provides tailored tasks for specific languages and frameworks:
   - **Common Tasks** (for all projects):
     - Optimize .gitignore files
     - Normalize line endings
     - Clean temporary files
     - Format code

   - **JavaScript/TypeScript Tasks**:
     - Convert JavaScript to TypeScript
     - Optimize npm dependencies

   - **Python Tasks**:
     - Clean __pycache__ directories
     - Optimize requirements.txt

   - **Java Tasks**:
     - Clean build artifacts
     - Optimize dependencies

3. **Safety Features**:
   - Creates backups before making changes
   - Supports dry-run mode to preview changes without applying them
   - Provides detailed logs and error handling

4. **User Experience**:
   - Interactive CLI with visual progress indicators
   - Color-coded output for better readability
   - Detailed summaries of actions taken

## Implementation Details

1. **Command-Line Interface**:
   - Uses `commander` for command-line argument parsing
   - Uses `inquirer` for interactive prompts
   - Uses `chalk` and `figures` for colorful terminal output

2. **File Operations**:
   - Safe file reading/writing with error handling
   - Directory creation and management
   - File pattern matching with glob

3. **Logging and Reporting**:
   - Custom logger implementation with different log levels
   - Formatted output for better readability
   - Support for verbose logging for debugging

## Usage Patterns

1. **Individual Task Mode** (`aiguardian`):
   - Allows users to select and run specific optimization tasks
   - Interactive menu for task selection

2. **Complete Optimization Mode** (`aiguardian-all`):
   - Runs all appropriate optimization tasks for the detected project type
   - Non-interactive mode for automation

3. **Command Line Options**:
   - Path specification
   - Dry-run mode
   - Verbose logging
   - Backup control
   - Force mode (skip confirmations)

## Development Status

The project appears to be in a functional state but might still be under active development. The codebase is well-structured with clear separation of concerns and consistent patterns across different modules.