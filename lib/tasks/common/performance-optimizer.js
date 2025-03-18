/**
 * Performance Optimizer
 * Analyzes code for performance issues and suggests improvements
 */
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../../utils/logger');
const astParser = require('../../utils/ast-parser');

/**
 * Gets file extensions to analyze based on project types
 * @param {string[]} projectTypes - Detected project types
 * @returns {string[]} - File extensions to analyze
 */
function getFileExtensions(projectTypes) {
  const extensions = [];
  
  // Default to JavaScript files if no specific project types are provided
  if (!projectTypes || !Array.isArray(projectTypes) || projectTypes.length === 0 || 
      projectTypes.includes('generic') || projectTypes.includes('unknown')) {
    extensions.push('.js', '.jsx');
  }
  
  if (projectTypes && Array.isArray(projectTypes)) {
    if (projectTypes.includes('javascript') || projectTypes.includes('typescript')) {
      extensions.push('.js', '.jsx');
      
      if (projectTypes.includes('typescript')) {
        extensions.push('.ts', '.tsx');
      }
    }
    
    if (projectTypes.includes('python')) {
      extensions.push('.py');
    }
    
    if (projectTypes.includes('java')) {
      extensions.push('.java');
    }
  }
  
  return extensions;
}

/**
 * Finds all source files to analyze
 * @param {string} projectPath - Path to the project
 * @param {string[]} extensions - File extensions to include
 * @returns {Promise<string[]>} - Array of file paths
 */
async function findSourceFiles(projectPath, extensions) {
  try {
    const sourceFiles = [];
    
    // Get all files recursively
    async function scanDirectory(dirPath) {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        // Skip node_modules, .git, and other common directories to ignore
        if (entry.isDirectory()) {
          if (
            entry.name !== 'node_modules' && 
            entry.name !== '.git' && 
            entry.name !== 'dist' && 
            entry.name !== 'build' && 
            entry.name !== '.aiguardian' && 
            !entry.name.startsWith('__pycache__')
          ) {
            await scanDirectory(fullPath);
          }
        } else if (extensions.some(ext => entry.name.endsWith(ext))) {
          sourceFiles.push(fullPath);
        }
      }
    }
    
    await scanDirectory(projectPath);
    return sourceFiles;
  } catch (error) {
    logger.error(`Error finding source files: ${error.message}`);
    return [];
  }
}

/**
 * Analyzes JavaScript/TypeScript code for performance issues
 * @param {string} filePath - Path to the file
 * @returns {Promise<Array>} - Array of performance issues
 */
