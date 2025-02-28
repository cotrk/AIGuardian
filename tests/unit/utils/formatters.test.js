/**
 * Unit tests for the formatters utility
 */
const path = require('path');
const chalk = require('chalk');
const figures = require('figures');
const formatters = require('../../../lib/utils/formatters');

// Disable chalk colors for testing
chalk.level = 0;

describe('Formatters Utility', () => {
  describe('formatSuccess', () => {
    test('should format success message with tick symbol', () => {
      const message = 'Test success message';
      const formatted = formatters.formatSuccess(message);
      expect(formatted).toContain(figures.tick);
      expect(formatted).toContain(message);
    });
  });
  
  describe('formatError', () => {
    test('should format error message with cross symbol', () => {
      const message = 'Test error message';
      const formatted = formatters.formatError(message);
      expect(formatted).toContain(figures.cross);
      expect(formatted).toContain(message);
    });
  });
  
  describe('formatWarning', () => {
    test('should format warning message with warning symbol', () => {
      const message = 'Test warning message';
      const formatted = formatters.formatWarning(message);
      expect(formatted).toContain(figures.warning);
      expect(formatted).toContain(message);
    });
  });
  
  describe('formatInfo', () => {
    test('should format info message with info symbol', () => {
      const message = 'Test info message';
      const formatted = formatters.formatInfo(message);
      expect(formatted).toContain(figures.info);
      expect(formatted).toContain(message);
    });
  });
  
  describe('formatHeading', () => {
    test('should format heading with appropriate styling', () => {
      const heading = 'Test Heading';
      const formatted = formatters.formatHeading(heading);
      expect(formatted).toContain(heading);
    });
  });
  
  describe('formatFilePath', () => {
    test('should format file path relative to project path', () => {
      const filePath = path.join('/project', 'src', 'file.js');
      const projectPath = '/project';
      const formatted = formatters.formatFilePath(filePath, projectPath);
      expect(formatted).toContain('src/file.js');
    });
    
    test('should handle file path that is the same as project path', () => {
      const filePath = '/project';
      const projectPath = '/project';
      const formatted = formatters.formatFilePath(filePath, projectPath);
      expect(formatted).toContain('.');
    });
  });
  
  describe('formatTaskName', () => {
    test('should format task name with proper capitalization and spacing', () => {
      const taskName = 'cleanupPycache';
      const formatted = formatters.formatTaskName(taskName);
      expect(formatted).toBe('Cleanup Pycache');
    });
    
    test('should handle task names with hyphens', () => {
      const taskName = 'convert-to-ts';
      const formatted = formatters.formatTaskName(taskName);
      expect(formatted).toBe('Convert To Ts');
    });
  });
  
  describe('formatDuration', () => {
    test('should format duration in milliseconds', () => {
      const duration = 1500; // 1.5 seconds
      const formatted = formatters.formatDuration(duration);
      expect(formatted).toContain('1.5');
      expect(formatted).toContain('s');
    });
    
    test('should format small durations in milliseconds', () => {
      const duration = 50; // 50 milliseconds
      const formatted = formatters.formatDuration(duration);
      expect(formatted).toContain('50');
      expect(formatted).toContain('ms');
    });
  });
});
