const fs = require("fs").promises;
const path = require("path");
const { logger } = require("../../utils/logger");
const { formatSuccess, formatError } = require("../../utils/formatters");

/**
 * Formats JavaScript/TypeScript code files
 * @param {Object} options - Task options
 * @param {string} options.projectPath - Path to the project
 * @param {boolean} options.dryRun - If true, don't make actual changes
 * @returns {Promise<Object>} Task result
 */
async function formatCode(options) {
  const { projectPath, dryRun } = options;
  const filesFormatted = [];
  const errors = [];

  try {
    logger.info("Analyzing files for formatting...");

    const jsFiles = await findJavaScriptFiles(projectPath);
    
    for (const file of jsFiles) {
      try {
        const content = await fs.readFile(file, "utf8");
        const formatted = formatJavaScriptContent(content);

        if (content !== formatted) {
          if (!dryRun) {
            await fs.writeFile(file, formatted, "utf8");
            filesFormatted.push(file);
          }
        }
      } catch (err) {
        errors.push({ file, error: err.message });
      }
    }

    if (filesFormatted.length > 0) {
      logger.success(
        formatSuccess(`Formatted ${filesFormatted.length} files`)
      );
    } else {
      logger.info("No files needed formatting");
    }

    return {
      success: true,
      filesFormatted: filesFormatted.length,
      errors: errors.length,
    };
  } catch (error) {
    logger.error(formatError(`Error formatting code: ${error.message}`));
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Finds all JavaScript files in the project
 * @param {string} dir - Directory to search
 * @returns {Promise<string[]>} Array of file paths
 */
async function findJavaScriptFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
      files.push(...await findJavaScriptFiles(fullPath));
    } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Formats JavaScript content
 * @param {string} content - File content
 * @returns {string} Formatted content
 */
function formatJavaScriptContent(content) {
  return content
    // Standardize quotes to double
    .replace(/'([^'\\]|\\.)*'/g, match => `"${match.slice(1, -1)}"`)
    // Ensure single space after commas
    .replace(/,\s*/g, ", ")
    // Remove trailing whitespace
    .replace(/[ \t]+$/gm, "")
    // Ensure single newline at EOF
    .replace(/\n*$/, "\n")
    // Standardize line endings to LF
    .replace(/\r\n/g, "\n")
    // Ensure space after keywords
    .replace(/\b(if|for|while|switch|catch)\(/g, "$1 (")
    // Add trailing commas in multiline objects/arrays
    .replace(/([{\[]\n(?:.*\n)*?[^\S\n]*)[}\]]/g, (match, p1) => {
      const lines = match.split("\n");
      if (lines.length > 2) {
        const lastLine = lines[lines.length - 2];
        if (!lastLine.trim().endsWith(",")) {
          lines[lines.length - 2] = lastLine.replace(/([^,\s])(\s*)$/, "$1,$2");
        }
      }
      return lines.join("\n");
    });
}

module.exports = formatCode;