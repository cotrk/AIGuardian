/**
 * Code Formatter
 * Formats code according to language-specific best practices
 */
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../../utils/logger');
const fileOps = require('../../utils/file-ops');
const { execPromise } = require('../../utils/process-utils');

/**
 * Formats JavaScript/TypeScript code
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} - Formatted code
 */
async function formatJavaScriptCode(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    
    // This is a simplified implementation
    // In a real implementation, we would use a proper formatter
    
    // Apply basic formatting rules
    let formatted = content;
    
    // 1. Fix indentation (simplified)
    formatted = fixIndentation(formatted);
    
    // 2. Fix spacing around operators
    formatted = fixOperatorSpacing(formatted);
    
    // 3. Fix semicolons
    formatted = fixSemicolons(formatted);
    
    // 4. Fix trailing whitespace
    formatted = fixTrailingWhitespace(formatted);
    
    return formatted;
  } catch (error) {
    logger.error(`Error formatting file ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Fixes indentation in code
 * @param {string} code - Code to fix
 * @returns {string} - Fixed code
 */
function fixIndentation(code) {
  const lines = code.split('\n');
  const formattedLines = [];
  let indentLevel = 0;
  const indentSize = 2;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Adjust indent level based on braces
    if (trimmedLine.endsWith('{')) {
      // Add line with current indent level
      formattedLines.push(' '.repeat(indentLevel * indentSize) + trimmedLine);
      indentLevel++;
    } else if (trimmedLine.startsWith('}')) {
      // Decrease indent level for closing brace
      indentLevel = Math.max(0, indentLevel - 1);
      formattedLines.push(' '.repeat(indentLevel * indentSize) + trimmedLine);
    } else {
      // Add line with current indent level
      formattedLines.push(' '.repeat(indentLevel * indentSize) + trimmedLine);
    }
  }
  
  return formattedLines.join('\n');
}

/**
 * Fixes spacing around operators
 * @param {string} code - Code to fix
 * @returns {string} - Fixed code
 */
function fixOperatorSpacing(code) {
  // Add space around operators
  return code
    .replace(/([+\-*/%=&|<>!])(=?)/g, ' $1$2 ')  // Add space around operators
    .replace(/\s+([+\-*/%=&|<>!])(=?)\s+/g, ' $1$2 ')  // Normalize spaces
    .replace(/\(\s+/g, '(')  // Remove space after opening parenthesis
    .replace(/\s+\)/g, ')')  // Remove space before closing parenthesis
    .replace(/,\s*/g, ', ')  // Normalize space after comma
    .replace(/\s+,/g, ',')   // Remove space before comma
    .replace(/\s+;/g, ';')   // Remove space before semicolon
    .replace(/;\s*/g, '; ')  // Normalize space after semicolon
    .replace(/\s{2,}/g, ' '); // Replace multiple spaces with a single space
}

/**
 * Fixes semicolons in code
 * @param {string} code - Code to fix
 * @returns {string} - Fixed code
 */
function fixSemicolons(code) {
  const lines = code.split('\n');
  const formattedLines = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip comments, empty lines, and lines that already end with semicolon
    if (
      trimmedLine === '' || 
      trimmedLine.startsWith('//') || 
      trimmedLine.startsWith('/*') || 
      trimmedLine.endsWith(';') || 
      trimmedLine.endsWith('{') || 
      trimmedLine.endsWith('}') || 
      trimmedLine.endsWith(':')
    ) {
      formattedLines.push(line);
      continue;
    }
    
    // Add semicolon to lines that need it
    if (
      !trimmedLine.match(/^\s*for\s*\(/) && 
      !trimmedLine.match(/^\s*if\s*\(/) && 
      !trimmedLine.match(/^\s*while\s*\(/) && 
      !trimmedLine.match(/^\s*function\s*\w*\s*\(/)
    ) {
      // Replace the line with one that has a semicolon
      const lastSpaceIndex = line.lastIndexOf(trimmedLine) + trimmedLine.length;
      formattedLines.push(line.substring(0, lastSpaceIndex) + ';' + line.substring(lastSpaceIndex));
    } else {
      formattedLines.push(line);
    }
  }
  
  return formattedLines.join('\n');
}

/**
 * Fixes trailing whitespace in code
 * @param {string} code - Code to fix
 * @returns {string} - Fixed code
 */
function fixTrailingWhitespace(code) {
  const lines = code.split('\n');
  const formattedLines = lines.map(line => line.replace(/\s+$/, ''));
  return formattedLines.join('\n');
}

/**
 * Detects if a project has a specific configuration file
 * @param {string} projectPath - Path to the project
 * @param {string} fileName - Configuration file name
 * @returns {Promise<boolean>} - True if the file exists
 */
async function hasConfigFile(projectPath, fileName) {
  try {
    await fs.access(path.join(projectPath, fileName));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Creates a default ESLint configuration file
 * @param {string} projectPath - Path to the project
 * @returns {Promise<boolean>} - True if successful
 */
async function createDefaultEslintConfig(projectPath) {
  try {
    const configPath = path.join(projectPath, '.eslintrc.json');
    const config = {
      "env": {
        "browser": true,
        "commonjs": true,
        "es2021": true,
        "node": true
      },
      "extends": "eslint:recommended",
      "parserOptions": {
        "ecmaVersion": "latest"
      },
      "rules": {
        "indent": ["error", 2],
        "linebreak-style": ["error", "unix"],
        "quotes": ["error", "single"],
        "semi": ["error", "always"],
        "no-unused-vars": ["warn"],
        "no-console": ["off"]
      }
    };
    
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
    logger.info(`Created default ESLint configuration at ${configPath}`);
    return true;
  } catch (error) {
    logger.error(`Error creating ESLint configuration: ${error.message}`);
    return false;
  }
}

/**
 * Creates a default Prettier configuration file
 * @param {string} projectPath - Path to the project
 * @returns {Promise<boolean>} - True if successful
 */
async function createDefaultPrettierConfig(projectPath) {
  try {
    const configPath = path.join(projectPath, '.prettierrc.json');
    const config = {
      "printWidth": 80,
      "tabWidth": 2,
      "useTabs": false,
      "semi": true,
      "singleQuote": true,
      "trailingComma": "es5",
      "bracketSpacing": true,
      "arrowParens": "avoid"
    };
    
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
    logger.info(`Created default Prettier configuration at ${configPath}`);
    return true;
  } catch (error) {
    logger.error(`Error creating Prettier configuration: ${error.message}`);
    return false;
  }
}

/**
 * Formats code according to language-specific best practices
 * @param {string} projectPath - Path to the project
 * @param {string[]} projectTypes - Detected project types
 * @param {Object} options - Task options
 * @returns {Promise<Object>} - Task result
 */
async function formatCode(projectPath, projectTypes = [], options = {}) {
  logger.info('Formatting code according to best practices...');
  
  try {
    // Ensure projectTypes is an array
    if (!projectTypes || !Array.isArray(projectTypes)) {
      projectTypes = [];
    }
    
    // Check if project is JavaScript/TypeScript
    if (!projectTypes.includes('javascript') && !projectTypes.includes('typescript')) {
      logger.warn('Code formatting is currently only supported for JavaScript/TypeScript projects');
      return {
        success: true,
        changes: [],
        metrics: {
          filesFormatted: 0,
          linesChanged: 0
        }
      };
    }
    
    // Check for existing formatting configuration
    const hasEslintConfig = await hasConfigFile(projectPath, '.eslintrc.json') || 
                           await hasConfigFile(projectPath, '.eslintrc.js') ||
                           await hasConfigFile(projectPath, '.eslintrc');
                           
    const hasPrettierConfig = await hasConfigFile(projectPath, '.prettierrc') ||
                             await hasConfigFile(projectPath, '.prettierrc.json') ||
                             await hasConfigFile(projectPath, '.prettierrc.js');
    
    // Create default configurations if none exist
    if (!hasEslintConfig && options.createConfigs !== false) {
      await createDefaultEslintConfig(projectPath);
    }
    
    if (!hasPrettierConfig && options.createConfigs !== false) {
      await createDefaultPrettierConfig(projectPath);
    }
    
    // Find JavaScript/TypeScript files
    const extensions = ['.js', '.jsx'];
    if (projectTypes.includes('typescript')) {
      extensions.push('.ts', '.tsx');
    }
    
    const files = [];
    
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
            entry.name !== '.aiguardian'
          ) {
            await scanDirectory(fullPath);
          }
        } else if (extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }
    
    await scanDirectory(projectPath);
    logger.info(`Found ${files.length} JavaScript/TypeScript files to format`);
    
    if (files.length === 0) {
      logger.warn('No JavaScript/TypeScript files found for formatting');
      return {
        success: true,
        changes: [],
        metrics: {
          filesFormatted: 0,
          linesChanged: 0
        }
      };
    }
    
    // Format each file
    const formattedFiles = [];
    let totalLinesChanged = 0;
    
    for (const file of files) {
      try {
        const originalContent = await fs.readFile(file, 'utf8');
        const formattedContent = await formatJavaScriptCode(file);
        
        if (formattedContent && formattedContent !== originalContent) {
          // Calculate lines changed
          const originalLines = originalContent.split('\n').length;
          const formattedLines = formattedContent.split('\n').length;
          const linesChanged = Math.abs(formattedLines - originalLines) + 
                              countLineDifferences(originalContent, formattedContent);
          
          // Write formatted content back to file
          if (!options.dryRun) {
            await fs.writeFile(file, formattedContent, 'utf8');
          }
          
          formattedFiles.push({
            file,
            linesChanged
          });
          
          totalLinesChanged += linesChanged;
        }
      } catch (error) {
        logger.error(`Error formatting file ${file}: ${error.message}`);
      }
    }
    
    logger.info(`Formatted ${formattedFiles.length} files with ${totalLinesChanged} line changes`);
    
    return {
      success: true,
      changes: formattedFiles,
      metrics: {
        filesFormatted: formattedFiles.length,
        linesChanged: totalLinesChanged
      }
    };
  } catch (error) {
    logger.error(`Error formatting code: ${error.message}`);
    return {
      success: false,
      error: error.message,
      metrics: {
        filesFormatted: 0,
        linesChanged: 0
      }
    };
  }
}

/**
 * Counts the number of different lines between two strings
 * @param {string} original - Original content
 * @param {string} formatted - Formatted content
 * @returns {number} - Number of different lines
 */
function countLineDifferences(original, formatted) {
  const originalLines = original.split('\n');
  const formattedLines = formatted.split('\n');
  
  let differences = 0;
  const minLength = Math.min(originalLines.length, formattedLines.length);
  
  for (let i = 0; i < minLength; i++) {
    if (originalLines[i] !== formattedLines[i]) {
      differences++;
    }
  }
  
  return differences;
}

module.exports = formatCode;
