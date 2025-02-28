# AIGuardian Troubleshooting Guide

If you run into any issues with AIGuardian, this guide will help you solve common problems.

## Installation Problems

### "Command not found" after installation

If you see `aiguardian: command not found` after installing:

1. Try closing and reopening your terminal/command prompt
2. If that doesn't work, try installing again with:
   ```
   npm install -g aiguardian
   ```
3. Make sure Node.js is properly installed by typing:
   ```
   node --version
   ```
   If this doesn't show a version number, you need to reinstall Node.js

### Installation errors with npm

If you see errors during installation:

1. Make sure you have the latest version of npm:
   ```
   npm install -g npm
   ```
2. Try installing with administrator privileges:
   - Windows: Right-click command prompt and select "Run as administrator"
   - Mac/Linux: Use `sudo npm install -g aiguardian`

## Usage Problems

### AIGuardian can't detect my project type

If AIGuardian doesn't correctly identify your project:

1. Make sure you're running AIGuardian in the main folder of your project
2. Check if your project has the typical files for its type (like package.json for JavaScript/Node.js)
3. You can still select tasks manually even if detection isn't perfect

### AIGuardian is too slow

If AIGuardian seems to take a long time:

1. Try running it on a smaller part of your project first
2. Use the `--verbose` option to see what's happening:
   ```
   aiguardian --verbose
   ```

### Changes made by AIGuardian broke my project

If something doesn't work after using AIGuardian:

1. Don't panic! AIGuardian creates backups before making changes
2. Look in the `.aiguardian/backups` folder in your project
3. The backups are ZIP files named with timestamps
4. Extract the most recent backup to restore your files

## Common Error Messages

### "No tasks applicable for this project"

This means AIGuardian couldn't find tasks suitable for your project:

1. Make sure you're in the correct project folder
2. Your project might be in a format AIGuardian doesn't recognize
3. Try running specific tasks manually

### "Permission denied" errors

If you see permission errors:

1. Make sure you have write permission to the files in your project
2. Try running AIGuardian with administrator privileges

## Getting More Help

If you're still having issues:

1. Check the official AIGuardian documentation
2. Visit the GitHub repository to search for similar issues
3. Ask for help in the discussions section on GitHub
4. Submit a bug report if you've found a new issue