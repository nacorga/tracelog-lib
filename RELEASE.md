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
  - ✅ Security audit (npm audit)
  - ✅ Code quality (ESLint + Prettier)
  - ✅ Unit tests (Vitest)
  - ✅ Integration tests
  - ✅ Code coverage (≥70% threshold)
  - ✅ Build integrity (ESM + CJS + Browser)
  - ✅ E2E tests with Playwright
  - ✅ Package configuration validation
  - ✅ **RC version published** (with `next` tag for testing)
- **Cannot merge until CI passes + code review**
- **CI does NOT run after merge** - all validation happens in PR

### 3. **Release Process**
Once your PR is merged to `main`:

```bash
# Go to GitHub Actions → Release workflow
# Click "Run workflow" → Select options → Run
```

**Important Notes:**
- ✅ All validations were already done in CI during the PR
- ✅ Release is **manual-only** via GitHub Actions workflow_dispatch
- ✅ Release handles: versioning, changelog, git tags, NPM publish, RC cleanup
- ❌ Release does NOT auto-trigger on push to main (prevents infinite loops)

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
```

## 📦 RC Version Management

### What are RC Versions?
**RC (Release Candidate)** versions are pre-release versions published during pull request development to allow testing before merging to main.

### RC Version Lifecycle
```
1. PR Created → RC version published
   Format: {version}-rc.{PR_NUMBER}.{COMMIT_COUNT}
   Example: 1.2.3-rc.45.2
   NPM Tag: next

2. PR Updated → New RC version published
   Example: 1.2.3-rc.45.3 (commit count incremented)
   Previous RC versions remain on npm

3. PR Merged → Stable release published → All RC versions cleaned up
   Stable version: 1.2.3 (NPM tag: latest)
   All -rc.* versions: Unpublished from npm
```

### Installing RC Versions
```bash
# Install specific RC version (for testing)
npm install @tracelog/lib@1.2.3-rc.45.2

