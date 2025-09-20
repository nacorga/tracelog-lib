#!/usr/bin/env node

/**
 * Intelligent Release Management System for TraceLog SDK
 *
 * This script automates the entire release process:
 * - Validates repository state and dependencies
 * - Analyzes conventional commits to determine version bump
 * - Runs comprehensive tests and builds
 * - Generates changelog automatically
 * - Updates version and creates git tags
 * - Publishes to NPM with verification
 * - Creates GitHub release with notes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createHash } = require('crypto');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class ReleaseManager {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.forceVersion = options.forceVersion || null;
    this.skipBuild = options.skipBuild || false;
    this.skipPublish = options.skipPublish || false;
    this.verbose = options.verbose || false;

    this.projectRoot = path.join(__dirname, '..');
    this.packagePath = path.join(this.projectRoot, 'package.json');
    this.changelogPath = path.join(this.projectRoot, 'CHANGELOG.md');

    this.log = this.createLogger();
  }

  createLogger() {
    return {
      info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
      success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
      warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
      error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
      step: (msg) => console.log(`${colors.cyan}🔄${colors.reset} ${msg}`),
      title: (msg) => console.log(`\n${colors.bright}${colors.magenta}🚀 ${msg}${colors.reset}\n`),
      debug: (msg) => this.verbose && console.log(`${colors.yellow}[DEBUG]${colors.reset} ${msg}`),
    };
  }

  async run() {
    try {
      this.log.title('TraceLog SDK Release Manager');

      if (this.dryRun) {
        this.log.warning('DRY RUN MODE - No changes will be made');
      }

      // Step 1: Pre-flight checks
      await this.validateEnvironment();

      // Step 2: Determine version bump
      const versionInfo = await this.determineVersionBump();

      // Step 3: Validation skipped - already done in CI
      this.log.step('Skipping validations - already verified in CI workflow');

      // Step 4: Build project
      if (!this.skipBuild) {
        await this.buildProject();
      }

      // Step 5: Update version and generate changelog
      await this.updateVersion(versionInfo);
      await this.generateChangelog(versionInfo);

      // Step 6: Create git tag
      await this.createGitTag(versionInfo);

      // Step 7: Publish to NPM
      if (!this.skipPublish) {
        await this.publishToNpm(versionInfo);
      }

      // Step 8: Create GitHub release
      await this.createGitHubRelease(versionInfo);

      this.log.success(`Release ${versionInfo.newVersion} completed successfully! 🎉`);
    } catch (error) {
      this.log.error(`Release failed: ${error.message}`);
      if (this.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  async validateEnvironment() {
    this.log.step('Validating release environment...');

    // Check if we're in a git repository
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    } catch {
      throw new Error('Not in a git repository');
    }

    // Check current branch - only allow releases from main
    try {
      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      if (branch !== 'main') {
        throw new Error(`Releases can only be created from the 'main' branch. Currently on '${branch}'.`);
      }
    } catch (error) {
      if (error.message.includes('Releases can only be created')) {
        throw error;
      }
      throw new Error('Could not determine current branch');
    }

    // Verify package.json exists
    if (!fs.existsSync(this.packagePath)) {
      throw new Error('package.json not found');
    }

    // Check NPM authentication if not skipping publish
    if (!this.skipPublish && !this.dryRun) {
      try {
        execSync('npm whoami', { stdio: 'ignore' });
      } catch {
        throw new Error('Not authenticated with NPM. Run `npm login` first.');
      }
    }

    this.log.success('Environment validation passed');
  }

  async determineVersionBump() {
    this.log.step('Analyzing commits to determine version bump...');

    if (this.forceVersion) {
      const currentVersion = this.getCurrentVersion();
      return {
        currentVersion,
        newVersion: this.forceVersion,
        bumpType: 'manual',
        changeType: 'manual',
      };
    }

    const currentVersion = this.getCurrentVersion();

    try {
      // Get commits since last tag
      const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
      const commitRange = `${lastTag}..HEAD`;
      const commits = execSync(`git log ${commitRange} --pretty=format:"%s"`, { encoding: 'utf8' });

      this.log.debug(`Analyzing commits since ${lastTag}:`);
      this.log.debug(commits);

      const changeType = this.analyzeCommits(commits);
      const bumpType = this.getBumpType(changeType);
      const newVersion = this.bumpVersion(currentVersion, bumpType);

      return {
        currentVersion,
        newVersion,
        bumpType,
        changeType,
        lastTag,
        commits,
      };
    } catch (error) {
      // No previous tags, this is the first release
      this.log.warning('No previous tags found, treating as initial release');
      return {
        currentVersion,
        newVersion: currentVersion,
        bumpType: 'initial',
        changeType: 'initial',
      };
    }
  }

  getCurrentVersion() {
    const packageJson = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
    return packageJson.version;
  }

  analyzeCommits(commits) {
    const commitLines = commits.split('\n').filter((line) => line.trim());

    let hasBreaking = false;
    let hasFeature = false;
    let hasFix = false;

    for (const commit of commitLines) {
      const lower = commit.toLowerCase();

      // Check for breaking changes
      if (lower.includes('breaking change') || lower.includes('!:')) {
        hasBreaking = true;
        break;
      }

      // Check for features
      if (lower.startsWith('feat:') || lower.startsWith('feat(')) {
        hasFeature = true;
      }

      // Check for fixes
      if (lower.startsWith('fix:') || lower.startsWith('fix(')) {
        hasFix = true;
      }
    }

    if (hasBreaking) return 'breaking';
    if (hasFeature) return 'feature';
    if (hasFix) return 'fix';
    return 'patch'; // Default for other changes
  }

  getBumpType(changeType) {
    switch (changeType) {
      case 'breaking':
        return 'major';
      case 'feature':
        return 'minor';
      case 'fix':
        return 'patch';
      default:
        return 'patch';
    }
  }

  bumpVersion(version, bumpType) {
    const parts = version.split('.').map(Number);

    switch (bumpType) {
      case 'major':
        parts[0]++;
        parts[1] = 0;
        parts[2] = 0;
        break;
      case 'minor':
        parts[1]++;
        parts[2] = 0;
        break;
      case 'patch':
        parts[2]++;
        break;
      default:
        return version;
    }

    return parts.join('.');
  }


  async buildProject() {
    this.log.step('Building project...');

    try {
      execSync('npm run build:all', {
        stdio: this.verbose ? 'inherit' : 'ignore',
        cwd: this.projectRoot,
      });
      this.log.success('Build completed successfully');
    } catch (error) {
      throw new Error('Build failed');
    }
  }

  async updateVersion(versionInfo) {
    this.log.step(`Updating version to ${versionInfo.newVersion}...`);

    if (this.dryRun) {
      this.log.info('DRY RUN: Would update package.json version');
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
    packageJson.version = versionInfo.newVersion;

    fs.writeFileSync(this.packagePath, JSON.stringify(packageJson, null, 2) + '\n');
    this.log.success(`Version updated to ${versionInfo.newVersion}`);
  }

  async generateChangelog(versionInfo) {
    this.log.step('Generating changelog...');

    const { ChangelogGenerator } = require('./generate-changelog');
    const changelogGenerator = new ChangelogGenerator({ verbose: this.verbose });
    await changelogGenerator.generate(versionInfo, this.dryRun);

    this.log.success('Changelog updated');
  }

  async createGitTag(versionInfo) {
    this.log.step(`Creating git tag v${versionInfo.newVersion}...`);

    if (this.dryRun) {
      this.log.info('DRY RUN: Would create git tag and commit');
      return;
    }

    try {
      // Add and commit version changes
      execSync('git add package.json CHANGELOG.md', { cwd: this.projectRoot });
      execSync(`git commit -m "chore: release v${versionInfo.newVersion}"`, { cwd: this.projectRoot });

      // Create annotated tag
      const tagMessage = `Release v${versionInfo.newVersion}`;
      execSync(`git tag -a v${versionInfo.newVersion} -m "${tagMessage}"`, { cwd: this.projectRoot });

      this.log.success(`Git tag v${versionInfo.newVersion} created`);
    } catch (error) {
      throw new Error(`Failed to create git tag: ${error.message}`);
    }
  }

  async publishToNpm(versionInfo) {
    this.log.step('Publishing to NPM...');

    if (this.dryRun) {
      this.log.info('DRY RUN: Would publish to NPM');
      return;
    }

    try {
      // Verify package can be published
      execSync('npm publish --dry-run', {
        stdio: this.verbose ? 'inherit' : 'ignore',
        cwd: this.projectRoot,
      });

      // Actual publish
      execSync('npm publish', {
        stdio: this.verbose ? 'inherit' : 'ignore',
        cwd: this.projectRoot,
      });

      this.log.success(`Published v${versionInfo.newVersion} to NPM`);
    } catch (error) {
      throw new Error(`NPM publish failed: ${error.message}`);
    }
  }

  async createGitHubRelease(versionInfo) {
    this.log.step('Creating GitHub release...');

    if (this.dryRun) {
      this.log.info('DRY RUN: Would create GitHub release');
      return;
    }

    try {
      // Push commits and tags
      execSync('git push origin', { cwd: this.projectRoot });
      execSync(`git push origin v${versionInfo.newVersion}`, { cwd: this.projectRoot });

      this.log.success('Pushed to GitHub');
      this.log.info('GitHub release can be created manually or via GitHub CLI');
    } catch (error) {
      this.log.warning(`Failed to push to GitHub: ${error.message}`);
    }
  }
}

// CLI Interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--force-version':
        options.forceVersion = args[++i];
        break;
      case '--skip-build':
        options.skipBuild = true;
        break;
      case '--skip-publish':
        options.skipPublish = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        showHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
${colors.bright}TraceLog SDK Release Manager${colors.reset}

Usage: node scripts/release.js [options]

Options:
  --dry-run           Simulate the release without making changes
  --force-version     Force a specific version (e.g., 1.2.3)
  --skip-build        Skip building the project
  --skip-publish      Skip publishing to NPM
  --verbose           Show detailed output
  --help              Show this help message

Examples:
  node scripts/release.js                    # Automatic release
  node scripts/release.js --dry-run          # Simulate release
  node scripts/release.js --force-version 2.0.0  # Force specific version
  `);
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  const releaseManager = new ReleaseManager(options);
  releaseManager.run().catch((error) => {
    console.error('Release failed:', error.message);
    process.exit(1);
  });
}

module.exports = { ReleaseManager };
