/**
 * Duplicate Code Detector
 * Detects duplicated code across the project and suggests refactoring
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
    // Ensure projectPath is a string
    if (typeof projectPath !== 'string') {
      throw new Error('Project path must be a string');
    }
    
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
    throw error;
  }
}

/**
 * Reads and tokenizes a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} - File content and tokens
 */
async function readAndTokenizeFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Simple tokenization by splitting on whitespace and removing comments
    // In a real implementation, we would use a proper tokenizer
    const tokens = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and comments
      if (line === '' || line.startsWith('//') || line.startsWith('#') || line.startsWith('/*')) {
        continue;
      }
      
      // Simple tokenization (this is a simplified approach)
      const lineTokens = line
        .split(/\s+/)
        .filter(token => token.length > 0)
        .map(token => ({ value: token, line: i + 1 }));
      
      tokens.push(...lineTokens);
    }
    
    return {
      path: filePath,
      content,
      lines,
      tokens
    };
  } catch (error) {
    logger.error(`Error reading file ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Finds code blocks in a file
 * @param {string} filePath - Path to the file
 * @param {string} content - File content
 * @param {number} minBlockSize - Minimum block size to consider
 * @returns {Array} - Array of code blocks
 */
function findCodeBlocks(filePath, content, minBlockSize = 5) {
  const blocks = [];
  const lines = content.split('\n');
  
  // Find function and method blocks
  let inFunction = false;
  let functionStart = 0;
  let braceCount = 0;
  let currentBlock = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (line === '' || line.startsWith('//') || line.startsWith('#') || line.startsWith('/*')) {
      continue;
    }
    
    // Check for function declarations
    if (!inFunction && (
        line.includes('function ') || 
        line.match(/^\s*[a-zA-Z0-9_$]+\s*\([^)]*\)\s*{/) || // Named function
        line.match(/^\s*\([^)]*\)\s*=>\s*{/) ||            // Arrow function with block
        line.match(/^\s*[a-zA-Z0-9_$]+\s*:\s*function/)    // Object method
      )) {
      inFunction = true;
      functionStart = i;
      currentBlock = [line];
      
      // Count opening braces
      braceCount = (line.match(/{/g) || []).length;
      // Count closing braces
      braceCount -= (line.match(/}/g) || []).length;
      
      continue;
    }
    
    if (inFunction) {
      currentBlock.push(line);
      
      // Count opening braces
      braceCount += (line.match(/{/g) || []).length;
      // Count closing braces
      braceCount -= (line.match(/}/g) || []).length;
      
      // If braces are balanced, we've reached the end of the function
      if (braceCount === 0) {
        inFunction = false;
        
        // Add the function block if it's long enough
        if (currentBlock.length >= minBlockSize) {
          blocks.push({
            file: filePath,
            startLine: functionStart + 1,
            endLine: i + 1,
            content: currentBlock.join('\n')
          });
        }
        
        currentBlock = [];
      }
    }
  }
  
  // Also find code blocks based on indentation patterns
  let currentIndentBlock = [];
  let currentIndentLevel = -1;
  let indentBlockStart = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines
    if (line.trim() === '') {
      continue;
    }
    
    // Calculate indentation level
    const indentMatch = line.match(/^(\s*)/);
    const indentLevel = indentMatch ? indentMatch[1].length : 0;
    
    if (currentIndentLevel === -1) {
      // Start a new block
      currentIndentLevel = indentLevel;
      indentBlockStart = i;
      currentIndentBlock = [line.trim()];
    } else if (indentLevel > currentIndentLevel) {
      // Continue the current block with increased indentation
      currentIndentBlock.push(line.trim());
    } else if (indentLevel < currentIndentLevel) {
      // End the current block
      if (currentIndentBlock.length >= minBlockSize) {
        blocks.push({
          file: filePath,
          startLine: indentBlockStart + 1,
          endLine: i,
          content: currentIndentBlock.join('\n')
        });
      }
      
      // Start a new block
      currentIndentLevel = indentLevel;
      indentBlockStart = i;
      currentIndentBlock = [line.trim()];
    } else {
      // Same indentation level
      currentIndentBlock.push(line.trim());
    }
  }
  
  // Add the last indentation-based block if it's long enough
  if (currentIndentBlock.length >= minBlockSize) {
    blocks.push({
      file: filePath,
      startLine: indentBlockStart + 1,
      endLine: lines.length,
      content: currentIndentBlock.join('\n')
    });
  }
  
  return blocks;
}

/**
 * Compares two code blocks for similarity
 * @param {Object} block1 - First code block
 * @param {Object} block2 - Second code block
 * @returns {number} - Similarity score (0-1)
 */
function compareBlocks(block1, block2) {
  // If the blocks are from the same file and overlap, they're not duplicates
  if (block1.file === block2.file) {
    if (
      (block1.startLine <= block2.startLine && block1.endLine >= block2.startLine) ||
      (block2.startLine <= block1.startLine && block2.endLine >= block1.startLine)
    ) {
      return 0;
    }
  }
  
  // Calculate similarity based on content
  const content1 = normalizeContent(block1.content);
  const content2 = normalizeContent(block2.content);
  
  // If the contents are identical after normalization, they're duplicates
  if (content1 === content2) {
    return 1;
  }
  
  // Calculate similarity using Jaccard similarity coefficient
  const tokens1 = content1.split(/\s+/).filter(token => token.length > 0);
  const tokens2 = content2.split(/\s+/).filter(token => token.length > 0);
  
  // Create sets of tokens
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  
  // Calculate intersection
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  
  // Calculate union
  const union = new Set([...set1, ...set2]);
  
  // Calculate Jaccard similarity
  const similarity = intersection.size / union.size;
  
  return similarity;
}

/**
 * Normalizes code content for comparison
 * @param {string} content - Code content
 * @returns {string} - Normalized content
 */
function normalizeContent(content) {
  return content
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .replace(/\/\/.*$/gm, '')  // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/['"].*?['"]/, '"STRING"') // Normalize string literals
    .replace(/\d+/g, '0')      // Normalize numbers
    .replace(/\b(var|let|const)\b/g, 'var') // Normalize variable declarations
    .replace(/\b(if|for|while|switch|return|function|class|import|export)\b/g, '$1') // Keep keywords
    .replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, function(match) {
      // Keep common keywords, normalize other identifiers
      const keywords = ['if', 'for', 'while', 'switch', 'return', 'function', 'class', 'import', 'export', 'var'];
      if (keywords.includes(match)) {
        return match;
      }
      // Replace variable/function names with placeholders based on their role
      if (match.startsWith('get') || match.startsWith('set')) {
        return 'accessor';
      } else if (match.startsWith('on') || match.endsWith('Handler') || match.endsWith('Listener')) {
        return 'eventHandler';
      } else if (match.startsWith('is') || match.startsWith('has') || match.startsWith('should')) {
        return 'booleanVar';
      } else {
        return 'identifier';
      }
    })
    .trim();
}

/**
 * Finds duplicated code blocks across files
 * @param {Array} allBlocks - All code blocks
 * @param {number} similarityThreshold - Similarity threshold (0-1)
 * @returns {Array} - Array of duplications
 */
function findDuplications(allBlocks, similarityThreshold = 0.8) {
  if (!allBlocks || !Array.isArray(allBlocks) || allBlocks.length === 0) {
    return [];
  }
  
  const duplications = [];
  const processedBlocks = new Set();
  
  // Compare each block with every other block
  for (let i = 0; i < allBlocks.length; i++) {
    const block1 = allBlocks[i];
    
    // Skip blocks that are already processed
    if (processedBlocks.has(i)) {
      continue;
    }
    
    const instances = [block1];
    const similarBlockIndices = [i];
    
    for (let j = i + 1; j < allBlocks.length; j++) {
      const block2 = allBlocks[j];
      
      // Skip blocks that are already processed
      if (processedBlocks.has(j)) {
        continue;
      }
      
      // Skip blocks that are too different in size (optimization)
      const block1Lines = block1.endLine - block1.startLine + 1;
      const block2Lines = block2.endLine - block2.startLine + 1;
      const lineDifference = Math.abs(block1Lines - block2Lines);
      
      // If the blocks differ by more than 20% in line count, they're likely not duplicates
      if (lineDifference > 0.2 * Math.max(block1Lines, block2Lines)) {
        continue;
      }
      
      // Compare blocks
      const similarity = compareBlocks(block1, block2);
      
      if (similarity >= similarityThreshold) {
        instances.push(block2);
        similarBlockIndices.push(j);
      }
    }
    
    // If we found duplicates, add to the list
    if (instances.length > 1) {
      // Mark all blocks in this group as processed
      for (const index of similarBlockIndices) {
        processedBlocks.add(index);
      }
      
      // Calculate average similarity (simplified)
      const avgSimilarity = 
        instances.slice(1).reduce((sum, block) => 
          sum + compareBlocks(block1, block), 0) / (instances.length - 1);
      
      duplications.push({
        similarity: avgSimilarity,
        instances
      });
    }
  }
  
  // Sort duplications by number of instances and similarity
  return duplications.sort((a, b) => {
    // First sort by number of instances (descending)
    const instanceDiff = b.instances.length - a.instances.length;
    if (instanceDiff !== 0) return instanceDiff;
    
    // Then by similarity (descending)
    return b.similarity - a.similarity;
  });
}

/**
 * Formats the report content for a duplication
 * @param {Object} duplication - Duplication object
 * @param {number} index - Index of the duplication
 * @param {string} projectPath - Path to the project
 * @returns {string} - Formatted report content
 */
function formatDuplicationReport(duplication, index, projectPath) {
  const { instances, similarity } = duplication;
  
  // Calculate average lines
  const avgLines = Math.floor(
    instances.reduce((sum, instance) => sum + (instance.endLine - instance.startLine + 1), 0) / instances.length
  );
  const potentialLinesReduced = avgLines * (instances.length - 1);
  
  let content = `Duplication #${index + 1}:\n`;
  content += `  Similarity: ${Math.round(similarity * 100)}%\n`;
  content += `  Instances: ${instances.length}\n`;
  content += `  Average Lines: ${avgLines}\n`;
  content += `  Potential Lines Reduced: ${potentialLinesReduced}\n`;
  content += '  Locations:\n';
  
  instances.forEach((instance, idx) => {
    const relativePath = path.relative(projectPath, instance.file);
    content += `    ${idx + 1}. ${relativePath} (lines ${instance.startLine}-${instance.endLine})\n`;
  });
  
  // Add refactoring suggestion
  content += '  Suggestion: ';
  
  if (instances.length >= 3) {
    content += 'Consider extracting this code into a shared utility function.\n';
  } else if (similarity >= 0.9) {
    content += 'Extract this code into a parameterized function to avoid duplication.\n';
  } else {
    content += 'Review these similar code blocks for potential refactoring.\n';
  }
  
  content += '\n';
  return content;
}

/**
 * Detects duplicated code across the project and suggests refactoring
 * @param {string|Object} projectPathOrOptions - Path to the project or options object
 * @param {string[]} projectTypes - Detected project types (optional if options object is used)
 * @param {Object} options - Task options (optional if options object is used)
 * @returns {Promise<Object>} - Task result
 */
async function detectDuplicateCode(projectPathOrOptions, projectTypes = [], options = {}) {
  logger.info('Analyzing code for duplications...');
  
  try {
    // Handle parameters passed as an object
    let projectPath;
    
    if (typeof projectPathOrOptions === 'object' && projectPathOrOptions !== null) {
      // Extract parameters from options object
      projectPath = projectPathOrOptions.projectPath;
      projectTypes = projectPathOrOptions.projectTypes || [];
      options = {
        minBlockSize: projectPathOrOptions.minBlockSize || 5,
        similarityThreshold: projectPathOrOptions.similarityThreshold || 0.8,
        dryRun: projectPathOrOptions.dryRun || false,
        verbose: projectPathOrOptions.verbose || false
      };
    } else {
      // Use parameters as they were passed
      projectPath = projectPathOrOptions;
    }
    
    // Validate projectPath
    if (typeof projectPath !== 'string') {
      throw new Error('Project path must be a string');
    }
    
    // Ensure projectTypes is an array
    if (!projectTypes || !Array.isArray(projectTypes)) {
      projectTypes = [];
    }
    
    // Get file extensions to analyze based on project types
    const extensions = getFileExtensions(projectTypes);
    
    if (extensions.length === 0) {
      logger.warn('No supported file types found for duplicate code detection');
      return {
        success: true,
        changes: [],
        metrics: {
          duplicateBlocks: 0,
          affectedFiles: 0,
          potentialLinesReduced: 0
        }
      };
    }
    
    // Find all source files
    const sourceFiles = await findSourceFiles(projectPath, extensions);
    logger.info(`Found ${sourceFiles.length} source files to analyze`);
    
    if (sourceFiles.length === 0) {
      logger.warn('No source files found for duplicate code detection');
      return {
        success: true,
        changes: [],
        metrics: {
          duplicateBlocks: 0,
          affectedFiles: 0,
          potentialLinesReduced: 0
        }
      };
    }
    
    // Find code blocks in each file
    const allBlocks = [];
    const minBlockSize = options.minBlockSize || 5; // Minimum lines for a code block
    
    for (const filePath of sourceFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const blocks = findCodeBlocks(filePath, content, minBlockSize);
        allBlocks.push(...blocks);
      } catch (error) {
        logger.error(`Error processing file ${filePath}: ${error.message}`);
      }
    }
    
    logger.info(`Found ${allBlocks.length} code blocks to analyze`);
    
    // Find duplications
    const similarityThreshold = options.similarityThreshold || 0.8;
    const duplications = findDuplications(allBlocks, similarityThreshold);
    
    logger.info(`Found ${duplications.length} duplicate code blocks`);
    
    // Generate detailed report
    const reportPath = path.join(projectPath, '.aiguardian', 'reports', 'duplicate-code-report.txt');
    
    // Create reports directory if it doesn't exist
    const reportsDir = path.dirname(reportPath);
    try {
      await fs.mkdir(reportsDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
    
    // Calculate metrics
    const affectedFiles = new Set();
    let totalPotentialLinesReduced = 0;
    
    // Generate report content
    let reportContent = '━━━ Duplicate Code Detection Report ━━━\n\n';
    
    if (duplications.length === 0) {
      reportContent += 'No duplicate code blocks found in the project.\n';
    } else {
      reportContent += `Found ${duplications.length} duplicate code blocks across ${sourceFiles.length} files.\n\n`;
      
      duplications.forEach((duplication, index) => {
        const { instances, similarity } = duplication;
        
        // Add affected files to the set
        instances.forEach(instance => {
          affectedFiles.add(instance.file);
        });
        
        // Calculate potential lines reduced
        const avgLines = Math.floor(
          instances.reduce((sum, instance) => sum + (instance.endLine - instance.startLine + 1), 0) / instances.length
        );
        const potentialLinesReduced = avgLines * (instances.length - 1);
        totalPotentialLinesReduced += potentialLinesReduced;
        
        // Add duplication details to the report
        reportContent += formatDuplicationReport(duplication, index, projectPath);
      });
      
      // Add summary
      reportContent += '━━━ Summary ━━━\n';
      reportContent += `Total Duplicate Blocks: ${duplications.length}\n`;
      reportContent += `Affected Files: ${affectedFiles.size}\n`;
      reportContent += `Potential Lines Reduced: ${totalPotentialLinesReduced}\n`;
      
      // Add refactoring recommendations
      reportContent += '\n━━━ Recommendations ━━━\n';
      
      if (totalPotentialLinesReduced > 100) {
        reportContent += '⚠️ HIGH DUPLICATION: Your codebase has significant code duplication.\n';
        reportContent += 'Consider implementing the following refactoring strategies:\n';
        reportContent += '1. Extract utility functions for common operations\n';
        reportContent += '2. Create base classes or mixins for shared functionality\n';
        reportContent += '3. Implement a more modular architecture\n';
      } else if (totalPotentialLinesReduced > 50) {
        reportContent += '⚠️ MODERATE DUPLICATION: Your codebase has some code duplication.\n';
        reportContent += 'Consider implementing the following refactoring strategies:\n';
        reportContent += '1. Extract shared code into helper functions\n';
        reportContent += '2. Use composition to share behavior between components\n';
      } else if (totalPotentialLinesReduced > 0) {
        reportContent += '⚠️ LOW DUPLICATION: Your codebase has minor code duplication.\n';
        reportContent += 'Consider reviewing the identified duplications and refactoring as needed.\n';
      } else {
        reportContent += '✓ NO DUPLICATION: Your codebase has no significant code duplication.\n';
      }
    }
    
    // Write report to file
    await fs.writeFile(reportPath, reportContent, 'utf8');
    logger.info(`Duplicate code report saved to ${reportPath}`);
    
    // Prepare duplications for result
    const resultDuplications = duplications.map(duplication => {
      const { instances, similarity } = duplication;
      const avgLines = Math.floor(
        instances.reduce((sum, instance) => sum + (instance.endLine - instance.startLine + 1), 0) / instances.length
      );
      
      return {
        similarity,
        instances: instances.map(instance => ({
          file: instance.file,
          startLine: instance.startLine,
          endLine: instance.endLine,
          content: instance.content
        })),
        avgLines,
        potentialLinesReduced: avgLines * (instances.length - 1)
      };
    });
    
    // Return task result
    return {
      success: true,
      changes: [],
      metrics: {
        duplicateBlocks: duplications.length,
        affectedFiles: affectedFiles.size,
        potentialLinesReduced: totalPotentialLinesReduced
      },
      duplications: resultDuplications,
      reportPath: duplications.length > 0 ? reportPath : null
    };
  } catch (error) {
    logger.error(`Error detecting duplicate code: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = detectDuplicateCode;
