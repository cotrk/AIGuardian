/**
 * ANSI color codes for terminal output
 */
const Colors = {
  RESET: '\x1b[0m',
  GRAY: '\x1b[90m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  RED: '\x1b[31m',
};

/**
 * Symbols for different log types
 */
const Symbols = {
  SUCCESS: '✓',
  WARNING: '⚠',
  ERROR: '✖',
};

/**
 * Logging levels
 * @enum {number}
 */
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  SUCCESS: 2,
  WARN: 3,
  ERROR: 4,
};

/**
 * Enhanced logger for AIGuardian
 */
class Logger {
  /**
   * Creates a new logger
   * @param {Object} options - Logger options
   * @param {number} options.level - Minimum log level (default: INFO)
   * @param {boolean} options.silent - If true, suppress all output
   */
  constructor(options = {}) {
    this.level = options.level ?? LogLevel.INFO;
    this.silent = options.silent ?? false;
    this.timestamps = options.timestamps ?? false;
  }

  /**
   * Gets the current timestamp
   * @returns {string} - Formatted timestamp
   */
  getTimestamp() {
    if (!this.timestamps) return "";

    const now = new Date();
    return `[${now.toISOString()}] `;
  }

  /**
   * Logs a debug message
   * @param {string} message - Message to log
   */
  debug(message) {
    if (this.silent || this.level > LogLevel.DEBUG) return;
    console.log(`${Colors.GRAY}${this.getTimestamp()}${message}${Colors.RESET}`);
  }

  /**
   * Logs an info message
   * @param {string} message - Message to log
   */
  info(message) {
    if (this.silent || this.level > LogLevel.INFO) return;
    console.log(`${this.getTimestamp()}${message}`);
  }

  /**
   * Logs a success message
   * @param {string} message - Message to log
   */
  success(message) {
    if (this.silent || this.level > LogLevel.SUCCESS) return;
    console.log(`${Colors.GREEN}${this.getTimestamp()}${Symbols.SUCCESS} ${message}${Colors.RESET}`);
  }

  /**
   * Logs a warning message
   * @param {string} message - Message to log
   */
  warn(message) {
    if (this.silent || this.level > LogLevel.WARN) return;
    console.warn(`${Colors.YELLOW}${this.getTimestamp()}${Symbols.WARNING} ${message}${Colors.RESET}`);
  }

  /**
   * Logs an error message
   * @param {string} message - Message to log
   */
  error(message) {
    if (this.silent || this.level > LogLevel.ERROR) return;
    console.error(`${Colors.RED}${this.getTimestamp()}${Symbols.ERROR} ${message}${Colors.RESET}`);
  }

  /**
   * Sets the log level
   * @param {number} level - New log level
   */
  setLevel(level) {
    this.level = level;
  }

  /**
   * Sets whether to show timestamps
   * @param {boolean} show - Whether to show timestamps
   */
  showTimestamps(show) {
    this.timestamps = show;
  }

  /**
   * Sets whether the logger is silent
   * @param {boolean} silent - Whether the logger is silent
   */
  setSilent(silent) {
    this.silent = silent;
  }
}

// Create a default logger instance
const logger = new Logger();

module.exports = {
  logger,
  LogLevel,
};
