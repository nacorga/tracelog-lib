const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

console.log('🚀 Starting migration from src_v2 to src...\n');

// Safety checks
console.log('⚠️  This will DELETE src/ and replace with src_v2/');
console.log('⚠️  Make sure all tests pass before proceeding!\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Type "MIGRATE" to confirm: ', (answer) => {
  if (answer !== 'MIGRATE') {
    console.log('❌ Migration cancelled');
    rl.close();
    process.exit(0);
  }

  try {
    // Backup
    const backupDir = `src_backup_${Date.now()}`;
    console.log(`\n📦 Creating backup: ${backupDir}`);
    execSync(`cp -r src ${backupDir}`);

    // Remove old src
    console.log('🗑️  Removing old src/');
    execSync('rm -rf src');

    // Move src_v2 to src
    console.log('📁 Moving src_v2/ to src/');
    execSync('mv src_v2 src');

    // Clean up dist_v2
    console.log('🧹 Cleaning dist_v2/');
    if (fs.existsSync('dist_v2')) {
      execSync('rm -rf dist_v2');
    }

    // Update package.json (remove v2 scripts)
    console.log('📝 Cleaning package.json v2 scripts');
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Remove v2-specific scripts
    const scriptsToRemove = [
      'build:v2',
      'build:v2:watch',
      'build:browser:v2',
      'build:browser:v2:testing',
      'dev:v2',
      'lint:v2',
      'lint:v2:fix',
      'format:v2',
      'format:v2:check',
      'check:v2',
      'fix:v2',
      'test:e2e:v2',
      'test:all:v2',
      'serve:test:v2',
      'compare-output',
      'migrate:v2'
    ];

    scriptsToRemove.forEach(script => {
      if (packageJson.scripts[script]) {
        delete packageJson.scripts[script];
      }
    });

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

    // Remove v2 config files
    console.log('🧹 Cleaning v2 config files');
    const configFiles = ['tsconfig.v2.json', 'vite.config.v2.mjs'];
    configFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });

    // Remove migration scripts
    console.log('🧹 Removing migration scripts');
    const migrationScripts = ['scripts/compare-outputs.js', 'scripts/migrate-v2.js'];
    migrationScripts.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });

    console.log('\n✅ Migration completed successfully!');
    console.log(`\n📦 Backup available at: ${backupDir}`);
    console.log('\n🔧 Next steps:');
    console.log('1. npm run build:all');
    console.log('2. npm run test:e2e');
    console.log('3. Update version to 2.0.0');
    console.log('4. npm run release');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n🔄 Attempting rollback...');

    try {
      if (fs.existsSync('src')) {
        execSync('rm -rf src');
      }
      const backups = fs.readdirSync('.').filter(f => f.startsWith('src_backup_'));
      if (backups.length > 0) {
        const latestBackup = backups.sort().reverse()[0];
        execSync(`mv ${latestBackup} src`);
        console.log('✅ Rollback successful');
      }
    } catch (rollbackError) {
      console.error('❌ Rollback failed:', rollbackError.message);
      console.error('⚠️  Manual intervention required!');
    }
  }

  rl.close();
});