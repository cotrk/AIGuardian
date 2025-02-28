const fs = require("fs").promises;
const path = require("path");
const { spawn } = require("child_process");
const { logger } = require("../../utils/logger");
const { formatSuccess, formatError } = require("../../utils/formatters");

/**
 * Optimizes Python project dependencies
 * @param {Object} options - Task options
 * @param {string} options.projectPath - Path to the project
 * @param {boolean} options.dryRun - If true, don't make actual changes
 * @returns {Promise<Object>} Task result
 */
async function optimizeRequirements(options) {
  const { projectPath, dryRun } = options;

  try {
    logger.info("Analyzing Python dependencies...");

    // Check for different dependency management files
    const hasRequirementsTxt = await fileExists(
      path.join(projectPath, "requirements.txt")
    );
    const hasPipfile = await fileExists(path.join(projectPath, "Pipfile"));
    const hasPyprojectToml = await fileExists(
      path.join(projectPath, "pyproject.toml")
    );

    if (!hasRequirementsTxt && !hasPipfile && !hasPyprojectToml) {
      logger.warn("No requirements.txt, Pipfile, or pyproject.toml found");
      return {
        success: false,
        error: "No supported dependency files found",
      };
    }

    // Check for virtual environment
    const venvPaths = ["venv", "env", ".venv", ".env"];
    let venvPath = null;

    for (const venv of venvPaths) {
      const venvDir = path.join(projectPath, venv);
      if (await directoryExists(venvDir)) {
        venvPath = venvDir;
        break;
      }
    }

    if (!venvPath) {
      logger.warn("No virtual environment found (venv, env, .venv, .env)");
      logger.info(
        "Consider creating a virtual environment for better dependency management"
      );
    }

    // Handle specific dependency management system
    if (hasRequirementsTxt) {
      return await optimizeRequirementsTxt(projectPath, venvPath, dryRun);
    } else if (hasPipfile) {
      return await optimizePipfile(projectPath, dryRun);
    } else if (hasPyprojectToml) {
      return await optimizePyprojectToml(projectPath, dryRun);
    }

    return {
      success: false,
      error: "Unsupported dependency management system",
    };
  } catch (error) {
    logger.error(
      formatError(`Error optimizing Python dependencies: ${error.message}`)
    );
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Optimizes requirements.txt file
 * @param {string} projectPath - Path to the project
 * @param {string|null} venvPath - Path to virtual environment, if available
 * @param {boolean} dryRun - If true, don't make actual changes
 * @returns {Promise<Object>} Task result
 */
async function optimizeRequirementsTxt(projectPath, venvPath, dryRun) {
  logger.info("Optimizing requirements.txt...");

  const requirementsPath = path.join(projectPath, "requirements.txt");

  try {
    // Read requirements.txt
    const requirements = await fs.readFile(requirementsPath, "utf8");
    const lines = requirements.split("\n").map((line) => line.trim());

    // Filter out comments and empty lines
    const deps = lines.filter((line) => line && !line.startsWith("#"));

    if (deps.length === 0) {
      logger.info("No dependencies found in requirements.txt");
      return {
        success: true,
        action: "none",
        dependenciesUpdated: 0,
      };
    }

    logger.info(`Found ${deps.length} dependencies in requirements.txt`);

    // Check for outdated packages if a virtual environment exists
    if (venvPath && !dryRun) {
      try {
        // Determine python/pip executable
        const pythonExe =
          process.platform === "win32"
            ? path.join(venvPath, "Scripts", "python.exe")
            : path.join(venvPath, "bin", "python");

        // Check if pip-tools is installed
        let hasPipTools = false;
        try {
          await runCommand(`${pythonExe} -m pip show pip-tools`, projectPath);
          hasPipTools = true;
        } catch (err) {
          // pip-tools not installed
        }

        if (hasPipTools) {
          // Use pip-tools to upgrade dependencies
          logger.info("Using pip-tools to check for dependency updates...");

          // Create a temporary requirements file
          const tempFile = path.join(projectPath, "requirements.tmp.txt");
          await fs.writeFile(tempFile, requirements);

          // Run pip-compile with upgrade flag
          await runCommand(
            `${pythonExe} -m piptools compile --upgrade --output-file requirements.new.txt requirements.tmp.txt`,
            projectPath
          );

          // Read the new requirements
          const newRequirements = await fs.readFile(
            path.join(projectPath, "requirements.new.txt"),
            "utf8"
          );

          // Cleanup temporary files
          await fs.unlink(path.join(projectPath, "requirements.tmp.txt"));

          // Compare requirements
          if (newRequirements !== requirements) {
            if (!dryRun) {
              // Replace the original requirements.txt
              await fs.writeFile(requirementsPath, newRequirements);
              logger.success(
                formatSuccess(
                  "Updated requirements.txt with latest dependencies"
                )
              );
            } else {
              logger.info(
                "Would update requirements.txt with latest dependencies (dry run)"
              );
            }

            return {
              success: true,
              action: dryRun ? "would_update" : "updated",
              dependenciesUpdated: deps.length,
            };
          } else {
            logger.info("All dependencies are up to date");

            // Clean up the new requirements file
            await fs.unlink(path.join(projectPath, "requirements.new.txt"));
          }
        } else {
          // Use pip to check for outdated packages
          logger.info("Checking for outdated packages...");
          const result = await runCommand(
            `${pythonExe} -m pip list --outdated --format=json`,
            projectPath
          );

          if (result) {
            try {
              const outdated = JSON.parse(result);

              if (outdated.length > 0) {
                logger.info(`Found ${outdated.length} outdated packages:`);

                for (const pkg of outdated) {
                  logger.info(
                    `  ${pkg.name}: ${pkg.version} -> ${pkg.latest_version}`
                  );
                }

                logger.info(
                  "Consider installing pip-tools for easier dependency management"
                );
                logger.info("Run: pip install pip-tools");
              } else {
                logger.info("All dependencies are up to date");
              }
            } catch (err) {
              logger.warn(`Could not parse pip output: ${err.message}`);
            }
          }
        }
      } catch (err) {
        logger.warn(`Could not check for outdated packages: ${err.message}`);
      }
    } else if (dryRun) {
      logger.info("Would check for outdated packages (dry run)");
    } else {
      logger.info("No virtual environment found, skipping dependency checks");
      logger.info(
        "Consider creating a virtual environment for better dependency management"
      );
    }

    return {
      success: true,
      action: "analysis_only",
      dependenciesAnalyzed: deps.length,
    };
  } catch (error) {
    logger.error(`Error processing requirements.txt: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Optimizes Pipfile
 * @param {string} projectPath - Path to the project
 * @param {boolean} dryRun - If true, don't make actual changes
 * @returns {Promise<Object>} Task result
 */
async function optimizePipfile(projectPath, dryRun) {
  logger.info("Optimizing Pipfile...");

  try {
    // Check if pipenv is installed
    try {
      await runCommand("pipenv --version", projectPath);
    } catch (err) {
      logger.warn("pipenv is not installed, cannot optimize Pipfile");
      logger.info("Install pipenv with: pip install pipenv");
      return {
        success: false,
        error: "pipenv not installed",
      };
    }

    if (!dryRun) {
      // Update dependencies
      logger.info("Checking for outdated packages...");

      try {
        const result = await runCommand(
          "pipenv update --outdated",
          projectPath
        );

        if (result && result.includes("All packages are up to date!")) {
          logger.info("All dependencies are up to date");
        } else {
          logger.info("Found outdated packages, updating...");

          // Update all packages
          await runCommand("pipenv update", projectPath);

          logger.success(formatSuccess("Updated all packages in Pipfile.lock"));
        }
      } catch (err) {
        logger.warn(`Could not update packages: ${err.message}`);
      }
    } else {
      logger.info("Would update all packages in Pipfile (dry run)");
    }

    return {
      success: true,
      action: dryRun ? "would_update" : "updated",
    };
  } catch (error) {
    logger.error(`Error processing Pipfile: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Optimizes pyproject.toml file
 * @param {string} projectPath - Path to the project
 * @param {boolean} dryRun - If true, don't make actual changes
 * @returns {Promise<Object>} Task result
 */
async function optimizePyprojectToml(projectPath, dryRun) {
  logger.info("Optimizing pyproject.toml...");

  try {
    // Check if poetry is installed
    let hasPoetry = false;
    try {
      await runCommand("poetry --version", projectPath);
      hasPoetry = true;
    } catch (err) {
      logger.warn(
        "poetry is not installed, cannot fully optimize pyproject.toml"
      );
      logger.info("Install poetry with: pip install poetry");
    }

    if (hasPoetry && !dryRun) {
      // Update dependencies
      logger.info("Checking for outdated packages...");

      try {
        const result = await runCommand("poetry show --outdated", projectPath);

        if (result && result.trim()) {
          logger.info("Found outdated packages, updating...");

          // Update all packages
          await runCommand("poetry update", projectPath);

          logger.success(
            formatSuccess("Updated all packages in pyproject.toml")
          );
        } else {
          logger.info("All dependencies are up to date");
        }
      } catch (err) {
        logger.warn(`Could not update packages: ${err.message}`);
      }
    } else if (dryRun) {
      logger.info("Would update all packages in pyproject.toml (dry run)");
    }

    return {
      success: true,
      action: dryRun ? "would_update" : "updated",
    };
  } catch (error) {
    logger.error(`Error processing pyproject.toml: ${error.message}`);
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
        reject(new Error(stderr || `Command exited with code ${code}`));
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

module.exports = optimizeRequirements;
