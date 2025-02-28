# Changelog

All notable changes to AIGuardian will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-02-28

### Added
- Enhanced task registry with improved project type handling
- Added `clearTasks()` method for testing purposes
- Added comprehensive test suite for core functionality
- Added new command line options:
  - `-y, --yes`: Skip confirmation prompts
  - `-t, --task`: Run specific task (can be used multiple times)
  - `-a, --all`: Run all available tasks

### Changed
- Updated task registry implementation for better project type handling
- Improved task retrieval by project type
- Enhanced error handling in file operations
- Updated documentation with comprehensive information about features and usage
- Improved cross-platform compatibility across Windows, Linux, and macOS

### Removed
- Removed unused dependencies (lodash, moment, axios, express)
- Simplified dependency structure to use only native Node.js modules where possible
- Kept only 'chalk' as an external dependency

### Fixed
- Fixed method naming inconsistencies in core modules
- Resolved task registration logic issues
- Improved error handling in file operations

## [1.0.0] - 2025-01-15

### Added
- Initial release of AIGuardian
- Project type detection (JavaScript/TypeScript, Python, Java)
- Task-based architecture for code optimization
- Backup creation before making changes
- Command-line interface with basic options
- Support for common optimization tasks across different project types
