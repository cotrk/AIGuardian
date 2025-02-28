/**
 * Unit tests for the logger utility
 */
const { logger, LogLevel } = require('../../../lib/utils/logger');

describe('Logger Utility', () => {
  // Save original console methods
  const originalConsole = { ...console };
  
  // Mock console methods before each test
  beforeEach(() => {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });
  
  // Restore console methods after each test
  afterEach(() => {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });
  
  test('should have the correct log levels defined', () => {
    expect(LogLevel.DEBUG).toBe(0);
    expect(LogLevel.INFO).toBe(1);
    expect(LogLevel.SUCCESS).toBe(2);
    expect(LogLevel.WARN).toBe(3);
    expect(LogLevel.ERROR).toBe(4);
  });
  
  test('should log debug messages when level is DEBUG', () => {
    // Set logger level to DEBUG
    logger.level = LogLevel.DEBUG;
    
    // Call debug method
    logger.debug('Test debug message');
    
    // Verify console.log was called
    expect(console.log).toHaveBeenCalled();
  });
  
  test('should not log debug messages when level is higher than DEBUG', () => {
    // Set logger level to INFO
    logger.level = LogLevel.INFO;
    
    // Call debug method
    logger.debug('Test debug message');
    
    // Verify console.log was not called
    expect(console.log).not.toHaveBeenCalled();
  });
  
  test('should log info messages when level is INFO or lower', () => {
    // Set logger level to INFO
    logger.level = LogLevel.INFO;
    
    // Call info method
    logger.info('Test info message');
    
    // Verify console.info was called
    expect(console.info).toHaveBeenCalled();
  });
  
  test('should log success messages when level is SUCCESS or lower', () => {
    // Set logger level to SUCCESS
    logger.level = LogLevel.SUCCESS;
    
    // Call success method
    logger.success('Test success message');
    
    // Verify console.log was called
    expect(console.log).toHaveBeenCalled();
  });
  
  test('should log warning messages when level is WARN or lower', () => {
    // Set logger level to WARN
    logger.level = LogLevel.WARN;
    
    // Call warn method
    logger.warn('Test warning message');
    
    // Verify console.warn was called
    expect(console.warn).toHaveBeenCalled();
  });
  
  test('should log error messages when level is ERROR or lower', () => {
    // Set logger level to ERROR
    logger.level = LogLevel.ERROR;
    
    // Call error method
    logger.error('Test error message');
    
    // Verify console.error was called
    expect(console.error).toHaveBeenCalled();
  });
  
  test('should not log any messages when silent is true', () => {
    // Set logger to silent
    logger.silent = true;
    
    // Call all log methods
    logger.debug('Test debug message');
    logger.info('Test info message');
    logger.success('Test success message');
    logger.warn('Test warning message');
    logger.error('Test error message');
    
    // Verify no console methods were called
    expect(console.log).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
    
    // Reset silent flag
    logger.silent = false;
  });
});
