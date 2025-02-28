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
   * @returns {Promise<Object>} - Project type information
   */
  async detectProject(projectPath) {
    try {
      logger.info('Detecting project type...');
      
      // Get list of files in the project directory
      const files = await fs.readdir(projectPath);
      
      // Check for JavaScript/TypeScript project
      if (this.isJavaScriptProject(files)) {
        const isTypeScript = await this.isTypeScriptProject(projectPath, files);
        const isNode = await this.isNodeProject(projectPath, files);
        const isReact = await this.isReactProject(projectPath, files);
        
        logger.info(`Detected ${isTypeScript ? 'TypeScript' : 'JavaScript'} project`);
        
        return {
          type: isTypeScript ? 'typescript' : 'javascript',
          isNode,
          isReact,
          framework: await this.detectJSFramework(projectPath, files)
        };
      }
      
      // Check for Python project
      if (this.isPythonProject(files)) {
        logger.info('Detected Python project');
        
        return {
          type: 'python',
          hasVirtualEnv: await this.hasVirtualEnv(projectPath, files),
          framework: await this.detectPythonFramework(projectPath, files)
        };
      }
      
      // Check for Java project
      if (this.isJavaProject(files)) {
        logger.info('Detected Java project');
        
        return {
          type: 'java',
          buildTool: await this.detectJavaBuildTool(projectPath, files),
          isSpring: await this.isSpringProject(projectPath, files)
        };
      }
      
      // Default to generic project
      logger.info('Could not determine specific project type (treating as generic)');
      return { type: 'generic' };
    } catch (error) {
      logger.error(`Error detecting project type: ${error.message}`);
      return { type: 'unknown', error: error.message };
    }
  }
  
  /**
   * Checks if the project is a JavaScript project
   * @param {Array<string>} files - List of files in the project
   * @returns {boolean} - True if it's a JavaScript project
   */
  isJavaSc