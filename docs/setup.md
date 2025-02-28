# Getting Started with AIGuardian

This guide will walk you through setting up and using AIGuardian in the simplest way possible.

## What is AIGuardian?

AIGuardian is a helpful tool that cleans up and improves your code projects automatically. Think of it like a smart assistant that tidies up your project files.

## Installation

### Step 1: Make sure you have Node.js installed

AIGuardian needs Node.js to run. If you don't have it already:

1. Go to [nodejs.org](https://nodejs.org/)
2. Download and install the "LTS" (Long Term Support) version
3. Follow the installation instructions for your computer

### Step 2: Install AIGuardian

Once Node.js is installed, open your command prompt or terminal and type:

```
npm install -g aiguardian
```

Wait for the installation to finish. This might take a minute or two.

## Using AIGuardian

### Basic Usage

1. Open your command prompt or terminal
2. Navigate to your project folder
   - On Windows: use `cd your_project_folder_path`
   - On Mac/Linux: use `cd your_project_folder_path`
3. Run AIGuardian:
   ```
   aiguardian
   ```

### What Happens Next

1. AIGuardian will scan your project files
2. It will show you a list of tasks it can perform
3. Use arrow keys to select tasks (press spacebar to select/deselect)
4. Press Enter to confirm your selection
5. AIGuardian will ask for confirmation before making changes
6. Once confirmed, it will clean and optimize your project

## Safest Way to Use AIGuardian

If you're worried about changes, use the "dry run" mode:

```
aiguardian --dry-run
```

This will show what changes would be made without actually changing anything.

## Common Tasks AIGuardian Can Help With

- Removing unnecessary files
- Fixing line endings in text files
- Creating or improving the .gitignore file
- Updating dependencies
- Organizing files

## Need Help?

If you encounter any issues or have questions:

1. Check the [GitHub repository](https://github.com/your-repo/aiguardian) for updates
2. Open an issue on GitHub if you find a bug
3. Ask for help in the discussions section

Remember, AIGuardian is designed to help make your coding experience easier!