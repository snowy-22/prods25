#!/usr/bin/env node

/**
 * Migration Fixer
 * Automatically fixes migration files to use IF NOT EXISTS
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const migrationsDir = path.join(__dirname, '../supabase/migrations');

// Find all migration files
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

console.log(`🔧 Fixing ${files.length} migration files...\n`);

files.forEach(file => {
  const filePath = path.join(migrationsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // Fix CREATE POLICY without IF NOT EXISTS
  const policyRegex = /^CREATE POLICY\s+"([^"]+)"\s+ON\s+/gm;
  if (policyRegex.test(content)) {
    content = content.replace(/^CREATE POLICY\s+(")/gm, 'CREATE POLICY IF NOT EXISTS $1');
    changed = true;
  }

  // Fix CREATE FUNCTION without IF NOT EXISTS
  const functionRegex = /^CREATE FUNCTION\s+/gm;
  if (functionRegex.test(content)) {
    content = content.replace(/^CREATE FUNCTION\s+/gm, 'CREATE OR REPLACE FUNCTION ');
    changed = true;
  }

  // Fix CREATE TRIGGER without IF NOT EXISTS
  const triggerRegex = /^CREATE TRIGGER\s+/gm;
  if (triggerRegex.test(content)) {
    content = content.replace(/^CREATE TRIGGER\s+/gm, 'CREATE TRIGGER IF NOT EXISTS ');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ ${file} - Fixed`);
  } else {
    console.log(`⏭️  ${file} - No changes needed`);
  }
});

console.log('\n✅ All migration files fixed!');
