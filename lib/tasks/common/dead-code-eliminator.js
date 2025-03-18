/**
 * Dead Code Eliminator
 * Detects and suggests removal of unused code (dead code)
 */
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../../utils/logger');
const fileOps = require('../../utils/file-ops');
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
 * Analyzes JavaScript/TypeScript files for unused code
 * @param {string[]} files - Array of file paths
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeJavaScriptFiles(files) {
  const unusedFunctions = [];
  const unusedVariables = [];
  
  // Track all declarations and references
  const declarations = {
    functions: [],
    variables: []
  };
  
  const references = {
    functions: [],
    variables: []
  };
  
  // First pass: collect all declarations
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const lines = content.split('\n');
      
      // Very simplified detection of function declarations
      // In a real implementation, we would use AST parsing
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Function declarations
        const functionMatch = line.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
        if (functionMatch) {
          declarations.functions.push({
            name: functionMatch[1],
            file,
            line: i + 1
          });
          continue;
        }
        
        // Arrow function variable assignments
        const arrowFunctionMatch = line.match(/const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/);
        if (arrowFunctionMatch) {
          declarations.functions.push({
            name: arrowFunctionMatch[1],
            file,
            line: i + 1
          });
          continue;
        }
        
        // Variable declarations
        const varMatch = line.match(/(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/);
        if (varMatch) {
          declarations.variables.push({
            name: varMatch[2],
            file,
            line: i + 1
          });
        }
      }
    } catch (error) {
      logger.error(`Error analyzing file ${file}: ${error.message}`);
    }
  }
  
  // Second pass: collect all references
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      
      // Check for function references
      for (const func of declarations.functions) {
        // Skip checking the line where the function is declared
        const pattern = new RegExp(`\\b${func.name}\\b(?!\\s*=|\\s*:)`, 'g');
        const matches = content.match(pattern);
        
        if (matches && matches.length > 1) {
          // Function is referenced elsewhere
          references.functions.push(func.name);
        }
      }
      
      // Check for variable references
      for (const variable of declarations.variables) {
        // Skip checking the line where the variable is declared
        const pattern = new RegExp(`\\b${variable.name}\\b(?!\\s*=|\\s*:)`, 'g');
        const matches = content.match(pattern);
        
        if (matches && matches.length > 1) {
          // Variable is referenced elsewhere
          references.variables.push(variable.name);
        }
      }
    } catch (error) {
      logger.error(`Error analyzing references in file ${file}: ${error.message}`);
    }
  }
  
  // Find unused functions and variables
  for (const func of declarations.functions) {
    if (!references.functions.includes(func.name)) {
      // Check if it's exported
      const isExported = await isExportedSymbol(func.file, func.name);
      
      if (!isExported) {
        unusedFunctions.push(func);
      }
    }
  }
  
  for (const variable of declarations.variables) {
    if (!references.variables.includes(variable.name)) {
      // Check if it's exported
      const isExported = await isExportedSymbol(variable.file, variable.name);
      
      if (!isExported) {
        unusedVariables.push(variable);
      }
    }
  }
  
  return {
    unusedFunctions,
    unusedVariables
  };
}

/**
 * Checks if a symbol is exported from a file
 * @param {string} file - File path
 * @param {string} symbolName - Symbol name
 * @returns {Promise<boolean>} - True if the symbol is exported
 */
