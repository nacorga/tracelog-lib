# 🚀 Release Management System

**Professional CI/CD workflow** with branch protection, automated validation in Pull Requests, and streamlined releases.

## 🔄 New Development Workflow

### 1. **Feature Development**
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... code, test, commit ...

# Push to remote
git push origin feature/your-feature-name
```

### 2. **Pull Request Process**
- Create PR to `main` branch
- **CI automatically runs all validations:**
  - ✅ Security audit
  - ✅ Code quality (ESLint + Prettier)
  - ✅ Build integrity
  - ✅ E2E tests with Playwright
  - ✅ Performance benchmarks
  - ✅ Package configuration validation
- **Cannot merge until CI passes + code review**

### 3. **Release Process**
Once your PR is merged to `main`:

```bash
# Go to GitHub Actions → Release workflow
# Click "Run workflow" → Select options → Run
```

**That's it!** All validations were already done in CI. Release just handles versioning and publishing.

## 🚀 How to Make Your First Release

### ✅ Prerequisites
- [ ] Feature merged to `main` branch
- [ ] CI validation passed
- [ ] NPM authenticated: `npm whoami`

### Quick Release Steps
1. **Go to GitHub Actions**
   - Navigate to your repository
   - Click "Actions" tab
   - Select "Release" workflow

2. **Run Release Workflow**
   - Click "Run workflow"
   - Select version type (auto/patch/minor/major)
   - Click "Run workflow"

3. **Monitor Progress**
   - Watch the workflow execution
   - Review generated changelog
   - Verify NPM publication

**No local commands needed!** Everything runs in GitHub Actions.

## 📋 Available Options

### GitHub Actions Release Workflow
- **Version Type**: `auto` (default), `patch`, `minor`, `major`
- **Force Version**: Specify exact version (e.g., `1.2.3`)
- **Dry Run**: Simulate release without publishing
- **Skip Tests**: Emergency option (not recommended)

### Local Development Commands (Optional)
```bash
# For local development only
npm run release:dry-run        # Test release simulation locally
npm run changelog:generate     # Generate changelog locally
npm run changelog:preview      # Preview changelog changes
```

### CI Validation Commands (Automatic)
```bash
# These run automatically in CI - no need to run manually
npm run check                  # Code quality checks
npm run test:e2e              # E2E tests
npm run build:all             # Build verification
npm run performance:benchmark # Performance tests
```

## 🔄 CI/CD Pipeline

### 1. **Pull Request Validation (CI Workflow)**
**Triggers**: Every PR to `main`
- ✅ Security audit (npm audit)
- ✅ Code quality (ESLint + Prettier)
- ✅ Build integrity (ESM + CJS + Browser)
- ✅ E2E test coverage (Playwright)
- ✅ Performance benchmarks
- ✅ Package configuration validation
- ✅ Upload test artifacts if failures occur

### 2. **Release Process (Release Workflow)**
**Triggers**: Manual GitHub Actions workflow
- ✅ Environment validation (git repo, main branch)
- ✅ Version detection (conventional commits analysis)
- ✅ Project build
- ✅ Version update & changelog generation
- ✅ Git tag creation
- ✅ NPM publication with verification
- ✅ GitHub release creation

### 3. **Intelligent Version Detection**
The system analyzes conventional commits since the last tag:

- `feat:` → **minor** version bump
- `fix:` → **patch** version bump
- `BREAKING CHANGE` → **major** version bump
- No significant changes → **patch** by default

### 4. **Automatic Generation**
- 📝 **CHANGELOG.md** with automatic categorization
- 🏷️ **Git tags** with annotations
- 📦 **NPM publication** with verification
- 🎯 **GitHub Release** with notes

## 🛡️ Quality Gates & Security

### Branch Protection (GitHub Settings)
- **Required Status Checks**: CI must pass before merge
- **Required Reviews**: Code review mandatory
- **Up-to-date branches**: PRs must be current with main
- **Linear History**: Enforced clean git history
- **Admin Enforcement**: No bypassing rules

### CI Validation Gates
- **Dependencies**: No critical or high vulnerabilities
- **Code Quality**: ESLint + Prettier must pass
- **Build Verification**: All builds (ESM/CJS/Browser) successful
- **Test Coverage**: Complete E2E test suite with Playwright
- **Performance**: Benchmarks within acceptable limits

### Release Security
- **Branch Restriction**: Only releases from `main`
- **NPM Authentication**: Automatic token validation
- **Version Validation**: Semantic versioning enforced
- **Publication Verification**: Post-publish success check

## 📊 GitHub Actions Workflows

### CI Workflow (`.github/workflows/ci.yml`)
```yaml
# Triggers: pull_request to main, push to main
# Jobs: validate (security, quality, build, tests, performance)
# Artifacts: Playwright reports on test failures
```

### Release Workflow (`.github/workflows/release.yml`)
```yaml
# Trigger: workflow_dispatch (manual)
# Options: version_type, force_version, dry_run
# Jobs: check-release-needed → release → notifications
```

## 🔧 Configuration

### Required GitHub Secrets
```bash
NPM_TOKEN=npm_token_here         # For NPM publishing
GITHUB_TOKEN=github_token_here   # Auto-provided by GitHub
```

### Release System Scripts
- `scripts/release.js` - Main release orchestrator
- `scripts/generate-changelog.js` - Changelog generator
- `scripts/version-utils.js` - Version utilities
- `scripts/extract-performance-data.js` - Performance analysis

### Branch Protection Setup
See `.github/BRANCH_PROTECTION.md` for complete configuration guide.

## 📝 Conventional Commits

The system automatically detects release type based on:

```bash
feat: new functionality             # minor bump
fix: bug fix                       # patch bump
perf: performance improvement      # patch bump
docs: documentation               # patch bump
test: tests                       # patch bump
refactor: refactoring             # patch bump
chore: maintenance tasks          # patch bump

