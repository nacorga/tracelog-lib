# Fase 1: Setup - Preparación src_v2

## 🎯 Objetivo
Crear estructura `src_v2/` paralela para desarrollo del refactor sin afectar `src/` original.

## 📋 Tareas

### 1. Crear Carpeta src_v2
```bash
# Copiar estructura completa
cp -r src src_v2

# Verificar copia
ls -la src_v2/
```

### 2. Actualizar tsconfig para Dual Support

Crear `tsconfig.v2.json`:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": "./src_v2",
    "outDir": "./dist_v2"
  },
  "include": ["src_v2/**/*"],
  "exclude": ["node_modules", "dist", "dist_v2", "tests", "src"]
}
```

### 3. Actualizar package.json Scripts

Agregar scripts para desarrollo paralelo:
```json
{
  "scripts": {
    "build:v2": "tsc -p tsconfig.v2.json",
    "build:v2:watch": "tsc -p tsconfig.v2.json --watch",
    "build:browser:v2": "vite build --config vite.config.v2.js",
    "dev:v2": "npm run build:v2:watch",

    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e:v2": "cross-env TEST_SRC=v2 playwright test",
    "test:all:v2": "npm run test:unit && npm run test:integration && npm run test:e2e:v2",
    "serve:test:v2": "cross-env TEST_SRC=v2 node tests/server.js",

    "check:v2": "npm run lint:v2 && npm run format:check:v2",
    "lint:v2": "eslint 'src_v2/**/*.ts'",
    "format:check:v2": "prettier --check 'src_v2/**/*.{ts,js}'",
    "fix:v2": "eslint 'src_v2/**/*.ts' --fix && prettier --write 'src_v2/**/*.{ts,js}'",

    "compare-output": "node scripts/compare-outputs.js",
    "migrate:v2": "node scripts/migrate-v2.js"
  }
}
```

### 4. Crear vite.config.v2.js

```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src_v2/api.ts'),
      name: 'TraceLog',
      fileName: 'tracelog',
      formats: ['es', 'umd', 'iife']
    },
    outDir: 'dist_v2',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src_v2')
    }
  }
});
```

### 5. Actualizar Test Server

Modificar `tests/server.js` para soportar dual source:

```javascript
const path = require('path');
const express = require('express');

const app = express();
const PORT = 3000;

// Detectar qué versión usar
const srcVersion = process.env.TEST_SRC === 'v2' ? 'src_v2' : 'src';
const distVersion = process.env.TEST_SRC === 'v2' ? 'dist_v2' : 'dist';

console.log(`[Test Server] Using source: ${srcVersion}`);

// Servir archivos estáticos
app.use('/dist', express.static(path.join(__dirname, '..', distVersion)));
app.use('/playground', express.static(path.join(__dirname, '..', 'playground')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Test Server] Running on http://localhost:${PORT}`);
  console.log(`[Test Server] Source: ${srcVersion} → ${distVersion}`);
});
```

### 6. Crear Script de Comparación

`scripts/compare-outputs.js`:
```javascript
const fs = require('fs');
const path = require('path');

function compareJSONStructure(obj1, obj2, path = '') {
  const differences = [];

  const keys1 = Object.keys(obj1 || {});
  const keys2 = Object.keys(obj2 || {});

  // Check for missing keys
  keys1.forEach(key => {
    if (!keys2.includes(key)) {
      differences.push(`Missing in v2: ${path}.${key}`);
    }
  });

  keys2.forEach(key => {
    if (!keys1.includes(key)) {
      differences.push(`Extra in v2: ${path}.${key}`);
    }
  });

  // Check structure recursively
  keys1.forEach(key => {
    if (keys2.includes(key)) {
      const val1 = obj1[key];
      const val2 = obj2[key];

      if (typeof val1 === 'object' && typeof val2 === 'object') {
        differences.push(...compareJSONStructure(val1, val2, `${path}.${key}`));
      }
    }
  });

  return differences;
}

