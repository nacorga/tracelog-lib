#!/usr/bin/env node

/**
 * Intelligent Changelog Generator
 *
 * Automatically generates CHANGELOG.md based on conventional commits
 * and git history. Provides structured release notes with categorized
 * changes and contributor information.
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

class ChangelogGenerator {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.projectRoot = path.join(__dirname, '..');
    this.changelogPath = path.join(this.projectRoot, 'CHANGELOG.md');
    this.packagePath = path.join(this.projectRoot, 'package.json');

    this.log = this.createLogger();
  }

  createLogger() {
    return {
      info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
      success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
      warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
      error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
      step: (msg) => console.log(`${colors.cyan}📝${colors.reset} ${msg}`),
      debug: (msg) => this.verbose && console.log(`${colors.yellow}[DEBUG]${colors.reset} ${msg}`),
    };
  }

  async generate(versionInfo, dryRun = false) {
    this.log.step('Generating changelog...');

    const releaseNotes = await this.generateReleaseNotes(versionInfo);
    const changelog = await this.updateChangelog(releaseNotes, dryRun);

    if (!dryRun) {
      this.log.success('Changelog updated successfully');
    } else {
      this.log.info('DRY RUN: Changelog would be updated');
      console.log('\n' + '='.repeat(60));
      console.log('CHANGELOG PREVIEW:');
      console.log('='.repeat(60));
      console.log(releaseNotes);
      console.log('='.repeat(60));
    }

    return changelog;
  }

  async generateReleaseNotes(versionInfo) {
    const { newVersion, lastTag, currentVersion } = versionInfo;
    const date = new Date().toISOString().split('T')[0];

    // Get commits since last release
    let commits = [];
    if (lastTag) {
      const commitRange = `${lastTag}..HEAD`;
      const commitOutput = execSync(`git log ${commitRange} --pretty=format:"%H|%s|%an|%ae|%ad" --date=short`, {
        encoding: 'utf8',
        cwd: this.projectRoot,
      });

      commits = commitOutput
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          const [hash, subject, author, email, date] = line.split('|');
          return { hash, subject, author, email, date };
        });
    } else {
      // First release - get all commits
      const commitOutput = execSync('git log --pretty=format:"%H|%s|%an|%ae|%ad" --date=short', {
        encoding: 'utf8',
        cwd: this.projectRoot,
      });

      commits = commitOutput
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          const [hash, subject, author, email, date] = line.split('|');
          return { hash, subject, author, email, date };
        });
    }

    // Categorize commits
    const categorizedCommits = this.categorizeCommits(commits);

    // Generate release notes
    let releaseNotes = `## [${newVersion}] - ${date}\n\n`;

    // Add breaking changes first
    if (categorizedCommits.breaking.length > 0) {
      releaseNotes += '### ⚠️ BREAKING CHANGES\n\n';
      for (const commit of categorizedCommits.breaking) {
        releaseNotes += `- ${this.formatCommitMessage(commit)}\n`;
      }
      releaseNotes += '\n';
    }

    // Add features
    if (categorizedCommits.features.length > 0) {
      releaseNotes += '### ✨ Features\n\n';
      for (const commit of categorizedCommits.features) {
        releaseNotes += `- ${this.formatCommitMessage(commit)}\n`;
      }
      releaseNotes += '\n';
    }

    // Add bug fixes
    if (categorizedCommits.fixes.length > 0) {
      releaseNotes += '### 🐛 Bug Fixes\n\n';
      for (const commit of categorizedCommits.fixes) {
        releaseNotes += `- ${this.formatCommitMessage(commit)}\n`;
      }
      releaseNotes += '\n';
    }

    // Add improvements
    if (categorizedCommits.improvements.length > 0) {
      releaseNotes += '### 🚀 Improvements\n\n';
      for (const commit of categorizedCommits.improvements) {
        releaseNotes += `- ${this.formatCommitMessage(commit)}\n`;
      }
      releaseNotes += '\n';
    }

    // Add tests
    if (categorizedCommits.tests.length > 0) {
      releaseNotes += '### 🧪 Tests\n\n';
      for (const commit of categorizedCommits.tests) {
        releaseNotes += `- ${this.formatCommitMessage(commit)}\n`;
      }
      releaseNotes += '\n';
    }

    // Add documentation
    if (categorizedCommits.docs.length > 0) {
      releaseNotes += '### 📚 Documentation\n\n';
      for (const commit of categorizedCommits.docs) {
        releaseNotes += `- ${this.formatCommitMessage(commit)}\n`;
      }
      releaseNotes += '\n';
    }

    // Add refactoring
    if (categorizedCommits.refactor.length > 0) {
      releaseNotes += '### ♻️ Refactoring\n\n';
      for (const commit of categorizedCommits.refactor) {
        releaseNotes += `- ${this.formatCommitMessage(commit)}\n`;
      }
      releaseNotes += '\n';
    }

    // Add other changes
    if (categorizedCommits.other.length > 0) {
      releaseNotes += '### 🔧 Other Changes\n\n';
      for (const commit of categorizedCommits.other) {
        releaseNotes += `- ${this.formatCommitMessage(commit)}\n`;
      }
      releaseNotes += '\n';
    }

    // Add contributors section
    const contributors = this.getUniqueContributors(commits);
    if (contributors.length > 0) {
      releaseNotes += '### 👥 Contributors\n\n';
      releaseNotes += 'Thanks to all contributors who made this release possible:\n\n';
      for (const contributor of contributors) {
        releaseNotes += `- ${contributor.author}\n`;
      }
      releaseNotes += '\n';
    }

    // Add metadata
    if (lastTag) {
      const compareUrl = this.getCompareUrl(lastTag, newVersion);
      if (compareUrl) {
        releaseNotes += `**Full Changelog**: ${compareUrl}\n\n`;
      }
    }

    return releaseNotes;
  }

  categorizeCommits(commits) {
    const categories = {
      breaking: [],
      features: [],
      fixes: [],
      improvements: [],
      tests: [],
      docs: [],
      refactor: [],
      other: [],
    };

    for (const commit of commits) {
      const subject = commit.subject.toLowerCase();

      // Check for breaking changes
      if (subject.includes('breaking change') || subject.includes('!:')) {
        categories.breaking.push(commit);
      }
      // Features
      else if (subject.startsWith('feat:') || subject.startsWith('feat(')) {
        categories.features.push(commit);
      }
      // Bug fixes
      else if (subject.startsWith('fix:') || subject.startsWith('fix(')) {
        categories.fixes.push(commit);
      }
      // Performance improvements
      else if (subject.startsWith('perf:') || subject.startsWith('perf(')) {
        categories.improvements.push(commit);
      }
      // Tests
      else if (subject.startsWith('test:') || subject.startsWith('test(')) {
        categories.tests.push(commit);
      }
      // Documentation
      else if (subject.startsWith('docs:') || subject.startsWith('docs(')) {
        categories.docs.push(commit);
      }
      // Refactoring
      else if (subject.startsWith('refactor:') || subject.startsWith('refactor(')) {
        categories.refactor.push(commit);
      }
      // Style changes
      else if (subject.startsWith('style:') || subject.startsWith('style(')) {
        categories.other.push(commit);
      }
      // Chores
      else if (subject.startsWith('chore:') || subject.startsWith('chore(')) {
        categories.other.push(commit);
      }
      // CI changes
      else if (subject.startsWith('ci:') || subject.startsWith('ci(')) {
        categories.other.push(commit);
      }
      // Build changes
      else if (subject.startsWith('build:') || subject.startsWith('build(')) {
        categories.other.push(commit);
      }
      // Everything else
      else {
        categories.other.push(commit);
      }
    }

    return categories;
  }

  formatCommitMessage(commit) {
    // Remove conventional commit prefix and clean up the message
    let message = commit.subject;

    // Remove type prefix (feat:, fix:, etc.)
    message = message.replace(/^(feat|fix|docs|style|refactor|perf|test|chore|ci|build)(\(.+?\))?:\s*/, '');

    // Capitalize first letter
    message = message.charAt(0).toUpperCase() + message.slice(1);

    // Add commit hash for reference
    const shortHash = commit.hash.substring(0, 7);
    return `${message} ([${shortHash}](../../commit/${commit.hash}))`;
  }

  getUniqueContributors(commits) {
    const contributorMap = new Map();

    for (const commit of commits) {
      if (!contributorMap.has(commit.email)) {
        contributorMap.set(commit.email, {
          author: commit.author,
          email: commit.email,
        });
      }
    }

    return Array.from(contributorMap.values()).sort((a, b) => a.author.localeCompare(b.author));
  }

  getCompareUrl(fromTag, toVersion) {
    try {
      // Try to get remote URL
      const remoteUrl = execSync('git config --get remote.origin.url', {
        encoding: 'utf8',
        cwd: this.projectRoot,
      }).trim();

      // Convert SSH URL to HTTPS for GitHub
      let httpsUrl = remoteUrl;
      if (remoteUrl.startsWith('git@github.com:')) {
        httpsUrl = remoteUrl.replace('git@github.com:', 'https://github.com/');
      }

      // Remove .git suffix
      httpsUrl = httpsUrl.replace(/\.git$/, '');

      return `${httpsUrl}/compare/${fromTag}...v${toVersion}`;
    } catch (error) {
      this.log.debug('Could not determine remote URL for compare link');
      return null;
    }
  }

  async updateChangelog(releaseNotes, dryRun = false) {
    if (dryRun) {
      return releaseNotes;
    }

    let existingChangelog = '';
    if (fs.existsSync(this.changelogPath)) {
      existingChangelog = fs.readFileSync(this.changelogPath, 'utf8');
    }

    let newChangelog;

    if (existingChangelog) {
      // Find the position to insert new release notes
      const headerRegex = /^# Changelog\s*$/m;
      const match = existingChangelog.match(headerRegex);

      if (match) {
        // Insert after the header
        const insertPosition = match.index + match[0].length;
        newChangelog =
          existingChangelog.slice(0, insertPosition) + '\n\n' + releaseNotes + existingChangelog.slice(insertPosition);
      } else {
        // No header found, prepend to existing content
        newChangelog = this.createChangelogHeader() + '\n\n' + releaseNotes + existingChangelog;
      }
    } else {
      // Create new changelog
      newChangelog = this.createChangelogHeader() + '\n\n' + releaseNotes;
    }

    fs.writeFileSync(this.changelogPath, newChangelog);
    return newChangelog;
  }

  createChangelogHeader() {
    return `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).`;
  }

  async generateFullChangelog() {
    this.log.step('Generating complete changelog from git history...');

    // Get all tags
    let tags = [];
    try {
      const tagOutput = execSync('git tag -l --sort=-version:refname', {
        encoding: 'utf8',
        cwd: this.projectRoot,
      });
      tags = tagOutput.split('\n').filter((tag) => tag.trim());
    } catch (error) {
      this.log.warning('No tags found, generating changelog from all commits');
    }

    let changelog = this.createChangelogHeader() + '\n\n';

    if (tags.length === 0) {
      // No tags, generate from all commits
      const versionInfo = {
        newVersion: 'Unreleased',
        lastTag: null,
        currentVersion: 'Unreleased',
      };

      const releaseNotes = await this.generateReleaseNotes(versionInfo);
      changelog += releaseNotes;
    } else {
      // Generate for each tag
      for (let i = 0; i < tags.length; i++) {
        const currentTag = tags[i];
        const previousTag = tags[i + 1] || null;

        const versionInfo = {
          newVersion: currentTag.replace(/^v/, ''),
          lastTag: previousTag,
          currentVersion: currentTag.replace(/^v/, ''),
        };

        const releaseNotes = await this.generateReleaseNotes(versionInfo);
        changelog += releaseNotes;
      }
    }

    return changelog;
  }
}