async function analyzeJavaScriptPerformance(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];
    
    // This is a simplified implementation
    // In a real implementation, we would use AST parsing for more accurate results
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and comments
      if (line === '' || line.startsWith('//') || line.startsWith('/*')) {
        continue;
      }
      
      // Check for inefficient DOM operations in loops
      if ((line.includes('for ') || line.includes('while ')) && 
          (line.includes('document.') || line.includes('getElementById') || 
           line.includes('querySelector'))) {
        issues.push({
          file: filePath,
          line: i + 1,
          description: 'DOM operation inside a loop',
          impact: 'DOM operations are expensive. Performing them inside loops can significantly slow down your application.',
          suggestion: 'Cache DOM elements outside the loop and manipulate them inside the loop, or use DocumentFragment for batch updates.',
          critical: true
        });
      }
      
      // Check for inefficient array operations
      if (line.includes('.forEach') && (line.includes('.push') || line.includes('.concat'))) {
        issues.push({
          file: filePath,
          line: i + 1,
          description: 'Inefficient array manipulation',
          impact: 'Using forEach with push/concat can be less efficient than using map or filter.',
          suggestion: 'Consider using map() or filter() instead of forEach() with push/concat.',
          critical: false
        });
      }
      
      // Check for inefficient string concatenation
      if (line.match(/[a-zA-Z_$][a-zA-Z0-9_$]*\s*\+=\s*['"][^'"]*['"]/)) {
        issues.push({
          file: filePath,
          line: i + 1,
          description: 'Inefficient string concatenation',
          impact: 'Repeated string concatenation with += can be inefficient for large strings.',
          suggestion: 'Use array.join() or template literals for building large strings.',
          critical: false
        });
      }
      
      // Check for synchronous XMLHttpRequest
      if (line.includes('new XMLHttpRequest') && 
          content.substring(i, i + 200).includes('.open') && 
          !content.substring(i, i + 200).includes('async')) {
        issues.push({
          file: filePath,
          line: i + 1,
          description: 'Synchronous XMLHttpRequest',
          impact: 'Synchronous XMLHttpRequest blocks the main thread and creates a poor user experience.',
          suggestion: 'Use asynchronous XMLHttpRequest or fetch() API instead.',
          critical: true
        });
      }
      
      // Check for inefficient selectors
      if (line.includes('document.getElementsByTagName') || line.includes('document.querySelectorAll("*")')) {
        issues.push({
          file: filePath,
          line: i + 1,
          description: 'Inefficient DOM selector',
          impact: 'Using broad selectors like getElementsByTagName or querySelectorAll("*") can be very slow.',
          suggestion: 'Use more specific selectors or add class/id attributes to target elements more efficiently.',
          critical: false
        });
      }
      
      // Check for memory leaks in event listeners
      if (line.includes('.addEventListener') && 
          !content.substring(i - 500, i + 500).includes('.removeEventListener')) {
        issues.push({
          file: filePath,
          line: i + 1,
          description: 'Potential memory leak in event listener',
          impact: 'Adding event listeners without removing them can cause memory leaks, especially in components that are created and destroyed frequently.',
          suggestion: 'Make sure to remove event listeners when they are no longer needed using removeEventListener().',
          critical: false
        });
      }
      
      // Check for console.log in production code
      if (line.includes('console.log')) {
        issues.push({
          file: filePath,
          line: i + 1,
          description: 'console.log in production code',
          impact: 'console.log statements can impact performance and should be removed in production code.',
          suggestion: 'Remove console.log statements or use a logging library with configurable log levels.',
          critical: false
        });
      }
    }
    
    return issues;
  } catch (error) {
    logger.error(`Error analyzing performance for ${filePath}: ${error.message}`);
    return [];
  }
}

/**
 * Analyzes Python code for performance issues
 * @param {string} filePath - Path to the file
 * @returns {Promise<Array>} - Array of performance issues
 */
async function analyzePythonPerformance(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];
    
    // This is a simplified implementation
    // In a real implementation, we would use AST parsing for more accurate results
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and comments
      if (line === '' || line.startsWith('#')) {
        continue;
      }
      
      // Check for inefficient list operations
      if ((line.includes('for ') || line.includes('while ')) && 
          (line.includes('.append') || line.includes('.extend'))) {
        issues.push({
          file: filePath,
          line: i + 1,
          description: 'Inefficient list manipulation',
          impact: 'Using append/extend inside loops can be inefficient for large lists.',
          suggestion: 'Consider using list comprehensions or generator expressions instead of loops with append/extend.',
          critical: false
        });
      }
      
      // Check for inefficient string concatenation
      if (line.match(/[a-zA-Z_][a-zA-Z0-9_]*\s*\+=\s*['"][^'"]*['"]/)) {
        issues.push({
          file: filePath,
          line: i + 1,
          description: 'Inefficient string concatenation',
          impact: 'Repeated string concatenation with += can be inefficient for large strings.',
          suggestion: 'Use str.join() or f-strings for building large strings.',
          critical: false
        });
      }
      
      // Check for inefficient list/dict comprehensions
      if (line.includes('[') && line.includes('for') && line.includes('if') && 
          line.includes('if') && line.includes('if')) {
        issues.push({
          file: filePath,
          line: i + 1,
          description: 'Complex list/dict comprehension',
          impact: 'Overly complex comprehensions can be hard to read and maintain.',
          suggestion: 'Break down complex comprehensions into multiple steps or use generator expressions for large datasets.',
          critical: false
        });
      }
      
      // Check for inefficient database operations
      if ((line.includes('for ') || line.includes('while ')) && 
          (line.includes('.execute(') || line.includes('.query('))) {
        issues.push({
          file: filePath,
          line: i + 1,
          description: 'Database operation inside a loop',
          impact: 'Performing database operations inside loops can lead to N+1 query problems and poor performance.',
          suggestion: 'Use batch operations or ORM features like select_related() or prefetch_related() to reduce the number of queries.',
          critical: true
        });
      }
      
      // Check for global variables
      if (line.match(/^[a-zA-Z_][a-zA-Z0-9_]*\s*=/) && 
          !line.startsWith('def ') && !line.startsWith('class ')) {
        issues.push({
          file: filePath,
          line: i + 1,
          description: 'Global variable',
          impact: 'Global variables can lead to namespace pollution and make code harder to maintain.',
          suggestion: 'Consider encapsulating variables within functions or classes.',
          critical: false
        });
      }
      
      // Check for print statements
      if (line.includes('print(')) {
        issues.push({
          file: filePath,
          line: i + 1,
          description: 'print() statement in production code',
          impact: 'print() statements can impact performance and should be removed in production code.',
          suggestion: 'Use a logging library like logging with configurable log levels instead of print().',
          critical: false
        });
      }
    }
    
    return issues;
  } catch (error) {
    logger.error(`Error analyzing performance for ${filePath}: ${error.message}`);
    return [];
  }
}

