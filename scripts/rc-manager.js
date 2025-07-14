#!/usr/bin/env node

const { execSync } = require('child_process');
const packageJson = require('../package.json');

const PACKAGE_NAME = packageJson.name;

/**
 * Get all published versions of the package
 */
function getPublishedVersions() {
  try {
    const result = execSync(`npm view ${PACKAGE_NAME} versions --json`, { encoding: 'utf8' });
    return JSON.parse(result);
  } catch (error) {
    console.error('Error getting versions:', error.message);
    return [];
  }
}

/**
 * Filter RC versions
 */
function getRCVersions() {
  const versions = getPublishedVersions();
  return versions.filter(version => version.includes('-rc.'));
}

/**
 * Clean old RC versions (keep the 3 most recent)
 */
function cleanupOldRCs() {
  const rcVersions = getRCVersions();
  
  if (rcVersions.length <= 3) {
    console.log('📝 No old RC versions to clean');
    return;
  }
  
  // Sort by creation date (most recent first)
  rcVersions.sort((a, b) => {
    const aTime = new Date(execSync(`npm view ${PACKAGE_NAME}@${a} time.modified`, { encoding: 'utf8' }).trim());
    const bTime = new Date(execSync(`npm view ${PACKAGE_NAME}@${b} time.modified`, { encoding: 'utf8' }).trim());
    return bTime - aTime;
  });
  
  // Keep only the 3 most recent
  const versionsToDelete = rcVersions.slice(3);
  
  console.log(`🧹 Cleaning ${versionsToDelete.length} old RC versions...`);
  
  versionsToDelete.forEach(version => {
    try {
      execSync(`npm unpublish ${PACKAGE_NAME}@${version}`, { stdio: 'inherit' });
      console.log(`✅ Deleted RC version: ${version}`);
    } catch (error) {
      console.error(`❌ Error deleting ${version}:`, error.message);
    }
  });
}

/**
 * List all RC versions available
 */
function listRCVersions() {
  const rcVersions = getRCVersions();
  
  if (rcVersions.length === 0) {
    console.log('📝 No RC versions available');
    return;
  }
  
  console.log('📦 RC versions available:');
  rcVersions.forEach(version => {
    console.log(`  - ${version}`);
  });
}

/**
 * Get information about the current RC tag
 */
function getRCTagInfo() {
  try {
    const result = execSync(`npm view ${PACKAGE_NAME}@rc version`, { encoding: 'utf8' });
    console.log(`🏷️  Current RC tag points to: ${result.trim()}`);
  } catch (error) {
    console.log('📝 No RC tag available');
  }
}

// Handle command line arguments
const command = process.argv[2];

switch (command) {
  case 'list':
    listRCVersions();
    break;
  case 'cleanup':
    cleanupOldRCs();
    break;
  case 'info':
    getRCTagInfo();
    break;
  case 'all':
    console.log('=== RC versions information ===');
    listRCVersions();
    console.log('\n=== Current RC tag ===');
    getRCTagInfo();
    break;
  default:
    console.log(`
📦 RC Manager for ${PACKAGE_NAME}

Usage: node scripts/rc-manager.js <command>

Available commands:
  list    - List all RC versions
  cleanup - Clean old RC versions (keep the 3 most recent)
  info    - Show information about the current RC tag
 

Examples:
  node scripts/rc-manager.js list
  node scripts/rc-manager.js cleanup
  node scripts/rc-manager.js info
`);
    break;
}
