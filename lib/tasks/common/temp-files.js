const fs = require("fs").promises;
const path = require("path");
const glob = require("glob-promise");
const { logger } = require("../../utils/logger");
const { formatSuccess, formatError } = require("../../utils/formatters");

/**
 * Cleans temporary and backup files from the project
 * @param {Object} options - Task options
 * @param {string} options.projectPath - Path to the project
 * @param {boolean} options.dryRun - If true, don't make actual changes
 * @returns {Promise<Object>} Task result
 */
async function cleanTempFiles(options) {
  const { projectPath, dryRun } = options;

  // Patterns for temporary and backup files
  const tempFilePatterns = [
    "**/*.tmp",
    "**/*.temp",
    "**/*.bak",
    "**/*.swp",
    "**/*.swo",
    "**/*~",
    "**/*.DS_Store",
    "**/Thumbs.db",
  ];

  // Directories to exclude
  const excludeDirs = ["node_modules", ".git", "venv", ".env"];

  try {
    logger.info("Cleaning temporary and backup files...");

    // Build a combined pattern with exclusions
    const excludePattern = excludeDirs.map((dir) => `!**/${dir}/**`);
    const patterns = [...tempFilePatterns, ...excludePattern];

    // Find all matching files
    const files = await glob(patterns, { cwd: projectPath, absolute: true });

    if (files.length === 0) {
      logger.info("No temporary files found to clean");
      return {
        success: true,
        action: "none",
        removedFiles: 0,
      };
    }

    // Display files that will be removed
    logger.info(`Found ${files.length} temporary files to clean`);

    if (!dryRun) {
      // Remove each file
      for (const file of files) {
        try {
          await fs.unlink(file);
          logger.debug(`Removed: ${path.relative(projectPath, file)}`);
        } catch (err) {
          logger.warn(
            `Failed to remove ${path.relative(projectPath, file)}: ${
              err.message
            }`
          );
        }
      }

      logger.success(formatSuccess(`Cleaned ${files.length} temporary files`));
    } else {
      logger.info(`Would clean ${files.length} temporary files`);
    }

    return {
      success: true,
      action: dryRun ? "would_remove" : "removed",
      removedFiles: files.length,
      files: files.map((file) => path.relative(projectPath, file)),
    };
  } catch (error) {
    logger.error(formatError(`Error cleaning temp files: ${error.message}`));
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = cleanTempFiles;
