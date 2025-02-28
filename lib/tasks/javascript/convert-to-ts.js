const fs = require("fs").promises;
const path = require("path");
const glob = require("glob-promise");
const { spawn } = require("child_process");
const { logger } = require("../../utils/logger");
const { formatSuccess, formatError } = require("../../utils/formatters");
const { readFile, writeFile } = require("../../utils/file-ops");

/**
 * Helps convert a JavaScript project to TypeScript
 * @param {Object} options - Task options
 * @param {string} options.projectPath - Path to the project
 * @param {boolean} options.dryRun - If true, don't make actual changes
 * @returns {Promise<Object>} Task result
 */
async function convertToTypeScript(options) {
  const { projectPath, dryRun } = options;

  try {
    logger.info("Analyzing project for TypeScript conversion...");

    // Check if project already has TypeScript
    const packageJsonPath = path.join(projectPath, "package.json");
    let packageJson;

    try {
      const packageJsonContent = await fs.readFile(packageJsonPath, "utf8");
      packageJson = JSON.parse(packageJsonContent);
    } catch (err) {
      throw new Error("Could not find or parse package.json");
    }

    const hasTSDeps =
      (packageJson.dependencies && packageJson.dependencies.typescript) ||
      (packageJson.devDependencies && packageJson.devDependencies.typescript);

    const hasTSConfig = await fileExists(
      path.join(projectPath, "tsconfig.json")
    );

    if (hasTSDeps && hasTSConfig) {
      logger.info("Project is already set up for TypeScript");
      return {
        success: true,
        action: "none",
        alreadyTypeScript: true,
      };
    }

    // Find all JavaScript files
    const jsFiles = await glob("**/*.js", {
      cwd: projectPath,
      absolute: true,
      ignore: ["node_modules/**", "dist/**", "build/**"],
    });

    if (jsFiles.length === 0) {
      logger.info("No JavaScript files found to convert");
      return {
        success: true,
        action: "none",
        noJsFiles: true,
      };
    }

    // In dry run mode, just report what would be done
    if (dryRun) {
      logger.info(
        `Would convert ${jsFiles.length} JavaScript files to TypeScript`
      );

      if (!hasTSDeps) {
        logger.info("Would add TypeScript to devDependencies");
      }

      if (!hasTSConfig) {
        logger.info("Would create a tsconfig.json file");
      }

      return {
        success: true,
        action: "would_convert",
        jsFilesCount: jsFiles.length,
      };
    }

    // Add TypeScript to package.json if not present
    if (!hasTSDeps) {
      logger.info("Adding TypeScript to devDependencies...");

      if (!packageJson.devDependencies) {
        packageJson.devDependencies = {};
      }

      packageJson.devDependencies.typescript = "^4.9.5";

      // Add ts-node for development
      packageJson.devDependencies["ts-node"] = "^10.9.1";

      // Update package.json
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

      logger.success(formatSuccess("Added TypeScript to devDependencies"));
    }

    // Create tsconfig.json if not present
    if (!hasTSConfig) {
      logger.info("Creating tsconfig.json...");

      const tsConfig = {
        compilerOptions: {
          target: "es2016",
          module: "commonjs",
          esModuleInterop: true,
          forceConsistentCasingInFileNames: true,
          strict: false, // Start with loose mode for easier migration
          skipLibCheck: true,
          outDir: "dist",
        },
        include: ["**/*.ts"],
        exclude: ["node_modules", "dist", "build"],
      };

      await fs.writeFile(
        path.join(projectPath, "tsconfig.json"),
        JSON.stringify(tsConfig, null, 2)
      );

      logger.success(formatSuccess("Created tsconfig.json"));
    }

    // Convert JS files to TS
    logger.info(
      `Converting ${jsFiles.length} JavaScript files to TypeScript...`
    );

    let convertedCount = 0;
    for (const jsFile of jsFiles) {
      const tsFile = jsFile.replace(/\.js$/, ".ts");

      // Read JS content
      const jsContent = await readFile(jsFile);

      // Write TS file
      await writeFile(tsFile, jsContent);

      // Remove JS file or keep both
      await fs.unlink(jsFile);

      convertedCount++;
      logger.debug(`Converted: ${path.relative(projectPath, jsFile)}`);
    }

    logger.success(
      formatSuccess(
        `Successfully converted ${convertedCount} files to TypeScript`
      )
    );

    return {
      success: true,
      action: "converted",
      convertedFiles: convertedCount,
    };
  } catch (error) {
    logger.error(
      formatError(`Error converting to TypeScript: ${error.message}`)
    );
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Checks if a file exists
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} - True if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = convertToTypeScript;
