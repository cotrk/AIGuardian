const fs = require("fs").promises;
const path = require("path");
const glob = require("glob-promise");
const { logger } = require("../../utils/logger");
const { formatSuccess, formatError } = require("../../utils/formatters");

/**
 * Cleans build artifacts from Java projects
 * @param {Object} options - Task options
 * @param {string} options.projectPath - Path to the project
 * @param {boolean} options.dryRun - If true, don't make actual changes
 * @returns {Promise<Object>} Task result
 */
async function cleanupBuild(options) {
  const { projectPath, dryRun } = options;

  try {
    logger.info("Cleaning Java build artifacts...");

    // Directories to clean based on build system
    let buildDirs = [
      "target", // Maven
      "build", // Gradle
      "out", // IntelliJ
      "bin", // Eclipse
      ".gradle", // Gradle cache
    ];

    // Files to clean
    const buildFiles = [
      "**/*.class", // Compiled class files
      "**/*.jar", // JAR files (only in build directories)
      "**/*.war", // WAR files
      "**/*.ear", // EAR files
      "**/hs_err_pid*", // JVM crash logs
    ];

    // Skip cleaning if in specific directories
    const excludeDirs = ["src", "lib", "libs", "dependencies"];

    // Detect build system
    const hasPomXml = await fileExists(path.join(projectPath, "pom.xml"));
    const hasGradleBuild = await fileExists(
      path.join(projectPath, "build.gradle")
    );

    if (hasPomXml) {
      logger.info("Detected Maven project");
    } else if (hasGradleBuild) {
      logger.info("Detected Gradle project");
    } else {
      logger.info("No specific build system detected, using generic cleanup");
    }

    // Find all build directories
    let foundDirs = [];
    let removedFiles = 0;

    // Check each potential build directory
    for (const dir of buildDirs) {
      const dirPath = path.join(projectPath, dir);

      if (await directoryExists(dirPath)) {
        foundDirs.push(dirPath);

        if (!dryRun) {
          try {
            // Remove directory contents but keep the directory
            const files = await fs.readdir(dirPath, { withFileTypes: true });
            for (const file of files) {
              const filePath = path.join(dirPath, file.name);
              if (file.isDirectory()) {
                await removeDirectory(filePath);
              } else {
                await fs.unlink(filePath);
              }
              removedFiles++;
            }
            logger.info(`Cleaned directory: ${dir}`);
          } catch (err) {
            logger.warn(
              `Could not fully clean directory ${dir}: ${err.message}`
            );
          }
        }
      }
    }

    // Find and delete stray build files
    const buildFilePatterns = buildFiles.map((pattern) => ({
      pattern,
      files: [],
    }));

    // Create exclusion patterns for glob
    const excludePatterns = excludeDirs.map((dir) => `!${dir}/**`);
    excludePatterns.push(...buildDirs.map((dir) => `!${dir}/**`)); // Skip already cleaned build dirs

    // Find matching files
    for (const pattern of buildFilePatterns) {
      const files = await glob(pattern.pattern, {
        cwd: projectPath,
        absolute: true,
        ignore: excludePatterns,
      });

      pattern.files = files;

      if (!dryRun && files.length > 0) {
        for (const file of files) {
          try {
            await fs.unlink(file);
            removedFiles++;
            logger.debug(`Removed: ${path.relative(projectPath, file)}`);
          } catch (err) {
            logger.warn(
              `Could not remove ${path.relative(projectPath, file)}: ${
                err.message
              }`
            );
          }
        }
      }
    }

    // Count total found files for dry run
    const totalFiles = buildFilePatterns.reduce(
      (total, pattern) => total + pattern.files.length,
      0
    );

    if (dryRun) {
      if (foundDirs.length > 0) {
        const dirNames = foundDirs.map((d) => path.relative(projectPath, d));
        logger.info(
          `Would clean ${dirNames.length} build directories: ${dirNames.join(
            ", "
          )}`
        );
      }

      if (totalFiles > 0) {
        logger.info(`Would remove ${totalFiles} additional build files`);
      }

      if (foundDirs.length === 0 && totalFiles === 0) {
        logger.info("No build artifacts found to clean");
      }
    } else {
      if (removedFiles > 0) {
        logger.success(
          formatSuccess(`Cleaned ${removedFiles} build artifacts`)
        );
      } else {
        logger.info("No build artifacts found to clean");
      }
    }

    return {
      success: true,
      action: dryRun ? "would_clean" : "cleaned",
      directoriesCleaned: dryRun ? foundDirs.length : foundDirs.length,
      filesRemoved: dryRun ? totalFiles : removedFiles,
    };
  } catch (error) {
    logger.error(
      formatError(`Error cleaning build artifacts: ${error.message}`)
    );
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Recursively removes a directory and all contents
 * @param {string} dirPath - Directory to remove
 */
async function removeDirectory(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        await removeDirectory(fullPath);
      } else {
        await fs.unlink(fullPath);
      }
    }

    await fs.rmdir(dirPath);
  } catch (error) {
    // Ignore errors for missing files/directories
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

/**
 * Checks if a file exists
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} - True if file exists
 */
async function fileExists(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch (err) {
    return false;
  }
}

/**
 * Checks if a directory exists
 * @param {string} dirPath - Path to check
 * @returns {Promise<boolean>} - True if directory exists
 */
async function directoryExists(dirPath) {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch (err) {
    return false;
  }
}

module.exports = cleanupBuild;
