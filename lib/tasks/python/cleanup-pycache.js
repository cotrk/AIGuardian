const fs = require("fs").promises;
const path = require("path");
const glob = require("glob-promise");
const { logger } = require("../../utils/logger");
const { formatSuccess, formatError } = require("../../utils/formatters");

/**
 * Cleans Python cache files and directories
 * @param {Object} options - Task options
 * @param {string} options.projectPath - Path to the project
 * @param {boolean} options.dryRun - If true, don't make actual changes
 * @returns {Promise<Object>} Task result
 */
async function cleanupPycache(options) {
  const { projectPath, dryRun } = options;

  try {
    logger.info("Cleaning Python cache files...");

    // Patterns to match
    const patterns = [
      // Python cache directories
      "**/__pycache__",
      "**/.pytest_cache",
      "**/.coverage",
      "**/.tox",

      // Compiled Python files
      "**/*.pyc",
      "**/*.pyo",
      "**/*.pyd",

      // Other Python cache files
      "**/*.py[cod]",
      "**/*$py.class",
    ];

    // Directories to exclude
    const excludeDirs = [
      "venv",
      "env",
      ".venv",
      ".env",
      ".git",
      "node_modules",
    ];

    const excludePatterns = excludeDirs.map((dir) => `!${dir}/**`);

    // Find all cache directories and files
    const dirResults = [];
    const fileResults = [];

    // First find directories (like __pycache__)
    for (const pattern of patterns.filter((p) => !p.includes("*."))) {
      const matches = await glob(pattern, {
        cwd: projectPath,
        absolute: true,
        ignore: excludePatterns,
      });

      for (const match of matches) {
        try {
          const stats = await fs.stat(match);
          if (stats.isDirectory()) {
            dirResults.push(match);
          }
        } catch (err) {
          // Skip if can't access
        }
      }
    }

    // Then find individual files
    for (const pattern of patterns.filter((p) => p.includes("*."))) {
      const matches = await glob(pattern, {
        cwd: projectPath,
        absolute: true,
        ignore: excludePatterns,
      });

      fileResults.push(...matches);
    }

    // Count total items found
    const totalItems = dirResults.length + fileResults.length;

    if (totalItems === 0) {
      logger.info("No Python cache files found");
      return {
        success: true,
        action: "none",
        itemsRemoved: 0,
      };
    }

    if (!dryRun) {
      // Remove directories
      for (const dir of dirResults) {
        try {
          await removeDirectory(dir);
          logger.debug(`Removed directory: ${path.relative(projectPath, dir)}`);
        } catch (err) {
          logger.warn(
            `Could not remove directory ${path.relative(projectPath, dir)}: ${
              err.message
            }`
          );
        }
      }

      // Remove files
      for (const file of fileResults) {
        try {
          await fs.unlink(file);
          logger.debug(`Removed file: ${path.relative(projectPath, file)}`);
        } catch (err) {
          logger.warn(
            `Could not remove file ${path.relative(projectPath, file)}: ${
              err.message
            }`
          );
        }
      }

      logger.success(
        formatSuccess(
          `Removed ${dirResults.length} cache directories and ${fileResults.length} cache files`
        )
      );
    } else {
      logger.info(
        `Would remove ${dirResults.length} cache directories and ${fileResults.length} cache files`
      );
    }

    return {
      success: true,
      action: dryRun ? "would_clean" : "cleaned",
      directoriesRemoved: dirResults.length,
      filesRemoved: fileResults.length,
    };
  } catch (error) {
    logger.error(formatError(`Error cleaning Python cache: ${error.message}`));
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Recursively removes a directory and all contents
 * @param {string} dirPath - Directory to remove
 */
async function removeDirectory(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        await removeDirectory(fullPath);
      } else {
        await fs.unlink(fullPath);
      }
    }

    await fs.rmdir(dirPath);
  } catch (error) {
    // Ignore errors for missing files/directories
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

module.exports = cleanupPycache;
