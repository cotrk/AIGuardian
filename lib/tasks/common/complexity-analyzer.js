/**
 * Complexity Analyzer
 * Analyzes code complexity and provides simplification recommendations
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
 * Calculates cyclomatic complexity of JavaScript/TypeScript code
 * @param {string} filePath - Path to the file
 * @returns {Promise<Array>} - Array of complex functions
 */
async function calculateJavaScriptComplexity(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const complexFunctions = [];
    
    // This is a simplified implementation
    // In a real implementation, we would use AST parsing for more accurate results
    
    // Find function declarations
    let currentFunction = null;
    let braceCount = 0;
    let complexity = 1; // Base complexity
    let startLine = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and comments
      if (line === '' || line.startsWith('//') || line.startsWith('/*')) {
        continue;
      }
      
      // Function declaration
      const functionMatch = line.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
      const arrowFunctionMatch = line.match(/const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/);
      
      if (functionMatch || arrowFunctionMatch) {
        // If we were already tracking a function, add it to the list
        if (currentFunction && complexity > 1) {
          complexFunctions.push({
            name: currentFunction,
            file: filePath,
            line: startLine + 1,
            complexity,
            threshold: 10, // Threshold for considering a function complex
            suggestion: generateSuggestion(complexity)
          });
        }
        
        // Start tracking a new function
        currentFunction = functionMatch ? functionMatch[1] : arrowFunctionMatch[1];
        braceCount = 0;
        complexity = 1;
        startLine = i;
      }
      
      // Count braces to track function boundaries
      if (line.includes('{')) {
        braceCount += (line.match(/{/g) || []).length;
      }
      
      if (line.includes('}')) {
        braceCount -= (line.match(/}/g) || []).length;
        
        // If braceCount is 0 and we're tracking a function, we've reached the end
        if (braceCount <= 0 && currentFunction) {
          if (complexity > 10) { // Only add functions with high complexity
            complexFunctions.push({
              name: currentFunction,
              file: filePath,
              line: startLine + 1,
              complexity,
              threshold: 10,
              suggestion: generateSuggestion(complexity)
            });
          }
          
          currentFunction = null;
          complexity = 1;
        }
      }
      
      // Increment complexity for control flow statements
      if (currentFunction) {
        if (
          line.includes(' if ') || 
          line.includes(' else ') || 
          line.includes(' for ') || 
          line.includes(' while ') || 
          line.includes(' case ') || 
          line.includes(' catch ') || 
          line.includes(' && ') || 
          line.includes(' || ')
        ) {
          complexity++;
        }
      }
    }
    
    // Add the last function if it's still being tracked
    if (currentFunction && complexity > 10) {
      complexFunctions.push({
        name: currentFunction,
        file: filePath,
        line: startLine + 1,
        complexity,
        threshold: 10,
        suggestion: generateSuggestion(complexity)
      });
    }
    
    return complexFunctions;
  } catch (error) {
    logger.error(`Error calculating complexity for ${filePath}: ${error.message}`);
    return [];
  }
}

/**
 * Calculates cyclomatic complexity of Python code
 * @param {string} filePath - Path to the file
 * @returns {Promise<Array>} - Array of complex functions
 */
async function calculatePythonComplexity(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const complexFunctions = [];
    
    // This is a simplified implementation
    // In a real implementation, we would use AST parsing for more accurate results
    
    // Find function declarations
    let currentFunction = null;
    let indentLevel = 0;
    let functionIndentLevel = 0;
    let complexity = 1; // Base complexity
    let startLine = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (trimmedLine === '' || trimmedLine.startsWith('#')) {
        continue;
      }
      
      // Calculate indent level
      const currentIndent = line.search(/\S|$/);
      indentLevel = Math.floor(currentIndent / 4); // Assuming 4 spaces per indent
      
      // Function declaration
      const functionMatch = trimmedLine.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
      
      if (functionMatch) {
        // If we were already tracking a function, add it to the list
        if (currentFunction && complexity > 1) {
          complexFunctions.push({
            name: currentFunction,
            file: filePath,
            line: startLine + 1,
            complexity,
            threshold: 10, // Threshold for considering a function complex
            suggestion: generateSuggestion(complexity)
          });
        }
        
        // Start tracking a new function
        currentFunction = functionMatch[1];
        functionIndentLevel = indentLevel;
        complexity = 1;
        startLine = i;
      }
      
      // If we're outside the function's scope, stop tracking it
      if (currentFunction && indentLevel <= functionIndentLevel) {
        if (complexity > 10) { // Only add functions with high complexity
          complexFunctions.push({
            name: currentFunction,
            file: filePath,
            line: startLine + 1,
            complexity,
            threshold: 10,
            suggestion: generateSuggestion(complexity)
          });
        }
        
        currentFunction = null;
        complexity = 1;
      }
      
      // Increment complexity for control flow statements
      if (currentFunction && indentLevel > functionIndentLevel) {
        if (
          trimmedLine.startsWith('if ') || 
          trimmedLine.startsWith('elif ') || 
          trimmedLine.startsWith('for ') || 
          trimmedLine.startsWith('while ') || 
          trimmedLine.startsWith('except ') || 
          ' and ' in trimmedLine || 
          ' or ' in trimmedLine
        ) {
          complexity++;
        }
      }
    }
    
    // Add the last function if it's still being tracked
    if (currentFunction && complexity > 10) {
      complexFunctions.push({
        name: currentFunction,
        file: filePath,
        line: startLine + 1,
        complexity,
        threshold: 10,
        suggestion: generateSuggestion(complexity)
      });
    }
    
    return complexFunctions;
  } catch (error) {
    logger.error(`Error calculating complexity for ${filePath}: ${error.message}`);
    return [];
  }
}

