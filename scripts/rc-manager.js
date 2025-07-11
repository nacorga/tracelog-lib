#!/usr/bin/env node

const { execSync } = require('child_process');
const packageJson = require('../package.json');

const PACKAGE_NAME = packageJson.name;

/**
 * Obtiene todas las versiones publicadas del paquete
 */
function getPublishedVersions() {
  try {
    const result = execSync(`npm view ${PACKAGE_NAME} versions --json`, { encoding: 'utf8' });
    return JSON.parse(result);
  } catch (error) {
    console.error('Error obteniendo versiones:', error.message);
    return [];
  }
}

/**
 * Filtra las versiones RC
 */
function getRCVersions() {
  const versions = getPublishedVersions();
  return versions.filter(version => version.includes('-rc.'));
}

/**
 * Limpia las versiones RC antiguas (deja solo las 3 más recientes)
 */
function cleanupOldRCs() {
  const rcVersions = getRCVersions();
  
  if (rcVersions.length <= 3) {
    console.log('📝 No hay versiones RC antiguas para limpiar');
    return;
  }
  
  // Ordenar por fecha de creación (más recientes primero)
  rcVersions.sort((a, b) => {
    const aTime = new Date(execSync(`npm view ${PACKAGE_NAME}@${a} time.modified`, { encoding: 'utf8' }).trim());
    const bTime = new Date(execSync(`npm view ${PACKAGE_NAME}@${b} time.modified`, { encoding: 'utf8' }).trim());
    return bTime - aTime;
  });
  
  // Mantener solo las 3 más recientes
  const versionsToDelete = rcVersions.slice(3);
  
  console.log(`🧹 Limpiando ${versionsToDelete.length} versiones RC antiguas...`);
  
  versionsToDelete.forEach(version => {
    try {
      execSync(`npm unpublish ${PACKAGE_NAME}@${version}`, { stdio: 'inherit' });
      console.log(`✅ Eliminada versión RC: ${version}`);
    } catch (error) {
      console.error(`❌ Error eliminando ${version}:`, error.message);
    }
  });
}

/**
 * Lista todas las versiones RC disponibles
 */
function listRCVersions() {
  const rcVersions = getRCVersions();
  
  if (rcVersions.length === 0) {
    console.log('📝 No hay versiones RC disponibles');
    return;
  }
  
  console.log('📦 Versiones RC disponibles:');
  rcVersions.forEach(version => {
    console.log(`  - ${version}`);
  });
}

/**
 * Obtiene información sobre el tag RC actual
 */
function getRCTagInfo() {
  try {
    const result = execSync(`npm view ${PACKAGE_NAME}@rc version`, { encoding: 'utf8' });
    console.log(`🏷️  Tag RC actual apunta a: ${result.trim()}`);
  } catch (error) {
    console.log('📝 No hay tag RC disponible');
  }
}

// Manejo de argumentos de línea de comandos
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
    console.log('=== Información de versiones RC ===');
    listRCVersions();
    console.log('\n=== Tag RC actual ===');
    getRCTagInfo();
    break;
  default:
    console.log(`
📦 RC Manager para ${PACKAGE_NAME}

Uso: node scripts/rc-manager.js <comando>

Comandos disponibles:
  list    - Lista todas las versiones RC
  cleanup - Limpia versiones RC antiguas (mantiene las 3 más recientes)
  info    - Muestra información del tag RC actual
  all     - Muestra toda la información

Ejemplos:
  node scripts/rc-manager.js list
  node scripts/rc-manager.js cleanup
  node scripts/rc-manager.js info
`);
    break;
} 