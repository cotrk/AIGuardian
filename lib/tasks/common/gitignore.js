const path = require('path');
const fs = require('fs').promises;
const { logger } = require('../../utils/logger');
const fileOps = require('../../utils/file-ops');

/**
 * Task that optimizes .gitignore file for the project
 * @param {Object} options - Task options
 * @returns {Promise<Object>} - Task result
 */
async function optimizeGitignore(options) {
  const { projectPath, projectTypes, dryRun, verbose } = options;
  
  try {
    logger.info('Optimizing .gitignore file...');
    
    const gitignorePath = path.join(projectPath, '.gitignore');
    let existingContent = '';
    let hasGitignore = false;
    
    // Check if .gitignore exists
    try {
      existingContent = await fileOps.readFile(gitignorePath, 'utf8');
      hasGitignore = true;
      logger.info('Found existing .gitignore file');
    } catch (error) {
      logger.info('No existing .gitignore file found, will create one');
    }
    
    // Generate appropriate gitignore content based on project type
    const newEntries = generateGitignoreEntries(projectTypes);
    
    // Merge existing content with new entries
    const updatedContent = mergeGitignoreContent(existingContent, newEntries);
    
    if (dryRun) {
      logger.info('Dry run: Would update .gitignore file');
      if (verbose) {
        logger.debug('New .gitignore content would be:');
        logger.debug(updatedContent);
      }
      return {
        success: true,
        message: hasGitignore ? 'Would update .gitignore file' : 'Would create .gitignore file'
      };
    }
    
    // Write the updated content to .gitignore
    await fileOps.writeFile(gitignorePath, updatedContent);
    
    logger.info(`Successfully ${hasGitignore ? 'updated' : 'created'} .gitignore file`);
    return {
      success: true,
      message: hasGitignore ? 'Updated .gitignore file with optimized entries' : 'Created new .gitignore file'
    };
  } catch (error) {
    logger.error(`Error optimizing .gitignore: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate gitignore entries based on project type
 * @param {string[]} projectTypes - Detected project types
 * @returns {string[]} - Gitignore entries
 */
function generateGitignoreEntries(projectTypes) {
  const entries = [
    '',
    '# AIGuardian generated .gitignore',
    '',
    '# System files',
    '.DS_Store',
    'Thumbs.db',
    'desktop.ini',
    '',
    '# Editor directories and files',
    '.idea/',
    '.vscode/',
    '*.sublime-project',
    '*.sublime-workspace',
    '*.swp',
    '*.swo',
    '',
    '# Logs',
    'logs',
    '*.log',
    'npm-debug.log*',
    'yarn-debug.log*',
    'yarn-error.log*',
    '',
    '# AIGuardian backups',
    '.aiguardian/',
    ''
  ];
  
  // JavaScript/TypeScript specific entries
  if (projectTypes.includes('javascript') || projectTypes.includes('typescript')) {
    entries.push(
      '# JavaScript/TypeScript',
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      '.env',
      '.env.local',
      '.env.development.local',
      '.env.test.local',
      '.env.production.local',
      ''
    );
    
    // TypeScript specific entries
    if (projectTypes.includes('typescript')) {
      entries.push(
        '# TypeScript',
        '*.tsbuildinfo',
        ''
      );
    }
  }
  
  // Python specific entries
  if (projectTypes.includes('python')) {
    entries.push(
      '# Python',
      '__pycache__/',
      '*.py[cod]',
      '*$py.class',
      '*.so',
      '.Python',
      'env/',
      'venv/',
      'ENV/',
      '.env',
      '.venv',
      'build/',
      'develop-eggs/',
      'dist/',
      'downloads/',
      'eggs/',
      '.eggs/',
      'lib/',
      'lib64/',
      'parts/',
      'sdist/',
      'var/',
      '*.egg-info/',
      '.installed.cfg',
      '*.egg',
      ''
    );
  }
  
  // Java specific entries
  if (projectTypes.includes('java')) {
    entries.push(
      '# Java',
      '*.class',
      '*.jar',
      '*.war',
      '*.ear',
      '*.zip',
      '*.tar.gz',
      '*.rar',
      'hs_err_pid*',
      '',
      '# Maven',
      'target/',
      'pom.xml.tag',
      'pom.xml.releaseBackup',
      'pom.xml.versionsBackup',
      'pom.xml.next',
      'release.properties',
      'dependency-reduced-pom.xml',
      'buildNumber.properties',
      '.mvn/timing.properties',
      '',
      '# Gradle',
      '.gradle/',
      'build/',
      'gradle-app.setting',
      '!gradle-wrapper.jar',
      '.gradletasknamecache',
      ''
    );
  }
  
  return entries;
}

/**
 * Merge existing gitignore content with new entries
 * @param {string} existingContent - Existing .gitignore content
 * @param {string[]} newEntries - New entries to add
 * @returns {string} - Merged content
 */
function mergeGitignoreContent(existingContent, newEntries) {
  // If no existing content, just return the new entries
  if (!existingContent.trim()) {
    return newEntries.join('\n');
  }
  
  // Split existing content into lines
  const existingLines = existingContent.split('\n').map(line => line.trim());
  
  // Filter out entries that already exist
  const filteredNewEntries = newEntries.filter(entry => {
    const trimmedEntry = entry.trim();
    // Skip empty lines and comments
    if (!trimmedEntry || trimmedEntry.startsWith('#')) {
      return true;
    }
    return !existingLines.includes(trimmedEntry);
  });
  
  // If all entries already exist, return existing content
  if (filteredNewEntries.length === 0) {
    return existingContent;
  }
  
  // Add a separator if the existing content doesn't end with a newline
  const separator = existingContent.endsWith('\n') ? '' : '\n';
  
  // Combine existing content with new entries
  return existingContent + separator + filteredNewEntries.join('\n');
}

module.exports = optimizeGitignore;
