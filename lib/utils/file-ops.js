const fs = require("fs").promises;
const path = require("path");
const { logger } = require("./logger");

/**
 * Reads a file safely with error handling
 * @param {string} filePath - Path to the file
 * @param {string} encoding - File encoding (default: utf8)
 * @returns {Promise<string>} - File content
 */
async function readFile(filePath, encoding = "utf8") {
  try {
    return await fs.readFile(filePath, encoding);
  } catch (error) {
    logger.debug(`Error reading file ${filePath}: ${error.message}`);
    throw error;
  }
}

/**
 * Writes a file safely with directory creation
 * @param {string} filePath - Path to the file
 * @param {string|Buffer} content - Content to write
 * @param {string} encoding - File encoding (default: utf8)
 * @returns {Promise<void>}
 */
async function writeFile(filePath, content, encoding = "utf8") {
  try {
    // Ensure directory exists
    await ensureDir(path.dirname(filePath));

    // Write file
    await fs.writeFile(filePath, content, encoding);
  } catch (error) {
    logger.debug(`Error writing file ${filePath}: ${error.message}`);
    throw error;
  }
}

/**
 * Ensures a directory exists, creating it if necessary
 * @param {string} dirPath - Path to the directory
 * @returns {Promise<void>}
 */
async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Ignore if directory already exists
    if (error.code !== "EEXIST") {
      throw error;
    }
  }
}

/**
 * Safely deletes a file with error handling
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} - True if file was deleted
 */
async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      // File doesn't exist, that's fine
      return false;
    }

    logger.debug(`Error deleting file ${filePath}: ${error.message}`);
    throw error;
  }
}

/**
 * Copies a file from source to destination
 * @param {string} source - Source file path
 * @param {string} destination - Destination file path
 * @returns {Promise<void>}
 */
async function copyFile(source, destination) {
  try {
    // Ensure destination directory exists
    await ensureDir(path.dirname(destination));

    // Copy the file
    await fs.copyFile(source, destination);
  } catch (error) {
    logger.debug(
      `Error copying file from ${source} to ${destination}: ${error.message}`
    );
    throw error;
  }
}

/**
 * Renames/moves a file
 * @param {string} oldPath - Current file path
 * @param {string} newPath - New file path
 * @returns {Promise<void>}
 */
async function moveFile(oldPath, newPath) {
  try {
    // Ensure destination directory exists
    await ensureDir(path.dirname(newPath));

    // Move the file
    await fs.rename(oldPath, newPath);
  } catch (error) {
    logger.debug(
      `Error moving file from ${oldPath} to ${newPath}: ${error.message}`
    );
    throw error;
  }
}

/**
 * Gets stats for a file or directory
 * @param {string} filePath - Path to the file or directory
 * @returns {Promise<fs.Stats>} - File stats
 */
async function getStats(filePath) {
  try {
    return await fs.stat(filePath);
  } catch (error) {
    logger.debug(`Error getting stats for ${filePath}: ${error.message}`);
    throw error;
  }
}

/**
 * Checks if a file or directory exists
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} - True if file exists
 */
async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  readFile,
  writeFile,
  ensureDir,
  deleteFile,
  copyFile,
  moveFile,
  getStats,
  exists,
};
