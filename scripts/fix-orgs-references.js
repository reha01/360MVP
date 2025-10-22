#!/usr/bin/env node

/**
 * Script to fix all 'orgs' references to 'organizations'
 * This script updates all services, hooks, and components
 */

import fs from 'fs';
import path from 'path';
import glob from 'glob';

// Files to update
const patterns = [
  'src/services/**/*.js',
  'src/services/**/*.jsx',
  'src/hooks/**/*.js',
  'src/pages/**/*.jsx',
  'scripts/**/*.js'
];

// Replacements to make
const replacements = [
  // Collection references
  { from: /collection\(db,\s*['"`]orgs['"`]/g, to: "collection(db, 'organizations'" },
  { from: /collection\(db,\s*['"`]orgs['"`],/g, to: "collection(db, 'organizations'," },
  
  // Doc references
  { from: /doc\(db,\s*['"`]orgs['"`]/g, to: "doc(db, 'organizations'" },
  { from: /doc\(db,\s*`orgs\//g, to: "doc(db, `organizations/" },
  
  // Path strings
  { from: /['"`]orgs\//g, to: "'organizations/" },
  { from: /`orgs\$\{/g, to: "`organizations${" },
  
  // Firebase Admin SDK
  { from: /\.collection\(['"`]orgs['"`]\)/g, to: ".collection('organizations')" },
  { from: /db\.collection\(['"`]orgs['"`]\)/g, to: "db.collection('organizations')" }
];

// Files to skip
const skipFiles = [
  'scripts/fix-orgs-references.js',
  'docs/CORRECCIÓN_APLICADA.md',
  'docs/VERIFICACION_ORGS_TO_ORGANIZATIONS_REPORT.md'
];

function shouldSkip(file) {
  return skipFiles.some(skip => file.includes(skip));
}

function fixFile(filePath) {
  if (shouldSkip(filePath)) {
    console.log(`⏭️  Skipping: ${filePath}`);
    return 0;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let changeCount = 0;
  
  replacements.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      content = content.replace(from, to);
      changeCount += matches.length;
    }
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${changeCount} references in: ${filePath}`);
    return changeCount;
  }
  
  return 0;
}

console.log('🔧 Fixing orgs references to organizations...\n');

let totalFiles = 0;
let totalChanges = 0;

patterns.forEach(pattern => {
  const files = glob.sync(pattern);
  files.forEach(file => {
    const changes = fixFile(file);
    if (changes > 0) {
      totalFiles++;
      totalChanges += changes;
    }
  });
});

console.log('\n📊 Summary:');
console.log(`   Files updated: ${totalFiles}`);
console.log(`   References fixed: ${totalChanges}`);

if (totalChanges === 0) {
  console.log('\n✨ No references to fix!');
} else {
  console.log('\n✅ All references have been fixed!');
}
