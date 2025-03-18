/**
 * Optimization Reporter utility
 * Generates reports for code optimization tasks
 */
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { formatFilePath, formatSuccess, formatWarning, formatError, formatHeading } = require('./formatters');
const { logger } = require('./logger');

/**
 * Generates a comprehensive optimization report
 * @param {Object} results - Optimization task results
 * @param {string} projectPath - Path to the project
 * @returns {string} - Formatted report
 */
function generateOptimizationReport(results, projectPath) {
  let report = formatHeading('Code Optimization Report');
  
  // Summary section
  report += 'Summary:\n';
  
  // Extract duplicate code results
  const duplicateCodeResult = results['detect-duplicate-code'];
  
  // Duplicate code metrics
  if (duplicateCodeResult && duplicateCodeResult.success && duplicateCodeResult.metrics) {
    const { duplicateBlocks, affectedFiles, potentialLinesReduced } = duplicateCodeResult.metrics;
    
    if (duplicateBlocks > 0) {
      report += `- ${duplicateBlocks} duplicate code blocks found in ${affectedFiles} files\n`;
      report += `  Potential reduction: ${potentialLinesReduced} lines\n`;
      
      // Try to read the detailed duplicate code report
      try {
        const duplicateReportPath = path.join(projectPath, '.aiguardian', 'reports', 'duplicate-code-report.txt');
        if (fs.existsSync(duplicateReportPath)) {
          report += `  Detailed report: ${formatFilePath(duplicateReportPath)}\n`;
        }
      } catch (error) {
        // Ignore errors reading the report
      }
    }
  }
  
  // Dead code metrics
  if (results.deadCode) {
    const { unusedFunctions, unusedVariables, linesRemoved } = results.deadCode.metrics || {};
    report += `- ${unusedFunctions || 0} unused functions and ${unusedVariables || 0} unused variables detected\n`;
    report += `  Potential reduction: ${linesRemoved || 0} lines\n`;
  }
  
  // Complexity metrics
  if (results.complexity) {
    const { complexFunctionsCount, averageComplexity, maxComplexity } = results.complexity.metrics || {};
    report += `- ${complexFunctionsCount || 0} complex functions identified\n`;
    report += `  Average complexity: ${averageComplexity || 0}, Max complexity: ${maxComplexity || 0}\n`;
  }
  
  // Performance metrics
  if (results.performance) {
    const { issuesFound, criticalIssues, estimatedImprovement } = results.performance.metrics || {};
    report += `- ${issuesFound || 0} performance issues found (${criticalIssues || 0} critical)\n`;
    report += `  Estimated performance improvement: ${estimatedImprovement || '0%'}\n`;
  }
  
  report += '\n';
  
  // Detailed sections for each optimization type
  if (duplicateCodeResult && duplicateCodeResult.success && duplicateCodeResult.duplications && duplicateCodeResult.duplications.length > 0) {
    report += formatHeading('Duplicate Code');
    
    duplicateCodeResult.duplications.forEach((duplication, index) => {
      const { instances, similarity, avgLines, potentialLinesReduced } = duplication;
      
      report += `${index + 1}. Duplication across ${instances.length} locations:\n`;
      
      instances.forEach((instance, idx) => {
        const relativePath = path.relative(projectPath, instance.file);
        report += `   - ${relativePath} (lines ${instance.startLine}-${instance.endLine})\n`;
      });
      
      // Add suggestion
      report += '   Suggestion: ';
      if (instances.length >= 3) {
        report += 'Consider extracting this code into a shared utility function.\n';
      } else if (similarity >= 0.9) {
        report += 'Extract this code into a parameterized function to avoid duplication.\n';
      } else {
        report += 'Review these similar code blocks for potential refactoring.\n';
      }
      
      report += '\n';
    });
  }
  
  if (results.deadCode && results.deadCode.unusedCode) {
    report += formatHeading('Unused Code');
    
    const { unusedFunctions, unusedVariables } = results.deadCode.unusedCode;
    
    if (unusedFunctions && unusedFunctions.length > 0) {
      report += 'Unused Functions:\n';
      unusedFunctions.forEach(func => {
        const relativePath = path.relative(projectPath, func.file);
        report += `- ${func.name} in ${formatFilePath(relativePath, projectPath)} (line ${func.line})\n`;
      });
      report += '\n';
    }
    
    if (unusedVariables && unusedVariables.length > 0) {
      report += 'Unused Variables:\n';
      unusedVariables.forEach(variable => {
        const relativePath = path.relative(projectPath, variable.file);
        report += `- ${variable.name} in ${formatFilePath(relativePath, projectPath)} (line ${variable.line})\n`;
      });
      report += '\n';
    }
  }
  
  if (results.complexity && results.complexity.complexFunctions) {
    report += formatHeading('Complex Code');
    
    results.complexity.complexFunctions.forEach((func, index) => {
      const relativePath = path.relative(projectPath, func.file);
      report += `${index + 1}. ${func.name} in ${formatFilePath(relativePath, projectPath)} (line ${func.line})\n`;
      report += `   Complexity: ${func.complexity} (threshold: ${func.threshold})\n`;
      report += `   Suggestion: ${func.suggestion}\n\n`;
    });
  }
  
  if (results.performance && results.performance.issues) {
    report += formatHeading('Performance Issues');
    
    results.performance.issues.forEach((issue, index) => {
      const relativePath = path.relative(projectPath, issue.file);
      const severity = issue.critical ? formatError('Critical') : formatWarning('Warning');
      
      report += `${index + 1}. ${severity} in ${formatFilePath(relativePath, projectPath)} (line ${issue.line})\n`;
      report += `   Issue: ${issue.description}\n`;
      report += `   Impact: ${issue.impact}\n`;
      report += `   Suggestion: ${issue.suggestion}\n\n`;
    });
  }
  
  // Recommendations section
  report += formatHeading('Top Recommendations');
  
  // Collect all recommendations
  const allRecommendations = [];
  
  // Add duplicate code recommendations
  if (duplicateCodeResult && duplicateCodeResult.success && duplicateCodeResult.metrics && duplicateCodeResult.metrics.duplicateBlocks > 0) {
    const { duplicateBlocks, potentialLinesReduced } = duplicateCodeResult.metrics;
    
    // Try to read the detailed duplicate code report
    try {
      const duplicateReportPath = path.join(projectPath, '.aiguardian', 'reports', 'duplicate-code-report.txt');
      if (fs.existsSync(duplicateReportPath)) {
        const reportContent = fs.readFileSync(duplicateReportPath, 'utf8');
        
        // Extract recommendations from the report
        const recommendationsMatch = reportContent.match(/━━━ Recommendations ━━━\n([\s\S]*?)(\n\n|$)/);
        if (recommendationsMatch && recommendationsMatch[1]) {
          allRecommendations.push({
            type: 'duplication',
            impact: potentialLinesReduced || 0,
            description: recommendationsMatch[1].trim()
          });
        } else {
          // Fallback if recommendations section not found
          allRecommendations.push({
            type: 'duplication',
            impact: potentialLinesReduced || 0,
            description: `Found ${duplicateBlocks} duplicate code blocks. Consider refactoring to reduce code duplication.`
          });
        }
      } else {
        // Fallback if report file not found
        allRecommendations.push({
          type: 'duplication',
          impact: potentialLinesReduced || 0,
          description: `Found ${duplicateBlocks} duplicate code blocks. Consider refactoring to reduce code duplication.`
        });
      }
    } catch (error) {
      // Fallback if error reading report
      allRecommendations.push({
        type: 'duplication',
        impact: potentialLinesReduced || 0,
        description: `Found ${duplicateBlocks} duplicate code blocks. Consider refactoring to reduce code duplication.`
      });
    }
  }
  
  // Add dead code recommendations
  if (results.deadCode && results.deadCode.unusedCode) {
    const { unusedFunctions, unusedVariables } = results.deadCode.unusedCode;
    
    if (unusedFunctions && unusedFunctions.length > 0) {
      allRecommendations.push({
        type: 'deadCode',
        impact: unusedFunctions.length * 5, // Estimate 5 lines per function
        description: `Remove ${unusedFunctions.length} unused functions`
      });
    }
    
    if (unusedVariables && unusedVariables.length > 0) {
      allRecommendations.push({
        type: 'deadCode',
        impact: unusedVariables.length,
        description: `Remove ${unusedVariables.length} unused variables`
      });
    }
  }
  
  // Add complexity recommendations
  if (results.complexity && results.complexity.complexFunctions) {
    results.complexity.complexFunctions.forEach(func => {
      allRecommendations.push({
        type: 'complexity',
        impact: func.complexity - func.threshold,
        description: `Simplify ${func.name} (complexity: ${func.complexity})`
      });
    });
  }
  
  // Add performance recommendations
  if (results.performance && results.performance.issues) {
    results.performance.issues.forEach(issue => {
      allRecommendations.push({
        type: 'performance',
        impact: issue.critical ? 100 : 50,
        description: issue.description
      });
    });
  }
  
  // Sort recommendations by impact
  allRecommendations.sort((a, b) => b.impact - a.impact);
  
  // List top recommendations
  const topRecommendations = allRecommendations.slice(0, 5);
  
  if (topRecommendations.length > 0) {
    topRecommendations.forEach((recommendation, index) => {
      report += `${index + 1}. ${recommendation.description}\n`;
    });
  } else {
    report += 'No significant issues found. Your code looks good!\n';
  }
  
  return report;
}

/**
 * Saves an optimization report to a file
 * @param {string} report - Report content
 * @param {string} projectPath - Path to the project
 * @returns {Promise<string>} - Path to the saved report
 */
async function saveOptimizationReport(report, projectPath) {
  try {
    const reportDir = path.join(projectPath, '.aiguardian', 'reports');
    
    // Create reports directory if it doesn't exist
    try {
      await fsPromises.mkdir(reportDir, { recursive: true });
    } catch (error) {
      logger.error(`Error creating reports directory: ${error.message}`);
    }
    
    // Generate timestamp for the report filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `optimization-report-${timestamp}.txt`);
    
    // Write report to file
    await fsPromises.writeFile(reportPath, report, 'utf8');
    
    logger.success(`Optimization report saved to ${reportPath}`);
    return reportPath;
  } catch (error) {
    logger.error(`Error saving optimization report: ${error.message}`);
    return null;
  }
}

module.exports = {
  generateOptimizationReport,
  saveOptimizationReport
};
