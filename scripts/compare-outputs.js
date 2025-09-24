const fs = require('fs');
const path = require('path');

function compareJSONStructure(obj1, obj2, currentPath = '') {
  const differences = [];

  const keys1 = Object.keys(obj1 || {});
  const keys2 = Object.keys(obj2 || {});

  // Check for missing keys
  keys1.forEach(key => {
    if (!keys2.includes(key)) {
      differences.push(`Missing in v2: ${currentPath}.${key}`);
    }
  });

  keys2.forEach(key => {
    if (!keys1.includes(key)) {
      differences.push(`Extra in v2: ${currentPath}.${key}`);
    }
  });

  // Check structure recursively
  keys1.forEach(key => {
    if (keys2.includes(key)) {
      const val1 = obj1[key];
      const val2 = obj2[key];

      if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
        differences.push(...compareJSONStructure(val1, val2, `${currentPath}.${key}`));
      }
    }
  });

  return differences;
}

async function compareEventStructures() {
  console.log('🔍 Comparing EventData structures...\n');

  const typesV1Path = path.join(__dirname, '../src/types/event.types.ts');
  const typesV2Path = path.join(__dirname, '../src_v2/types/event.types.ts');

  if (!fs.existsSync(typesV1Path)) {
    console.log('⚠️  src/types/event.types.ts not found\n');
    return;
  }

  if (!fs.existsSync(typesV2Path)) {
    console.log('⚠️  src_v2/types/event.types.ts not found\n');
    return;
  }

  const typesV1 = fs.readFileSync(typesV1Path, 'utf8');
  const typesV2 = fs.readFileSync(typesV2Path, 'utf8');

  if (typesV1 === typesV2) {
    console.log('✅ event.types.ts is IDENTICAL\n');
  } else {
    console.log('⚠️  event.types.ts has DIFFERENCES\n');
    console.log('Run: diff src/types/event.types.ts src_v2/types/event.types.ts\n');
  }

  // Compare API
  const apiV1Path = path.join(__dirname, '../src/api.ts');
  const apiV2Path = path.join(__dirname, '../src_v2/api.ts');

  if (!fs.existsSync(apiV1Path) || !fs.existsSync(apiV2Path)) {
    console.log('⚠️  API files not found\n');
    return;
  }

  const apiV1 = fs.readFileSync(apiV1Path, 'utf8');
  const apiV2 = fs.readFileSync(apiV2Path, 'utf8');

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

  // Compare public-api
  const publicApiV1Path = path.join(__dirname, '../src/public-api.ts');
  const publicApiV2Path = path.join(__dirname, '../src_v2/public-api.ts');

  if (fs.existsSync(publicApiV1Path) && fs.existsSync(publicApiV2Path)) {
    const publicApiV1 = fs.readFileSync(publicApiV1Path, 'utf8');
    const publicApiV2 = fs.readFileSync(publicApiV2Path, 'utf8');

    console.log('📦 Comparing public-api.ts...\n');
    if (publicApiV1 === publicApiV2) {
      console.log('✅ public-api.ts is IDENTICAL\n');
    } else {
      console.log('⚠️  public-api.ts has DIFFERENCES\n');
      console.log('Run: diff src/public-api.ts src_v2/public-api.ts\n');
    }
  }
}

compareEventStructures().catch(console.error);