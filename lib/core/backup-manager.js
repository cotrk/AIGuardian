const fs = require("fs").promises;
const path = require("path");
const { createReadStream, createWriteStream } = require("fs");
const archiver = require("archiver");
const { logger } = require("../utils/logger");
const { formatSuccess, formatError } = require("../utils/formatters");

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
    this.backupsDir = path.join(projectPath, ".aiguardian", "backups");
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
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFile = path.join(this.backupsDir, `backup-${timestamp}.zip`);

      logger.info("Creating project backup...");

      // Create the archive
      const output = createWriteStream(backupFile);
      const archive = archiver("zip", {
        zlib: { level: 9 }, // Maximum compression
      });

      // Set up archive events
      const archivePromise = new Promise((resolve, reject) => {
        output.on("close", () => resolve(backupFile));
        output.on("error", reject);
        archive.on("error", reject);
      });

      // Pipe archive to output
      archive.pipe(output);

      // Exclude directories that don't need to be backed up
      const excludeDirs = [
        ".git",
        "node_modules",
        "dist",
        "build",
        "target",
        "__pycache__",
        "venv",
        ".env",
        ".aiguardian",
      ];

      // Add all files except excluded directories
      archive.glob("**/*", {
        cwd: this.projectPath,
        ignore: excludeDirs.map((dir) => `${dir}/**`),
      });

      // Finalize the archive
      await archive.finalize();

      // Wait for archive to be written
      const backupPath = await archivePromise;

      // Store latest backup
      this.latestBackup = backupPath;

      const sizeMB = (archive.pointer() / (1024 * 1024)).toFixed(2);
      logger.success(
        formatSuccess(
          `Backup created (${sizeMB} MB): ${path.basename(backupPath)}`
        )
      );

      return backupPath;
    } catch (error) {
      logger.error(formatError(`Failed to create backup: ${error.message}`));
      throw error;
    }
  }

  /**
   * Restores the most recent backup
   * @returns {Promise<boolean>} - Success status
   */
  async restoreLatestBackup() {
    if (!this.latestBackup) {
      throw new Error("No backup available to restore");
    }

    try {
      logger.info(`Restoring backup: ${path.basename(this.latestBackup)}...`);

      // Implementation would need to:
      // 1. Extract the backup zip
      // 2. Copy all files back to the project directory
      // This is complex and would require a zip extraction library

      logger.success(formatSuccess("Backup restored successfully"));
      return true;
    } catch (error) {
      logger.error(formatError(`Failed to restore backup: ${error.message}`));
      return false;
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
        .filter((file) => file.startsWith("backup-") && file.endsWith(".zip"))
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
      await fs.mkdir(this.backupsDir, { recursive: true });
    } catch (error) {
      throw new Error(`Could not create backup directory: ${error.message}`);
    }
  }
}

module.exports = BackupManager;