/**
 * Generates a suggestion based on complexity
 * @param {number} complexity - Cyclomatic complexity
 * @returns {string} - Suggestion
 */
function generateSuggestion(complexity) {
  if (complexity > 20) {
    return 'Consider breaking this function into multiple smaller functions with clear responsibilities';
  } else if (complexity > 15) {
    return 'Refactor this function to reduce nesting and conditional logic';
  } else {
    return 'Extract complex conditions into well-named helper functions or variables';
  }
}

/**
 * Analyzes code complexity and provides simplification recommendations
 * @param {string} projectPath - Path to the project
 * @param {string[]} projectTypes - Detected project types
 * @param {Object} options - Task options
 * @returns {Promise<Object>} - Task result
 */
async function analyzeComplexity(projectPath, projectTypes = [], options = {}) {
  logger.info('Analyzing code complexity...');
  
  try {
    // Ensure projectTypes is an array
    if (!projectTypes || !Array.isArray(projectTypes)) {
      projectTypes = [];
    }
    
    // Get file extensions to analyze based on project types
    const extensions = getFileExtensions(projectTypes);
    
    if (extensions.length === 0) {
      logger.warn('No supported file types found for complexity analysis');
      return {
        success: true,
        changes: [],
        metrics: {
          complexFunctionsCount: 0,
          averageComplexity: 0,
          maxComplexity: 0
        }
      };
    }
    
    // Find all source files
    const sourceFiles = await findSourceFiles(projectPath, extensions);
    logger.info(`Found ${sourceFiles.length} source files to analyze`);
    
    if (sourceFiles.length === 0) {
      logger.warn('No source files found for complexity analysis');
      return {
        success: true,
        changes: [],
        metrics: {
          complexFunctionsCount: 0,
          averageComplexity: 0,
          maxComplexity: 0
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
    const complexFunctions = [];
    
    // Analyze JavaScript/TypeScript files
    for (const file of jsFiles) {
      const functions = await calculateJavaScriptComplexity(file);
      complexFunctions.push(...functions);
    }
    
    // Analyze Python files
    for (const file of pyFiles) {
      const functions = await calculatePythonComplexity(file);
      complexFunctions.push(...functions);
    }
    
    // Sort by complexity (descending)
    complexFunctions.sort((a, b) => b.complexity - a.complexity);
    
    // Calculate metrics
    const complexFunctionsCount = complexFunctions.length;
    
    let totalComplexity = 0;
    let maxComplexity = 0;
    
    for (const func of complexFunctions) {
      totalComplexity += func.complexity;
      maxComplexity = Math.max(maxComplexity, func.complexity);
    }
    
    const averageComplexity = complexFunctionsCount > 0 ? 
      Math.round((totalComplexity / complexFunctionsCount) * 10) / 10 : 0;
    
    logger.info(`Found ${complexFunctionsCount} complex functions with average complexity of ${averageComplexity}`);
    
    return {
      success: true,
      complexFunctions,
      metrics: {
        complexFunctionsCount,
        averageComplexity,
        maxComplexity
      }
    };
  } catch (error) {
    logger.error(`Error analyzing code complexity: ${error.message}`);
    return {
      success: false,
      error: error.message,
      metrics: {
        complexFunctionsCount: 0,
        averageComplexity: 0,
        maxComplexity: 0
      }
    };
  }
}

module.exports = analyzeComplexity;
