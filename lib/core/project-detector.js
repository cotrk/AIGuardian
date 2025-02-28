const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../utils/logger');

/**
 * Detects the type of project in a directory
 */
class ProjectDetector {
  /**
   * Detects the project type based on files and structure
   * @param {string} projectPath - Path to the project
   * @returns {Promise<string[]>} - Array of detected project types
   */
  async detectProjectTypes(projectPath) {
    try {
      logger.info('Detecting project type...');
      
      // Get list of files in the project directory
      const files = await this.getFilesInDirectory(projectPath);
      
      // Initialize array to hold detected project types
      const projectTypes = [];
      
      // Check for JavaScript/TypeScript project
      if (await this.isJavaScriptProject(projectPath, files)) {
        const isTypeScript = await this.isTypeScriptProject(projectPath, files);
        
        if (isTypeScript) {
          projectTypes.push('typescript');
        } else {
          projectTypes.push('javascript');
        }
      }
      
      // Check for Python project
      if (await this.isPythonProject(projectPath, files)) {
        projectTypes.push('python');
      }
      
      // Check for Java project
      if (await this.isJavaProject(projectPath, files)) {
        projectTypes.push('java');
      }
      
      // If no specific project type was detected, mark as generic
      if (projectTypes.length === 0) {
        projectTypes.push('generic');
      }
      
      return projectTypes;
    } catch (error) {
      logger.error(`Error detecting project type: ${error.message}`);
      return ['unknown'];
    }
  }
  
  /**
   * Gets a list of files in a directory
   * @param {string} directoryPath - Path to the directory
   * @returns {Promise<string[]>} - List of files in the directory
   */
  async getFilesInDirectory(directoryPath) {
    try {
      return await fs.readdir(directoryPath);
    } catch (error) {
      logger.error(`Error reading directory ${directoryPath}: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Checks if a file exists in a directory
   * @param {string} projectPath - Path to the project
   * @param {string} fileName - Name of the file to check
   * @returns {Promise<boolean>} - True if the file exists
   */
  async fileExists(projectPath, fileName) {
    try {
      await fs.access(path.join(projectPath, fileName));
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Checks if the project is a JavaScript project
   * @param {string} projectPath - Path to the project
   * @param {string[]} files - List of files in the project
   * @returns {Promise<boolean>} - True if it's a JavaScript project
   */
  async isJavaScriptProject(projectPath, files) {
    // Check for common JavaScript files
    const jsIndicators = [
      'package.json',
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      'node_modules',
      'webpack.config.js',
      '.eslintrc',
      '.babelrc'
    ];
    
    // Check if any files have JavaScript extensions
    const hasJsFiles = files.some(file => 
      file.endsWith('.js') || 
      file.endsWith('.jsx') || 
      file.endsWith('.ts') || 
      file.endsWith('.tsx')
    );
    
    // Check for package.json
    const hasPackageJson = await this.fileExists(projectPath, 'package.json');
    
    // Check for node_modules directory
    const hasNodeModules = files.includes('node_modules');
    
    return hasJsFiles || hasPackageJson || hasNodeModules || 
      files.some(file => jsIndicators.some(indicator => file.includes(indicator)));
  }
  
  /**
   * Checks if the project is a TypeScript project
   * @param {string} projectPath - Path to the project
   * @param {string[]} files - List of files in the project
   * @returns {Promise<boolean>} - True if it's a TypeScript project
   */
  async isTypeScriptProject(projectPath, files) {
    // Check for TypeScript files
    const hasTsFiles = files.some(file => 
      file.endsWith('.ts') || 
      file.endsWith('.tsx')
    );
    
    // Check for tsconfig.json
    const hasTsConfig = await this.fileExists(projectPath, 'tsconfig.json');
    
    return hasTsFiles || hasTsConfig;
  }
  
  /**
   * Checks if the project is a Python project
   * @param {string} projectPath - Path to the project
   * @param {string[]} files - List of files in the project
   * @returns {Promise<boolean>} - True if it's a Python project
   */
  async isPythonProject(projectPath, files) {
    // Check for Python files
    const hasPyFiles = files.some(file => file.endsWith('.py'));
    
    // Check for common Python project files
    const pythonIndicators = [
      'requirements.txt',
      'setup.py',
      'Pipfile',
      'pyproject.toml',
      '.venv',
      'venv',
      '__pycache__'
    ];
    
    return hasPyFiles || 
      files.some(file => pythonIndicators.includes(file));
  }
  
  /**
   * Checks if the project is a Java project
   * @param {string} projectPath - Path to the project
   * @param {string[]} files - List of files in the project
   * @returns {Promise<boolean>} - True if it's a Java project
   */
  async isJavaProject(projectPath, files) {
    // Check for Java files
    const hasJavaFiles = files.some(file => file.endsWith('.java'));
    
    // Check for common Java project files
    const javaIndicators = [
      'pom.xml',
      'build.gradle',
      '.classpath',
      '.project',
      'target',
      'build',
      'gradle',
      'src/main/java'
    ];
    
    return hasJavaFiles || 
      files.some(file => javaIndicators.includes(file));
  }
}

module.exports = ProjectDetector;