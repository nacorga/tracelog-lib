---
description: Interactive release workflow with semantic versioning based on conventional commits
argument-hint: [patch|minor|major] (optional)
allowed-tools: [Bash, Read]
model: claude-sonnet-4-5
---

# Release Workflow

Interactive release workflow for TraceLog library following semantic versioning and conventional commits.

## Arguments

- `patch`: Force patch version bump (0.8.3 → 0.8.4)
- `minor`: Force minor version bump (0.8.3 → 0.9.0)
- `major`: Force major version bump (0.8.3 → 1.0.0)
- (no argument): Automatic version bump based on commit analysis

## Process

1. Validate current branch is `main`
2. Analyze commits since last tag
3. Determine version bump
4. Run acceptance criteria
5. Execute release script
6. Display next steps

## Execution

Check argument and run appropriate command:

!if [ -z "$ARGUMENTS" ]; then npm run release:dry-run && echo "" && echo "📋 Review the above analysis. To proceed with release, run: npm run release"; elif [ "$ARGUMENTS" = "patch" ]; then npm run release:patch; elif [ "$ARGUMENTS" = "minor" ]; then npm run release:minor; elif [ "$ARGUMENTS" = "major" ]; then npm run release:major; else echo "❌ Invalid argument. Use: patch, minor, major, or leave empty for automatic"; fi

## Post-Release

After release script completes:

@package.json

Display current version and next steps:
```
✅ Release prepared successfully!

Next Steps:
1. Review commit: git log -1
2. Push to main: git push origin main
3. Monitor GitHub Actions workflow
4. Verify NPM publish
5. Verify GitHub Release created

GitHub Actions will:
- Create git tag
- Publish to NPM
- Create GitHub Release with notes
```
