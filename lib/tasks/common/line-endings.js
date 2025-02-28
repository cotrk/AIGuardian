const fs = require("fs").promises;
const path = require("path");
const glob = require("glob-promise");
const { logger } = require("../../utils/logger");
const { formatSuccess, formatError } = require("../../utils/formatters");
const { readFile, writeFile } = require("../../utils/file-ops");

/**
 * Normalizes line endings in text files
 * @param {Object} options - Task options
 * @param {string} options.projectPath - Path to the project
 * @param {boolean} options.dryRun - If true, don't make actual changes
 * @param {string} options.lineEnding - Line ending to use ('lf' or 'crlf')
 * @returns {Promise<Object>} Task result
 */
async function normalizeLineEndings(options) {
  const { projectPath, dryRun, lineEnding = "lf" } = options;

  const targetEnding = lineEnding.toLowerCase() === "lf" ? "\n" : "\r\n";
  const textFilePatterns = [
    "**/*.js",
    "**/*.jsx",
    "**/*.ts",
    "**/*.tsx",
    "**/*.html",
    "**/*.css",
    "**/*.scss",
    "**/*.json",
    "**/*.md",
    "**/*.txt",
    "**/*.yaml",
    "**/*.yml",
    "**/*.py",
    "**/*.java",
    "**/*.xml",
    "**/*.properties",
  ];

  // Directories to exclude
  const excludeDirs = [
    "node_modules",
    "dist",
    "build",
    "target",
    ".git",
    "__pycache__",
    "venv",
    ".env",
  ];

  try {
    logger.info(`Normalizing line endings to ${lineEnding.toUpperCase()}...`);

    // Build a combined pattern with exclusions
    const excludePattern = excludeDirs.map((dir) => `!**/${dir}/**`);
    const patterns = [...textFilePatterns, ...excludePattern];

    // Find all matching files
    const files = await glob(patterns, { cwd: projectPath, absolute: true });

    let modifiedCount = 0;
    let processedCount = 0;

    for (const file of files) {
      try {
        // Read file content
        const content = await readFile(file);

        // Normalize line endings
        const normalizedContent = content
          .replace(/\r\n/g, "\n") // Convert Windows to Unix
          .replace(/\r/g, "\n") // Convert old Mac to Unix
          .replace(/\n/g, targetEnding); // Convert to target format

        // Check if content changed
        if (content !== normalizedContent) {
          if (!dryRun) {
            await writeFile(file, normalizedContent);
          }
          modifiedCount++;
        }

        processedCount++;
      } catch (err) {
        logger.debug(`Skipping binary or unreadable file: ${file}`);
      }
    }

    if (modifiedCount > 0) {
      logger.success(
        formatSuccess(
          `Normalized line endings in ${modifiedCount} of ${processedCount} files`
        )
      );
    } else {
      logger.info(
        `All ${processedCount} files already have correct line endings`
      );
    }

    return {
      success: true,
      processedFiles: processedCount,
      modifiedFiles: modifiedCount,
      action: dryRun ? "would_modify" : "modified",
    };
  } catch (error) {
    logger.error(
      formatError(`Error normalizing line endings: ${error.message}`)
    );
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = normalizeLineEndings;
