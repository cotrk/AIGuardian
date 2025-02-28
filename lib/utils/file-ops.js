/**
 * File operations utility module
 * Uses only native Node.js modules for file operations
 */

const fs = require('fs').promises;
const path = require('path');
const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream').promises;
const { logger } = require('./logger');

/**
 * Check if a file exists
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} - True if file exists, false otherwise
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Read file content
 * @param {string} filePath - Path to the file
 * @param {string} encoding - File encoding (default: 'utf8')
 * @returns {Promise<string|Buffer>} - File content
 */
async function readFile(filePath, encoding = 'utf8') {
  try {
    return await fs.readFile(filePath, encoding);
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error.message}`);
  }
}

/**
 * Write content to a file
 * @param {string} filePath - Path to the file
 * @param {string|Buffer} content - Content to write
 * @param {string} encoding - File encoding (default: 'utf8')
 * @returns {Promise<void>}
 */
async function writeFile(filePath, content, encoding = 'utf8') {
  try {
    // Ensure directory exists
    const dirPath = path.dirname(filePath);
    await ensureDirectoryExists(dirPath);
    
    // Write file
    await fs.writeFile(filePath, content, encoding);
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error.message}`);
  }
}

/**
 * Ensure a directory exists, create it if it doesn't
 * @param {string} dirPath - Path to the directory
 * @returns {Promise<void>}
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Ignore error if directory already exists
    if (error.code !== 'EEXIST') {
      throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
    }
  }
}

/**
 * Copy a file
 * @param {string} sourcePath - Source file path
 * @param {string} destPath - Destination file path
 * @returns {Promise<void>}
 */
async function copyFile(sourcePath, destPath) {
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(destPath);
    await ensureDirectoryExists(destDir);
    
    // Copy file
    await fs.copyFile(sourcePath, destPath);
  } catch (error) {
    throw new Error(`Failed to copy file from ${sourcePath} to ${destPath}: ${error.message}`);
  }
}

/**
 * Copy a directory recursively
 * @param {string} sourceDir - Source directory path
 * @param {string} destDir - Destination directory path
 * @returns {Promise<void>}
 */
async function copyDirectory(sourceDir, destDir) {
  try {
    // Ensure destination directory exists
    await ensureDirectoryExists(destDir);
    
    // Read source directory
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });
    
    // Copy each entry
    for (const entry of entries) {
      const sourcePath = path.join(sourceDir, entry.name);
      const destPath = path.join(destDir, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively copy subdirectory
        await copyDirectory(sourcePath, destPath);
      } else {
        // Copy file
        await copyFile(sourcePath, destPath);
      }
    }
  } catch (error) {
    throw new Error(`Failed to copy directory from ${sourceDir} to ${destDir}: ${error.message}`);
  }
}

/**
 * Delete a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<void>}
 */
async function deleteFile(filePath) {
  try {
    if (await fileExists(filePath)) {
      await fs.unlink(filePath);
    }
  } catch (error) {
    throw new Error(`Failed to delete file ${filePath}: ${error.message}`);
  }
}

/**
 * Delete a directory recursively
 * @param {string} dirPath - Path to the directory
 * @returns {Promise<void>}
 */
async function deleteDirectory(dirPath) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    // Handle Node.js versions that don't support fs.rm
    if (error.code === 'ERR_FS_EISDIR' || error.code === 'ENOENT') {
      try {
        await fs.rmdir(dirPath, { recursive: true });
      } catch (rmdirError) {
        throw new Error(`Failed to delete directory ${dirPath}: ${rmdirError.message}`);
      }
    } else {
      throw new Error(`Failed to delete directory ${dirPath}: ${error.message}`);
    }
  }
}

/**
 * Find files matching a pattern
 * @param {string} dirPath - Directory to search in
 * @param {RegExp} pattern - Pattern to match against file names
 * @param {boolean} recursive - Whether to search recursively
 * @returns {Promise<string[]>} - Array of matching file paths
 */
async function findFiles(dirPath, pattern, recursive = true) {
  const results = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory() && recursive) {
        // Recursively search subdirectory
        const subResults = await findFiles(fullPath, pattern, recursive);
        results.push(...subResults);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        // Add matching file
        results.push(fullPath);
      }
    }
  } catch (error) {
    logger.error(`Error searching in ${dirPath}: ${error.message}`);
  }
  
  return results;
}

/**
 * Stream a file from source to destination
 * @param {string} sourcePath - Source file path
 * @param {string} destPath - Destination file path
 * @returns {Promise<void>}
 */
async function streamFile(sourcePath, destPath) {
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(destPath);
    await ensureDirectoryExists(destDir);
    
    // Create read and write streams
    const readStream = createReadStream(sourcePath);
    const writeStream = createWriteStream(destPath);
    
    // Pipe data from read stream to write stream
    await pipeline(readStream, writeStream);
  } catch (error) {
    throw new Error(`Failed to stream file from ${sourcePath} to ${destPath}: ${error.message}`);
  }
}

module.exports = {
  fileExists,
  readFile,
  writeFile,
  ensureDirectoryExists,
  copyFile,
  copyDirectory,
  deleteFile,
  deleteDirectory,
  findFiles,
  streamFile
};
