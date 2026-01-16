#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const migrationDir = 'supabase/migrations';
const files = fs.readdirSync(migrationDir).filter(f => f.includes('20260107') || f.includes('20260109'));

files.forEach(fileName => {
  const filePath = path.join(migrationDir, fileName);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace CREATE INDEX with CREATE INDEX IF NOT EXISTS
  content = content.replace(/CREATE INDEX\s+/g, 'CREATE INDEX IF NOT EXISTS ');
  
  // Replace CREATE UNIQUE INDEX with CREATE UNIQUE INDEX IF NOT EXISTS
  content = content.replace(/CREATE UNIQUE INDEX\s+/g, 'CREATE UNIQUE INDEX IF NOT EXISTS ');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fixed indexes in: ${fileName}`);
});

console.log('\n✨ All migration files updated!');
