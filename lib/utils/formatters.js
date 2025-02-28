/**
 * ANSI color codes for terminal output
 */
const Colors = {
  RESET: '\x1b[0m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  GREEN: '\x1b[32m',
  MAGENTA: '\x1b[35m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BOLD: '\x1b[1m',
};

/**
 * Symbols for different message types
 */
const Symbols = {
  TICK: '✓',
  CROSS: '✖',
  WARNING: '⚠',
  INFO: 'ℹ',
  HORIZONTAL_LINE: '━━━',
};

/**
 * Formats a success message with appropriate styling
 * @param {string} message - Message to format
 * @returns {string} - Formatted message
 */
function formatSuccess(message) {
  return `${Colors.GREEN}${Symbols.TICK}${Colors.RESET} ${message}`;
}

/**
 * Formats an error message with appropriate styling
 * @param {string} message - Message to format
 * @returns {string} - Formatted message
 */
function formatError(message) {
  return `${Colors.RED}${Symbols.CROSS}${Colors.RESET} ${message}`;
}

/**
 * Formats a warning message with appropriate styling
 * @param {string} message - Message to format
 * @returns {string} - Formatted message
 */
function formatWarning(message) {
  return `${Colors.YELLOW}${Symbols.WARNING}${Colors.RESET} ${message}`;
}

/**
 * Formats an info message with appropriate styling
 * @param {string} message - Message to format
 * @returns {string} - Formatted message
 */
function formatInfo(message) {
  return `${Colors.BLUE}${Symbols.INFO}${Colors.RESET} ${message}`;
}

/**
 * Formats a heading with appropriate styling
 * @param {string} message - Message to format
 * @returns {string} - Formatted message
 */
function formatHeading(message) {
  return `\n${Colors.MAGENTA}${Symbols.HORIZONTAL_LINE}${Colors.RESET} ${Colors.BOLD}${Colors.MAGENTA}${message}${Colors.RESET} ${Colors.MAGENTA}${Symbols.HORIZONTAL_LINE}${Colors.RESET}\n`;
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

  return `${Colors.CYAN}${displayPath}${Colors.RESET}`;
}

/**
 * Formats a task name for display
 * @param {string} name - Task name to format
 * @returns {string} - Formatted task name
 */
function formatTaskName(name) {
  return `${Colors.BOLD}${Colors.MAGENTA}${name}${Colors.RESET}`;
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
