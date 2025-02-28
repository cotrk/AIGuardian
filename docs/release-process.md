# AIGuardian Release Process

This document outlines the process for creating and publishing new releases of AIGuardian.

## Release Checklist

### 1. Prepare the Release

1. Ensure all tests pass:
   ```
   npm test
   ```

2. Update version number in:
   - `package.json`
   - `README.md`
   - Documentation files in the `docs` folder

3. Update the `CHANGELOG.md` with details of changes since the last release

### 2. Create the Release Package

1. Run the release script:
   ```
   npm run release
   ```

   This will:
   - Create a zip file in the `releases` directory
   - Generate release notes based on the changelog

### 3. Create a Git Tag

1. Create a tag for the release:
   ```
   git tag -a v1.1.0 -m "Release v1.1.0"
   ```

2. Push the tag to the remote repository:
   ```
   git push origin --tags
   ```

### 4. Create a GitHub Release

1. Go to the GitHub repository
2. Click on "Releases"
3. Click "Draft a new release"
4. Select the tag you just created
5. Fill in the release title (e.g., "AIGuardian v1.1.0")
6. Copy the content from the generated release notes
7. Attach the zip file from the `releases` directory
8. Publish the release

### 5. Publish to npm (if applicable)

1. Ensure you're logged in to npm:
   ```
   npm login
   ```

2. Publish the package:
   ```
   npm publish
   ```

## Versioning Guidelines

AIGuardian follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version when making incompatible API changes
- **MINOR** version when adding functionality in a backwards compatible manner
- **PATCH** version when making backwards compatible bug fixes

## Hotfix Process

For critical bugs that need immediate fixing:

1. Create a hotfix branch from the release tag
2. Fix the issue
3. Increment the PATCH version
4. Follow the standard release process