/**
 * Analyzes code for performance issues and suggests improvements
 * @param {string} projectPath - Path to the project
 * @param {string[]} projectTypes - Detected project types
 * @param {Object} options - Task options
 * @returns {Promise<Object>} - Task result
 */
async function optimizePerformance(projectPath, projectTypes = [], options = {}) {
  logger.info('Analyzing code for performance issues...');
  
  try {
    // Ensure projectTypes is an array
    if (!projectTypes || !Array.isArray(projectTypes)) {
      projectTypes = [];
    }
    
    // Get file extensions to analyze based on project types
    const extensions = getFileExtensions(projectTypes);
    
    if (extensions.length === 0) {
      logger.warn('No supported file types found for performance optimization');
      return {
        success: true,
        changes: [],
        metrics: {
          issuesFound: 0,
          criticalIssues: 0,
          estimatedImprovement: '0%'
        }
      };
    }
    
    // Find all source files
    const sourceFiles = await findSourceFiles(projectPath, extensions);
    logger.info(`Found ${sourceFiles.length} source files to analyze`);
    
    if (sourceFiles.length === 0) {
      logger.warn('No source files found for performance optimization');
      return {
        success: true,
        changes: [],
        metrics: {
          issuesFound: 0,
          criticalIssues: 0,
          estimatedImprovement: '0%'
        }
      };
    }
    
    // Group files by language
    const jsFiles = sourceFiles.filter(file => 
      file.endsWith('.js') || file.endsWith('.jsx') || 
      file.endsWith('.ts') || file.endsWith('.tsx')
    );
    
    const pyFiles = sourceFiles.filter(file => file.endsWith('.py'));
    
    // Analyze files by language
    const allIssues = [];
    
    // Analyze JavaScript/TypeScript files
    for (const file of jsFiles) {
      const issues = await analyzeJavaScriptPerformance(file);
      allIssues.push(...issues);
    }
    
    // Analyze Python files
    for (const file of pyFiles) {
      const issues = await analyzePythonPerformance(file);
      allIssues.push(...issues);
    }
    
    // Calculate metrics
    const issuesFound = allIssues.length;
    const criticalIssues = allIssues.filter(issue => issue.critical).length;
    
    // Estimate performance improvement (simplified)
    // In a real implementation, we would use more sophisticated algorithms
    let estimatedImprovement = '0%';
    
    if (issuesFound > 0) {
      const improvementFactor = (criticalIssues * 5 + (issuesFound - criticalIssues)) / sourceFiles.length;
      const improvementPercentage = Math.min(Math.round(improvementFactor * 10), 90);
      estimatedImprovement = `${improvementPercentage}%`;
    }
    
    logger.info(`Found ${issuesFound} performance issues (${criticalIssues} critical)`);
    
    return {
      success: true,
      issues: allIssues,
      metrics: {
        issuesFound,
        criticalIssues,
        estimatedImprovement
      }
    };
  } catch (error) {
    logger.error(`Error optimizing performance: ${error.message}`);
    return {
      success: false,
      error: error.message,
      metrics: {
        issuesFound: 0,
        criticalIssues: 0,
        estimatedImprovement: '0%'
      }
    };
  }
}

module.exports = optimizePerformance;
