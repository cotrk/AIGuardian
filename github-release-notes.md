# AIGuardian v1.2.0 Release Notes

We're excited to announce the release of AIGuardian v1.2.0, featuring significant improvements to the duplicate code detection capabilities.

## What's New in v1.2.0

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

## Installation

```bash
npm install -g aiguardian
```

## Usage

AIGuardian can be used to optimize your codebase with the following commands:

```bash
# Run all optimization tasks
aiguardian-optimize

# Run specific optimization tasks
aiguardian-optimize -t duplicate-code
```

For more information, please refer to the [documentation](https://github.com/cotrk/AIGuardian/tree/main/docs).
