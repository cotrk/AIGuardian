const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const { logger } = require('../../utils/logger');
const fileOps = require('../../utils/file-ops');

// Promisify exec
const execPromise = util.promisify(exec);

/**
 * Task that analyzes and optimizes Python requirements files
 * @param {Object} options - Task options
 * @returns {Promise<Object>} - Task result
 */
async function analyzeRequirements(options) {
  const { projectPath, dryRun, verbose } = options;
  
  try {
    logger.info('Analyzing Python requirements files...');
    
    // Find all requirements files
    const requirementsFiles = await findRequirementsFiles(projectPath);
    
    if (requirementsFiles.length === 0) {
      logger.info('No requirements files found');
      return {
        success: true,
        message: 'No requirements files found',
        requirementsFiles: []
      };
    }
    
    logger.info(`Found ${requirementsFiles.length} requirements files: ${requirementsFiles.map(f => path.basename(f)).join(', ')}`);
    
    const results = [];
    
    // Process each requirements file
    for (const requirementsFile of requirementsFiles) {
      const result = await processRequirementsFile(requirementsFile, dryRun, verbose);
      results.push({
        file: requirementsFile,
        ...result
      });
    }
    
    const successCount = results.filter(r => r.success).length;
    
    logger.info(`Successfully processed ${successCount} of ${results.length} requirements files`);
    return {
      success: true,
      message: `Processed ${successCount} of ${results.length} requirements files`,
      results
    };
  } catch (error) {
    logger.error(`Error analyzing requirements: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Find all requirements files in the project
 * @param {string} projectPath - Path to the project
 * @returns {Promise<string[]>} - Array of file paths
 */
async function findRequirementsFiles(projectPath) {
  try {
    // Common requirements file patterns
    const requirementsPattern = /^requirements.*\.txt$/;
    
    // Find all requirements files
    return await fileOps.findFiles(projectPath, requirementsPattern);
  } catch (error) {
    logger.error(`Error finding requirements files: ${error.message}`);
    return [];
  }
}

/**
 * Process a single requirements file
 * @param {string} filePath - Path to the requirements file
 * @param {boolean} dryRun - If true, don't make actual changes
 * @param {boolean} verbose - If true, log verbose output
 * @returns {Promise<Object>} - Processing result
 */
async function processRequirementsFile(filePath, dryRun, verbose) {
  try {
    logger.info(`Processing ${path.basename(filePath)}...`);
    
    // Read requirements file
    const content = await fileOps.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Parse requirements
    const requirements = parseRequirements(lines);
    
    if (requirements.length === 0) {
      logger.info(`No requirements found in ${path.basename(filePath)}`);
      return {
        success: true,
        message: 'No requirements found',
        changes: []
      };
    }
    
    // Check for issues and optimize
    const { optimizedRequirements, changes } = optimizeRequirements(requirements);
    
    if (changes.length === 0) {
      logger.info(`No issues found in ${path.basename(filePath)}`);
      return {
        success: true,
        message: 'No issues found',
        changes: []
      };
    }
    
    logger.info(`Found ${changes.length} issues in ${path.basename(filePath)}`);
    
    if (verbose) {
      for (const change of changes) {
        logger.debug(`  - ${change.type}: ${change.description}`);
      }
    }
    
    if (dryRun) {
      logger.info(`Dry run: Would fix ${changes.length} issues in ${path.basename(filePath)}`);
      return {
        success: true,
        message: `Would fix ${changes.length} issues`,
        changes
      };
    }
    
    // Generate optimized content
    const optimizedContent = generateRequirementsContent(optimizedRequirements);
    
    // Write optimized content
    await fileOps.writeFile(filePath, optimizedContent, 'utf8');
    
    logger.info(`Successfully fixed ${changes.length} issues in ${path.basename(filePath)}`);
    return {
      success: true,
      message: `Fixed ${changes.length} issues`,
      changes
    };
  } catch (error) {
    logger.error(`Error processing ${path.basename(filePath)}: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Parse requirements from file lines
 * @param {string[]} lines - Lines from requirements file
 * @returns {Array<Object>} - Parsed requirements
 */
function parseRequirements(lines) {
  const requirements = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      requirements.push({
        type: 'comment',
        content: trimmedLine
      });
      continue;
    }
    
    // Parse requirement
    const requirement = parseRequirement(trimmedLine);
    requirements.push(requirement);
  }
  
  return requirements;
}

/**
 * Parse a single requirement line
 * @param {string} line - Requirement line
 * @returns {Object} - Parsed requirement
 */
function parseRequirement(line) {
  // Check for editable installs
  if (line.startsWith('-e ')) {
    return {
      type: 'editable',
      content: line
    };
  }
  
  // Check for other options
  if (line.startsWith('-')) {
    return {
      type: 'option',
      content: line
    };
  }
  
  // Regular requirement
  const parts = line.split('#');
  const requirementPart = parts[0].trim();
  const commentPart = parts.length > 1 ? '#' + parts.slice(1).join('#') : '';
  
  // Parse package name and version
  const versionMatch = requirementPart.match(/^([^=<>!~]+)(.*)$/);
  
  if (versionMatch) {
    const packageName = versionMatch[1].trim();
    const versionSpec = versionMatch[2].trim();
    
    return {
      type: 'package',
      packageName,
      versionSpec,
      comment: commentPart,
      content: line
    };
  }
  
  // Fallback
  return {
    type: 'unknown',
    content: line
  };
}

/**
 * Optimize requirements
 * @param {Array<Object>} requirements - Parsed requirements
 * @returns {Object} - Optimized requirements and changes
 */
function optimizeRequirements(requirements) {
  const optimizedRequirements = [];
  const changes = [];
  const packageSet = new Set();
  
  for (const req of requirements) {
    // Keep comments and options as is
    if (req.type === 'comment' || req.type === 'option' || req.type === 'editable' || req.type === 'unknown') {
      optimizedRequirements.push(req);
      continue;
    }
    
    // Check for duplicates
    if (req.type === 'package') {
      if (packageSet.has(req.packageName.toLowerCase())) {
        changes.push({
          type: 'duplicate',
          description: `Removed duplicate package: ${req.packageName}`,
          original: req.content
        });
        continue;
      }
      
      packageSet.add(req.packageName.toLowerCase());
      
      // Check for unsafe version specifiers
      if (!req.versionSpec || req.versionSpec === '') {
        const optimizedReq = {
          ...req,
          versionSpec: '>=0.0.0',
          content: `${req.packageName}>=0.0.0${req.comment ? ' ' + req.comment : ''}`
        };
        
        optimizedRequirements.push(optimizedReq);
        changes.push({
          type: 'version',
          description: `Added version specifier to: ${req.packageName}`,
          original: req.content,
          updated: optimizedReq.content
        });
      } else {
        optimizedRequirements.push(req);
      }
    }
  }
  
  return {
    optimizedRequirements,
    changes
  };
}

/**
 * Generate requirements file content from parsed requirements
 * @param {Array<Object>} requirements - Parsed requirements
 * @returns {string} - Generated content
 */
function generateRequirementsContent(requirements) {
  return requirements.map(req => req.content).join('\n');
}

module.exports = analyzeRequirements;
