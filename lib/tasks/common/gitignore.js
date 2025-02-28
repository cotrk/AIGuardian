const fs = require("fs").promises;
const path = require("path");
const { logger } = require("../../utils/logger");
const { formatSuccess, formatError } = require("../../utils/formatters");

/**
 * Creates or optimizes .gitignore files
 * @param {Object} options - Task options
 * @param {string} options.projectPath - Path to the project
 * @param {boolean} options.dryRun - If true, don't make actual changes
 * @returns {Promise<Object>} Task result
 */
async function optimizeGitignore(options) {
  const { projectPath, dryRun } = options;
  const gitignorePath = path.join(projectPath, ".gitignore");

  try {
    logger.info("Checking .gitignore file...");

    // Check if .gitignore exists
    let gitignoreExists = false;
    try {
      await fs.access(gitignorePath);
      gitignoreExists = true;
    } catch (err) {
      // File doesn't exist
    }

    // Standard patterns that should be in .gitignore
    const standardPatterns = [
      "# OS files",
      ".DS_Store",
      "Thumbs.db",
      "# Editor files",
      ".vscode/",
      ".idea/",
      "*.swp",
      "*.swo",
      "# Log files",
      "*.log",
      "npm-debug.log*",
      "yarn-debug.log*",
      "yarn-error.log*",
      "# Environment variables",
      ".env",
      ".env.local",
      ".env.development.local",
      ".env.test.local",
      ".env.production.local",
    ];

    if (gitignoreExists) {
      // Read existing .gitignore
      const content = await fs.readFile(gitignorePath, "utf8");
      const lines = content.split("\n").map((line) => line.trim());

      // Find missing patterns
      const missingPatterns = standardPatterns.filter(
        (pattern) => !pattern.startsWith("#") && !lines.includes(pattern)
      );

      if (missingPatterns.length > 0) {
        if (!dryRun) {
          // Add missing patterns
          const updatedContent =
            content +
            "\n\n# Added by AIGuardian\n" +
            missingPatterns.join("\n");
          await fs.writeFile(gitignorePath, updatedContent);

          logger.success(
            formatSuccess(
              `Updated .gitignore with ${missingPatterns.length} new patterns`
            )
          );
        } else {
          logger.info(
            `Would add ${missingPatterns.length} patterns to .gitignore`
          );
        }

        return {
          success: true,
          action: dryRun ? "would_update" : "updated",
          addedPatterns: missingPatterns.length,
        };
      } else {
        logger.info("No updates needed for .gitignore");
        return {
          success: true,
          action: "no_change_needed",
        };
      }
    } else {
      if (!dryRun) {
        // Create new .gitignore
        await fs.writeFile(gitignorePath, standardPatterns.join("\n"));
        logger.success(formatSuccess("Created new .gitignore file"));
      } else {
        logger.info("Would create a new .gitignore file");
      }

      return {
        success: true,
        action: dryRun ? "would_create" : "created",
      };
    }
  } catch (error) {
    logger.error(formatError(`Error optimizing .gitignore: ${error.message}`));
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = optimizeGitignore;
