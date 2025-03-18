# Changelog

All notable changes to AIGuardian will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-03-18

### Added - Duplicate Code Detection Enhancements

- Enhanced duplicate code detection with improved metrics calculation
- Added detailed refactoring suggestions in duplicate code reports
- Added severity assessment for duplicate code issues (LOW, MODERATE, HIGH)
- Created comprehensive test suite for duplicate code detection

### Changed - Improved Algorithms

- Improved duplicate code detection algorithm for more accurate results
- Enhanced reporting format for duplicate code findings
- Updated documentation with detailed information about duplicate code detection
- Refined metrics calculation to include potential lines reduced after refactoring

### Fixed - Bug Fixes

- Fixed issue with duplicate code detection metrics not properly calculating affected files
- Resolved report formatting inconsistencies in optimization reporter
- Fixed variable scope issues in duplicate code detector

## [1.1.0] - 2025-02-28

### Added - Core Functionality

- Enhanced task registry with improved project type handling
- Added `clearTasks()` method for testing purposes
- Added comprehensive test suite for core functionality
- Added new command line options:
  - `-y, --yes`: Skip confirmation prompts
  - `-t, --task`: Run specific task (can be used multiple times)
  - `-a, --all`: Run all available tasks

### Changed - Project Structure

- Updated task registry implementation for better project type handling
- Improved task retrieval by project type
- Enhanced error handling in file operations
- Updated documentation with comprehensive information about features and usage
- Improved cross-platform compatibility across Windows, Linux, and macOS

### Removed - Dependencies

- Removed unused dependencies (lodash, moment, axios, express)
- Simplified dependency structure to use only native Node.js modules where possible
- Kept only 'chalk' as an external dependency

### Fixed - Core Bugs

- Fixed method naming inconsistencies in core modules
- Resolved task registration logic issues
- Improved error handling in file operations

## [1.0.0] - 2025-01-15

### Added - Initial Release

- Initial release of AIGuardian
- Project type detection (JavaScript/TypeScript, Python, Java)
- Task-based architecture for code optimization
- Backup creation before making changes
- Command-line interface with basic options
- Support for common optimization tasks across different project types
