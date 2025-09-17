#!/usr/bin/env node

/**
 * Pre-Release Validation Utilities
 *
 * Comprehensive validation suite that runs before any release to ensure
 * code quality, security, and performance standards are met.
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

class PreReleaseChecker {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.strict = options.strict || false;
    this.skipPerformance = options.skipPerformance || false;

    this.projectRoot = path.join(__dirname, '..');
    this.packagePath = path.join(this.projectRoot, 'package.json');

    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      checks: [],
    };

    this.log = this.createLogger();
  }

  createLogger() {
    return {
      info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
      success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
      warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
      error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
      step: (msg) => console.log(`${colors.cyan}🔍${colors.reset} ${msg}`),
      title: (msg) => console.log(`\n${colors.bright}${colors.cyan}🛡️ ${msg}${colors.reset}\n`),
      debug: (msg) => this.verbose && console.log(`${colors.yellow}[DEBUG]${colors.reset} ${msg}`),
    };
  }

  async run() {
    this.log.title('Pre-Release Validation Suite');

    const checks = [
      { name: 'Repository State', fn: () => this.checkRepositoryState() },
      { name: 'Dependencies Security', fn: () => this.checkDependencySecurity() },
      { name: 'Code Quality', fn: () => this.checkCodeQuality() },
      { name: 'Build Integrity', fn: () => this.checkBuildIntegrity() },
      { name: 'Test Coverage', fn: () => this.checkTestCoverage() },
      { name: 'Package Configuration', fn: () => this.checkPackageConfiguration() },
      { name: 'File Structure', fn: () => this.checkFileStructure() },
    ];

    if (!this.skipPerformance) {
      checks.push({ name: 'Performance Benchmarks', fn: () => this.checkPerformanceBenchmarks() });
    }

    for (const check of checks) {
      await this.runCheck(check);
    }

    this.showSummary();

    if (this.results.failed > 0) {
      process.exit(1);
    }

    if (this.strict && this.results.warnings > 0) {
      this.log.error('Strict mode enabled and warnings found');
      process.exit(1);
    }
  }

  async runCheck(check) {
    this.log.step(`Checking ${check.name}...`);

    try {
      const result = await check.fn();
      this.recordResult(check.name, 'pass', result);
      this.log.success(`${check.name} passed`);
    } catch (error) {
      this.recordResult(check.name, 'fail', error.message);
      this.log.error(`${check.name} failed: ${error.message}`);
    }
  }

  recordResult(checkName, status, details) {
    this.results.checks.push({ name: checkName, status, details });

    if (status === 'pass') {
      this.results.passed++;
    } else if (status === 'fail') {
      this.results.failed++;
    } else if (status === 'warning') {
      this.results.warnings++;
    }
  }

  async checkRepositoryState() {
    // Check if git is clean
    const status = execSync('git status --porcelain', { encoding: 'utf8', cwd: this.projectRoot });
    if (status.trim()) {
      throw new Error('Working directory is not clean');
    }

    // Check if we're on main branch - only allow releases from main
    const branch = execSync('git branch --show-current', { encoding: 'utf8', cwd: this.projectRoot }).trim();
    if (branch !== 'main') {
      throw new Error(`Releases can only be created from the 'main' branch. Currently on '${branch}'.`);
    }

    // Check if we're up to date with remote
    try {
      execSync('git fetch', { stdio: 'ignore', cwd: this.projectRoot });
      const behind = execSync('git rev-list HEAD..@{u} --count', { encoding: 'utf8', cwd: this.projectRoot }).trim();
      if (parseInt(behind) > 0) {
        throw new Error(`Branch is ${behind} commits behind remote`);
      }
    } catch (error) {
      if (error.message.includes('no upstream branch')) {
        this.log.warning('No upstream branch configured');
      } else {
        throw error;
      }
    }

    return 'Repository state is clean';
  }

  async checkDependencySecurity() {
    try {
      // Check for known vulnerabilities
      execSync('npm audit --audit-level high', {
        stdio: this.verbose ? 'inherit' : 'ignore',
        cwd: this.projectRoot,
      });

      return 'No high-severity vulnerabilities found';
    } catch (error) {
      // Check if it's just warnings
      try {
        const auditOutput = execSync('npm audit --json', {
          encoding: 'utf8',
          cwd: this.projectRoot,
        });
        const audit = JSON.parse(auditOutput);

        if (audit.metadata && audit.metadata.vulnerabilities) {
          const { high, critical } = audit.metadata.vulnerabilities;
          if (high > 0 || critical > 0) {
            throw new Error(`Found ${critical} critical and ${high} high severity vulnerabilities`);
          }
        }
      } catch (parseError) {
        throw new Error('npm audit failed to run properly');
      }
    }
  }

  async checkCodeQuality() {
    try {
      // Run linting
      execSync('npm run lint', {
        stdio: this.verbose ? 'inherit' : 'ignore',
        cwd: this.projectRoot,
      });

      // Run formatting check
      execSync('npm run format:check', {
        stdio: this.verbose ? 'inherit' : 'ignore',
        cwd: this.projectRoot,
      });

      return 'Code quality checks passed';
    } catch (error) {
      throw new Error('Code quality checks failed. Run `npm run fix` to address issues.');
    }
  }

  async checkBuildIntegrity() {
    try {
      // Clean previous builds
      if (fs.existsSync(path.join(this.projectRoot, 'dist'))) {
        execSync('rm -rf dist', { cwd: this.projectRoot });
      }

      // Run full build
      execSync('npm run build:all', {
        stdio: this.verbose ? 'inherit' : 'ignore',
        cwd: this.projectRoot,
      });

      // Verify build outputs
      const distPath = path.join(this.projectRoot, 'dist');
      const requiredPaths = [
        'dist/esm/public-api.js',
        'dist/esm/public-api.d.ts',
        'dist/cjs/public-api.js',
        'dist/browser/tracelog.js',
      ];

      for (const requiredPath of requiredPaths) {
        const fullPath = path.join(this.projectRoot, requiredPath);
        if (!fs.existsSync(fullPath)) {
          throw new Error(`Missing build output: ${requiredPath}`);
        }
      }

      // Check file sizes (basic sanity check)
      const browserBuild = path.join(this.projectRoot, 'dist/browser/tracelog.js');
      const stats = fs.statSync(browserBuild);
      const sizeKB = Math.round(stats.size / 1024);

      if (sizeKB > 100) {
        this.log.warning(`Browser build is large: ${sizeKB}KB`);
        this.recordResult('Build Size', 'warning', `${sizeKB}KB`);
      }

      return `Build completed successfully. Browser build: ${sizeKB}KB`;
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  async checkTestCoverage() {
    try {
      // Run E2E tests
      execSync('npm run test:e2e', {
        stdio: this.verbose ? 'inherit' : 'ignore',
        cwd: this.projectRoot,
      });

      return 'All tests passed';
    } catch (error) {
      throw new Error('Test suite failed');
    }
  }

  async checkPackageConfiguration() {
    const packageJson = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
    const issues = [];

    // Check required fields
    const requiredFields = ['name', 'version', 'description', 'main', 'module', 'types'];
    for (const field of requiredFields) {
      if (!packageJson[field]) {
        issues.push(`Missing required field: ${field}`);
      }
    }

    // Check exports configuration
    if (!packageJson.exports) {
      issues.push('Missing exports configuration');
    }

    // Check files array
    if (!packageJson.files || packageJson.files.length === 0) {
      issues.push('Missing or empty files array');
    }

    // Check for scripts
    const requiredScripts = ['build', 'lint', 'test:e2e'];
    for (const script of requiredScripts) {
      if (!packageJson.scripts || !packageJson.scripts[script]) {
        issues.push(`Missing script: ${script}`);
      }
    }

    // Validate version format
    const versionRegex = /^\d+\.\d+\.\d+(-[\w.]+)?$/;
    if (!versionRegex.test(packageJson.version)) {
      issues.push(`Invalid version format: ${packageJson.version}`);
    }

    if (issues.length > 0) {
      throw new Error(`Package configuration issues: ${issues.join(', ')}`);
    }

    return 'Package configuration is valid';
  }

  async checkFileStructure() {
    const requiredFiles = ['package.json', 'README.md', 'LICENSE', 'tsconfig.json', 'src/api.ts', 'src/app.ts'];

    const missingFiles = [];
    for (const file of requiredFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
    }

    // Check for unexpected files in dist (should be clean)
    const distPath = path.join(this.projectRoot, 'dist');
    if (!fs.existsSync(distPath)) {
      throw new Error('dist directory does not exist - run build first');
    }

    return 'File structure is correct';
  }

  async checkPerformanceBenchmarks() {
    try {
      // Run performance benchmarks
      execSync('npm run performance:benchmark', {
        stdio: this.verbose ? 'inherit' : 'ignore',
        cwd: this.projectRoot,
      });

      // Check performance results
      const performanceResultsPath = path.join(this.projectRoot, 'performance/performance-results.json');
      if (fs.existsSync(performanceResultsPath)) {
        const results = JSON.parse(fs.readFileSync(performanceResultsPath, 'utf8'));

        // Basic performance thresholds
        const thresholds = {
          initialization: 50, // ms
          averageEvent: 5, // ms
        };

        const warnings = [];
        for (const [browser, metrics] of Object.entries(results.summary)) {
          for (const [metric, data] of Object.entries(metrics)) {
            if (thresholds[metric] && data.avg > thresholds[metric]) {
              warnings.push(`${browser} ${metric}: ${data.avg}ms > ${thresholds[metric]}ms`);
            }
          }
        }

        if (warnings.length > 0) {
          this.log.warning(`Performance thresholds exceeded: ${warnings.join(', ')}`);
          this.recordResult('Performance Thresholds', 'warning', warnings.join(', '));
        }
      }

      return 'Performance benchmarks completed';
    } catch (error) {
      throw new Error(`Performance benchmarks failed: ${error.message}`);
    }
  }

  showSummary() {
    console.log('\n' + '='.repeat(60));
    this.log.title('Pre-Release Validation Summary');

    console.log(`${colors.green}✅ Passed: ${this.results.passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${this.results.failed}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Warnings: ${this.results.warnings}${colors.reset}`);

    if (this.results.failed === 0 && this.results.warnings === 0) {
      this.log.success('All checks passed! Ready for release 🚀');
    } else if (this.results.failed === 0) {
      this.log.warning(`Ready for release with ${this.results.warnings} warnings`);
    } else {
      this.log.error(`${this.results.failed} critical issues must be resolved before release`);
    }

    console.log('='.repeat(60));
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
      case '--strict':
        options.strict = true;
        break;
      case '--skip-performance':
        options.skipPerformance = true;
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
${colors.bright}Pre-Release Validation Suite${colors.reset}

Usage: node scripts/pre-release-check.js [options]

Options:
  --verbose           Show detailed output
  --strict            Fail on warnings
  --skip-performance  Skip performance benchmarks
  --help              Show this help message

Examples:
  node scripts/pre-release-check.js              # Standard validation
  node scripts/pre-release-check.js --strict     # Fail on any warnings
  node scripts/pre-release-check.js --verbose    # Detailed output
  `);
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  const checker = new PreReleaseChecker(options);
  checker.run().catch((error) => {
    console.error('Pre-release check failed:', error.message);
    process.exit(1);
  });
}

module.exports = { PreReleaseChecker };
