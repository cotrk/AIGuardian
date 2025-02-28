# AIGuardian 🛡️

`Latest Updates (v1.0.0)`

- **Complete Rebrand**: Evolved from a simple cleaner to a comprehensive AI-powered optimization tool
- **Universal Architecture**: Now automatically detects project types and offers relevant optimization tasks
- **Task-Based Framework**: Redesigned with a modular architecture that makes adding new optimizations easy
- **Cross-Platform Support**: Improved compatibility across Windows, Linux, and macOS
- **Modern UI**: Enhanced command-line interface with progress indicators and colorful output

<div align="center" style="border-top:15px #000 solid;border-bottom:15px #000 solid;margin:1.2rem;padding:1rem;opacity:0.5;">
  <img src="assets/logo-aiguardian-5.png" alt="AIGuardian Logo" max-width="99%">
</div>

<p>An AI-powered <strong>codebase optimizer and cleaner</strong> that intelligently detects project types and provides tailored optimization tasks.</p>

## Overview

AIGuardian helps you maintain clean, secure, and efficient codebases by automatically detecting your project type (JavaScript/TypeScript, Python, Java, etc.) and offering relevant optimization tasks. It serves as an intelligent companion for your development process, ensuring your code remains organized and follows best practices.

## Features

- **Universal Detection**: Automatically identifies project types and adapts to different codebases
- **Smart Optimization**: Provides tailored tasks for specific languages and frameworks
- **Safety First**: Creates backups before making changes to ensure nothing is lost
- **Flexible Execution**: Run individual tasks or complete optimization suites
- **User-Friendly Interface**: Interactive CLI with visual progress indicators

## Installation

```bash
# Global installation (recommended)
npm install -g aiguardian

# Or local installation
npm install --save-dev aiguardian
```

## Usage

### Individual Task Mode

Select and run specific optimization tasks:

```bash
# If installed globally
aiguardian

# If installed locally
npx aiguardian
```

### Complete Optimization Mode

Run all appropriate optimization tasks for your project type:

```bash
# If installed globally
aiguardian-all

# If installed locally
npx aiguardian-all
```

### Command Line Options

```
Options:
  -p, --path <path>   Path to project directory (default: current directory)
  -d, --dry-run       Run without making changes
  -v, --verbose       Show detailed logs
  -b, --no-backup     Skip backup creation
  -f, --force         Run without user confirmation
  -h, --help          Display help information
```

## Optimization Capabilities

AIGuardian offers various optimization tasks based on your project type:

### Common Tasks (All Projects)

- **Optimize .gitignore**: Create or improve .gitignore with appropriate patterns
- **Normalize Line Endings**: Ensure consistent line endings across files (CRLF/LF)
- **Clean Temporary Files**: Remove temporary, backup, and system files

### JavaScript/TypeScript Tasks

- **Convert to TypeScript**: Help migrate JavaScript projects to TypeScript
- **Optimize Dependencies**: Update and clean npm dependencies

### Python Tasks

- **Clean**pycache\*\*\*\*: Remove Python cache files and directories
- **Optimize Requirements**: Update and clean Python package dependencies

### Java Tasks

- **Clean Build Artifacts**: Remove build directories and compiled files
- **Optimize Dependencies**: Update Maven/Gradle dependencies

## Why AIGuardian?

Even experienced developers can miss opportunities for codebase optimization. AIGuardian automatically identifies these opportunities and helps implement improvements, ensuring your code stays clean, secure, and efficient.

## For Developers of All Levels

AIGuardian is designed to be accessible for developers with varying levels of experience:

- No complex configuration files needed
- Clear, plain language instructions
- Visual feedback with colors and symbols
- Confirmation prompts before making changes
- Detailed summaries of actions taken

## Contributing

We welcome contributions! Feel free to:

1. Report bugs and issues
2. Suggest new features or optimizations
3. Submit pull requests
4. Help improve documentation

## License

MIT License - Feel free to use AIGuardian in your projects!

---

Note: AIGuardian is under active development. For the latest features and updates, check the GitHub repository regularly.