async function isExportedSymbol(file, symbolName) {
  try {
    const content = await fs.readFile(file, 'utf8');
    
    // Check for CommonJS exports
    const commonJsExport = new RegExp(`module\\.exports(?:\\.${symbolName}|\\[['"]${symbolName}['"]]|\\s*=\\s*{[^}]*\\b${symbolName}\\b[^}]*})`, 'g');
    if (content.match(commonJsExport)) {
      return true;
    }
    
    // Check for ES6 exports
    const es6Export = new RegExp(`export\\s+(?:const|let|var|function|class|default)?\\s*\\b${symbolName}\\b|export\\s*{[^}]*\\b${symbolName}\\b[^}]*}`, 'g');
    if (content.match(es6Export)) {
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error(`Error checking if symbol ${symbolName} is exported from ${file}: ${error.message}`);
    return false;
  }
}

/**
 * Analyzes Python files for unused code
 * @param {string[]} files - Array of file paths
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzePythonFiles(files) {
  // This is a simplified implementation
  // In a real implementation, we would use AST parsing
  
  const unusedFunctions = [];
  const unusedVariables = [];
  
  // Track all declarations and references
  const declarations = {
    functions: [],
    variables: []
  };
  
  const references = {
    functions: [],
    variables: []
  };
  
  // First pass: collect all declarations
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Function declarations
        const functionMatch = line.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
        if (functionMatch) {
          declarations.functions.push({
            name: functionMatch[1],
            file,
            line: i + 1
          });
          continue;
        }
        
        // Variable assignments (simplified)
        const varMatch = line.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
        if (varMatch && !line.match(/^\s*for\s+/) && !line.match(/^\s*if\s+/)) {
          declarations.variables.push({
            name: varMatch[1],
            file,
            line: i + 1
          });
        }
      }
    } catch (error) {
      logger.error(`Error analyzing file ${file}: ${error.message}`);
    }
  }
  
  // Second pass: collect all references
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      
      // Check for function references
      for (const func of declarations.functions) {
        // Skip checking the line where the function is declared
        const pattern = new RegExp(`\\b${func.name}\\b(?!\\s*=|\\s*:)`, 'g');
        const matches = content.match(pattern);
        
        if (matches && matches.length > 1) {
          // Function is referenced elsewhere
          references.functions.push(func.name);
        }
      }
      
      // Check for variable references
      for (const variable of declarations.variables) {
        // Skip checking the line where the variable is declared
        const pattern = new RegExp(`\\b${variable.name}\\b(?!\\s*=|\\s*:)`, 'g');
        const matches = content.match(pattern);
        
        if (matches && matches.length > 1) {
          // Variable is referenced elsewhere
          references.variables.push(variable.name);
        }
      }
    } catch (error) {
      logger.error(`Error analyzing references in file ${file}: ${error.message}`);
    }
  }
  
  // Find unused functions and variables
  for (const func of declarations.functions) {
    if (!references.functions.includes(func.name) && !func.name.startsWith('_')) {
      unusedFunctions.push(func);
    }
  }
  
  for (const variable of declarations.variables) {
    if (!references.variables.includes(variable.name) && !variable.name.startsWith('_')) {
      unusedVariables.push(variable);
    }
  }
  
  return {
    unusedFunctions,
    unusedVariables
  };
}

/**
 * Detects and suggests removal of unused code (dead code)
 * @param {string} projectPath - Path to the project
 * @param {string[]} projectTypes - Detected project types
 * @param {Object} options - Task options
 * @returns {Promise<Object>} - Task result
 */
async function eliminateDeadCode(projectPath, projectTypes = [], options = {}) {
  logger.info('Analyzing code for unused functions and variables...');
  
  try {
    // Ensure projectTypes is an array
    if (!projectTypes || !Array.isArray(projectTypes)) {
      projectTypes = [];
    }
    
    // Get file extensions to analyze based on project types
    const extensions = getFileExtensions(projectTypes);
    
    if (extensions.length === 0) {
      logger.warn('No supported file types found for dead code elimination');
      return {
        success: true,
        changes: [],
        metrics: {
          unusedFunctions: 0,
          unusedVariables: 0,
          linesRemoved: 0
        }
      };
    }
    
    // Find all source files
    const sourceFiles = await findSourceFiles(projectPath, extensions);
    logger.info(`Found ${sourceFiles.length} source files to analyze`);
    
    if (sourceFiles.length === 0) {
      logger.warn('No source files found for dead code elimination');
      return {
        success: true,
        changes: [],
        metrics: {
          unusedFunctions: 0,
          unusedVariables: 0,
          linesRemoved: 0
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
    let unusedCode = {
      unusedFunctions: [],
      unusedVariables: []
    };
    
    if (jsFiles.length > 0) {
      const jsResults = await analyzeJavaScriptFiles(jsFiles);
      unusedCode.unusedFunctions.push(...jsResults.unusedFunctions);
      unusedCode.unusedVariables.push(...jsResults.unusedVariables);
    }
    
    if (pyFiles.length > 0) {
      const pyResults = await analyzePythonFiles(pyFiles);
      unusedCode.unusedFunctions.push(...pyResults.unusedFunctions);
      unusedCode.unusedVariables.push(...pyResults.unusedVariables);
    }
    
    // Calculate metrics
    const unusedFunctionsCount = unusedCode.unusedFunctions.length;
    const unusedVariablesCount = unusedCode.unusedVariables.length;
    
    // Estimate lines removed (simplified)
    // In a real implementation, we would calculate this more accurately
    const linesRemoved = unusedFunctionsCount * 5 + unusedVariablesCount;
    
    logger.info(`Found ${unusedFunctionsCount} unused functions and ${unusedVariablesCount} unused variables`);
    
    return {
      success: true,
      unusedCode,
      metrics: {
        unusedFunctions: unusedFunctionsCount,
        unusedVariables: unusedVariablesCount,
        linesRemoved
      }
    };
  } catch (error) {
    logger.error(`Error eliminating dead code: ${error.message}`);
    return {
      success: false,
      error: error.message,
      metrics: {
        unusedFunctions: 0,
        unusedVariables: 0,
        linesRemoved: 0
      }
    };
  }
}

module.exports = eliminateDeadCode;