async function compareEventStructures() {
  console.log('🔍 Comparing EventData structures...\n');

  const typesV1 = fs.readFileSync(path.join(__dirname, '../src/types/event.types.ts'), 'utf8');
  const typesV2 = fs.readFileSync(path.join(__dirname, '../src_v2/types/event.types.ts'), 'utf8');

  if (typesV1 === typesV2) {
    console.log('✅ event.types.ts is IDENTICAL\n');
  } else {
    console.log('⚠️  event.types.ts has DIFFERENCES\n');
    console.log('Run: diff src/types/event.types.ts src_v2/types/event.types.ts\n');
  }

  // Compare API
  const apiV1 = fs.readFileSync(path.join(__dirname, '../src/api.ts'), 'utf8');
  const apiV2 = fs.readFileSync(path.join(__dirname, '../src_v2/api.ts'), 'utf8');

  const exportRegex = /export\s+(?:const|function|class)\s+\w+/g;
  const exportsV1 = apiV1.match(exportRegex) || [];
  const exportsV2 = apiV2.match(exportRegex) || [];

  console.log('📦 Comparing API exports...\n');
  console.log('V1 exports:', exportsV1);
  console.log('V2 exports:', exportsV2);

  const missingExports = exportsV1.filter(e => !exportsV2.includes(e));
  const extraExports = exportsV2.filter(e => !exportsV1.includes(e));

  if (missingExports.length > 0) {
    console.log('\n❌ Missing exports in V2:', missingExports);
  }

  if (extraExports.length > 0) {
    console.log('\n⚠️  Extra exports in V2:', extraExports);
  }

  if (missingExports.length === 0 && extraExports.length === 0) {
    console.log('\n✅ API exports are IDENTICAL\n');
  }
}

compareEventStructures().catch(console.error);
```

### 7. Crear Script de Migración

`scripts/migrate-v2.js`:
```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting migration from src_v2 to src...\n');

// Safety checks
console.log('⚠️  This will DELETE src/ and replace with src_v2/');
console.log('⚠️  Make sure all tests pass before proceeding!\n');

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Type "MIGRATE" to confirm: ', (answer) => {
  if (answer !== 'MIGRATE') {
    console.log('❌ Migration cancelled');
    readline.close();
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
    execSync('rm -rf dist_v2');

    // Update package.json (remove v2 scripts)
    console.log('📝 Updating package.json');
    // ... implement package.json cleanup

    console.log('\n✅ Migration completed successfully!');
    console.log(`\n📦 Backup available at: ${backupDir}`);
    console.log('\n🔧 Next steps:');
    console.log('1. npm run build:all');
    console.log('2. npm run test:e2e');
    console.log('3. Update version to 2.0.0');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n🔄 Attempting rollback...');

    try {
      execSync('rm -rf src');
      execSync(`mv ${backupDir} src`);
      console.log('✅ Rollback successful');
    } catch (rollbackError) {
      console.error('❌ Rollback failed:', rollbackError.message);
      console.error('⚠️  Manual intervention required!');
    }
  }

  readline.close();
});
```

### 8. Actualizar .gitignore

```bash
# Agregar a .gitignore
dist_v2/
src_backup_*/
```

### 9. Configurar Vitest para Tests Unitarios

`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src_v2/**/*.ts'],
      exclude: [
        'src_v2/**/*.types.ts',
        'src_v2/constants/**',
        'src_v2/types/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src_v2'),
    },
  },
});
```

`vitest.integration.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 10000,
  },
});
```

### 10. Crear Test de Validación DTO

`tests/e2e/dto-validation.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test.describe('DTO Structure Validation', () => {
  test('EventData structure must be preserved', async ({ page }) => {
    let capturedPayload: any;

    // Interceptar request
    await page.route('**/api/**', (route) => {
      capturedPayload = route.request().postDataJSON();
      route.fulfill({ status: 200, body: '{}' });
    });

    await page.goto('http://localhost:3000');
    await page.click('button');
    await page.waitForTimeout(2000);

    expect(capturedPayload).toBeDefined();
    expect(capturedPayload).toHaveProperty('user_id');
    expect(capturedPayload).toHaveProperty('session_id');
    expect(capturedPayload).toHaveProperty('device');
    expect(capturedPayload).toHaveProperty('events');

    const event = capturedPayload.events[0];
    expect(event).toHaveProperty('type');
    expect(event).toHaveProperty('page_url');
    expect(event).toHaveProperty('timestamp');
    expect(typeof event.timestamp).toBe('number');
  });

  test('EventData fields match expected structure', async ({ page }) => {
    const expectedFields = [
      'type',
      'page_url',
      'timestamp',
      // Opcionales pero deben existir cuando corresponde
      'referrer',
      'from_page_url',
      'scroll_data',
      'click_data',
      'custom_event',
      'web_vitals',
      'page_view',
      'session_start_recovered',
      'session_end_reason',
      'error_data',
      'utm',
      'tags'
    ];

    // Implementar validación...
  });
});
```

### 11. Crear Tests Unitarios Básicos

`tests/unit/utils/sanitize.test.ts`:
```typescript
import { describe, test, expect } from 'vitest';
import { sanitizeMetadata } from '@/utils/data/sanitize.utils';

