const fs = require('fs').promises;
const path = require('path');
const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
const zlib = require('zlib');
const { logger } = require('../utils/logger');
const { formatSuccess, formatError } = require('../utils/formatters');
const fileOps = require('../utils/file-ops');

/**
 * Manages project backups before making changes
 */
class BackupManager {
  /**
   * Creates a new backup manager
   * @param {string} projectPath - Path to the project
   */
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.backupsDir = path.join(projectPath, '.aiguardian', 'backups');
    this.latestBackup = null;
  }

  /**
   * Creates a backup of the project
   * @returns {Promise<string>} - Path to the backup file
   */
  async createBackup() {
    try {
      // Ensure backup directory exists
      await this.ensureBackupDir();

      // Generate timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(this.backupsDir, `backup-${timestamp}`);
      const backupFile = `${backupDir}.tar.gz`;

      logger.info('Creating project backup...');

      // Create temporary directory for backup files
      await fileOps.ensureDirectoryExists(backupDir);

      // Copy files to backup directory
      await this.copyProjectFiles(backupDir);

      // Create tar.gz archive
      await this.createArchive(backupDir, backupFile);

      // Clean up temporary directory
      await this.removeDirectory(backupDir);

      // Store latest backup
      this.latestBackup = backupFile;

      // Get file size
      const stats = await fs.stat(backupFile);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      logger.success(
        formatSuccess(
          `Backup created (${sizeMB} MB): ${path.basename(backupFile)}`
        )
      );

      return backupFile;
    } catch (error) {
      logger.error(formatError(`Failed to create backup: ${error.message}`));
      throw error;
    }
  }

  /**
   * Copy project files to backup directory
   * @param {string} backupDir - Destination directory
   * @returns {Promise<void>}
   * @private
   */
  async copyProjectFiles(backupDir) {
    try {
      // Exclude directories that don't need to be backed up
      const excludeDirs = [
        '.git',
        'node_modules',
        'dist',
        'build',
        'target',
        '__pycache__',
        'venv',
        '.env',
        '.aiguardian',
      ];

      // Get all files in the project directory
      const files = await this.getAllFiles(this.projectPath, excludeDirs);

      // Copy each file to the backup directory
      for (const file of files) {
        const relativePath = path.relative(this.projectPath, file);
        const destPath = path.join(backupDir, relativePath);
        
        // Ensure destination directory exists
        await fileOps.ensureDirectoryExists(path.dirname(destPath));
        
        // Copy the file
        await fs.copyFile(file, destPath);
      }
    } catch (error) {
      throw new Error(`Failed to copy project files: ${error.message}`);
    }
  }

  /**
   * Get all files in a directory recursively
   * @param {string} dir - Directory to scan
   * @param {string[]} excludeDirs - Directories to exclude
   * @param {string[]} [result=[]] - Accumulated results
   * @returns {Promise<string[]>} - List of file paths
   * @private
   */
  async getAllFiles(dir, excludeDirs, result = []) {
    try {
      const files = await fs.readdir(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        
        // Skip excluded directories
        if (excludeDirs.includes(file)) {
          continue;
        }
        
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory()) {
          // Recursively scan subdirectories
          await this.getAllFiles(filePath, excludeDirs, result);
        } else {
          // Add file to result
          result.push(filePath);
        }
      }
      
      return result;
    } catch (error) {
      logger.debug(`Error scanning directory ${dir}: ${error.message}`);
      return result;
    }
  }

  /**
   * Create a tar.gz archive from a directory
   * @param {string} sourceDir - Directory to archive
   * @param {string} destFile - Destination archive file
   * @returns {Promise<void>}
   * @private
   */
  async createArchive(sourceDir, destFile) {
    try {
      const { execFile } = require('child_process');
      const util = require('util');
      const execFilePromise = util.promisify(execFile);
      
      // Use tar command if available (Unix/Linux/macOS)
      try {
        await execFilePromise('tar', ['-czf', destFile, '-C', path.dirname(sourceDir), path.basename(sourceDir)]);
        return;
      } catch (error) {
        // If tar command fails, fall back to manual implementation
        logger.debug('Tar command not available, using fallback method');
      }
      
      // Fallback: Manual implementation using Node.js streams
      // This is a simplified version and doesn't create a proper tar.gz
      // In a real implementation, you would use a proper tar library or implement tar format
      
      const output = createWriteStream(destFile);
      const gzip = zlib.createGzip();
      
      // Pipe gzip to output file
      gzip.pipe(output);
      
      // Get all files in the source directory
      const files = await this.getAllFiles(sourceDir, []);
      
      // Write each file to the archive
      for (const file of files) {
        const relativePath = path.relative(sourceDir, file);
        const fileContent = await fs.readFile(file);
        
        // Write file path and content to the archive
        gzip.write(`${relativePath}\n`);
        gzip.write(fileContent);
        gzip.write('\n');
      }
      
      // Finalize the archive
      gzip.end();
      
      // Wait for the archive to be written
      await new Promise((resolve, reject) => {
        output.on('finish', resolve);
        output.on('error', reject);
      });
    } catch (error) {
      throw new Error(`Failed to create archive: ${error.message}`);
    }
  }

  /**
   * Remove a directory and all its contents
   * @param {string} dir - Directory to remove
   * @returns {Promise<void>}
   * @private
   */
  async removeDirectory(dir) {
    try {
      const { rm } = fs;
      
      // Use recursive remove if available (Node.js 14+)
      if (rm) {
        await rm(dir, { recursive: true, force: true });
        return;
      }
      
      // Fallback for older Node.js versions
      const files = await fs.readdir(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory()) {
          // Recursively remove subdirectories
          await this.removeDirectory(filePath);
        } else {
          // Remove file
          await fs.unlink(filePath);
        }
      }
      
      // Remove empty directory
      await fs.rmdir(dir);
    } catch (error) {
      logger.debug(`Error removing directory ${dir}: ${error.message}`);
    }
  }

  /**
   * Restores the most recent backup
   * @returns {Promise<boolean>} - Success status
   */
  async restoreLatestBackup() {
    if (!this.latestBackup) {
      throw new Error('No backup available to restore');
    }

    try {
      logger.info(`Restoring backup: ${path.basename(this.latestBackup)}...`);

      // Extract the backup
      const extractDir = path.join(
        this.backupsDir,
        'restore-' + Date.now()
      );
      
      await this.extractArchive(this.latestBackup, extractDir);
      
      // Copy files back to project directory
      await this.copyFilesToProject(extractDir);
      
      // Clean up
      await this.removeDirectory(extractDir);

      logger.success(formatSuccess('Backup restored successfully'));
      return true;
    } catch (error) {
      logger.error(formatError(`Failed to restore backup: ${error.message}`));
      return false;
    }
  }

  /**
   * Extract a tar.gz archive
   * @param {string} archiveFile - Archive file to extract
   * @param {string} destDir - Destination directory
   * @returns {Promise<void>}
   * @private
   */
  async extractArchive(archiveFile, destDir) {
    try {
      const { execFile } = require('child_process');
      const util = require('util');
      const execFilePromise = util.promisify(execFile);
      
      // Ensure destination directory exists
      await fileOps.ensureDirectoryExists(destDir);
      
      // Try using tar command if available
      try {
        await execFilePromise('tar', ['-xzf', archiveFile, '-C', destDir]);
        return;
      } catch (error) {
        // If tar command fails, fall back to manual implementation
        logger.debug('Tar command not available, using fallback method');
        throw new Error('Extraction fallback not implemented');
      }
    } catch (error) {
      throw new Error(`Failed to extract archive: ${error.message}`);
    }
  }

  /**
   * Copy files from extracted backup to project directory
   * @param {string} sourceDir - Source directory
   * @returns {Promise<void>}
   * @private
   */
  async copyFilesToProject(sourceDir) {
    try {
      // Get all files in the source directory
      const files = await this.getAllFiles(sourceDir, []);
      
      // Copy each file to the project directory
      for (const file of files) {
        const relativePath = path.relative(sourceDir, file);
        const destPath = path.join(this.projectPath, relativePath);
        
        // Ensure destination directory exists
        await fileOps.ensureDirectoryExists(path.dirname(destPath));
        
        // Copy the file
        await fs.copyFile(file, destPath);
      }
    } catch (error) {
      throw new Error(`Failed to copy files to project: ${error.message}`);
    }
  }

  /**
   * Lists all available backups
   * @returns {Promise<Array<string>>} - List of backup files
   */
  async listBackups() {
    try {
      await this.ensureBackupDir();

      const files = await fs.readdir(this.backupsDir);
      return files
        .filter(file => file.endsWith('.tar.gz') && file.startsWith('backup-'))
        .sort()
        .reverse(); // Latest first
    } catch (error) {
      logger.error(formatError(`Failed to list backups: ${error.message}`));
      return [];
    }
  }

  /**
   * Ensures the backup directory exists
   * @private
   */
  async ensureBackupDir() {
    try {
      await fileOps.ensureDirectoryExists(this.backupsDir);
    } catch (error) {
      throw new Error(`Could not create backup directory: ${error.message}`);
    }
  }
}

module.exports = BackupManager;
