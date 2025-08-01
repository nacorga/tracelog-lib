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
  
  // Sort by timestamp in version (most recent first)
  // Format: x.y.z-rc.{PR}.{timestamp}
  rcVersions.sort((a, b) => {
    const extractTimestamp = (version) => {
      const match = version.match(/-rc\.\d+\.(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    };
    
    const aTimestamp = extractTimestamp(a);
    const bTimestamp = extractTimestamp(b);
    
    // If both have timestamp, sort by timestamp; otherwise fallback to NPM time
    if (aTimestamp && bTimestamp) {
      return bTimestamp - aTimestamp;
    }
    
    // Fallback to NPM publish time for older versions without timestamp
    try {
      const aTime = new Date(execSync(`npm view ${PACKAGE_NAME}@${a} time.modified`, { encoding: 'utf8' }).trim());
      const bTime = new Date(execSync(`npm view ${PACKAGE_NAME}@${b} time.modified`, { encoding: 'utf8' }).trim());
      return bTime - aTime;
    } catch (error) {
      console.warn(`⚠️  Could not get time for ${a} or ${b}, using alphabetical sort`);
      return b.localeCompare(a);
    }
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
  
  // Sort by timestamp (most recent first)
  rcVersions.sort((a, b) => {
    const extractTimestamp = (version) => {
      const match = version.match(/-rc\.\d+\.(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    };
    
    const aTimestamp = extractTimestamp(a);
    const bTimestamp = extractTimestamp(b);
    
    if (aTimestamp && bTimestamp) {
      return bTimestamp - aTimestamp;
    }
    return b.localeCompare(a);
  });
  
  rcVersions.forEach(version => {
    const match = version.match(/-rc\.(\d+)\.(\d+)$/);
    if (match) {
      const prNumber = match[1];
      const timestamp = match[2];
      const date = new Date(parseInt(timestamp) * 1000).toLocaleString();
      console.log(`  - ${version} (PR #${prNumber}, ${date})`);
    } else {
      console.log(`  - ${version} (legacy format)`);
    }
  });
}

/**
 * Get information about the current RC tag
 */
function getRCTagInfo() {
  try {
    const result = execSync(`npm view ${PACKAGE_NAME}@rc version`, { encoding: 'utf8' });
    const version = result.trim();
    console.log(`🏷️  Current RC tag points to: ${version}`);
    
    // Extract PR info if available
    const match = version.match(/-rc\.(\d+)\.(\d+)$/);
    if (match) {
      const prNumber = match[1];
      const timestamp = match[2];
      const date = new Date(parseInt(timestamp) * 1000).toLocaleString();
      console.log(`📋 PR #${prNumber}, published: ${date}`);
    }
  } catch (error) {
    console.log('📝 No RC tag available');
  }
}

/**
 * Clean RC versions for a specific PR
 */
function cleanupPRRCs(prNumber) {
  const rcVersions = getRCVersions();
  const prRCs = rcVersions.filter(version => version.includes(`-rc.${prNumber}.`));
  
  if (prRCs.length === 0) {
    console.log(`📝 No RC versions found for PR #${prNumber}`);
    return;
  }
  
  console.log(`🧹 Cleaning ${prRCs.length} RC versions for PR #${prNumber}...`);
  
  prRCs.forEach(version => {
    try {
      execSync(`npm unpublish ${PACKAGE_NAME}@${version}`, { stdio: 'inherit' });
      console.log(`✅ Deleted RC version: ${version}`);
    } catch (error) {
      console.error(`❌ Error deleting ${version}:`, error.message);
    }
  });
}

/**
 * Clean ALL RC versions (used when publishing a new release)
 */
function cleanupAllRCs() {
  const rcVersions = getRCVersions();
  
  if (rcVersions.length === 0) {
    console.log('📝 No RC versions to clean');
    return;
  }
  
  console.log(`🧹 Cleaning ALL ${rcVersions.length} RC versions...`);
  
  rcVersions.forEach(version => {
    try {
      execSync(`npm unpublish ${PACKAGE_NAME}@${version}`, { stdio: 'inherit' });
      console.log(`✅ Deleted RC version: ${version}`);
    } catch (error) {
      console.error(`❌ Error deleting ${version}:`, error.message);
    }
  });
  
  console.log('🎉 All RC versions have been cleaned up');
}

// Handle command line arguments
const command = process.argv[2];
const argument = process.argv[3];

switch (command) {
  case 'list':
    listRCVersions();
    break;
  case 'cleanup':
    if (argument === 'all') {
      cleanupAllRCs();
    } else if (argument && argument.startsWith('pr:')) {
      const prNumber = argument.replace('pr:', '');
      cleanupPRRCs(prNumber);
    } else {
      cleanupOldRCs();
    }
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

Usage: node scripts/rc-manager.js <command> [argument]

Available commands:
  list              - List all RC versions
  cleanup           - Clean old RC versions (keep the 3 most recent)
  cleanup all       - Clean ALL RC versions (used for releases)
  cleanup pr:<num>  - Clean all RC versions for a specific PR
  info              - Show information about the current RC tag
  all               - Show all information
 

Examples:
  node scripts/rc-manager.js list
  node scripts/rc-manager.js cleanup
  node scripts/rc-manager.js cleanup all
  node scripts/rc-manager.js cleanup pr:123
  node scripts/rc-manager.js info
  node scripts/rc-manager.js all
`);
    break;
}
