const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const { logger } = require('../../utils/logger');
const fileOps = require('../../utils/file-ops');

// Promisify exec
const execPromise = util.promisify(exec);

/**
 * Task that detects and removes unused dependencies in JavaScript/TypeScript projects
 * @param {Object} options - Task options
 * @returns {Promise<Object>} - Task result
 */
async function detectUnusedDependencies(options) {
  const { projectPath, dryRun, verbose } = options;
  
  try {
    logger.info('Analyzing project for unused dependencies...');
    
    // Check if package.json exists
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!await fileOps.fileExists(packageJsonPath)) {
      logger.info('No package.json found, skipping unused dependencies check');
      return {
        success: true,
        message: 'No package.json found, skipping unused dependencies check',
        unusedDependencies: []
      };
    }
    
    // Read package.json
    const packageJsonContent = await fileOps.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);
    
    // Get dependencies
    const dependencies = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {}
    };
    
    if (Object.keys(dependencies).length === 0) {
      logger.info('No dependencies found in package.json');
      return {
        success: true,
        message: 'No dependencies found in package.json',
        unusedDependencies: []
      };
    }
    
    // Find all JS/TS files in the project
    const jsFiles = await findJsFiles(projectPath);
    
    if (jsFiles.length === 0) {
      logger.info('No JavaScript/TypeScript files found in the project');
      return {
        success: true,
        message: 'No JavaScript/TypeScript files found in the project',
        unusedDependencies: []
      };
    }
    
    // Analyze imports in all files
    const usedDependencies = await analyzeImports(jsFiles, Object.keys(dependencies));
    
    // Find unused dependencies
    const unusedDependencies = Object.keys(dependencies).filter(dep => !usedDependencies.includes(dep));
    
    if (unusedDependencies.length === 0) {
      logger.info('No unused dependencies found');
      return {
        success: true,
        message: 'No unused dependencies found',
        unusedDependencies: []
      };
    }
    
    logger.info(`Found ${unusedDependencies.length} unused dependencies: ${unusedDependencies.join(', ')}`);
    
    if (dryRun) {
      logger.info('Dry run: Would remove the following unused dependencies:');
      for (const dep of unusedDependencies) {
        logger.info(`  - ${dep}`);
      }
      return {
        success: true,
        message: `Would remove ${unusedDependencies.length} unused dependencies`,
        unusedDependencies
      };
    }
    
    // Create updated package.json without unused dependencies
    const updatedPackageJson = { ...packageJson };
    
    if (updatedPackageJson.dependencies) {
      for (const dep of unusedDependencies) {
        if (updatedPackageJson.dependencies[dep]) {
          delete updatedPackageJson.dependencies[dep];
        }
      }
    }
    
    if (updatedPackageJson.devDependencies) {
      for (const dep of unusedDependencies) {
        if (updatedPackageJson.devDependencies[dep]) {
          delete updatedPackageJson.devDependencies[dep];
        }
      }
    }
    
    // Write updated package.json
    await fileOps.writeFile(
      packageJsonPath, 
      JSON.stringify(updatedPackageJson, null, 2) + '\n',
      'utf8'
    );
    
    logger.info(`Successfully removed ${unusedDependencies.length} unused dependencies`);
    return {
      success: true,
      message: `Removed ${unusedDependencies.length} unused dependencies`,
      unusedDependencies
    };
  } catch (error) {
    logger.error(`Error detecting unused dependencies: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Find all JavaScript and TypeScript files in the project
 * @param {string} projectPath - Path to the project
 * @returns {Promise<string[]>} - Array of file paths
 */
async function findJsFiles(projectPath) {
  try {
    // Find all JS and TS files
    const jsPattern = /\.(js|jsx|ts|tsx)$/;
    const nodeModulesPattern = /node_modules/;
    
    const allFiles = await fileOps.findFiles(projectPath, jsPattern);
    
    // Filter out files in node_modules
    return allFiles.filter(file => !nodeModulesPattern.test(file));
  } catch (error) {
    logger.error(`Error finding JS/TS files: ${error.message}`);
    return [];
  }
}

/**
 * Analyze imports in JavaScript/TypeScript files
 * @param {string[]} files - Array of file paths
 * @param {string[]} dependencies - Array of dependency names
 * @returns {Promise<string[]>} - Array of used dependency names
 */
async function analyzeImports(files, dependencies) {
  const usedDependencies = new Set();
  
  // Regular expressions for different import patterns
  const importPatterns = [
    /import\s+.*\s+from\s+['"]([^./][^'"]*)['"];?/g,     // ES6 imports
    /import\s+['"]([^./][^'"]*)['"];?/g,                  // Side-effect imports
    /require\s*\(\s*['"]([^./][^'"]*)['"].*\)/g,          // CommonJS require
    /import\s*\(\s*['"]([^./][^'"]*)['"].*\)/g,           // Dynamic imports
    /from\s+['"]([^./][^'"]*)['"];?/g                     // TypeScript 'from' imports
  ];
  
  for (const file of files) {
    try {
      const content = await fileOps.readFile(file, 'utf8');
      
      // Check each import pattern
      for (const pattern of importPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const importName = match[1].split('/')[0]; // Get package name (before any sub-paths)
          
          // Check if this import matches any of our dependencies
          if (dependencies.includes(importName)) {
            usedDependencies.add(importName);
          }
        }
      }
    } catch (error) {
      logger.error(`Error analyzing imports in ${file}: ${error.message}`);
    }
  }
  
  return Array.from(usedDependencies);
}

module.exports = detectUnusedDependencies;
