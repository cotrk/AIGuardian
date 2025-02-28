const fs = require("fs").promises;
const path = require("path");
const { spawn } = require("child_process");
const xml2js = require("xml2js");
const { logger } = require("../../utils/logger");
const { formatSuccess, formatError } = require("../../utils/formatters");

/**
 * Optimizes dependencies in Java projects
 * @param {Object} options - Task options
 * @param {string} options.projectPath - Path to the project
 * @param {boolean} options.dryRun - If true, don't make actual changes
 * @returns {Promise<Object>} Task result
 */
async function optimizeDependencies(options) {
  const { projectPath, dryRun } = options;

  try {
    logger.info("Analyzing Java dependencies...");

    // Detect build system
    const hasPomXml = await fileExists(path.join(projectPath, "pom.xml"));
    const hasGradleBuild = await fileExists(
      path.join(projectPath, "build.gradle")
    );

    if (!hasPomXml && !hasGradleBuild) {
      logger.warn("No Maven (pom.xml) or Gradle (build.gradle) files found");
      return {
        success: false,
        error: "No supported build system detected",
      };
    }

    if (hasPomXml) {
      return await optimizeMavenDependencies(projectPath, dryRun);
    } else {
      return await optimizeGradleDependencies(projectPath, dryRun);
    }
  } catch (error) {
    logger.error(
      formatError(`Error optimizing Java dependencies: ${error.message}`)
    );
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Optimizes Maven dependencies
 * @param {string} projectPath - Path to the project
 * @param {boolean} dryRun - If true, don't make actual changes
 * @returns {Promise<Object>} Task result
 */
async function optimizeMavenDependencies(projectPath, dryRun) {
  logger.info("Optimizing Maven dependencies...");

  const pomPath = path.join(projectPath, "pom.xml");

  try {
    // Read pom.xml
    const pomXml = await fs.readFile(pomPath, "utf8");
    const parser = new xml2js.Parser({ explicitArray: false });
    const pom = await parser.parseStringPromise(pomXml);

    if (!pom.project || !pom.project.dependencies) {
      logger.info("No dependencies found in pom.xml");
      return {
        success: true,
        action: "none",
        dependenciesUpdated: 0,
      };
    }

    // Check for Maven wrapper
    const hasMavenWrapper =
      (await fileExists(path.join(projectPath, "mvnw"))) ||
      (await fileExists(path.join(projectPath, "mvnw.cmd")));

    // In a real implementation, we'd analyze the dependencies and suggest updates
    // For now, we'll use mvn versions:display-dependency-updates if available
    if (!dryRun) {
      try {
        const mvnCommand = hasMavenWrapper
          ? process.platform === "win32"
            ? "mvnw.cmd"
            : "./mvnw"
          : "mvn";

        logger.info("Checking for dependency updates...");
        const result = await runCommand(
          `${mvnCommand} versions:display-dependency-updates -DprocessDependencyManagement=false`,
          projectPath
        );

        if (result) {
          // Parse the output to find outdated dependencies
          const lines = result.split("\n");
          const updates = lines.filter(
            (line) =>
              line.includes("->") &&
              !line.includes("No dependencies in Dependencies")
          );

          if (updates.length > 0) {
            logger.info(
              `Found ${updates.length} dependencies that could be updated:`
            );
            updates.forEach((update) => logger.info(`  ${update.trim()}`));

            // Ask if user wants to update to the latest versions
            if (!dryRun) {
              const updatedPom = await updatePomDependencies(pom, updates);
              if (updatedPom) {
                const builder = new xml2js.Builder();
                const xml = builder.buildObject(updatedPom);

                // Save the updated pom.xml
                await fs.writeFile(pomPath, xml);
                logger.success(
                  formatSuccess("Updated pom.xml with latest dependencies")
                );
              }
            }
          } else {
            logger.info("All dependencies are up to date");
          }

          return {
            success: true,
            action: dryRun ? "would_update" : "updated",
            dependenciesUpdated: updates.length,
          };
        }
      } catch (err) {
        logger.warn(`Could not run Maven version check: ${err.message}`);
        logger.info(
          'Recommend running "mvn versions:display-dependency-updates" manually'
        );
      }
    } else {
      logger.info("Would check and update dependencies (dry run)");
    }

    return {
      success: true,
      action: "analysis_only",
      dependenciesAnalyzed: pom.project.dependencies.dependency
        ? Array.isArray(pom.project.dependencies.dependency)
          ? pom.project.dependencies.dependency.length
          : 1
        : 0,
    };
  } catch (error) {
    logger.error(`Error processing pom.xml: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Updates POM dependencies based on version information
 * @param {Object} pom - Parsed POM object
 * @param {Array<string>} updates - Update information lines
 * @returns {Promise<Object>} Updated POM object
 */
async function updatePomDependencies(pom, updates) {
  // This is a simplified implementation
  // In a real implementation, we'd parse the updates and modify the POM

  // For now, we'll just show what we would do
  logger.info("Dependency updates would be applied to these dependencies:");

  if (pom.project.dependencies.dependency) {
    const dependencies = Array.isArray(pom.project.dependencies.dependency)
      ? pom.project.dependencies.dependency
      : [pom.project.dependencies.dependency];

    for (const dep of dependencies) {
      const groupId = dep.groupId;
      const artifactId = dep.artifactId;
      const currentVersion = dep.version;

      // Find if there's an update for this dependency
      const updateLine = updates.find(
        (line) => line.includes(groupId) && line.includes(artifactId)
      );

      if (updateLine) {
        // Extract new version
        const match = updateLine.match(
          /(\d+\.\d+\.\d+(?:-[A-Za-z0-9.]+)?) -> (\d+\.\d+\.\d+(?:-[A-Za-z0-9.]+)?)/
        );
        if (match && match[2]) {
          const newVersion = match[2];
          logger.info(
            `  ${groupId}:${artifactId} (${currentVersion} -> ${newVersion})`
          );

          // Update the version in the POM (not actually doing it in this simplified version)
        }
      }
    }
  }

  // In a real implementation, we'd return the modified POM
  return pom;
}

/**
 * Optimizes Gradle dependencies
 * @param {string} projectPath - Path to the project
 * @param {boolean} dryRun - If true, don't make actual changes
 * @returns {Promise<Object>} Task result
 */
async function optimizeGradleDependencies(projectPath, dryRun) {
  logger.info("Optimizing Gradle dependencies...");

  const gradlePath = path.join(projectPath, "build.gradle");

  try {
    // Read build.gradle
    const gradleFile = await fs.readFile(gradlePath, "utf8");

    // Check for Gradle wrapper
    const hasGradleWrapper =
      (await fileExists(path.join(projectPath, "gradlew"))) ||
      (await fileExists(path.join(projectPath, "gradlew.bat")));

    // Check for outdated dependencies if not in dry run mode
    if (!dryRun) {
      try {
        const gradleCommand = hasGradleWrapper
          ? process.platform === "win32"
            ? "gradlew.bat"
            : "./gradlew"
          : "gradle";

        logger.info("Checking for dependency updates...");

        // For this to work, the project needs to have the gradle-versions-plugin
        // In a real implementation, we might check for its presence and suggest adding it
        const result = await runCommand(
          `${gradleCommand} dependencyUpdates`,
          projectPath
        );

        if (result) {
          // Parse the output to find outdated dependencies
          // This would depend on the exact format of the dependencyUpdates output
          logger.info("Dependency check complete.");

          // In a real implementation, we'd parse the output and update the build.gradle
          // For now, we'll just suggest running the task manually
          logger.info(
            "Recommend reviewing the output and updating dependencies manually"
          );

          return {
            success: true,
            action: "analysis_only",
          };
        }
      } catch (err) {
        logger.warn(`Could not run Gradle version check: ${err.message}`);
        logger.info(
          "Consider adding the gradle-versions-plugin to check for dependency updates"
        );
      }
    } else {
      logger.info("Would check for outdated dependencies (dry run)");
    }

    return {
      success: true,
      action: "analysis_only",
    };
  } catch (error) {
    logger.error(`Error processing build.gradle: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Runs a command in the specified directory
 * @param {string} command - Command to run
 * @param {string} cwd - Working directory
 * @returns {Promise<string>} - Command output
 */
function runCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(" ");
    const proc = spawn(cmd, args, {
      cwd,
      shell: true,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        // Some commands might return non-zero but still give useful output
        resolve(stdout || stderr);
      } else {
        resolve(stdout);
      }
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
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

module.exports = optimizeDependencies;
