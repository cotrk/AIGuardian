# AIGuardian Optimization Demo

This project demonstrates the code optimization features of AIGuardian. It contains example files with various issues that can be detected and optimized by AIGuardian's intelligent code optimization tools.

## Included Examples

1. **Duplicate Code** (`duplicate-code.js`): Contains duplicated code blocks that can be refactored into shared functions.

1. **Poor Formatting** (`poorly-formatted.js`): Contains JavaScript code with inconsistent formatting, indentation, and style issues.

1. **Performance Issues** (`performance-issues.js`): Contains code with various performance problems such as inefficient loops, string concatenation, and DOM manipulation.

1. **Unused Dependencies** (`package.json`): Contains dependencies that are not used in the project.

## How to Use

1. Install AIGuardian globally:

```bash
npm install -g aiguardian
```

1. Run the optimization tool on this project:

```bash
cd optimization-demo
aiguardian-optimize
```

1. Select the optimization tasks you want to run, or use the `-a` flag to run all tasks:

```bash
aiguardian-optimize -a
```

1. Review the optimization report to see the detected issues and recommendations.

## Optimization Tasks

- **Duplicate Code Detection**: Identifies duplicated code blocks and suggests refactoring.
- **Dead Code Elimination**: Detects unused functions and variables.
- **Code Formatting**: Formats code according to best practices.
- **Complexity Analysis**: Identifies overly complex functions and suggests simplification.
- **Performance Optimization**: Detects performance issues and suggests improvements.

## Expected Results

After running AIGuardian's optimization tools, you should see:

1. Detected duplicate code in `duplicate-code.js` with suggestions to extract common validation and processing logic.
1. Formatting improvements for `poorly-formatted.js`.
1. Performance optimization suggestions for `performance-issues.js`.
1. Detection of unused dependencies in `package.json`.
1. Complexity analysis for the complex functions in `duplicate-code.js`.

## Notes

This is a demonstration project and does not include actual functionality. The code examples are designed to showcase AIGuardian's optimization capabilities.
