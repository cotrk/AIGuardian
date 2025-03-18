/**
 * Process utilities for executing commands
 * Provides functions to execute shell commands safely
 */
const { exec, spawn } = require('child_process');
const { logger } = require('./logger');

/**
 * Executes a command and returns a promise
 * @param {string} command - Command to execute
 * @param {Object} options - Options for exec
 * @returns {Promise<Object>} - Promise resolving to { stdout, stderr }
 */
function execPromise(command, options = {}) {
  return new Promise((resolve, reject) => {
    logger.debug(`Executing command: ${command}`);
    
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Command execution error: ${error.message}`);
        reject(error);
        return;
      }
      
      resolve({ stdout, stderr });
    });
  });
}

/**
 * Spawns a process with streaming output
 * @param {string} command - Command to execute
 * @param {Array} args - Arguments for the command
 * @param {Object} options - Options for spawn
 * @returns {Promise<number>} - Promise resolving to exit code
 */
function spawnProcess(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    logger.debug(`Spawning process: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      ...options
    });
    
    process.on('close', (code) => {
      if (code !== 0) {
        logger.error(`Process exited with code ${code}`);
        reject(new Error(`Process exited with code ${code}`));
        return;
      }
      
      resolve(code);
    });
    
    process.on('error', (error) => {
      logger.error(`Process error: ${error.message}`);
      reject(error);
    });
  });
}

module.exports = {
  execPromise,
  spawnProcess
};