describe('sanitizeMetadata', () => {
  test('should remove sensitive fields', () => {
    const input = { password: '123', token: 'abc', user: 'john' };
    const result = sanitizeMetadata(input);

    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('token');
    expect(result).toHaveProperty('user');
  });

  test('should limit object size', () => {
    const large = { data: 'x'.repeat(10000) };
    const result = sanitizeMetadata(large);

    expect(JSON.stringify(result).length).toBeLessThan(5000);
  });
});
```

## ✅ Validación Setup

### 1. Verificar estructura creada
```bash
ls -la src_v2/
ls -la scripts/
```

### 2. Build ambas versiones
```bash
npm run build        # Build v1 (original)
npm run build:v2     # Build v2 (refactor)
```

### 3. Ejecutar comparación
```bash
npm run compare-output
```

### 4. Instalar dependencias de testing
```bash
npm install -D vitest @vitest/coverage-v8 jsdom
npm install -D @types/node
```

### 5. Test en ambas versiones
```bash
# Tests unitarios
npm run test:unit
npm run test:unit:watch  # Para desarrollo

# Tests de integración
npm run test:integration

# E2E V1 original
npm run test:e2e

# E2E V2 refactor
npm run test:e2e:v2

# Todos los tests V2
npm run test:all:v2

# Coverage
npm run test:coverage
```

## 📊 Resultado Esperado

- ✅ `src_v2/` creado con estructura idéntica a `src/`
- ✅ Ambas versiones compilan sin errores
- ✅ Scripts de desarrollo funcionando
- ✅ Vitest configurado para tests unitarios
- ✅ Tests E2E ejecutándose en ambas versiones
- ✅ Tests unitarios básicos creados
- ✅ Coverage configurado con threshold 80%
- ✅ Script de comparación detecta diferencias
- ✅ Script de migración listo para uso final

## 🚦 Criterios de Éxito

- [ ] `src_v2/` existe y compila
- [ ] `npm run build` y `npm run build:v2` exitosos
- [ ] `npm run test:unit` pasa
- [ ] `npm run test:integration` funciona
- [ ] `npm run test:e2e` pasa
- [ ] `npm run test:e2e:v2` pasa
- [ ] `npm run test:coverage` muestra > 80%
- [ ] `npm run compare-output` muestra estructuras idénticas
- [ ] Ambas versiones generan mismo output

---

**Estado**: Pendiente
**Siguiente**: PHASE_2_REFACTOR_CORE.md