feat!: breaking change            # major bump
fix!: breaking fix               # major bump
BREAKING CHANGE: in body         # major bump
```

## 🚨 Troubleshooting

### Pull Request Issues

#### ❌ "CI workflow failing"
1. Check failed step in GitHub Actions
2. Download Playwright artifacts if E2E tests fail
3. Fix issues locally and push new commit

#### ❌ "Cannot merge PR"
- Ensure CI status checks pass
- Resolve all PR conversations
- Get required code review approval
- Update branch if behind main

### Release Issues

#### ❌ "Release workflow not appearing"
- Ensure you're on `main` branch
- Check `.github/workflows/release.yml` exists
- Verify you have proper repository permissions

#### ❌ "NPM authentication failed in Actions"
```bash
# Add NPM_TOKEN to GitHub repository secrets:
# Settings → Secrets and variables → Actions → New repository secret
# Name: NPM_TOKEN
# Value: your_npm_token
```

#### ❌ "Release failed during publishing"
1. Check GitHub Actions logs for specific error
2. Verify package.json version is correct
3. Run dry-run first to test: select "Dry run" option

### Local Development Issues

#### ❌ "E2E tests failing locally"
```bash
# Run tests to see specific failures
npm run test:e2e

# Check test artifacts in playwright-report/
# Fix failing tests and commit
```

#### ❌ "Code quality checks failing"
```bash
# Auto-fix most issues
npm run fix

# Verify it's fixed
npm run check
```

### Post-Release Verification
```bash
# 1. Verify NPM publication
npm view @tracelog/sdk version

# 2. Verify Git tag created
git tag -l | tail -5

# 3. Check GitHub Release page
# Visit: https://github.com/your-username/tracelog-client/releases

# 4. Test installation
npm install @tracelog/sdk@latest
```

### Emergency Recovery
```bash
# If release partially failed:
# 1. Check what completed in GitHub Actions logs
# 2. Manually fix any issues (e.g., unpublish from NPM if needed)
# 3. Re-run release workflow with --dry-run first
```

## 📈 Metrics and Monitoring

### Performance Benchmarks
- **Initialization**: < 50ms
- **Event Processing**: < 5ms average
- **Bundle Size**: < 100KB (browser build)

### Release Analytics
- Complete release time
- Tests executed and results
- Generated build sizes
- GitHub Actions performance

## 🎯 Best Practices

### Development Workflow
1. **Use conventional commits** for automatic version detection
2. **Create focused PRs** - one feature per pull request
3. **Write descriptive PR descriptions** explaining the change
4. **Respond to code review feedback** promptly

### Release Management
1. **Always run dry-run first** for important releases
2. **Review generated changelog** before publishing
3. **Monitor release workflow** for any issues
4. **Test published package** after release
5. **Keep NPM tokens secure** in GitHub secrets

### Quality Assurance
1. **Let CI catch issues** - don't skip failed checks
2. **Fix failing tests immediately** - don't merge broken code
3. **Keep dependencies updated** regularly
4. **Review Playwright artifacts** when E2E tests fail

### Branch Management
1. **Protect main branch** with required status checks
2. **Use descriptive branch names** (feature/, fix/, chore/)
3. **Keep branches up to date** with main
4. **Delete merged branches** to keep repository clean

---

**Professional CI/CD System for TraceLog SDK** - Automated validation in PRs, streamlined releases, and comprehensive quality gates.