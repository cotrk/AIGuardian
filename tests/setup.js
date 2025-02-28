/**
 * Jest setup file for AIGuardian tests
 */

// Set test environment variable
process.env.NODE_ENV = "test";

// Increase timeout for integration tests
jest.setTimeout(10000);

// Mock console methods to prevent cluttering test output
global.console = {
  ...console,
  // Keep error for debugging
  error: jest.fn(),
  // Comment out the line below to see log output during tests
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};
