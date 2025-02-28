const chalk = require("chalk");
const figures = require("figures");

/**
 * Formats a success message with appropriate styling
 * @param {string} message - Message to format
 * @returns {string} - Formatted message
 */
function formatSuccess(message) {
  return `${chalk.green(figures.tick)} ${message}`;
}

/**
 * Formats an error message with appropriate styling
 * @param {string} message - Message to format
 * @returns {string} - Formatted message
 */
function formatError(message) {
  return `${chalk.red(figures.cross)} ${message}`;
}

/**
 * Formats a warning message with appropriate styling
 * @param {string} message - Message to format
 * @returns {string} - Formatted message
 */
function formatWarning(message) {
  return `${chalk.yellow(figures.warning)} ${message}`;
}

/**
 * Formats an info message with appropriate styling
 * @param {string} message - Message to format
 * @returns {string} - Formatted message
 */
function formatInfo(message) {
  return `${chalk.blue(figures.info)} ${message}`;
}

/**
 * Formats a heading with appropriate styling
 * @param {string} message - Message to format
 * @returns {string} - Formatted message
 */
function formatHeading(message) {
  return `\n${chalk.magenta("━━━")} ${chalk.bold.magenta(
    message
  )} ${chalk.magenta("━━━")}\n`;
}

/**
 * Formats a file path for display
 * @param {string} filePath - File path to format
 * @param {string} projectPath - Base path for relative display
 * @returns {string} - Formatted file path
 */
function formatFilePath(filePath, projectPath) {
  if (!filePath) return "";

  let displayPath = filePath;

  if (projectPath && filePath.startsWith(projectPath)) {
    displayPath = filePath.substring(projectPath.length);
    if (displayPath.startsWith("/") || displayPath.startsWith("\\")) {
      displayPath = displayPath.substring(1);
    }
  }

  return chalk.cyan(displayPath);
}

/**
 * Formats a task name for display
 * @param {string} name - Task name to format
 * @returns {string} - Formatted task name
 */
function formatTaskName(name) {
  return chalk.bold.magenta(name);
}

/**
 * Formats a duration for display
 * @param {number} milliseconds - Duration in milliseconds
 * @returns {string} - Formatted duration
 */
function formatDuration(milliseconds) {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  const seconds = (milliseconds / 1000).toFixed(1);
  return `${seconds}s`;
}

module.exports = {
  formatSuccess,
  formatError,
  formatWarning,
  formatInfo,
  formatHeading,
  formatFilePath,
  formatTaskName,
  formatDuration,
};
