# 🚀 Release Management System

The TraceLog SDK release management system fully automates the versioning, documentation, and publishing process.

## 🚀 How to Make Your First Release (v0.0.1)

### ✅ Pre-Release Checklist
- [ ] You're on `main` branch: `git branch --show-current`
- [ ] Working directory is clean: `git status`
- [ ] NPM authenticated: `npm whoami`
- [ ] Tests pass: `npm run test:e2e`
- [ ] Build works: `npm run build:all`

### Quick Steps for Release v0.0.1
```bash
# 1. Switch to main branch
git checkout main && git pull origin main

# 2. Verify clean state
git status  # Should be clean

# 3. Execute release
npm run release
```

**It's that simple!** The system automates everything: version detection, CHANGELOG, build, NPM publish, GitHub release.

### If You Prefer to Validate First
```bash
# 1. Run validations
npm run pre-release-check

# 2. Simulate release
npm run release:dry-run

# 3. If everything OK, do real release
npm run release
```

## 📋 Available Commands

### Automatic Releases
```bash
npm run release                 # Automatic release (detects version type)
npm run release:dry-run        # Complete release simulation
```

### Manual Releases
```bash
npm run release:patch          # Increment patch version (1.0.0 → 1.0.1)
npm run release:minor          # Increment minor version (1.0.0 → 1.1.0)
npm run release:major          # Increment major version (1.0.0 → 2.0.0)
```

### Validation and Changelog
```bash
npm run pre-release-check      # Complete pre-release validation
npm run changelog:generate     # Generate complete changelog
npm run changelog:preview      # Preview changelog
```

## 🔄 Release Process

### 1. **Automatic Validation**
- ✅ Git repository state (clean, up-to-date)
- ✅ Dependency vulnerability analysis
- ✅ Code quality (lint + format)
- ✅ Build integrity (ESM + CJS + Browser)
- ✅ E2E test coverage
- ✅ Package.json configuration
- ✅ File structure
- ✅ Performance benchmarks

### 2. **Intelligent Version Detection**
The system analyzes conventional commits since the last tag:

- `feat:` → **minor** version bump
- `fix:` → **patch** version bump
- `BREAKING CHANGE` → **major** version bump
- No significant changes → **patch** by default

### 3. **Automatic Generation**
- 📝 **CHANGELOG.md** with automatic categorization
- 🏷️ **Git tags** with annotations
- 📦 **NPM publication** with verification
- 🎯 **GitHub Release** with notes

## 🛡️ Security Validations

### Pre-Release Checks
- **Branch Protection**: Only releases from `main`
- **Working Directory**: Must be clean (no changes)
- **Dependencies**: No critical or high vulnerabilities
- **Build Verification**: All builds successful
- **Test Coverage**: Complete E2E test suite
- **Performance**: Benchmarks within limits

### NPM Publishing
- **Token Validation**: NPM authentication verification
- **Version Constraints**: Semantic version validation
- **Dry Run**: Simulation before real publication
- **Post-Publish**: Publication success verification

## 📊 GitHub Actions

### Manual Workflow
```yaml
# Trigger: workflow_dispatch
# Options: version_type, force_version, skip_tests, dry_run
```

### Automatic Workflow
```yaml
# Trigger: push to main (excludes release files)
# Automatically detects conventional commits
```

## 🔧 Advanced Configuration

### Environment Variables
```bash
NPM_TOKEN=npm_token_here    # For NPM publishing
GITHUB_TOKEN=github_token_here    # For GitHub releases
```

### Release System Scripts
- `scripts/release.js` - Main orchestrator
- `scripts/pre-release-check.js` - Validation suite
- `scripts/generate-changelog.js` - Changelog generator
- `scripts/version-utils.js` - Version utilities

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

### Specific Issues for First Release (v0.0.1)

#### ❌ "Releases can only be created from the 'main' branch"
```bash
git checkout main
git pull origin main
```

#### ❌ "Working directory is not clean"
```bash
# See which files are modified
git status

# Commit changes
git add .
git commit -m "chore: prepare for release"

# Or stash if you don't want to commit
git stash
```

#### ❌ "Not authenticated with NPM"
```bash
# If you have .npmrc configured (like your case)
npm whoami  # Should show your username

# If it doesn't work, manual login
npm login
```

#### ❌ "Test suite failed"
```bash
# Run tests manually to see errors
npm run test:e2e

# If they fail, check logs in test-results/
```

#### ❌ "Code quality checks failed"
```bash
# Auto-fix
npm run fix

# Verify it's fixed
npm run check
```

### Failed Release
1. Review validation logs: `npm run pre-release-check`
2. Fix issues: `npm run fix`
3. Verify tests: `npm run test:e2e`
4. Try dry-run: `npm run release:dry-run`

### Common Errors
- **Working directory not clean**: Commit or stash changes
- **NPM authentication**: Run `npm login`
- **Tests failing**: Review and fix E2E tests
- **Build errors**: Check dependencies and configuration

### Post-Release Verification v0.0.1
```bash
# 1. Verify it published to NPM
npm view @tracelog/sdk version
# Should show: 0.0.1

# 2. Verify Git tag
git tag -l
# Should show: v0.0.1

# 3. Verify CHANGELOG.md exists
cat CHANGELOG.md | head -20

# 4. Verify GitHub Release
# Go to: https://github.com/your-username/tracelog-client/releases

# 5. Installation test
npm install @tracelog/sdk@0.0.1
```

### Recovery
```bash
# If release fails mid-process:
git reset --hard HEAD~1           # Undo version commit
git tag -d v0.0.1                 # Remove tag if exists (in this case v0.0.1)
npm version 0.0.1                 # Restore previous version
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

1. **Use conventional commits** for automatic detection
2. **Do dry-run** before important releases
3. **Review generated changelog** before publishing
4. **Keep dependencies updated**
5. **Run pre-release-check** regularly
6. **Releases only from main** to maintain stability

---

**System created for TraceLog SDK** - Complete release automation with intelligent validation and automatic documentation.