// CLI Interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--verbose':
        options.verbose = true;
        break;
      case '--full':
        options.full = true;
        break;
      case '--dry-run':
        options.dryRun = true;
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
${colors.bright}Changelog Generator${colors.reset}

Usage: node scripts/generate-changelog.js [options]

Options:
  --verbose     Show detailed output
  --full        Generate complete changelog from git history
  --dry-run     Preview changelog without writing to file
  --help        Show this help message

Examples:
  node scripts/generate-changelog.js              # Generate for next release
  node scripts/generate-changelog.js --full       # Regenerate complete changelog
  node scripts/generate-changelog.js --dry-run    # Preview changelog
  `);
}

// Main execution
async function main() {
  const options = parseArgs();
  const generator = new ChangelogGenerator(options);

  if (options.full) {
    const changelog = await generator.generateFullChangelog();
    if (!options.dryRun) {
      fs.writeFileSync(generator.changelogPath, changelog);
      generator.log.success('Complete changelog generated');
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('FULL CHANGELOG PREVIEW:');
      console.log('='.repeat(60));
      console.log(changelog);
      console.log('='.repeat(60));
    }
  } else {
    // This would typically be called from the release script
    generator.log.info('Use this module from the release script or use --full to generate complete changelog');
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Changelog generation failed:', error.message);
    process.exit(1);
  });
}

module.exports = { ChangelogGenerator };
