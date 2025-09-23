#!/usr/bin/env node

// scripts/validate-scoping.js
// Validates that all Firestore operations use proper scoping

import { readFileSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

class ScopingValidator {
  constructor() {
    this.results = {
      scoped: [],
      unscoped: [],
      warnings: []
    };
  }

  async validateProject() {
    console.log('🔍 Validating Firestore scoping across project...\n');

    const srcDir = join(projectRoot, 'src');
    const files = this.getAllFiles(srcDir, ['.js', '.jsx', '.ts', '.tsx']);
    
    for (const file of files) {
      await this.validateFile(file);
    }

    this.printResults();
    return this.results.unscoped.length === 0;
  }

  getAllFiles(dir, extensions) {
    const files = [];
    
    try {
      const items = readdirSync(dir);
      
      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...this.getAllFiles(fullPath, extensions));
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      this.results.warnings.push(`Error reading directory ${dir}: ${error.message}`);
    }
    
    return files;
  }

  async validateFile(filePath) {
    try {
      const content = readFileSync(filePath, 'utf8');
      const relativePath = filePath.replace(projectRoot, '').replace(/\\\\/g, '/');

      // Skip certain files
      if (this.shouldSkipFile(relativePath)) {
        return;
      }

      // Check for unscoped Firestore operations
      this.checkUnscopedOperations(content, relativePath);
      
      // Check for proper scoping usage
      this.checkScopingUsage(content, relativePath);

    } catch (error) {
      this.results.warnings.push(`Error reading ${filePath}: ${error.message}`);
    }
  }

  shouldSkipFile(filePath) {
    const skipPatterns = [
      '/services/firebase.admin',
      '/services/firebase.js',
      '/services/scopingService.js',
      '/services/telemetryService.js',
      '/services/multiTenantService',
      'test',
      'spec',
      '.test.',
      '.spec.',
      'node_modules'
    ];

    return skipPatterns.some(pattern => filePath.includes(pattern));
  }

  checkUnscopedOperations(content, filePath) {
    const lines = content.split('\n');
    
    // Patterns that indicate unscoped Firestore operations
    const unscopedPatterns = [
      // Direct collection access without scoping
      /collection\(.*?['"`](evaluations|reports|responses)['"`]\s*\)/,
      // Direct queries without orgScope
      /query\(\s*collection\(.*?['"`](evaluations|reports|responses)['"`]\)/,
      // getDocs without scoping
      /getDocs\(\s*collection\(.*?['"`](evaluations|reports|responses)['"`]\)/,
      // addDoc without scoping
      /addDoc\(\s*collection\(.*?['"`](evaluations|reports|responses)['"`]\)/
    ];

    // Exceptions - patterns that are actually scoped
    const scopedExceptions = [
      /getScopedCollection/,
      /createScopedDoc/,
      /updateScopedDoc/,
      /deleteScopedDoc/,
      /getScopedDoc/,
      /orgScope\(/,
      /where\(['"`]orgId['"`]/,
      /where\(['"`]userId['"`].*==.*request\.auth\.uid/
    ];

    lines.forEach((line, index) => {
      // Skip comments and imports
      if (line.trim().startsWith('//') || line.trim().startsWith('import')) {
        return;
      }

      // Check for unscoped operations
      const hasUnscopedOperation = unscopedPatterns.some(pattern => pattern.test(line));
      
      if (hasUnscopedOperation) {
        // Check if it's actually scoped (exception)
        const isActuallyScoped = scopedExceptions.some(pattern => pattern.test(line)) ||
                                scopedExceptions.some(pattern => pattern.test(content.slice(Math.max(0, content.indexOf(line) - 200), content.indexOf(line) + 200)));

        if (!isActuallyScoped) {
          this.results.unscoped.push({
            file: filePath,
            line: index + 1,
            code: line.trim(),
            issue: 'Unscoped Firestore operation detected'
          });
        }
      }
    });
  }

  checkScopingUsage(content, filePath) {
    // Check for proper scoping function usage
    const scopingFunctions = [
      'getScopedCollection',
      'createScopedDoc',
      'updateScopedDoc',
      'deleteScopedDoc',
      'getScopedDoc',
      'createScopedQuery'
    ];

    const hasScopingFunctions = scopingFunctions.some(func => content.includes(func));
    const hasFirestoreOperations = /collection\(.*?['"`](evaluations|reports|responses)['"`]/.test(content);

    if (hasFirestoreOperations && hasScopingFunctions) {
      this.results.scoped.push({
        file: filePath,
        functions: scopingFunctions.filter(func => content.includes(func))
      });
    }

    // Check for userId parameter in functions
    const functionMatches = content.match(/export\s+const\s+\w+\s*=\s*async\s*\([^)]*\)/g);
    if (functionMatches) {
      functionMatches.forEach(match => {
        if (match.includes('evaluationId') || match.includes('reportId')) {
          if (!match.includes('userId')) {
            const functionName = match.match(/export\s+const\s+(\w+)/)?.[1];
            if (functionName) {
              this.results.warnings.push(`Function ${functionName} in ${filePath} might need userId parameter for scoping`);
            }
          }
        }
      });
    }
  }

  printResults() {
    console.log('════════════════════════════════════════════════════════════');
    console.log('FIRESTORE SCOPING VALIDATION RESULTS');
    console.log('════════════════════════════════════════════════════════════');
    
    console.log(`\n✅ Files with proper scoping: ${this.results.scoped.length}`);
    this.results.scoped.forEach(item => {
      console.log(`   ${item.file} (${item.functions.join(', ')})`);
    });

    console.log(`\n❌ Unscoped operations found: ${this.results.unscoped.length}`);
    this.results.unscoped.forEach(item => {
      console.log(`   ${item.file}:${item.line} - ${item.issue}`);
      console.log(`     Code: ${item.code}`);
    });

    console.log(`\n⚠️  Warnings: ${this.results.warnings.length}`);
    this.results.warnings.forEach(warning => {
      console.log(`   ${warning}`);
    });

    console.log('\n════════════════════════════════════════════════════════════');
    
    if (this.results.unscoped.length === 0) {
      console.log('🎉 ALL FIRESTORE OPERATIONS ARE PROPERLY SCOPED!');
    } else {
      console.log('💥 UNSCOPED OPERATIONS DETECTED - Please fix before proceeding');
    }
    
    console.log('════════════════════════════════════════════════════════════');
  }
}

// Main execution
const main = async () => {
  const validator = new ScopingValidator();
  
  try {
    const success = await validator.validateProject();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Fatal Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

// Run if called directly
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

export default ScopingValidator;
