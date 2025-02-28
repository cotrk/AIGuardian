/**
 * Jest configuration for AIGuardian
 */
module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Collect coverage from these directories
  collectCoverageFrom: [
    'lib/**/*.js',
    '!**/node_modules/**',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Test match patterns
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/integration/**/*.test.js',
  ],
  
  // Setup files
  setupFilesAfterEnv: ['./tests/setup.js'],
  
  // Verbose output
  verbose: true,
};
