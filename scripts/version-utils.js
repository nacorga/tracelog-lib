#!/usr/bin/env node

/**
 * Version Utilities
 *
 * Helper functions for version management, validation, and manipulation.
 * Provides utilities for semantic versioning operations.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class VersionUtils {
  constructor(projectRoot = null) {
    this.projectRoot = projectRoot || path.join(__dirname, '..');
    this.packagePath = path.join(this.projectRoot, 'package.json');

    this.log = this.createLogger();
  }

  createLogger() {
    return {
      info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
      success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
      warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
      error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
    };
  }

  /**
   * Get current version from package.json
   */
  getCurrentVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
      return packageJson.version;
    } catch (error) {
      throw new Error(`Failed to read package.json: ${error.message}`);
    }
  }

  /**
   * Validate semantic version format
   */
  isValidVersion(version) {
    const semverRegex =
      /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    return semverRegex.test(version);
  }

  /**
   * Parse version string into components
   */
  parseVersion(version) {
    if (!this.isValidVersion(version)) {
      throw new Error(`Invalid version format: ${version}`);
    }

    const [core, prerelease, build] = version.split(/[-+]/);
    const [major, minor, patch] = core.split('.').map(Number);

    return {
      major,
      minor,
      patch,
      prerelease: prerelease || null,
      build: build || null,
      original: version,
    };
  }

  /**
   * Compare two versions
   * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
   */
  compareVersions(v1, v2) {
    const parsed1 = this.parseVersion(v1);
    const parsed2 = this.parseVersion(v2);

    // Compare major.minor.patch
    for (const part of ['major', 'minor', 'patch']) {
      if (parsed1[part] !== parsed2[part]) {
        return parsed1[part] < parsed2[part] ? -1 : 1;
      }
    }

    // Both versions are equal in major.minor.patch
    // Handle prerelease comparison
    if (parsed1.prerelease && !parsed2.prerelease) return -1;
    if (!parsed1.prerelease && parsed2.prerelease) return 1;
    if (parsed1.prerelease && parsed2.prerelease) {
      return parsed1.prerelease.localeCompare(parsed2.prerelease);
    }

    return 0;
  }

  /**
   * Bump version by type
   */
  bumpVersion(version, bumpType) {
    const parsed = this.parseVersion(version);

    switch (bumpType) {
      case 'major':
        parsed.major++;
        parsed.minor = 0;
        parsed.patch = 0;
        parsed.prerelease = null;
        break;

      case 'minor':
        parsed.minor++;
        parsed.patch = 0;
        parsed.prerelease = null;
        break;

      case 'patch':
        parsed.patch++;
        parsed.prerelease = null;
        break;

      case 'prerelease':
        if (parsed.prerelease) {
          // Increment existing prerelease
          const prereleaseNumber = parsed.prerelease.match(/\d+$/);
          if (prereleaseNumber) {
            const num = parseInt(prereleaseNumber[0]) + 1;
            parsed.prerelease = parsed.prerelease.replace(/\d+$/, num);
          } else {
            parsed.prerelease += '.1';
          }
        } else {
          // Add new prerelease
          parsed.patch++;
          parsed.prerelease = 'alpha.1';
        }
        break;

      default:
        throw new Error(`Invalid bump type: ${bumpType}`);
    }

    // Construct new version string
    let newVersion = `${parsed.major}.${parsed.minor}.${parsed.patch}`;
    if (parsed.prerelease) {
      newVersion += `-${parsed.prerelease}`;
    }
    if (parsed.build) {
      newVersion += `+${parsed.build}`;
    }

    return newVersion;
  }

  /**
   * Get next version suggestions based on conventional commits
   */
  getVersionSuggestions(currentVersion, commits = []) {
    const suggestions = {};

    // Always provide standard bumps
    suggestions.patch = this.bumpVersion(currentVersion, 'patch');
    suggestions.minor = this.bumpVersion(currentVersion, 'minor');
    suggestions.major = this.bumpVersion(currentVersion, 'major');
    suggestions.prerelease = this.bumpVersion(currentVersion, 'prerelease');

    // Analyze commits if provided
    if (commits.length > 0) {
      let hasBreaking = false;
      let hasFeature = false;
      let hasFix = false;

      for (const commit of commits) {
        const lower = commit.toLowerCase();

        if (lower.includes('breaking change') || lower.includes('!:')) {
          hasBreaking = true;
          break;
        }

        if (lower.startsWith('feat:') || lower.startsWith('feat(')) {
          hasFeature = true;
        }

        if (lower.startsWith('fix:') || lower.startsWith('fix(')) {
          hasFix = true;
        }
      }

      // Determine recommended bump
      if (hasBreaking) {
        suggestions.recommended = suggestions.major;
        suggestions.recommendedType = 'major';
        suggestions.reason = 'Breaking changes detected';
      } else if (hasFeature) {
        suggestions.recommended = suggestions.minor;
        suggestions.recommendedType = 'minor';
        suggestions.reason = 'New features detected';
      } else if (hasFix) {
        suggestions.recommended = suggestions.patch;
        suggestions.recommendedType = 'patch';
        suggestions.reason = 'Bug fixes detected';
      } else {
        suggestions.recommended = suggestions.patch;
        suggestions.recommendedType = 'patch';
        suggestions.reason = 'No significant changes, defaulting to patch';
      }
    }

    return suggestions;
  }

  /**
   * Update version in package.json
   */
  updatePackageVersion(newVersion) {
    if (!this.isValidVersion(newVersion)) {
      throw new Error(`Invalid version format: ${newVersion}`);
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
      const oldVersion = packageJson.version;

      packageJson.version = newVersion;
      fs.writeFileSync(this.packagePath, JSON.stringify(packageJson, null, 2) + '\n');

      return { oldVersion, newVersion };
    } catch (error) {
      throw new Error(`Failed to update package.json: ${error.message}`);
    }
  }

  /**
   * Get latest git tag version
   */
  getLatestGitTag() {
    try {
      const tag = execSync('git describe --tags --abbrev=0', {
        encoding: 'utf8',
        cwd: this.projectRoot,
      }).trim();

      // Remove 'v' prefix if present
      return tag.startsWith('v') ? tag.slice(1) : tag;
    } catch (error) {
      return null; // No tags found
    }
  }

  /**
   * Check if version exists as git tag
   */
  versionTagExists(version) {
    try {
      const tags = execSync('git tag -l', {
        encoding: 'utf8',
        cwd: this.projectRoot,
      }).split('\n');

      return tags.includes(`v${version}`) || tags.includes(version);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get commits since version tag
   */
  getCommitsSinceVersion(version) {
    const tag = this.versionTagExists(`v${version}`) ? `v${version}` : version;

    if (!this.versionTagExists(tag)) {
      throw new Error(`Version tag ${tag} does not exist`);
    }

    try {
      const commits = execSync(`git log ${tag}..HEAD --pretty=format:"%s"`, {
        encoding: 'utf8',
        cwd: this.projectRoot,
      });

      return commits.split('\n').filter((line) => line.trim());
    } catch (error) {
      throw new Error(`Failed to get commits since ${tag}: ${error.message}`);
    }
  }

  /**
   * Check if current version is ahead of git tag
   */
  isVersionAheadOfGit() {
    const currentVersion = this.getCurrentVersion();
    const latestTag = this.getLatestGitTag();

    if (!latestTag) {
      return true; // No tags, so current version is ahead
    }

    return this.compareVersions(currentVersion, latestTag) > 0;
  }

  /**
   * Validate version constraints
   */
  validateVersionConstraints(version, options = {}) {
    const errors = [];
    const warnings = [];

    // Basic format validation
    if (!this.isValidVersion(version)) {
      errors.push('Invalid semantic version format');
      return { valid: false, errors, warnings };
    }

    // Check if version already exists as tag
    if (this.versionTagExists(version)) {
      errors.push(`Version ${version} already exists as git tag`);
    }

    // Check version progression
    const currentVersion = this.getCurrentVersion();
    if (this.compareVersions(version, currentVersion) <= 0) {
      errors.push(`New version ${version} must be greater than current version ${currentVersion}`);
    }

    // Check for reasonable version jumps
    const parsed = this.parseVersion(version);
    const currentParsed = this.parseVersion(currentVersion);

    if (parsed.major > currentParsed.major + 1) {
      warnings.push(`Major version jump from ${currentVersion} to ${version} seems large`);
    }

    if (parsed.minor > currentParsed.minor + 10) {
      warnings.push(`Minor version jump from ${currentVersion} to ${version} seems large`);
    }

    // Custom constraints
    if (options.allowPrerelease === false && parsed.prerelease) {
      errors.push('Prerelease versions are not allowed');
    }

    if (options.maxMajor && parsed.major > options.maxMajor) {
      errors.push(`Major version cannot exceed ${options.maxMajor}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Format version display with metadata
   */
  formatVersionInfo(version) {
    const parsed = this.parseVersion(version);
    const isPrerelease = !!parsed.prerelease;
    const latestTag = this.getLatestGitTag();

    let info = `Version: ${version}`;

    if (isPrerelease) {
      info += ' (prerelease)';
    }

    if (latestTag) {
      const comparison = this.compareVersions(version, latestTag);
      if (comparison > 0) {
        info += ` (ahead of ${latestTag})`;
      } else if (comparison === 0) {
        info += ` (same as ${latestTag})`;
      } else {
        info += ` (behind ${latestTag})`;
      }
    }

    return info;
  }
}

// CLI Interface
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];
  const options = {};

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--help':
        showHelp();
        process.exit(0);
        break;
      default:
        if (!args[i].startsWith('--')) {
          options.version = args[i];
        }
        break;
    }
  }

  return { command, options };
}

function showHelp() {
  console.log(`
${colors.bright}Version Utilities${colors.reset}

Usage: node scripts/version-utils.js <command> [options]

Commands:
  current                     Show current version
  latest-tag                  Show latest git tag version
  parse <version>             Parse version into components
  compare <v1> <v2>          Compare two versions
  bump <type>                Bump current version (patch|minor|major|prerelease)
  suggestions                Show version bump suggestions
  validate <version>         Validate version format and constraints
  info <version>             Show detailed version information

Examples:
  node scripts/version-utils.js current
  node scripts/version-utils.js bump minor
  node scripts/version-utils.js compare 1.0.0 1.1.0
  node scripts/version-utils.js validate 2.0.0
  `);
}

// Main execution
async function main() {
  const { command, options } = parseArgs();
  const utils = new VersionUtils();

  try {
    switch (command) {
      case 'current':
        console.log(utils.getCurrentVersion());
        break;

      case 'latest-tag':
        const latestTag = utils.getLatestGitTag();
        console.log(latestTag || 'No tags found');
        break;

      case 'parse':
        if (!options.version) {
          utils.log.error('Version required for parse command');
          process.exit(1);
        }
        console.log(JSON.stringify(utils.parseVersion(options.version), null, 2));
        break;

      case 'compare':
        const [v1, v2] = process.argv.slice(3);
        if (!v1 || !v2) {
          utils.log.error('Two versions required for compare command');
          process.exit(1);
        }
        const result = utils.compareVersions(v1, v2);
        if (result < 0) console.log(`${v1} < ${v2}`);
        else if (result > 0) console.log(`${v1} > ${v2}`);
        else console.log(`${v1} === ${v2}`);
        break;

      case 'bump':
        const bumpType = process.argv[3];
        if (!['patch', 'minor', 'major', 'prerelease'].includes(bumpType)) {
          utils.log.error('Invalid bump type. Use: patch, minor, major, or prerelease');
          process.exit(1);
        }
        const currentVersion = utils.getCurrentVersion();
        const newVersion = utils.bumpVersion(currentVersion, bumpType);
        console.log(newVersion);
        break;

      case 'suggestions':
        const current = utils.getCurrentVersion();
        const suggestions = utils.getVersionSuggestions(current);
        console.log('Version Suggestions:');
        console.log(`  Patch: ${suggestions.patch}`);
        console.log(`  Minor: ${suggestions.minor}`);
        console.log(`  Major: ${suggestions.major}`);
        console.log(`  Prerelease: ${suggestions.prerelease}`);
        if (suggestions.recommended) {
          console.log(`  Recommended: ${suggestions.recommended} (${suggestions.reason})`);
        }
        break;

      case 'validate':
        if (!options.version) {
          utils.log.error('Version required for validate command');
          process.exit(1);
        }
        const validation = utils.validateVersionConstraints(options.version);
        if (validation.valid) {
          utils.log.success('Version is valid');
        } else {
          utils.log.error('Version validation failed:');
          validation.errors.forEach((error) => console.log(`  - ${error}`));
        }
        if (validation.warnings.length > 0) {
          utils.log.warning('Warnings:');
          validation.warnings.forEach((warning) => console.log(`  - ${warning}`));
        }
        process.exit(validation.valid ? 0 : 1);
        break;

      case 'info':
        if (!options.version) {
          utils.log.error('Version required for info command');
          process.exit(1);
        }
        console.log(utils.formatVersionInfo(options.version));
        break;

      default:
        utils.log.error(`Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    utils.log.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { VersionUtils };