# Install latest RC version (automatically uses 'next' tag)
npm install @tracelog/lib@next
```

### Automatic Cleanup
When a PR is merged to main and a stable release is published:
- ✅ All RC versions (containing `-rc.` in version string) are automatically unpublished
- ✅ Keeps npm package registry clean
- ✅ Prevents confusion between stable and pre-release versions
- ✅ No manual cleanup required

**Note:** RC versions are ONLY for testing during PR review. Once merged, they are no longer needed and are automatically removed.

## 🔄 CI/CD Pipeline

### Key Design Principles
- ✅ **All validation happens in PRs** - CI runs on every PR change
- ❌ **No CI on push to main** - Avoids redundant validation after merge
- ✅ **Manual release control** - Releases only via workflow_dispatch
- ⚡ **Concurrency control** - Cancels outdated workflow runs automatically
- 🔒 **Single status check** - "All Checks Passed" job for branch protection
- 📦 **RC versions** - Published during PR for testing, cleaned up on release

### 1. **Pull Request Validation (CI Workflow)**
**Triggers**: Every PR to `main` (opened, synchronize, reopened, ready_for_review)
- ✅ Security audit (npm audit --audit-level high)
- ✅ Code quality (ESLint + Prettier)
- ✅ Unit tests (Vitest)
- ✅ Integration tests
- ✅ Code coverage validation (≥70% threshold)
- ✅ Build integrity (ESM + CJS + Browser)
- ✅ E2E test coverage (Playwright - Chromium + Mobile Chrome)
- ✅ Package configuration validation
- ✅ Upload test artifacts if failures occur
- ✅ **RC version publication** (publishes `{version}-rc.{PR_NUMBER}.{COMMIT_COUNT}` to npm with `next` tag)
- ✅ **All Checks Passed** job (single status check for branch protection)
- ⚡ **Concurrency control** (cancels outdated runs when new commits pushed)

### 2. **Release Process (Release Workflow)**
**Triggers**: Manual GitHub Actions `workflow_dispatch` ONLY
- ✅ Conventional commits analysis (determines if release needed)
- ✅ Version detection & bump (auto/patch/minor/major)
- ✅ Project build (all outputs)
- ✅ CHANGELOG.md generation
- ✅ package.json version update
- ✅ Git commit & tag creation
- ✅ NPM publication with retry verification (5 attempts for registry propagation)
- ✅ GitHub release creation with notes
- ✅ **RC versions cleanup** (unpublishes all `-rc.*` versions from npm automatically)
- ✅ Post-release validation & notifications

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
- **Required Status Checks**:
  - `All Checks Passed` - Single status check that validates all CI jobs
  - PRs must pass this check before merge
- **Required Reviews**: Code review mandatory
- **Up-to-date branches**: PRs must be current with main
- **Linear History**: Enforced clean git history
- **Admin Enforcement**: No bypassing rules
- **Concurrency Protection**: Old workflow runs automatically cancelled on new commits

### CI Validation Gates
- **Dependencies**: No critical or high vulnerabilities (npm audit --audit-level high)
- **Code Quality**: ESLint + Prettier must pass (npm run check)
- **Unit Tests**: Vitest test suite must pass
- **Integration Tests**: Component interaction tests must pass
- **Code Coverage**: Minimum 70% line coverage required
- **Build Verification**: All builds (ESM/CJS/Browser) successful
- **E2E Tests**: Complete Playwright test suite (Chromium + Mobile Chrome)
- **Package Config**: package.json, exports, and files array validation

### Release Security
- **Manual Trigger Only**: No automatic releases on push (prevents infinite loops)
- **Branch Restriction**: Only releases from `main` branch
- **NPM Authentication**: Automatic token validation via secrets
- **Version Validation**: Semantic versioning enforced
- **Publication Verification**: Post-publish success check with 5 retry attempts
- **RC Cleanup**: Automatic unpublishing of pre-release versions

## 📊 GitHub Actions Workflows

### CI Workflow (`.github/workflows/ci.yml`)
```yaml
# Triggers: pull_request to main (opened, synchronize, reopened, ready_for_review)
# Concurrency: Cancels outdated runs on new commits
# Jobs:
#   - validate: security, quality, unit tests, integration tests,
#               coverage, build, E2E tests, package validation
#   - publish-rc: Publishes RC version with 'next' tag (PR only)
#   - notify-rc-failure: Comments on PR if RC publish fails
#   - all-checks-passed: Single status check for branch protection
# Artifacts: test-reports, coverage-report (on success/failure)
```

### Release Workflow (`.github/workflows/release.yml`)
```yaml
# Trigger: workflow_dispatch (manual) ONLY - no auto-trigger on push
# Options: version_type (auto/patch/minor/major), force_version, dry_run, skip_tests
# Jobs:
#   - check-release-needed: Analyzes conventional commits
#   - release: Version bump, changelog, git tag, npm publish, RC cleanup
#   - notify-success: Success notification
#   - notify-failure: Failure notification
```

### Deploy Demo Workflow (`.github/workflows/deploy-demo.yml`)
```yaml
# Triggers: push to main (paths: docs/**, src/**)
# Concurrency: Cancels outdated deployments
# Jobs:
#   - deploy-demo: Builds library, copies to docs/, deploys to gh-pages
#   - notify-failure: Deployment failure notification
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
npm view @tracelog/lib version

# 2. Verify Git tag created
git tag -l | tail -5

# 3. Check GitHub Release page
# Visit: https://github.com/your-username/tracelog-lib/releases

# 4. Test installation
npm install @tracelog/lib@latest
```

### Emergency Recovery
```bash
# If release partially failed:
# 1. Check what completed in GitHub Actions logs
# 2. Manually fix any issues (e.g., unpublish from NPM if needed)
# 3. Re-run release workflow with --dry-run first
```

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
